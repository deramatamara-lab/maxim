/**
 * Crash Tracking Initialization
 * Sets up Sentry with proper configuration and context
 * Called early in app startup for maximum coverage
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { track } from '../services/crashTracking';
import { log } from '../utils/logger';

// Get app configuration
const getAppConfig = () => {
  return {
    appName: Constants.expoConfig?.name || 'Maxim',
    appVersion: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
    environment: process.env.NODE_ENV || 'development',
    platform: Platform.OS,
    platformVersion: Platform.Version.toString(),
  };
};

// Initialize crash tracking with app context
export function initializeCrashTracking(): void {
  try {
    const appConfig = getAppConfig();
    
    // Configure crash tracking
    const config = {
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://placeholder@sentry.io/123456',
      environment: appConfig.environment as 'development' | 'production' | 'test',
      enableCrashReporting: true,
      enablePerformanceMonitoring: appConfig.environment === 'production',
      enableSessionTracking: true,
      sampleRate: appConfig.environment === 'production' ? 1.0 : 0.1,
    };

    // Initialize the service
    track.initialize();

    // Set app context
    track.setContext({
      appName: appConfig.appName,
      appVersion: appConfig.appVersion,
      buildNumber: appConfig.buildNumber,
      platform: appConfig.platform,
      platformVersion: appConfig.platformVersion,
      expoVersion: Constants.expoConfig?.sdkVersion || 'unknown',
      device: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        isEmulator: __DEV__,
      },
    });

    // Add initialization breadcrumb
    track.addBreadcrumb({
      message: 'Crash tracking initialized',
      category: 'system',
      level: 'info',
      data: {
        environment: config.environment,
        platform: appConfig.platform,
        version: appConfig.appVersion,
      },
    });

    log.info('Crash tracking initialization complete', {
      event: 'crash_tracking_init_complete',
      component: 'crashTrackingInit',
      environment: config.environment,
      platform: appConfig.platform,
      version: appConfig.appVersion,
    });

  } catch (error) {
    // Fallback logging if crash tracking fails to initialize
    log.error('Crash tracking initialization failed', {
      event: 'crash_tracking_init_failed',
      component: 'crashTrackingInit',
    }, error);
  }
}

// Set user context after authentication
export function setUserContext(user: {
  id: string;
  email: string;
  name: string;
  role: 'rider' | 'driver' | 'admin';
}): void {
  try {
    track.setUser(user);
    
    log.info('User context set for crash tracking', {
      event: 'user_context_set',
      component: 'crashTrackingInit',
      userId: user.id,
      userRole: user.role,
    });
  } catch (error) {
    log.error('Failed to set user context', {
      event: 'user_context_set_failed',
      component: 'crashTrackingInit',
    }, error);
  }
}

// Clear user context on logout
export function clearUserContext(): void {
  try {
    track.clearUser();
    
    log.info('User context cleared', {
      event: 'user_context_cleared',
      component: 'crashTrackingInit',
    });
  } catch (error) {
    log.error('Failed to clear user context', {
      event: 'user_context_clear_failed',
      component: 'crashTrackingInit',
    }, error);
  }
}

// Add route context for navigation
export function setRouteContext(route: string, params?: Record<string, unknown>): void {
  try {
    track.setContext({
      currentRoute: route,
      routeParams: params,
    });
    
    track.addBreadcrumb({
      message: `Route changed: ${route}`,
      category: 'navigation',
      level: 'info',
      data: {
        route,
        params,
      },
    });
    
    log.debug('Route context set', {
      event: 'route_context_set',
      component: 'crashTrackingInit',
      route,
    });
  } catch (error) {
    log.error('Failed to set route context', {
      event: 'route_context_set_failed',
      component: 'crashTrackingInit',
    }, error);
  }
}

// Report critical errors that should be tracked even in development
export function reportCriticalError(error: Error, context?: Record<string, unknown>): void {
  try {
    track.captureException(error, {
      severity: 'fatal',
      ...context,
    });
    
    log.error('Critical error reported', {
      event: 'critical_error_reported',
      component: 'crashTrackingInit',
      errorType: error.constructor.name,
    }, error);
  } catch (reportError) {
    // Fallback to console if crash tracking fails
    log.error('Critical error (crash tracking failed)', { event: 'critical_error_crash_tracking_failed', component: 'crashTrackingInit' }, error);
    log.error('Reporting error', { event: 'reporting_error', component: 'crashTrackingInit' }, reportError);
  }
}

export default {
  initializeCrashTracking,
  setUserContext,
  clearUserContext,
  setRouteContext,
  reportCriticalError,
};
