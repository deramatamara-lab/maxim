/**
 * Network Status Provider
 * Handles network interruptions, offline queuing, and automatic retries
 * Integrates with WebSocket service for robust ride state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { log } from '@/utils/logger';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string | null;
  lastConnected: number | null;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface QueuedAction {
  id: string;
  type: 'ride_request' | 'ride_cancel' | 'payment' | 'location_update';
  data: unknown;
  timestamp: number;
  retryCount: number;
  retryDelay: number;
}

interface NetworkContextType {
  networkStatus: NetworkStatus;
  isOnline: boolean;
  queueAction: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount' | 'retryDelay'>) => void;
  retryAction: (actionId: string) => Promise<boolean>;
  clearQueue: () => void;
  getQueueLength: () => number;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
    lastConnected: Date.now(),
  });
  
  const [actionQueue, setActionQueue] = useState<QueuedAction[]>([]);
  const retryTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isProcessingQueue = useRef(false);

  // Calculate exponential backoff delay
  const calculateRetryDelay = useCallback((retryCount: number, config: RetryConfig): number => {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, retryCount);
    return Math.min(delay, config.maxDelay);
  }, []);

  // Refs to hold callbacks to avoid circular dependencies
  const processQueuedActionsRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const retryActionRef = useRef<((actionId: string) => Promise<boolean>) | undefined>(undefined);

  // Update network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const newStatus: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        connectionType: state.type,
        lastConnected: state.isConnected ? Date.now() : networkStatus.lastConnected,
      };

      setNetworkStatus(newStatus);

      log.info('Network status changed', {
        event: 'network_status_changed',
        component: 'NetworkStatusProvider',
        isConnected: newStatus.isConnected,
        isInternetReachable: newStatus.isInternetReachable,
        connectionType: newStatus.connectionType,
      });

      // Process queue when coming back online
      if (newStatus.isConnected && newStatus.isInternetReachable && !isProcessingQueue.current) {
        processQueuedActionsRef.current?.();
      }
    });

    return () => unsubscribe();
  }, [networkStatus.lastConnected]);

  // Queue an action for retry
  const queueAction = useCallback((
    action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount' | 'retryDelay'>
  ) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      retryDelay: calculateRetryDelay(0, DEFAULT_RETRY_CONFIG),
    };

    setActionQueue(prev => [...prev, queuedAction]);

    log.info('Action queued for retry', {
      event: 'action_queued',
      component: 'NetworkStatusProvider',
      actionId: queuedAction.id,
      actionType: action.type,
      queueLength: actionQueue.length + 1,
    });

    // Schedule retry if online
    if (networkStatus.isConnected && networkStatus.isInternetReachable) {
      const timer = setTimeout(() => {
        retryActionRef.current?.(queuedAction.id);
      }, queuedAction.retryDelay);
      retryTimers.current.set(queuedAction.id, timer);
    }
  }, [actionQueue.length, calculateRetryDelay, networkStatus]);

  // Retry a specific action
  const retryAction = useCallback(async (actionId: string): Promise<boolean> => {
    const action = actionQueue.find(a => a.id === actionId);
    if (!action) return false;

    // Clear existing timer
    const timer = retryTimers.current.get(actionId);
    if (timer) {
      clearTimeout(timer);
      retryTimers.current.delete(actionId);
    }

    try {
      log.info('Retrying queued action', {
        event: 'action_retry',
        component: 'NetworkStatusProvider',
        actionId: action.id,
        actionType: action.type,
        retryCount: action.retryCount + 1,
      });

      // Execute action based on type
      let success = false;
      switch (action.type) {
        case 'ride_request':
          success = await retryRideRequest(action.data);
          break;
        case 'ride_cancel':
          success = await retryRideCancel(action.data);
          break;
        case 'payment':
          success = await retryPayment(action.data);
          break;
        case 'location_update':
          success = await retryLocationUpdate(action.data);
          break;
      }

      if (success) {
        // Remove from queue on success
        setActionQueue(prev => prev.filter(a => a.id !== actionId));
        log.info('Action retry successful', {
          event: 'action_retry_success',
          component: 'NetworkStatusProvider',
          actionId: action.id,
        });
        return true;
      } else {
        // Increment retry count and reschedule if under max
        const newRetryCount = action.retryCount + 1;
        if (newRetryCount < DEFAULT_RETRY_CONFIG.maxRetries) {
          const updatedAction = {
            ...action,
            retryCount: newRetryCount,
            retryDelay: calculateRetryDelay(newRetryCount, DEFAULT_RETRY_CONFIG),
          };
          
          setActionQueue(prev => 
            prev.map(a => a.id === actionId ? updatedAction : a)
          );
          
          // Schedule retry inline to avoid circular dependency
          const timer = setTimeout(() => {
            retryAction(actionId);
          }, updatedAction.retryDelay);
          retryTimers.current.set(actionId, timer);
        } else {
          // Max retries reached, remove from queue
          setActionQueue(prev => prev.filter(a => a.id !== actionId));
          log.error('Action retry max attempts reached', {
            event: 'action_retry_max_reached',
            component: 'NetworkStatusProvider',
            actionId: action.id,
            retryCount: newRetryCount,
          });
        }
        return false;
      }
    } catch (error) {
      log.error('Action retry failed', {
        event: 'action_retry_failed',
        component: 'NetworkStatusProvider',
        actionId: action.id,
      }, error);
      return false;
    }
  }, [actionQueue, calculateRetryDelay]);

  // Process all queued actions when coming online
  const processQueuedActions = useCallback(async () => {
    if (isProcessingQueue.current || actionQueue.length === 0) return;
    
    isProcessingQueue.current = true;
    log.info('Processing queued actions', {
      event: 'processing_queue',
      component: 'NetworkStatusProvider',
      queueLength: actionQueue.length,
    });

    // Process actions in order with delay between them
    for (const action of actionQueue) {
      await retryAction(action.id);
      // Small delay between actions to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    isProcessingQueue.current = false;
  }, [actionQueue, retryAction]);

  // Assign callbacks to refs for use in other callbacks
  useEffect(() => {
    processQueuedActionsRef.current = processQueuedActions;
    retryActionRef.current = retryAction;
  }, [processQueuedActions, retryAction]);

  // Clear all queued actions
  const clearQueue = useCallback(() => {
    // Clear all timers
    retryTimers.current.forEach(timer => clearTimeout(timer));
    retryTimers.current.clear();
    
    setActionQueue([]);
    log.info('Action queue cleared', {
      event: 'queue_cleared',
      component: 'NetworkStatusProvider',
    });
  }, []);

  // Get queue length
  const getQueueLength = useCallback(() => {
    return actionQueue.length;
  }, [actionQueue]);

  // Retry implementations (these would integrate with existing services)
  const retryRideRequest = async (_data: unknown): Promise<boolean> => {
    // Integration with ride service
    try {
      // This would call your existing ride booking logic
      // await rideService.requestRide(data);
      log.info('Ride request retry would be executed here', {
        event: 'ride_request_retry_mock',
        component: 'NetworkStatusProvider',
      });
      return true;
    } catch (error) {
      log.error('Ride request retry failed', {
        event: 'ride_request_retry_error',
        component: 'NetworkStatusProvider',
      }, error);
      return false;
    }
  };

  const retryRideCancel = async (_data: unknown): Promise<boolean> => {
    // Integration with ride service
    try {
      // await rideService.cancelRide(data.rideId);
      log.info('Ride cancel retry would be executed here', {
        event: 'ride_cancel_retry_mock',
        component: 'NetworkStatusProvider',
      });
      return true;
    } catch (error) {
      log.error('Ride cancel retry failed', {
        event: 'ride_cancel_retry_error',
        component: 'NetworkStatusProvider',
      }, error);
      return false;
    }
  };

  const retryPayment = async (_data: unknown): Promise<boolean> => {
    // Integration with payment service
    try {
      // await paymentService.processPayment(data);
      log.info('Payment retry would be executed here', {
        event: 'payment_retry_mock',
        component: 'NetworkStatusProvider',
      });
      return true;
    } catch (error) {
      log.error('Payment retry failed', {
        event: 'payment_retry_error',
        component: 'NetworkStatusProvider',
      }, error);
      return false;
    }
  };

  const retryLocationUpdate = async (_data: unknown): Promise<boolean> => {
    // Integration with WebSocket service
    try {
      // await websocketService.updateLocation(data);
      log.info('Location update retry would be executed here', {
        event: 'location_update_retry_mock',
        component: 'NetworkStatusProvider',
      });
      return true;
    } catch (error) {
      log.error('Location update retry failed', {
        event: 'location_update_retry_error',
        component: 'NetworkStatusProvider',
      }, error);
      return false;
    }
  };

  const value: NetworkContextType = {
    networkStatus,
    isOnline: networkStatus.isConnected && networkStatus.isInternetReachable,
    queueAction,
    retryAction,
    clearQueue,
    getQueueLength,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworkStatus = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within NetworkStatusProvider');
  }
  return context;
};

export default NetworkStatusProvider;
