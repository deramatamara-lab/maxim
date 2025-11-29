/**
 * useActiveRide Hook
 * Manages active ride state and bridges WebSocket updates to UI components
 * Provides a clean interface for ActiveRideTracker component
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useActiveRideWebSocket } from './useWebSocket';
import { Driver, PaymentMethod, Location, Vehicle } from '@/types';
import { log } from '@/utils/logger';

export type RideStatus = 
  | 'searching' 
  | 'confirmed' 
  | 'arriving' 
  | 'in_progress' 
  | 'completed';

export interface RideOption {
  id: string;
  name: string;
  price: string;
  eta: string;
}

interface UseActiveRideOptions {
  rideId: string;
  driverId?: string;
  ride: RideOption;
  paymentMethod: PaymentMethod;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface UseActiveRideReturn {
  // State
  status: RideStatus;
  eta: number | null;
  driver: Driver | null;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  cancelRide: () => void;
  openChat: () => void;
  completeRide: () => void;
  
  // Chat
  messages: Array<{
    id: string;
    content: string;
    senderType: 'rider' | 'driver';
    timestamp: string;
  }>;
  sendMessage: (content: string) => void;
  unreadCount: number;
  
  // Location
  driverLocation: Location | null;
}

// Map WebSocket status to component status
const mapStatus = (wsStatus: string): RideStatus => {
  switch (wsStatus) {
    case 'pending':
    case 'searching':
      return 'searching';
    case 'accepted':
    case 'confirmed':
      return 'confirmed';
    case 'arriving':
    case 'driver_en_route':
      return 'arriving';
    case 'in_progress':
    case 'started':
      return 'in_progress';
    case 'completed':
    case 'arrived':
      return 'completed';
    default:
      return 'searching';
  }
};

export function useActiveRide({
  rideId,
  driverId,
  ride: _ride,
  paymentMethod: _paymentMethod,
  onComplete,
  onCancel,
}: UseActiveRideOptions): UseActiveRideReturn {
  const [_showChat, setShowChat] = useState(false);
  const [localStatus, setLocalStatus] = useState<RideStatus>('searching');

  // Connect to WebSocket
  const ws = useActiveRideWebSocket(rideId, driverId);

  // Map WebSocket status to component status
  const status = useMemo(() => {
    return mapStatus(ws.status);
  }, [ws.status]);

  // Update local status when WebSocket status changes
  useEffect(() => {
    setLocalStatus(status);
    
    log.info('Ride status updated', {
      event: 'ride_status_change',
      component: 'useActiveRide',
      rideId,
      status,
      wsStatus: ws.status,
    });
  }, [status, rideId, ws.status]);

  // Handle completion
  useEffect(() => {
    if (status === 'completed') {
      log.info('Ride completed', {
        event: 'ride_completed',
        component: 'useActiveRide',
        rideId,
      });
    }
  }, [status, rideId]);

  // Build driver object from WebSocket data
  const driver = useMemo((): Driver | null => {
    if (!driverId || status === 'searching') return null;

    // In production, this would come from the WebSocket or API
    // For now, construct from available data
    return {
      id: driverId,
      name: 'Driver', // Would come from WS
      email: '',
      rating: 4.95,
      totalTrips: 0,
      isOnline: true,
      vehicle: {
        id: 'v-1',
        make: 'Tesla',
        model: 'Model S',
        year: 2024,
        color: 'Black',
        licensePlate: '8X2-99L',
        type: 'electric',
        capacity: 4,
      } as Vehicle,
    };
  }, [driverId, status]);

  // Driver location from WebSocket
  const driverLocation = useMemo((): Location | null => {
    if (!ws.driverLocation) return null;
    return {
      latitude: ws.driverLocation.lat,
      longitude: ws.driverLocation.lon,
    };
  }, [ws.driverLocation]);

  // ETA in minutes
  const eta = useMemo((): number | null => {
    if (ws.driverEta) return ws.driverEta;
    if (ws.estimatedArrival) {
      // Convert timestamp to minutes
      const arrivalTime = new Date(ws.estimatedArrival).getTime();
      const now = Date.now();
      const diffMs = arrivalTime - now;
      return Math.max(0, Math.round(diffMs / 60000));
    }
    return null;
  }, [ws.driverEta, ws.estimatedArrival]);

  // Cancel ride
  const cancelRide = useCallback(() => {
    log.info('Cancelling ride', {
      event: 'ride_cancel_requested',
      component: 'useActiveRide',
      rideId,
    });
    
    // In production, send cancel request via WebSocket
    ws.sendMessage?.('cancel_ride', { rideId });
    onCancel?.();
  }, [rideId, ws, onCancel]);

  // Open chat
  const openChat = useCallback(() => {
    setShowChat(true);
    ws.markAllAsRead?.();
  }, [ws]);

  // Complete ride (acknowledge completion)
  const completeRide = useCallback(() => {
    log.info('Ride completion acknowledged', {
      event: 'ride_completion_acknowledged',
      component: 'useActiveRide',
      rideId,
    });
    onComplete?.();
  }, [rideId, onComplete]);

  // Chat messages
  const messages = useMemo(() => {
    return ws.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderType: msg.senderType as 'rider' | 'driver',
      timestamp: msg.timestamp,
    }));
  }, [ws.messages]);

  // Send chat message
  const sendMessage = useCallback((content: string) => {
    ws.sendChatMessage?.(content);
  }, [ws]);

  return {
    status: localStatus,
    eta,
    driver,
    isConnected: ws.isConnected,
    error: ws.error,
    cancelRide,
    openChat,
    completeRide,
    messages,
    sendMessage,
    unreadCount: ws.unreadCount,
    driverLocation,
  };
}

export default useActiveRide;
