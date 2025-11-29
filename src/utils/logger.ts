/**
 * Structured Logger Utility
 * Replaces ad-hoc console usage with structured logging
 * Provides PII sanitization and automatic context injection
 * Integrates with Sentry for error tracking
 */

import { captureSentryException, captureSentryMessage, addSentryBreadcrumb } from '../config/sentry';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  event?: string;
  component?: string;
  rideId?: string;
  userId?: string;
  severity: LogLevel;
  timestamp: string;
  [key: string]: unknown;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFileLogging: boolean;
  sanitizePII: boolean;
  environment: 'development' | 'production' | 'test';
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableFileLogging: false,
  sanitizePII: true,
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
};

class Logger {
  private config: LoggerConfig;
  private globalContext: Partial<LogContext> = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set global context that will be included in all log entries
   */
  setGlobalContext(context: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * Clear global context
   */
  clearGlobalContext(): void {
    this.globalContext = {};
  }

  /**
   * Sanitize PII from log data
   */
  private sanitizePII(data: unknown): unknown {
    if (!this.config.sanitizePII) {
      return data;
    }

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
            // Address sanitization (keep city, state, zip)
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
  }

  /**
   * Check if log level should be processed
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context: Partial<LogContext> = {},
    data?: unknown
  ): LogContext {
    const entry: LogContext = {
      severity: level,
      timestamp: new Date().toISOString(),
      message,
      ...this.globalContext,
      ...context,
    };

    if (data !== undefined) {
      entry.data = this.sanitizePII(data);
    }

    return entry;
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogContext): void {
    if (!this.config.enableConsole) return;

    const { severity, timestamp, component, event, rideId, userId, message, data, ..._rest } = entry;
    
    const contextStr = [
      component && `[${component}]`,
      event && `event:${event}`,
      rideId && `ride:${rideId}`,
      userId && `user:${userId}`,
    ].filter(Boolean).join(' ');

    const prefix = contextStr ? `${timestamp} ${contextStr}` : timestamp;
    const logMessage = `${prefix} ${message}`;

    switch (severity) {
      case 'debug':
        console.debug(logMessage, data || '');
        break;
      case 'info':
        console.info(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context: Partial<LogContext> = {}, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, data);
    this.outputToConsole(entry);

    // Send to Sentry
    this.sendToSentry(level, message, entry, data);

    // Future: Add file logging, remote logging, etc.
    if (this.config.enableFileLogging) {
      // TODO: Implement file logging for production
    }
  }

  /**
   * Send logs to Sentry for error tracking
   */
  private sendToSentry(level: LogLevel, message: string, context: LogContext, data?: unknown): void {
    try {
      // Add breadcrumb for all log levels
      addSentryBreadcrumb(
        message,
        context.component || 'app',
        level === 'debug' ? 'debug' : level === 'info' ? 'info' : level === 'warn' ? 'warning' : 'error',
        { ...context, data }
      );

      // Capture errors and warnings in Sentry
      if (level === 'error' && data instanceof Error) {
        captureSentryException(data, context);
      } else if (level === 'error' || level === 'warn') {
        captureSentryMessage(
          message,
          level === 'error' ? 'error' : 'warning',
          context
        );
      }
    } catch (_sentryError) {
      // Silently fail if Sentry is not available
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context: Partial<LogContext> = {}, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  /**
   * Info level logging
   */
  info(message: string, context: Partial<LogContext> = {}, data?: unknown): void {
    this.log('info', message, context, data);
  }

  /**
   * Warn level logging
   */
  warn(message: string, context: Partial<LogContext> = {}, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  /**
   * Error level logging
   */
  error(message: string, context: Partial<LogContext> = {}, data?: unknown): void {
    this.log('error', message, context, data);
  }

  /**
   * Convenience method for component-specific logging
   */
  createComponentLogger(component: string) {
    return {
      debug: (message: string, context: Partial<LogContext> = {}, data?: unknown) =>
        this.debug(message, { component, ...context }, data),
      info: (message: string, context: Partial<LogContext> = {}, data?: unknown) =>
        this.info(message, { component, ...context }, data),
      warn: (message: string, context: Partial<LogContext> = {}, data?: unknown) =>
        this.warn(message, { component, ...context }, data),
      error: (message: string, context: Partial<LogContext> = {}, data?: unknown) =>
        this.error(message, { component, ...context }, data),
    };
  }

  /**
   * Convenience method for event logging
   */
  logEvent(event: string, level: LogLevel = 'info', context: Partial<LogContext> = {}, data?: unknown): void {
    this.log(level, `Event: ${event}`, { event, ...context }, data);
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, context: Partial<LogContext> = {}): void {
    this.info(`Performance: ${operation}`, { 
      event: 'performance_metric',
      operation,
      duration,
      ...context 
    }, { duration, operation });
  }

  /**
   * Log user actions
   */
  logUserAction(action: string, context: Partial<LogContext> = {}, data?: unknown): void {
    this.info(`User action: ${action}`, {
      event: 'user_action',
      action,
      ...context,
    }, data);
  }

  /**
   * Log API calls
   */
  logApiCall(method: string, url: string, status: number, duration: number, context: Partial<LogContext> = {}): void {
    const level = status >= 400 ? 'warn' : status >= 500 ? 'error' : 'debug';
    this.log(level, `API: ${method} ${url}`, {
      event: 'api_call',
      method,
      url: this.sanitizePII(url),
      status,
      duration,
      ...context,
    }, { method, url, status, duration });
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: Partial<LogContext>, data?: unknown) => 
    logger.debug(message, context, data),
  info: (message: string, context?: Partial<LogContext>, data?: unknown) => 
    logger.info(message, context, data),
  warn: (message: string, context?: Partial<LogContext>, data?: unknown) => 
    logger.warn(message, context, data),
  error: (message: string, context?: Partial<LogContext>, data?: unknown) => 
    logger.error(message, context, data),
  event: (event: string, level?: LogLevel, context?: Partial<LogContext>, data?: unknown) => 
    logger.logEvent(event, level, context, data),
  performance: (operation: string, duration: number, context?: Partial<LogContext>) => 
    logger.logPerformance(operation, duration, context),
  userAction: (action: string, context?: Partial<LogContext>, data?: unknown) => 
    logger.logUserAction(action, context, data),
  apiCall: (method: string, url: string, status: number, duration: number, context?: Partial<LogContext>) => 
    logger.logApiCall(method, url, status, duration, context),
  createComponent: (component: string) => logger.createComponentLogger(component),
  setContext: (context: Partial<LogContext>) => logger.setGlobalContext(context),
  clearContext: () => logger.clearGlobalContext(),
};

export default logger;
