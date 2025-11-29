/**
 * React Hook for Structured Logging
 * Provides automatic component context injection
 * Makes logger adoption easier for React components
 */

import { useCallback } from 'react';
import { logger, LogLevel, LogContext } from '@/utils/logger';

export interface UseLoggerOptions {
  component: string;
  rideId?: string;
  userId?: string;
  additionalContext?: Partial<LogContext>;
}

export function useLogger({ component, rideId, userId, additionalContext = {} }: UseLoggerOptions) {
  const componentLogger = logger.createComponentLogger(component);

  // Create logging methods with automatic context
  const debug = useCallback((message: string, context: Partial<LogContext> = {}, data?: unknown) => {
    componentLogger.debug(message, { rideId, userId, ...additionalContext, ...context }, data);
  }, [componentLogger, rideId, userId, additionalContext]);

  const info = useCallback((message: string, context: Partial<LogContext> = {}, data?: unknown) => {
    componentLogger.info(message, { rideId, userId, ...additionalContext, ...context }, data);
  }, [componentLogger, rideId, userId, additionalContext]);

  const warn = useCallback((message: string, context: Partial<LogContext> = {}, data?: unknown) => {
    componentLogger.warn(message, { rideId, userId, ...additionalContext, ...context }, data);
  }, [componentLogger, rideId, userId, additionalContext]);

  const error = useCallback((message: string, context: Partial<LogContext> = {}, data?: unknown) => {
    componentLogger.error(message, { rideId, userId, ...additionalContext, ...context }, data);
  }, [componentLogger, rideId, userId, additionalContext]);

  const logEvent = useCallback((event: string, level: LogLevel = 'info', context: Partial<LogContext> = {}, data?: unknown) => {
    logger.logEvent(event, level, { component, rideId, userId, ...additionalContext, ...context }, data);
  }, [component, rideId, userId, additionalContext]);

  const logPerformance = useCallback((operation: string, duration: number, context: Partial<LogContext> = {}) => {
    logger.logPerformance(operation, duration, { component, rideId, userId, ...additionalContext, ...context });
  }, [component, rideId, userId, additionalContext]);

  const logUserAction = useCallback((action: string, context: Partial<LogContext> = {}, data?: unknown) => {
    logger.logUserAction(action, { component, rideId, userId, ...additionalContext, ...context }, data);
  }, [component, rideId, userId, additionalContext]);

  return {
    debug,
    info,
    warn,
    error,
    logEvent,
    logPerformance,
    logUserAction,
  };
}

export default useLogger;
