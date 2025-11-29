/**
 * Offline UX Hook
 * Provides comprehensive offline user experience management
 * Handles network state, action disabling, and graceful degradation
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { networkResilience, NetworkStatus } from '@/api/networkResilience';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

export interface OfflineUXState {
  isOnline: boolean;
  connectionType: string;
  isInternetReachable: boolean | null;
  lastChecked: number | null;
  queuedRequests: number;
  showOfflineMessage: boolean;
}

export interface OfflineAction {
  id: string;
  label: string;
  requiresNetwork: boolean;
  fallbackMessage?: string;
  gracefulDegradation?: () => void;
}

export interface OfflineUXConfig {
  showPersistentIndicator?: boolean;
  autoRetryInterval?: number;
  gracefulDegradationEnabled?: boolean;
  offlineMessageDuration?: number;
}

const DEFAULT_CONFIG: OfflineUXConfig = {
  showPersistentIndicator: true,
  autoRetryInterval: 30000, // 30 seconds
  gracefulDegradationEnabled: true,
  offlineMessageDuration: 5000, // 5 seconds
};

export function useOfflineUX(config: OfflineUXConfig = {}) {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  // Initialize state with current network status to avoid cascading renders
  const [offlineState, setOfflineState] = useState<OfflineUXState>(() => {
    const initialStatus = networkResilience.getNetworkStatus();
    return {
      isOnline: initialStatus?.isConnected ?? true,
      connectionType: initialStatus?.connectionType ?? 'unknown',
      isInternetReachable: initialStatus?.isInternetReachable ?? null,
      lastChecked: initialStatus?.lastChecked ?? null,
      queuedRequests: networkResilience.getQueueStatus().totalRequests,
      showOfflineMessage: false,
    };
  });

  const [registeredActions, setRegisteredActions] = useState<Map<string, OfflineAction>>(new Map());
  const [offlineMessageTimer, setOfflineMessageTimer] = useState<NodeJS.Timeout | null>(null);
  
  const { trigger } = useHaptics();
  const { play } = useSound();

  const handleGoingOffline = useCallback(() => {
    // Haptic and sound feedback for going offline
    trigger('error'); // Using available haptic type
    play('warning');
    
    // Show offline message
    setOfflineState(prev => ({ ...prev, showOfflineMessage: true }));
    
    // Auto-hide offline message after duration (but keep persistent indicator)
    if (offlineMessageTimer) {
      clearTimeout(offlineMessageTimer);
    }
    
    const timer = setTimeout(() => {
      setOfflineState(prev => ({ ...prev, showOfflineMessage: false }));
    }, finalConfig.offlineMessageDuration) as unknown as NodeJS.Timeout;
    
    setOfflineMessageTimer(timer);
  }, [trigger, play, finalConfig.offlineMessageDuration, offlineMessageTimer]);

  const handleComingOnline = useCallback(() => {
    // Haptic and sound feedback for coming online
    trigger('success');
    play('success'); // Using available sound type
    
    // Clear offline message
    if (offlineMessageTimer) {
      clearTimeout(offlineMessageTimer);
      setOfflineMessageTimer(null);
    }
    
    setOfflineState(prev => ({ 
      ...prev, 
      showOfflineMessage: false,
      queuedRequests: 0, // Will be updated by queue processing
    }));
  }, [trigger, play, offlineMessageTimer]);

  // Update offline state from network status
  const updateOfflineState = useCallback((networkStatus: NetworkStatus) => {
    const wasOnline = offlineState.isOnline;
    const isNowOnline = networkStatus.isConnected;
    
    setOfflineState(prev => ({
      ...prev,
      isOnline: isNowOnline,
      connectionType: networkStatus.connectionType,
      isInternetReachable: networkStatus.isInternetReachable,
      lastChecked: networkStatus.lastChecked,
      queuedRequests: networkResilience.getQueueStatus().totalRequests,
    }));

    // Handle online/offline transitions
    if (wasOnline && !isNowOnline) {
      // Just went offline
      handleGoingOffline();
    } else if (!wasOnline && isNowOnline) {
      // Just came back online
      handleComingOnline();
    }
  }, [offlineState.isOnline, handleGoingOffline, handleComingOnline]);

  // Register an action that may require network
  const registerAction = useCallback((action: OfflineAction) => {
    setRegisteredActions(prev => new Map(prev.set(action.id, action)));
  }, []);

  // Unregister an action
  const unregisterAction = useCallback((actionId: string) => {
    setRegisteredActions(prev => {
      const newMap = new Map(prev);
      newMap.delete(actionId);
      return newMap;
    });
  }, []);

  // Check if an action can be performed (considering network requirements)
  const canPerformAction = useCallback((actionId: string): boolean => {
    const action = registeredActions.get(actionId);
    if (!action) return true; // Unknown actions are allowed
    
    if (action.requiresNetwork && !offlineState.isOnline) {
      return false;
    }
    
    return true;
  }, [registeredActions, offlineState.isOnline]);

  // Attempt to perform an action with offline handling
  const performAction = useCallback(async (
    actionId: string,
    actionFn: () => Promise<void> | void,
    options?: {
      showOfflineMessage?: boolean;
      fallbackAction?: () => void;
    }
  ): Promise<boolean> => {
    const action = registeredActions.get(actionId);
    
    if (!canPerformAction(actionId)) {
      // Action requires network but we're offline
      trigger('error');
      play('warning'); // Using available sound type
      
      if (options?.showOfflineMessage !== false) {
        setOfflineState(prev => ({ ...prev, showOfflineMessage: true }));
        
        // Auto-hide message
        setTimeout(() => {
          setOfflineState(prev => ({ ...prev, showOfflineMessage: false }));
        }, finalConfig.offlineMessageDuration);
      }
      
      // Try fallback action or graceful degradation
      if (options?.fallbackAction) {
        options.fallbackAction();
      } else if (action?.gracefulDegradation && finalConfig.gracefulDegradationEnabled) {
        action.gracefulDegradation();
      }
      
      return false;
    }
    
    try {
      await actionFn();
      return true;
    } catch (error) {
      log.error('Action failed', { event: 'action_failed', component: 'useOfflineUX', actionId }, error);
      
      // If it's a network error and we have fallback, use it
      if (options?.fallbackAction) {
        options.fallbackAction();
      }
      
      return false;
    }
  }, [registeredActions, canPerformAction, trigger, play, finalConfig]);

  // Get offline message for user
  const getOfflineMessage = useCallback((): string => {
    const queueCount = offlineState.queuedRequests;
    
    if (queueCount > 0) {
      return `You're offline. ${queueCount} request${queueCount > 1 ? 's' : ''} will be sent when you reconnect.`;
    }
    
    return "You're offline. Some features may not be available.";
  }, [offlineState.queuedRequests]);

  // Get disabled actions (those requiring network while offline)
  const getDisabledActions = useCallback((): OfflineAction[] => {
    if (offlineState.isOnline) return [];
    
    return Array.from(registeredActions.values()).filter(action => action.requiresNetwork);
  }, [offlineState.isOnline, registeredActions]);

  // Manual retry connection
  const retryConnection = useCallback(async () => {
    trigger('tap');
    play('tapSoft');
    
    try {
      // Force network status check
      const currentStatus = networkResilience.getNetworkStatus();
      if (currentStatus) {
        updateOfflineState(currentStatus);
      }
      
      // Try to process queued requests
      await networkResilience.processQueue();
      
      return offlineState.isOnline;
    } catch (error) {
      log.error('Retry connection failed', { event: 'retry_connection_failed', component: 'useOfflineUX' }, error);
      return false;
    }
  }, [trigger, play, updateOfflineState, offlineState.isOnline]);

  // Initialize network monitoring
  useEffect(() => {
    const unsubscribe = networkResilience.subscribe(updateOfflineState);
    
    return () => {
      unsubscribe();
      if (offlineMessageTimer) {
        clearTimeout(offlineMessageTimer);
      }
    };
  }, [updateOfflineState, offlineMessageTimer]);

  // Periodic queue status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const queueStatus = networkResilience.getQueueStatus();
      setOfflineState(prev => ({
        ...prev,
        queuedRequests: queueStatus.totalRequests,
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    // State
    ...offlineState,
    
    // Actions
    registerAction,
    unregisterAction,
    canPerformAction,
    performAction,
    retryConnection,
    
    // Helpers
    getOfflineMessage,
    getDisabledActions,
    
    // Configuration
    config: finalConfig,
  };
}

// Predefined common actions for easy registration
export const COMMON_OFFLINE_ACTIONS: Record<string, Omit<OfflineAction, 'id'>> = {
  BOOK_RIDE: {
    label: 'Book Ride',
    requiresNetwork: true,
    fallbackMessage: 'Booking requires internet connection. Your request will be sent when you reconnect.',
  },
  CANCEL_RIDE: {
    label: 'Cancel Ride',
    requiresNetwork: true,
    fallbackMessage: 'Cancellation requires internet connection. Your request will be queued.',
  },
  UPDATE_LOCATION: {
    label: 'Update Location',
    requiresNetwork: true,
    gracefulDegradation: () => {
      // Store location locally for later sync
      log.warn('Location update queued for when online', { event: 'location_update_queued', component: 'useOfflineUX' });
    },
  },
  SEND_MESSAGE: {
    label: 'Send Message',
    requiresNetwork: true,
    fallbackMessage: 'Messages will be sent when you reconnect.',
  },
  LOAD_MAP: {
    label: 'Load Map',
    requiresNetwork: false, // Can show cached/offline map
    gracefulDegradation: () => {
      // Show cached map tiles or simplified view
      log.warn('Showing offline map view', { event: 'offline_map_view_shown', component: 'useOfflineUX' });
    },
  },
  VIEW_HISTORY: {
    label: 'View Ride History',
    requiresNetwork: false, // Can show cached history
    gracefulDegradation: () => {
      // Show cached ride history
      log.warn('Showing cached ride history', { event: 'cached_ride_history_shown', component: 'useOfflineUX' });
    },
  },
};

export default useOfflineUX;
