/**
 * React Hook for Crash Tracking
 * Provides easy integration with crash tracking service
 * Automatically sets context and handles user information
 */

import { useEffect, useCallback, useRef } from 'react';
import { useEnhancedAuthState } from '../store/useEnhancedAppStore';
import { track } from '../services/crashTracking';
import { log } from '../utils/logger';

interface PerformanceTransaction {
  finish(): void;
  setStatus?(status: string): void;
  setTag?(key: string, value: string): void;
}

export interface UseCrashTrackingOptions {
  component: string;
  route?: string;
  enableBreadcrumbs?: boolean;
  trackPerformance?: boolean;
  customContext?: Record<string, unknown>;
}

export function useCrashTracking({
  component,
  route,
  enableBreadcrumbs = true,
  trackPerformance = false,
  customContext = {},
}: UseCrashTrackingOptions) {
  const { user, isAuthenticated } = useEnhancedAuthState();
  const performanceTransactions = useRef<Map<string, PerformanceTransaction | null>>(new Map());

  // Initialize crash tracking and set user context
  useEffect(() => {
    if (!track.isReady()) {
      track.initialize();
    }

    // Set user context when authenticated
    if (isAuthenticated && user) {
      track.setUser({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      track.clearUser();
    }

    // Set component and route context
    track.setContext({
      component,
      route: route || 'Unknown',
      ...customContext,
    });
  }, [isAuthenticated, user, component, route, customContext]);

  // Report errors with automatic context
  const reportError = useCallback((error: Error, additionalContext?: Record<string, unknown>) => {
    const context = {
      component,
      route: route || 'Unknown',
      ...customContext,
      ...additionalContext,
    };

    track.captureException(error, context);

    log.error('Error reported via crash tracking hook', {
      event: 'hook_error_reported',
      component,
      route: route || 'Unknown',
      errorType: error.constructor.name,
    }, error);
  }, [component, route, customContext]);

  // Report messages with automatic context
  const reportMessage = useCallback((
    message: string, 
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    additionalContext?: Record<string, unknown>
  ) => {
    const context = {
      component,
      route: route || 'Unknown',
      ...customContext,
      ...additionalContext,
    };

    track.captureMessage(message, level, context);

    log.info('Message reported via crash tracking hook', {
      event: 'hook_message_reported',
      component,
      route: route || 'Unknown',
      message,
      level,
    });
  }, [component, route, customContext]);

  // Add breadcrumbs with automatic context
  const addBreadcrumb = useCallback((
    message: string,
    category: string = 'user',
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, unknown>
  ) => {
    if (!enableBreadcrumbs) return;

    const breadcrumb = {
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
      data: {
        component,
        route: route || 'Unknown',
        ...customContext,
        ...data,
      },
    };

    track.addBreadcrumb(breadcrumb);

    log.debug('Breadcrumb added via crash tracking hook', {
      event: 'hook_breadcrumb_added',
      component,
      route: route || 'Unknown',
      category,
      message,
    });
  }, [component, route, customContext, enableBreadcrumbs]);

  // Performance tracking
  const startPerformanceTracking = useCallback((operationName: string) => {
    if (!trackPerformance) return null;

    const transactionName = `${component}_${operationName}`;
    const transaction = track.startTransaction(
      transactionName,
      operationName,
      {
        component,
        route: route || 'Unknown',
        ...customContext,
      }
    );

    if (transaction) {
      performanceTransactions.current.set(operationName, {
        finish: () => {
          // Call Sentry transaction finish if available
          if (transaction && typeof transaction === 'object' && 'finish' in transaction) {
            (transaction as { finish?: () => void }).finish?.();
          }
        },
        setStatus: (status: string) => {
          // Call Sentry transaction setStatus if available
          if (transaction && typeof transaction === 'object' && 'setStatus' in transaction) {
            (transaction as { setStatus?: (status: string) => void }).setStatus?.(status);
          }
        },
        setTag: (key: string, value: string) => {
          // Call Sentry transaction setTag if available
          if (transaction && typeof transaction === 'object' && 'setTag' in transaction) {
            (transaction as { setTag?: (key: string, value: string) => void }).setTag?.(key, value);
          }
        }
      } as PerformanceTransaction);
    }

    log.debug('Performance tracking started', {
      event: 'performance_tracking_started',
      component,
      operation: operationName,
    });

    return transaction;
  }, [component, route, customContext, trackPerformance]);

  const stopPerformanceTracking = useCallback((operationName: string) => {
    if (!trackPerformance) return;

    const transaction = performanceTransactions.current.get(operationName);
    if (transaction) {
      transaction.finish();
      performanceTransactions.current.delete(operationName);

      log.debug('Performance tracking stopped', {
        event: 'performance_tracking_stopped',
        component,
        operation: operationName,
      });
    }
  }, [component, trackPerformance]);

  // Track user actions
  const trackUserAction = useCallback((action: string, data?: Record<string, unknown>) => {
    addBreadcrumb(`User action: ${action}`, 'user', 'info', {
      action,
      ...data,
    });

    log.userAction(action, {
      component,
      route: route || 'Unknown',
    }, data);
  }, [addBreadcrumb, component, route]);

  // Track async operations with error handling
  const trackAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T | null> => {
    const transaction = startPerformanceTracking(operationName);
    
    try {
      addBreadcrumb(`Starting async operation: ${operationName}`, 'async', 'debug', context);
      
      const result = await operation();
      
      addBreadcrumb(`Completed async operation: ${operationName}`, 'async', 'info', {
        success: true,
        ...context,
      });
      
      return result;
    } catch (error) {
      reportError(error as Error, {
        operationName,
        ...context,
      });
      
      addBreadcrumb(`Failed async operation: ${operationName}`, 'async', 'error', {
        error: (error as Error).message,
        ...context,
      });
      
      return null;
    } finally {
      if (transaction) {
        stopPerformanceTracking(operationName);
      }
    }
  }, [startPerformanceTracking, stopPerformanceTracking, addBreadcrumb, reportError]);

  // Cleanup performance transactions on unmount
  useEffect(() => {
    // Capture ref value inside effect to avoid stale closure warning
    const transactionsRef = performanceTransactions;
    return () => {
      // Capture the current ref value to avoid stale closure issues
      const currentTransactions = transactionsRef.current;
      currentTransactions.forEach((transaction) => {
        if (transaction && typeof transaction.finish === 'function') {
          transaction.finish();
        }
      });
      currentTransactions.clear();
    };
  }, []);

  return {
    reportError,
    reportMessage,
    addBreadcrumb,
    startPerformanceTracking,
    stopPerformanceTracking,
    trackUserAction,
    trackAsyncOperation,
    isReady: track.isReady(),
  };
}

// Convenience hook for screen-level crash tracking
export function useScreenCrashTracking(screenName: string, route?: string) {
  const crashTracking = useCrashTracking({
    component: 'Screen',
    route: route || screenName,
    customContext: {
      screenName,
    },
  });

  // Track screen lifecycle
  useEffect(() => {
    crashTracking.addBreadcrumb(`Screen mounted: ${screenName}`, 'lifecycle', 'info');
    
    return () => {
      crashTracking.addBreadcrumb(`Screen unmounted: ${screenName}`, 'lifecycle', 'info');
    };
  }, [screenName, crashTracking]);

  return crashTracking;
}

// Hook for API error tracking
export function useApiErrorTracking(serviceName: string) {
  const crashTracking = useCrashTracking({
    component: 'API',
    customContext: {
      serviceName,
    },
  });

  const trackApiError = useCallback((
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number
  ) => {
    crashTracking.reportError(error, {
      apiEndpoint: endpoint,
      httpMethod: method,
      statusCode,
      serviceName,
    });

    crashTracking.addBreadcrumb(`API error: ${method} ${endpoint}`, 'http', 'error', {
      statusCode,
      error: error.message,
    });
  }, [crashTracking, serviceName]);

  const trackApiCall = useCallback((
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ) => {
    crashTracking.addBreadcrumb(`API call: ${method} ${endpoint}`, 'http', 'info', {
      statusCode,
      duration,
    });

    log.apiCall(method, endpoint, statusCode, duration, {
      component: 'API',
      serviceName,
    });
  }, [crashTracking, serviceName]);

  return {
    trackApiError,
    trackApiCall,
    ...crashTracking,
  };
}

export default useCrashTracking;
