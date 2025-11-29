/**
 * Network Status Hook
 * Provides real-time network connectivity status and offline action utilities
 * Used throughout the app to disable network-dependent actions when offline
 */

import { useState, useEffect, useCallback } from 'react';
import { networkResilience, NetworkStatus } from '@/api/networkResilience';
import { NetInfoStateType } from '@react-native-community/netinfo';
import { log } from '@/utils/logger';

/**
 * Derive connection quality from connection type
 */
function deriveConnectionQuality(
  connectionType: NetInfoStateType | string,
  isInternetReachable: boolean | null
): 'poor' | 'fair' | 'good' | 'excellent' {
  if (!isInternetReachable) return 'poor';
  
  switch (connectionType) {
    case 'wifi':
      return 'excellent';
    case 'cellular':
      return 'good';
    case 'ethernet':
      return 'excellent';
    case 'bluetooth':
      return 'fair';
    case 'vpn':
      return 'good';
    case 'none':
    case 'unknown':
    default:
      return 'fair';
  }
}

export interface NetworkStatusState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  lastConnected: number | null;
  timeSinceLastConnection: number | null;
}

export interface NetworkActions {
  retryConnection: () => Promise<boolean>;
  clearQueue: () => Promise<void>;
  getQueueStatus: () => { size: number; oldestMessage: number | null };
}

export function useNetworkStatus(): NetworkStatusState & NetworkActions {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatusState>({
    isOnline: true,
    isConnected: false,
    connectionType: 'unknown',
    quality: 'fair',
    lastConnected: null,
    timeSinceLastConnection: null,
  });

  // Update network status from networkResilience
  useEffect(() => {
    const updateStatus = (status: NetworkStatus | null) => {
      if (!status) {
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: false,
          isConnected: false,
          connectionType: 'unknown',
        }));
        return;
      }

      const now = Date.now();
      // Use lastChecked as approximate lastConnected time when connected
      const lastConnectedTime = status.isConnected ? status.lastChecked : networkStatus.lastConnected;
      const timeSinceLastConnection = lastConnectedTime ? now - lastConnectedTime : null;

      // Derive quality from connection type
      const derivedQuality = deriveConnectionQuality(status.connectionType, status.isInternetReachable);

      setNetworkStatus({
        isOnline: status.isConnected,
        isConnected: status.isConnected,
        connectionType: status.connectionType || 'unknown',
        quality: derivedQuality,
        lastConnected: lastConnectedTime,
        timeSinceLastConnection,
      });

      // Log network status changes
      log.debug('Network status updated', {
        event: 'network_status_updated',
        component: 'useNetworkStatus',
        isConnected: status.isConnected,
        connectionType: status.connectionType,
        quality: derivedQuality,
      });
    };

    // Get initial status
    updateStatus(networkResilience.getNetworkStatus());

    // Listen for status changes
    const unsubscribe = networkResilience.subscribe(updateStatus);

    return () => { unsubscribe(); };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Retry connection - triggers a manual network check
  const retryConnection = useCallback(async (): Promise<boolean> => {
    try {
      log.info('Attempting to check network status', {
        event: 'network_retry_attempt',
        component: 'useNetworkStatus',
      });

      // Re-check network status by getting current status
      const currentStatus = networkResilience.getNetworkStatus();
      const isConnected = currentStatus?.isConnected ?? false;
      
      if (isConnected) {
        log.info('Network check successful - connected', {
          event: 'network_retry_success',
          component: 'useNetworkStatus',
        });
      } else {
        log.warn('Network check - still offline', {
          event: 'network_retry_failed',
          component: 'useNetworkStatus',
        });
      }

      return isConnected;
    } catch (error) {
      log.error('Network check error', {
        event: 'network_retry_error',
        component: 'useNetworkStatus',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }, []);

  // Clear offline queue
  const clearQueue = useCallback(async (): Promise<void> => {
    try {
      await networkResilience.clearQueue();
      log.info('Offline queue cleared', {
        event: 'queue_cleared',
        component: 'useNetworkStatus',
      });
    } catch (error) {
      log.error('Failed to clear offline queue', {
        event: 'queue_clear_error',
        component: 'useNetworkStatus',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  // Get queue status
  const getQueueStatus = useCallback(() => {
    const status = networkResilience.getQueueStatus();
    // Transform to expected structure for components
    return {
      size: status.totalRequests,
      oldestMessage: null, // Not tracked in current implementation
      totalRequests: status.totalRequests,
      highPriority: status.highPriority,
    };
  }, []);

  return {
    ...networkStatus,
    retryConnection,
    clearQueue,
    getQueueStatus,
  };
}

/**
 * Hook for network-dependent actions
 * Returns whether an action should be disabled and why
 */
export function useOfflineAction(
  actionName: string,
  requiresHighQuality: boolean = false
): {
  disabled: boolean;
  reason: string | null;
  canRetry: boolean;
  onRetry: () => Promise<boolean>;
} {
  const { isOnline, quality, retryConnection } = useNetworkStatus();

  const disabled = !isOnline || (requiresHighQuality && quality === 'poor');
  
  let reason: string | null = null;
  let canRetry = false;

  if (!isOnline) {
    reason = `${actionName} requires internet connection`;
    canRetry = true;
  } else if (requiresHighQuality && quality === 'poor') {
    reason = `${actionName} requires better connection quality`;
    canRetry = false;
  }

  return {
    disabled,
    reason,
    canRetry,
    onRetry: retryConnection,
  };
}

/**
 * Format time since last connection for display
 */
export function formatTimeSinceLastConnection(milliseconds: number | null): string {
  if (!milliseconds) return 'Never';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Get human-readable connection quality text
 */
export function getConnectionQualityText(quality: NetworkStatusState['quality']): string {
  switch (quality) {
    case 'excellent':
      return 'Excellent connection';
    case 'good':
      return 'Good connection';
    case 'fair':
      return 'Fair connection';
    case 'poor':
      return 'Poor connection';
    default:
      return 'Unknown connection';
  }
}
