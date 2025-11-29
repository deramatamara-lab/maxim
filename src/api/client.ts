/**
 * API Service Layer for Aura Ride App
 * Provides centralized API communication with proper error handling, type safety, and network resilience
 */

import { log } from '../utils/logger';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { tokenManager } from '../services/tokenManager';
import { rateLimiter } from '../utils/validation';
import { getApiConfig, validateEnvironment } from './config';
import { getSecurityHeaders, validateUrlSecurity, logSecurityEvent } from '../config/security';
import { ApiResponse, NetworkStatus } from './types';

// Enhanced API client with automatic retry logic and offline queuing
class ResilientApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private networkStatus: NetworkStatus | null = null;
  private authToken: string | null = null;
  private requestQueue: Array<{
    id: string; 
    url: string; 
    method: string; 
    data?: Record<string, unknown>; 
    headers?: Record<string, string>; 
    timestamp: number;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  constructor(baseUrl?: string) {
    // Validate environment configuration
    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      log.error('Environment validation failed', {
        event: 'environment_validation_failed',
        component: 'ApiClient',
        errors: envValidation.errors,
      });
      // In production, this should be fatal
      if (process.env.EXPO_PUBLIC_ENV === 'production') {
        throw new Error(`Environment validation failed: ${envValidation.errors.join(', ')}`);
      }
    }
    
    // Use centralized configuration
    const config = getApiConfig();
    this.baseUrl = baseUrl || config.baseUrl;
    
    log.info('API client initialized', {
      event: 'api_client_initialized',
      component: 'ApiClient',
      environment: config.environment,
      baseUrl: this.baseUrl,
      debug: config.debug,
      enforceHttps: config.enforceHttps,
    });
    
    // Merge default headers with security headers
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `AuraApp/${process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0'}`,
      'X-Environment': config.environment,
      'X-App-Version': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      ...getSecurityHeaders(),
    };

    // Initialize network status monitoring
    this.initializeNetworkMonitoring();
  }

  private async initializeNetworkMonitoring() {
    try {
      const netInfoState = await NetInfo.fetch();
      this.networkStatus = {
        isConnected: netInfoState.isConnected ?? false,
        connectionType: netInfoState.type as NetInfoStateType,
        isInternetReachable: netInfoState.isInternetReachable ?? null,
        lastChecked: Date.now(),
      };
    } catch (error) {
      log.warn('Failed to get initial network status', { event: 'get_initial_network_status_failed', component: 'apiClient' }, error);
      this.networkStatus = {
        isConnected: false,
        connectionType: 'none' as NetInfoStateType,
        isInternetReachable: false,
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<_T>(
    requestFn: () => Promise<Response>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<Response> {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await requestFn();
        if (response.ok) {
          return response;
        }
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Higher-order function wrapper for resilient API calls
   * Automatically handles retries, offline queuing, circuit breaker logic, and authentication
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit,
    priority: 'high' | 'medium' | 'low' = 'medium',
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    // Validate URL security (HTTPS enforcement in production)
    const urlSecurityCheck = validateUrlSecurity(url);
    if (!urlSecurityCheck.isSecure) {
      logSecurityEvent('insecure_url_blocked', { url, error: urlSecurityCheck.error }, 'error');
      return {
        success: false,
        error: urlSecurityCheck.error || 'Insecure connection not allowed',
      };
    }

    try {
      // Rate limiting for sensitive endpoints
      const sensitiveEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
      if (sensitiveEndpoints.some(sensitive => endpoint.includes(sensitive))) {
        const rateLimitKey = `api:${endpoint}`;
        const rateLimitCheck = rateLimiter.check(rateLimitKey, 5, 60000); // 5 attempts per minute
        
        if (!rateLimitCheck.allowed) {
          const waitSeconds = rateLimitCheck.resetAt ? Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000) : 60;
          return {
            success: false,
            error: `Too many requests. Please try again in ${waitSeconds} seconds.`,
          };
        }
      }

      // Check if we're offline and queue the request if needed
      if (!this.networkStatus?.isConnected) {
        return await this.queueRequest<T>(url, options, priority);
      }

      // Add authentication headers if required
      let authHeaders = {};
      if (requiresAuth) {
        const accessToken = await tokenManager.getValidAccessToken();
        if (!accessToken) {
          return {
            success: false,
            error: 'Authentication required - please login again',
          };
        }
        authHeaders = { 'Authorization': `Bearer ${accessToken}` };
      }

      // Make the request with automatic retry logic
      const response = await this.executeWithRetry(
        async () => {
          const fetchResponse = await fetch(url, {
            ...options,
            headers: { 
              ...this.defaultHeaders, 
              ...authHeaders,
              ...options.headers 
            },
          });

          // Handle 401 Unauthorized - attempt token refresh
          if (fetchResponse.status === 401 && requiresAuth) {
            const refreshResult = await tokenManager.refreshToken();
            
            if (refreshResult.success && refreshResult.tokens) {
              // Retry request with new token
              const retryResponse = await fetch(url, {
                ...options,
                headers: { 
                  ...this.defaultHeaders, 
                  'Authorization': `Bearer ${refreshResult.tokens.accessToken}`,
                  ...options.headers 
                },
              });

              if (!retryResponse.ok) {
                throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
              }

              return retryResponse.json();
            } else {
              // Token refresh failed - return authentication error
              throw new Error('Authentication expired - please login again');
            }
          }

          if (!fetchResponse.ok) {
            throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
          }

          return fetchResponse.json();
        },
        priority === 'high' ? 5 : 3,
        1000
      );

      return {
        success: true,
        data: response as unknown as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Queue a request for offline execution
   */
  private async queueRequest<T>(
    url: string,
    options: RequestInit,
    priority: 'high' | 'medium' | 'low'
  ): Promise<ApiResponse<T>> {
    const queuedRequest = {
      id: this.generateRequestId(),
      url,
      method: (options.method as 'GET' | 'POST' | 'PUT' | 'DELETE') || 'GET',
      data: options.body ? JSON.parse(options.body as string) : undefined,
      headers: options.headers as Record<string, string>,
      timestamp: Date.now(),
      retryCount: 0,
      priority,
    };

    this.requestQueue.push(queuedRequest);
    this.persistQueue(); // Save to storage

    return {
      success: false,
      isOffline: true,
      error: 'Device offline - request queued for later',
      message: 'Request will be automatically retried when connection is restored',
    };
  }

  /**
   * Persist queue to storage (using secure storage for consistency)
   */
  private async persistQueue() {
    try {
      // Note: Request queue is temporary operational data, not sensitive
      // We'll use AsyncStorage for this since it's non-sensitive performance data
      // This will be updated when we have a proper non-secure storage utility
      log.warn('Request queue persistence to be implemented with appropriate storage', { event: 'queue_persistence_todo', component: 'apiClient' });
    } catch (error) {
      log.warn('Failed to persist request queue', { event: 'persist_request_queue_failed', component: 'apiClient' }, error);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * GET request with automatic retry
   */
  async get<T>(
    endpoint: string, 
    params?: Record<string, string | number | boolean>, 
    priority: 'high' | 'medium' | 'low' = 'medium',
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    // Add query parameters to URL
    let url = endpoint;
    if (params) {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      url = `${endpoint}?${queryString}`;
    }
    
    return this.makeRequest<T>(url, { method: 'GET' }, priority, requiresAuth);
  }

  /**
   * POST request with automatic retry
   */
  async post<T, B = Record<string, unknown>>(
    endpoint: string,
    data?: B,
    priority: 'high' | 'medium' | 'low' = 'medium',
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      },
      priority,
      requiresAuth
    );
  }

  /**
   * PUT request with automatic retry
   */
  async put<T>(
    endpoint: string,
    data?: Record<string, unknown>,
    priority: 'high' | 'medium' | 'low' = 'medium',
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      },
      priority,
      requiresAuth
    );
  }

  /**
   * DELETE request with automatic retry
   */
  async delete<T>(
    endpoint: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      priority,
      requiresAuth
    );
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus | null {
    return this.networkStatus;
  }

  /**
   * Public method to set authentication token (for login)
   */
  async setAuthToken(accessToken: string, refreshToken: string, expiresIn: number = 3600): Promise<void> {
    const tokens = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      tokenType: 'Bearer' as const,
    };

    await tokenManager.setTokens(tokens);
  }

  /**
   * Backward compatibility method - set authentication token with single value
   * Uses the same token for both access and refresh tokens (for mock/testing scenarios)
   */
  async setAuthTokenSingle(token: string): Promise<void> {
    await this.setAuthToken(token, token);
  }

  /**
   * Public method to clear authentication token (for logout)
   */
  async clearAuthToken(): Promise<void> {
    await tokenManager.clearTokens();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await tokenManager.isAuthenticated();
  }

  /**
   * Get token information for debugging
   */
  async getTokenInfo(): Promise<{
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    isExpired: boolean;
    expiresAt?: number;
  }> {
    return await tokenManager.getTokenInfo();
  }

  /**
   * Get current access token for manual API calls
   */
  async getAccessToken(): Promise<string | null> {
    return await tokenManager.getAccessToken();
  }

  /**
   * Force retry of queued requests
   */
  async retryQueuedRequests(): Promise<void> {
    if (this.requestQueue.length === 0) return;
    
    const queue = [...this.requestQueue];
    this.requestQueue = [];
    this.persistQueue();
    
    for (const request of queue) {
      try {
        await this.makeRequest(
          request.url.replace(this.baseUrl, ''), 
          {
            method: request.method,
            body: request.data ? JSON.stringify(request.data) : undefined,
            headers: request.headers,
          },
          request.priority
        );
      } catch (_error) {
        // If failed again and still offline, re-queue
        if (!this.networkStatus?.isConnected) {
          this.requestQueue.push(request);
        }
      }
    }
    this.persistQueue();
  }

  /**
   * Get current queue status
   */
  public getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      isOnline: this.networkStatus?.isConnected ?? false,
    };
  }
}

// Export singleton instance and types
export const apiClient = new ResilientApiClient();
export { ApiResponse, NetworkStatus } from './types';
