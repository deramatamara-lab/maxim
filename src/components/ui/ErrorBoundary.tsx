/**
 * Error Boundary Component
 * Catches React component errors and reports them to crash tracking
 * Provides fallback UI for better user experience
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { track } from '../../services/crashTracking';
import { log } from '../../utils/logger';
import { ds } from '@/constants/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
  route?: string;
  showRetry?: boolean;
  customMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    const context = {
      component: this.props.componentName || 'Unknown',
      route: this.props.route || 'Unknown',
      errorBoundary: true,
      retryCount: this.state.retryCount,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
    };

    // Report to crash tracking
    track.captureException(error, context);

    // Log to structured logger
    log.error('React error boundary caught error', {
      event: 'react_error_caught',
      component: this.props.componentName || 'ErrorBoundary',
      route: this.props.route,
      errorType: error.constructor.name,
      errorMessage: error.message,
    }, error);

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        log.error('Error in custom error handler', {
          event: 'error_handler_failed',
          component: 'ErrorBoundary',
        }, handlerError);
      }
    }
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      log.warn('Max retries reached for error boundary', {
        event: 'error_boundary_max_retries',
        component: this.props.componentName || 'ErrorBoundary',
        retryCount: this.state.retryCount,
      });
      return;
    }

    const newRetryCount = this.state.retryCount + 1;
    
    // Add breadcrumb for retry attempt
    track.addBreadcrumb({
      message: `Error boundary retry attempt ${newRetryCount}`,
      category: 'user',
      level: 'info',
      data: {
        component: this.props.componentName,
        retryCount: newRetryCount,
      },
    });

    // Reset error state with exponential backoff
    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: newRetryCount,
      });
    }, Math.pow(2, newRetryCount) * 1000) as unknown as NodeJS.Timeout; // 2s, 4s, 8s

    this.retryTimeouts.push(timeout);
  };

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts = [];
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.props.customMessage || 
               'An unexpected error occurred. Please try again or contact support.'}
            </Text>
            
            {this.props.showRetry && this.state.retryCount < this.maxRetries && (
              <Pressable 
                style={styles.retryButton} 
                onPress={this.handleRetry}
              >
                <Text style={styles.retryText}>
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </Text>
              </Pressable>
            )}

            {this.state.retryCount >= this.maxRetries && (
              <Text style={styles.maxRetriesMessage}>
                Maximum retry attempts reached. Please refresh the app.
              </Text>
            )}

            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>
                  Error: {this.state.error.message}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    Component: {this.state.errorInfo?.componentStack?.split('\n')?.[1]?.trim() || 'Unknown'}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage
export interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
  route?: string;
  showRetry?: boolean;
  customMessage?: string;
}

export function ErrorBoundaryWrapper({
  children,
  fallback,
  onError,
  componentName,
  route,
  showRetry = true,
  customMessage,
}: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      fallback={fallback}
      onError={onError}
      componentName={componentName}
      route={route}
      showRetry={showRetry}
      customMessage={customMessage}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for programmatic error reporting
export function useErrorReporting(componentName: string, route?: string) {
  const reportError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
    track.captureException(error, {
      component: componentName,
      route: route || 'Unknown',
      ...context,
    });

    log.error('Programmatic error reported', {
      event: 'programmatic_error',
      component: componentName,
      route: route || 'Unknown',
      errorType: error.constructor.name,
    }, error);
  }, [componentName, route]);

  const reportMessage = React.useCallback((message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'warning', context?: Record<string, unknown>) => {
    track.captureMessage(message, level, {
      component: componentName,
      route: route || 'Unknown',
      ...context,
    });

    log.info('Programmatic message reported', {
      event: 'programmatic_message',
      component: componentName,
      route: route || 'Unknown',
      message,
      level,
    });
  }, [componentName, route]);

  return { reportError, reportMessage };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing.lg,
    backgroundColor: ds.colors.backgroundDeep,
  },
  errorCard: {
    backgroundColor: ds.colors.glassBorder,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    marginBottom: ds.spacing.lg,
    lineHeight: ds.typography.size.body * 1.5,
  },
  retryButton: {
    backgroundColor: ds.colors.primary,
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.md,
    borderRadius: ds.radius.md,
    marginBottom: ds.spacing.md,
  },
  retryText: {
    color: ds.colors.textPrimary,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
  },
  maxRetriesMessage: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  debugInfo: {
    marginTop: ds.spacing.lg,
    padding: ds.spacing.md,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: ds.radius.md,
    width: '100%',
  },
  debugTitle: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  debugText: {
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: ds.spacing.xs,
  },
});

export default ErrorBoundary;
