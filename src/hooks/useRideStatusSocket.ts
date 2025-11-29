/**
 * Ride Status WebSocket Hook
 * Handles real-time ride status updates, location tracking, and driver communication
 * Integrates with useEnhancedRideState to provide live ride updates
 */

import { useEffect, useCallback, useRef } from 'react';
import { wsService, RideStatusUpdate, DriverUpdate } from '@/services/websocketService';
import { Location } from '@/api/rides';
import { useEnhancedRideState } from '@/store/useEnhancedAppStore';
import { useWebSocketConnection } from '@/hooks/useWebSocket';
import { log } from '@/utils/logger';

interface UseRideStatusSocketOptions {
  rideId?: string;
  onStatusChange?: (status: string, data?: RideStatusUpdate) => void;
  onLocationUpdate?: (location: Location) => void;
  onDriverUpdate?: (driver: DriverUpdate) => void;
  onError?: (error: string) => void;
  onDriverCancelled?: (reason?: string) => void;
  _onNetworkInterruption?: (pendingActions: Array<{type: string, data: unknown}>) => void;
}

export function useRideStatusSocket({
  rideId,
  onStatusChange,
  onLocationUpdate,
  onDriverUpdate,
  onError,
  onDriverCancelled,
  _onNetworkInterruption,
}: UseRideStatusSocketOptions = {}) {
  const { 
    currentRide, 
    getActiveRide,
  } = useEnhancedRideState();
  
  const { isConnected, connectionStatus } = useWebSocketConnection();
  const processedEvents = useRef(new Set<string>());

  // Handle ride status updates
  const handleRideStatusUpdate = useCallback((update: RideStatusUpdate) => {
    // Only process updates for current ride or specific rideId
    if (rideId && update.rideId !== rideId) return;
    if (!rideId && currentRide?.id && update.rideId !== currentRide.id) return;

    // Prevent duplicate processing
    const eventKey = `status-${update.rideId}-${update.status}`;
    if (processedEvents.current.has(eventKey)) return;
    processedEvents.current.add(eventKey);

    log.info('Ride status update received', { 
      event: 'ride_status_update', 
      component: 'useRideStatusSocket',
      rideId: update.rideId,
      status: update.status,
      estimatedArrival: update.estimatedArrival 
    });

    // Handle driver cancellation edge case
    if (update.status === 'cancelled' && update.message?.includes('driver')) {
      onDriverCancelled?.(update.message);
      log.warn('Driver cancelled ride', { 
        event: 'driver_cancelled', 
        component: 'useRideStatusSocket',
        rideId: update.rideId,
        reason: update.message 
      });
    }

    // Refresh ride data from store to get latest status
    getActiveRide();

    // Call custom handler
    onStatusChange?.(update.status, update);

    // Clean up old processed events periodically
    if (processedEvents.current.size > 100) {
      const eventsArray = Array.from(processedEvents.current);
      processedEvents.current = new Set(eventsArray.slice(-50));
    }
  }, [rideId, currentRide, getActiveRide, onStatusChange, onDriverCancelled]);

  // Handle driver location updates
  const handleDriverUpdate = useCallback((update: DriverUpdate) => {
    // Only process updates for current ride
    if (rideId && currentRide?.id !== rideId) return;
    if (!rideId && currentRide?.id && !currentRide.driver?.id) return;

    // Prevent duplicate processing
    const eventKey = `location-${update.driverId}-${update.location.lat}-${update.location.lon}`;
    if (processedEvents.current.has(eventKey)) return;
    processedEvents.current.add(eventKey);

    log.info('Driver location update received', { 
      event: 'driver_location_update', 
      component: 'useRideStatusSocket',
      driverId: update.driverId,
      location: update.location,
      eta: update.eta 
    });

    // Refresh ride data to get latest location
    getActiveRide();

    // Call custom handler
    onLocationUpdate?.(update.location);
    onDriverUpdate?.(update);

    // Clean up old processed events periodically
    if (processedEvents.current.size > 100) {
      const eventsArray = Array.from(processedEvents.current);
      processedEvents.current = new Set(eventsArray.slice(-50));
    }
  }, [rideId, currentRide, getActiveRide, onLocationUpdate, onDriverUpdate]);

  // Handle connection errors
  const handleConnectionError = useCallback((error: string) => {
    log.error('WebSocket connection error', { 
      event: 'websocket_error', 
      component: 'useRideStatusSocket',
      error 
    });
    onError?.(error);
  }, [onError]);

  // Subscribe to WebSocket events when connected
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to ride status updates
    wsService.on('ride_status_update', handleRideStatusUpdate as (...args: unknown[]) => void);
    
    // Subscribe to driver location updates
    wsService.on('driver_location_update', handleDriverUpdate as (...args: unknown[]) => void);
    
    // Subscribe to connection errors
    wsService.on('connection_error', handleConnectionError as (...args: unknown[]) => void);

    // Join ride-specific room if we have a rideId
    if (rideId || currentRide?.id) {
      const targetRideId = rideId || currentRide?.id;
      wsService.joinRide(targetRideId!);
      
      log.info('Joined ride room', { 
        event: 'join_ride_room', 
        component: 'useRideStatusSocket',
        rideId: targetRideId 
      });
    }

    return () => {
      // Clean up event listeners
      wsService.off('ride_status_update', handleRideStatusUpdate as (...args: unknown[]) => void);
      wsService.off('driver_location_update', handleDriverUpdate as (...args: unknown[]) => void);
      wsService.off('connection_error', handleConnectionError as (...args: unknown[]) => void);
      
      // Leave ride room when unmounting
      if (rideId || currentRide?.id) {
        const targetRideId = rideId || currentRide?.id;
        wsService.leaveRide(targetRideId!);
        
        log.info('Left ride room', { 
          event: 'leave_ride_room', 
          component: 'useRideStatusSocket',
          rideId: targetRideId 
        });
      }
    };
  }, [isConnected, rideId, currentRide?.id, handleRideStatusUpdate, handleDriverUpdate, handleConnectionError]);

  // Request current ride status when connecting
  useEffect(() => {
    if (!isConnected || !rideId && !currentRide?.id) return;

    const targetRideId = rideId || currentRide?.id;
    if (targetRideId) {
      // Refresh ride data to get current status
      getActiveRide();
      
      log.info('Requested ride status and location', { 
        event: 'request_ride_status', 
        component: 'useRideStatusSocket',
        rideId: targetRideId 
      });
    }
  }, [isConnected, rideId, currentRide?.id, getActiveRide]);

  // Manual refresh function
  const refreshRideStatus = useCallback(() => {
    if (!isConnected || !rideId && !currentRide?.id) return false;

    const targetRideId = rideId || currentRide?.id;
    if (targetRideId) {
      getActiveRide();
      
      log.info('Manual refresh requested', { 
        event: 'manual_refresh', 
        component: 'useRideStatusSocket',
        rideId: targetRideId 
      });
      return true;
    }
    return false;
  }, [isConnected, rideId, currentRide?.id, getActiveRide]);

  return {
    isConnected,
    connectionStatus,
    refreshRideStatus,
  };
}

export default useRideStatusSocket;
