/**
 * Crash Tracking Service
 * Wraps Sentry with structured logging context and PII protection
 * Provides unified error reporting across the application
 */

import * as Sentry from 'sentry-expo';
import { Platform } from 'react-native';
import { log } from '../utils/logger';

// Type definitions for Sentry breadcrumbs
interface BreadcrumbData {
  [key: string]: unknown;
}

interface Breadcrumb {
  message?: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
  timestamp?: number;
  type?: string;
  data?: BreadcrumbData;
}

// Reuse PII sanitization from logger
const sanitizePII = (data: unknown): unknown => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  const sanitizeObject = (obj: Record<string, unknown>): void => {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          // Email sanitization
          if (key.toLowerCase().includes('email') || value.includes('@')) {
            obj[key] = value.replace(/(.{2}).*(@.*)/, '$1***$2');
          }
          // Phone sanitization
          else if (key.toLowerCase().includes('phone') || /^\+?\d{10,}$/.test(value)) {
            obj[key] = value.replace(/(\+?\d{3}).*(\d{4})/, '$1****$2');
          }
          // Credit card sanitization
          else if (key.toLowerCase().includes('card') || /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(value)) {
            obj[key] = value.replace(/\d(?=\d{4})/g, '*');
          }
          // Address sanitization
          else if (key.toLowerCase().includes('address')) {
            obj[key] = value.replace(/(\d+\s+.*?\s+)(.*?\s+[A-Z]{2}\s*\d{5})/, '*** $2');
          }
          // Name sanitization
          else if (key.toLowerCase().includes('name') && value.length > 3) {
            obj[key] = value.charAt(0) + '***' + value.charAt(value.length - 1);
          }
        } else if (typeof value === 'object' && value !== null) {
          sanitizeObject(value as Record<string, unknown>);
        }
      }
    }
  };

  sanitizeObject(sanitized as Record<string, unknown>);
  return sanitized;
};

export interface CrashTrackingConfig {
  dsn: string;
  environment: 'development' | 'production' | 'test';
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableSessionTracking: boolean;
  sampleRate: number;
}

const DEFAULT_CONFIG: Partial<CrashTrackingConfig> = {
  environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  enableSessionTracking: true,
  sampleRate: 1.0,
};

class CrashTrackingService {
  private config: CrashTrackingConfig;
  private currentContext: Record<string, unknown> = {};
  private isInitialized = false;

  constructor(config: Partial<CrashTrackingConfig> = {}) {
    if (!config.dsn) {
      // Use placeholder DSN if not provided
      config.dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://placeholder@sentry.io/123456';
    }
    
    this.config = { ...DEFAULT_CONFIG, ...config } as CrashTrackingConfig;
  }

  /**
   * Initialize Sentry with PII protection and context management
   */
  initialize(): void {
    if (this.isInitialized) {
      log.warn('Crash tracking already initialized', {
        event: 'crash_tracking_already_initialized',
        component: 'CrashTrackingService',
      });
      return;
    }

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        enableAutoSessionTracking: this.config.enableSessionTracking,
        sampleRate: this.config.sampleRate,
        
        // PII protection with beforeSend
        beforeSend: (event) => {
          if (!event) return null;
          
          // Sanitize PII in event data
          if (event.extra) {
            event.extra = sanitizePII(event.extra) as Record<string, unknown>;
          }
          
          if (event.contexts) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            event.contexts = sanitizePII(event.contexts) as any;
          }
          
          if (event.user) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            event.user = sanitizePII(event.user) as any;
          }
          
          // Add structured logging context
          event.tags = {
            ...event.tags,
            ...this.currentContext,
            platform: Platform.OS,
            appVersion: this.config.environment === 'production' ? '1.0.0' : 'dev',
          };
          
          log.info('Crash report sent', {
            event: 'crash_report_sent',
            component: 'CrashTrackingService',
            eventId: event.event_id,
            level: event.level,
          });
          
          return event;
        },
        
        // Debug mode for development
        debug: this.config.environment === 'development',
      });

      this.isInitialized = true;
      
      log.info('Crash tracking initialized', {
        event: 'crash_tracking_initialized',
        component: 'CrashTrackingService',
        environment: this.config.environment,
        enableCrashReporting: this.config.enableCrashReporting,
      });
      
    } catch (error) {
      log.error('Failed to initialize crash tracking', {
        event: 'crash_tracking_init_failed',
        component: 'CrashTrackingService',
      }, error);
    }
  }

  /**
   * Set user context with PII protection
   */
  setUser(user: { id?: string; email?: string; name?: string; role?: string }): void {
    if (!this.isInitialized) {
      log.warn('Cannot set user: crash tracking not initialized', {
        event: 'crash_tracking_not_initialized',
        component: 'CrashTrackingService',
      });
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sanitizedUser = sanitizePII(user) as any;
      Sentry.Native.setUser(sanitizedUser);
      
      this.currentContext.userId = user.id;
      this.currentContext.userRole = user.role;
      
      log.info('User context set for crash tracking', {
        event: 'user_context_set',
        component: 'CrashTrackingService',
        userId: user.id,
        userRole: user.role,
      });
      
    } catch (error) {
      log.error('Failed to set user context', {
        event: 'user_context_failed',
        component: 'CrashTrackingService',
      }, error);
    }
  }

  /**
   * Set additional context for crash reports
   */
  setContext(context: Record<string, unknown>): void {
    if (!this.isInitialized) {
      log.warn('Cannot set context: crash tracking not initialized', {
        event: 'crash_tracking_not_initialized',
        component: 'CrashTrackingService',
      });
      return;
    }

    try {
      const sanitizedContext = sanitizePII(context);
      this.currentContext = { ...this.currentContext, ...(sanitizedContext as Record<string, unknown>) };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Sentry.Native.setContext('app_context', sanitizedContext as Record<string, any>);
      
      log.info('Additional context set for crash tracking', {
        event: 'context_set',
        component: 'CrashTrackingService',
        contextKeys: Object.keys(context),
      });
      
    } catch (error) {
      log.error('Failed to set additional context', {
        event: 'context_set_failed',
        component: 'CrashTrackingService',
      }, error);
    }
  }

  /**
   * Capture exception with structured context
   */
  captureException(error: Error, context: Record<string, unknown> = {}): void {
    if (!this.isInitialized || !this.config.enableCrashReporting) {
      return;
    }

    try {
      const sanitizedContext = sanitizePII(context);
      
      Sentry.Native.withScope((scope) => {
        // Add context to scope
        Object.entries(sanitizedContext as Record<string, unknown>).forEach(([key, value]) => {
          scope.setContext(key, { value });
        });
        
        // Add tags
        scope.setTag('component', context.component as string || 'Unknown');
        scope.setTag('route', context.route as string || 'Unknown');
        
        Sentry.Native.captureException(error);
      });
      
      log.error('Exception captured for crash tracking', {
        event: 'exception_captured',
        component: 'CrashTrackingService',
        errorType: error.constructor.name,
        errorMessage: error.message,
        ...context,
      }, error);
      
    } catch (captureError) {
      log.error('Failed to capture exception', {
        event: 'exception_capture_failed',
        component: 'CrashTrackingService',
      }, captureError);
    }
  }

  /**
   * Capture message with structured context
   */
  captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info', context: Record<string, unknown> = {}): void {
    if (!this.isInitialized || !this.config.enableCrashReporting) {
      return;
    }

    try {
      const sanitizedContext = sanitizePII(context);
      
      Sentry.Native.withScope((scope) => {
        // Add context to scope
        Object.entries(sanitizedContext as Record<string, unknown>).forEach(([key, value]) => {
          scope.setContext(key, { value });
        });
        
        // Add tags
        scope.setTag('component', context.component as string || 'Unknown');
        scope.setTag('route', context.route as string || 'Unknown');
        
        Sentry.Native.captureMessage(message, level);
      });
      
      log.info('Message captured for crash tracking', {
        event: 'message_captured',
        component: 'CrashTrackingService',
        message,
        level,
        ...context,
      });
      
    } catch (captureError) {
      log.error('Failed to capture message', {
        event: 'message_capture_failed',
        component: 'CrashTrackingService',
      }, captureError);
    }
  }

  /**
   * Add breadcrumb for better debugging context
   */
  addBreadcrumb(breadcrumb: Breadcrumb, context: Record<string, unknown> = {}): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      const sanitizedBreadcrumb = {
        ...breadcrumb,
        data: breadcrumb.data ? sanitizePII(breadcrumb.data) as BreadcrumbData : undefined,
      };
      
      Sentry.Native.addBreadcrumb(sanitizedBreadcrumb);
      
      log.debug('Breadcrumb added to crash tracking', {
        event: 'breadcrumb_added',
        component: 'CrashTrackingService',
        breadcrumbType: breadcrumb.type,
        breadcrumbMessage: breadcrumb.message,
        ...context,
      });
      
    } catch (error) {
      log.error('Failed to add breadcrumb', {
        event: 'breadcrumb_add_failed',
        component: 'CrashTrackingService',
      }, error);
    }
  }

  /**
   * Start performance transaction
   */
  startTransaction(name: string, operation: string, context: Record<string, unknown> = {}): unknown {
    if (!this.isInitialized || !this.config.enablePerformanceMonitoring) {
      return null;
    }

    try {
      const transaction = Sentry.Native.startTransaction({
        name,
        op: operation,
        data: sanitizePII(context) as Record<string, string | number | boolean>,
      });
      
      Sentry.Native.getCurrentHub().configureScope((scope) => {
        // Note: setSpan may not be available in all Sentry versions
        // This is optional for basic transaction tracking
        if ('setSpan' in scope) {
          // Type assertion for Sentry scope extension
          (scope as { setSpan?: (span: unknown) => void }).setSpan?.(transaction);
        }
      });
      
      log.debug('Performance transaction started', {
        event: 'transaction_started',
        component: 'CrashTrackingService',
        transactionName: name,
        operation,
      });
      
      return transaction;
      
    } catch (error) {
      log.error('Failed to start transaction', {
        event: 'transaction_start_failed',
        component: 'CrashTrackingService',
      }, error);
      return null;
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.Native.setUser(null);
      delete this.currentContext.userId;
      delete this.currentContext.userRole;
      
      log.info('User context cleared', {
        event: 'user_context_cleared',
        component: 'CrashTrackingService',
      });
      
    } catch (error) {
      log.error('Failed to clear user context', {
        event: 'user_context_clear_failed',
        component: 'CrashTrackingService',
      }, error);
    }
  }

  /**
   * Get initialization status
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): CrashTrackingConfig {
    return { ...this.config };
  }
}

// Create singleton instance
export const crashTracking = new CrashTrackingService();

// Export convenience functions
export const track = {
  initialize: () => crashTracking.initialize(),
  setUser: (user: { id?: string; email?: string; name?: string; role?: string }) => 
    crashTracking.setUser(user),
  setContext: (context: Record<string, unknown>) => 
    crashTracking.setContext(context),
  captureException: (error: Error, context?: Record<string, unknown>) => 
    crashTracking.captureException(error, context),
  captureMessage: (message: string, level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug', context?: Record<string, unknown>) => 
    crashTracking.captureMessage(message, level, context),
  addBreadcrumb: (breadcrumb: { message?: string; category?: string; level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'; data?: Record<string, unknown> }, context?: Record<string, unknown>) => 
    crashTracking.addBreadcrumb(breadcrumb, context),
  startTransaction: (name: string, operation: string, context?: Record<string, unknown>) => 
    crashTracking.startTransaction(name, operation, context),
  clearUser: () => crashTracking.clearUser(),
  isReady: () => crashTracking.isReady(),
};

export default crashTracking;
