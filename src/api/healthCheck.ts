/**
 * Backend Health Check Utility
 * Verifies backend connectivity on app startup and provides clear error messaging
 * Used for production deployment verification and debugging
 */

import { apiClient, ApiResponse } from './client';
import { getApiConfig } from './config';
import { log } from '@/utils/logger';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  api: {
    reachable: boolean;
    responseTime: number;
    error?: string;
  };
  websocket: {
    reachable: boolean;
    error?: string;
  };
  environment: {
    name: string;
    baseUrl: string;
    wsUrl: string;
  };
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
}

/**
 * Performs comprehensive health check of backend services
 * Called on app startup to verify production readiness
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const config = getApiConfig();
  const startTime = Date.now();
  
  log.info('Starting backend health check', {
    event: 'health_check_start',
    component: 'HealthCheck',
    environment: config.environment,
    baseUrl: config.baseUrl,
    wsUrl: config.wsUrl,
  });

  const result: HealthCheckResult = {
    status: 'healthy',
    api: {
      reachable: false,
      responseTime: 0,
    },
    websocket: {
      reachable: false,
    },
    environment: {
      name: config.environment,
      baseUrl: config.baseUrl,
      wsUrl: config.wsUrl,
    },
  };

  try {
    // Check API connectivity
    const apiResult = await checkApiHealth();
    result.api = apiResult;

    // Check WebSocket connectivity (non-blocking)
    const wsResult = await checkWebSocketHealth();
    result.websocket = wsResult;

    // Determine overall status
    if (!result.api.reachable && !result.websocket.reachable) {
      result.status = 'unhealthy';
    } else if (!result.api.reachable || !result.websocket.reachable || 
               (result.api.responseTime > 5000)) {
      result.status = 'degraded';
    }

    const totalTime = Date.now() - startTime;
    
    log.info('Backend health check completed', {
      event: 'health_check_complete',
      component: 'HealthCheck',
      status: result.status,
      totalTime,
      apiReachable: result.api.reachable,
      wsReachable: result.websocket.reachable,
    });

  } catch (error) {
    result.status = 'unhealthy';
    log.error('Health check failed with unexpected error', {
      event: 'health_check_error',
      component: 'HealthCheck',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return result;
}

/**
 * Checks API endpoint connectivity
 */
async function checkApiHealth(): Promise<HealthCheckResult['api']> {
  const startTime = Date.now();
  
  try {
    // Try to reach a lightweight health endpoint
    const response = await apiClient.get<{ status: string; timestamp: string }>('/health', undefined, 'low');
    const responseTime = Date.now() - startTime;

    if (response.success && response.data) {
      return {
        reachable: true,
        responseTime,
      };
    } else {
      return {
        reachable: false,
        responseTime,
        error: response.error || 'Health endpoint returned error',
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      reachable: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown API error',
    };
  }
}

/**
 * Checks WebSocket connectivity
 */
async function checkWebSocketHealth(): Promise<HealthCheckResult['websocket']> {
  try {
    // Import WebSocket service dynamically to avoid circular dependencies
    const { websocketService } = await import('@/services/websocketService');
    
    // Try to establish connection with timeout
    const connectionPromise = websocketService.connect('test-token');
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    });

    await Promise.race([connectionPromise, timeoutPromise]);
    
    // Disconnect test connection
    websocketService.disconnect();
    
    return {
      reachable: true,
    };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : 'WebSocket connection failed',
    };
  }
}

/**
 * Logs health check results in a user-friendly format
 * Called on app startup to provide clear feedback about backend status
 */
export function logHealthCheckResults(result: HealthCheckResult): void {
  const { status, api, websocket, environment } = result;
  
  switch (status) {
    case 'healthy':
      log.info('✅ All backend services are healthy', {
        event: 'backend_healthy',
        component: 'HealthCheck',
        apiResponseTime: api.responseTime,
        environment: environment.name,
      });
      break;
      
    case 'degraded':
      log.warn('⚠️ Backend services are degraded', {
        event: 'backend_degraded',
        component: 'HealthCheck',
        apiReachable: api.reachable,
        wsReachable: websocket.reachable,
        apiResponseTime: api.responseTime,
        environment: environment.name,
      });
      break;
      
    case 'unhealthy':
      log.error('❌ Backend services are unhealthy', {
        event: 'backend_unhealthy',
        component: 'HealthCheck',
        apiError: api.error,
        wsError: websocket.error,
        environment: environment.name,
      });
      break;
  }
}

/**
 * Gets user-friendly error message for health check failures
 */
export function getHealthCheckErrorMessage(result: HealthCheckResult): string | null {
  if (result.status === 'healthy') {
    return null;
  }

  const messages: string[] = [];
  
  if (!result.api.reachable) {
    messages.push(`API server unavailable: ${result.api.error || 'Connection failed'}`);
  }
  
  if (!result.websocket.reachable) {
    messages.push(`Real-time updates unavailable: ${result.websocket.error || 'WebSocket failed'}`);
  }
  
  if (result.api.responseTime > 5000) {
    messages.push('API server responding slowly');
  }
  
  return messages.join('. ');
}

/**
 * Export singleton instance for easy access
 */
export const healthCheck = {
  perform: performHealthCheck,
  logResults: logHealthCheckResults,
  getErrorMessage: getHealthCheckErrorMessage,
};
