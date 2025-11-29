/**
 * Sentry Configuration
 * Centralized error tracking and performance monitoring setup
 * 
 * Features:
 * - Automatic error capture
 * - Performance monitoring
 * - Release tracking
 * - User context
 * - Breadcrumbs
 * - Source maps support
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Environment configuration
const ENV = Constants.expoConfig?.extra?.ENV || 'development';
const IS_DEV = ENV === 'development';
const IS_PROD = ENV === 'production';

// Sentry DSN - Replace with your actual DSN from Sentry.io
// Get this from: https://sentry.io/settings/[org]/projects/[project]/keys/
const SENTRY_DSN = Constants.expoConfig?.extra?.SENTRY_DSN || process.env.SENTRY_DSN;

/**
 * Initialize Sentry
 * Call this as early as possible in your app lifecycle
 */
export function initSentry(): void {
  // Skip initialization in development unless explicitly enabled
  if (IS_DEV && !process.env.ENABLE_SENTRY_DEV) {
    // Sentry disabled in development
    return;
  }

  if (!SENTRY_DSN) {
    // Sentry DSN not configured
    return;
  }

  try {
    Sentry.init({
      // Your Sentry DSN
      dsn: SENTRY_DSN,

      // Environment
      environment: ENV,

      // Enable debug mode in development
      debug: IS_DEV,

      // Release tracking
      release: Constants.expoConfig?.version || '1.0.0',
      dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString(),

      // Performance Monitoring
      enableAutoPerformanceTracing: true,
      tracesSampleRate: IS_PROD ? 0.2 : 1.0, // 20% in prod, 100% in dev

      // Session Tracking
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000, // 30 seconds

      // Native Crash Handling
      enableNative: true,
      enableNativeCrashHandling: true,
      enableNativeNagger: false, // Disable native module warnings

      // Integrations - using Sentry v7 API
      integrations: [],

      // Before send hook - Filter and enrich events
      beforeSend(event, hint) {
        // Filter out development errors in production
        if (IS_PROD && event.exception) {
          const error = hint.originalException;
          
          // Filter out known non-critical errors
          if (error instanceof Error) {
            const message = error.message.toLowerCase();
            
            // Skip network timeout errors (handled by retry logic)
            if (message.includes('network request failed') || message.includes('timeout')) {
              return null;
            }
            
            // Skip cancelled requests
            if (message.includes('cancelled') || message.includes('aborted')) {
              return null;
            }
          }
        }

        // Enrich event with additional context
        event.tags = {
          ...event.tags,
          platform: Platform.OS,
          version: Platform.Version.toString(),
        };

        return event;
      },

      // Before breadcrumb hook - Filter breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy console breadcrumbs in production
        if (IS_PROD && breadcrumb.category === 'console') {
          return null;
        }

        return breadcrumb;
      },

      // Maximum breadcrumbs to keep
      maxBreadcrumbs: 50,

      // Attach stack traces to messages
      attachStacktrace: true,
    });

    // Sentry initialized successfully
  } catch (_error) {
    // Sentry initialization failed - error tracking disabled
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add custom context to errors
 */
export function setSentryContext(key: string, context: Record<string, unknown>): void {
  Sentry.setContext(key, context);
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Manually capture an exception
 */
export function captureSentryException(
  error: Error,
  context?: Record<string, unknown>
): string {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
  
  return 'Error captured';
}

/**
 * Manually capture a message
 */
export function captureSentryMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, unknown>
): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Start a performance span
 * Note: Use Sentry.startSpan() for performance monitoring in Sentry v7+
 */
export function startSentrySpan(
  name: string,
  op: string,
  callback: () => void | Promise<void>
): void {
  // Performance monitoring via spans
  // This is a placeholder - implement with Sentry.startSpan() when needed
  callback();
}

/**
 * Export Sentry for advanced usage
 */
export { Sentry };
