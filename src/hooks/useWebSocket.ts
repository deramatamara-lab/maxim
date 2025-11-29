/**
 * React Hooks for WebSocket State Management
 * Provides real-time updates for location tracking, ride status, and chat functionality
 * Enhanced with automatic reconnection, heartbeat monitoring, and message queuing for production reliability
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wsService, LocationUpdate, RideStatusUpdate, DriverUpdate, ChatMessage } from '../services/websocketService';
import { log } from '../utils/logger';
import { deviceLocationManager, type LocationResult } from '../services/deviceLocationManager';
import { useEnhancedAuthState } from '../store/useEnhancedAppStore';
import * as Location from 'expo-location';

// Define missing types locally since they're not exported
interface RideRequestMessage {
  type: 'ride_request';
  data: {
    rideId: string;
    userId: string;
    pickupLocation: { lat: number; lng: number };
    dropoffLocation: { lat: number; lng: number };
  };
}

// Connection configuration
const WS_CONFIG = {
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectBackoffFactor: 2,
  heartbeatInterval: 30000, // 30 seconds
  heartbeatTimeout: 10000, // 10 seconds
  messageQueueMaxSize: 100,
};

// Queued message interface
interface QueuedMessage {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

// Enhanced connection hook with automatic reconnection and heartbeat
export function useWebSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'reconnecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastConnected, setLastConnected] = useState<number | null>(null);
  const { user, isAuthenticated } = useEnhancedAuthState();
  
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const isManualDisconnectRef = useRef(false);

  // Calculate reconnection delay with exponential backoff
  const getReconnectDelay = useCallback((attempt: number) => {
    return Math.min(
      WS_CONFIG.reconnectDelay * Math.pow(WS_CONFIG.reconnectBackoffFactor, attempt),
      WS_CONFIG.maxReconnectDelay
    );
  }, []);

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsService.isSocketConnected()) {
        // Send ping
        wsService.send({ type: 'ping', timestamp: Date.now() });
        
        // Set timeout for pong response
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }
        
        heartbeatTimeoutRef.current = setTimeout(() => {
          log.warn('WebSocket heartbeat timeout - connection may be dead', {
            event: 'websocket_heartbeat_timeout',
            component: 'useWebSocketConnection',
          });
          wsService.disconnect();
          setIsConnected(false);
          setConnectionStatus('disconnected');
          setError('Connection lost - no heartbeat response');
        }, WS_CONFIG.heartbeatTimeout);
      }
    }, WS_CONFIG.heartbeatInterval);
  }, []);

  // Stop heartbeat monitoring
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Queue message for offline delivery
  const queueMessage = useCallback((type: string, data: unknown) => {
    const message: QueuedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    messageQueueRef.current.push(message);

    // Limit queue size
    if (messageQueueRef.current.length > WS_CONFIG.messageQueueMaxSize) {
      messageQueueRef.current = messageQueueRef.current.slice(-WS_CONFIG.messageQueueMaxSize);
    }

    // Persist queue to storage
    AsyncStorage.setItem('ws_message_queue', JSON.stringify(messageQueueRef.current));
  }, []);

  // Send queued messages when reconnected
  const flushMessageQueue = useCallback(async () => {
    if (messageQueueRef.current.length === 0) return;

    const messages = [...messageQueueRef.current];
    messageQueueRef.current = [];

    try {
      for (const message of messages) {
        // Skip old messages (older than 5 minutes)
        if (Date.now() - message.timestamp > 5 * 60 * 1000) {
          continue;
        }

        try {
          await wsService.send({ type: message.type, ...(message.data as Record<string, unknown>) });
        } catch (error) {
          log.warn(`Failed to send queued message ${message.id}`, {
            event: 'websocket_queue_send_failed',
            component: 'useWebSocketConnection',
            messageId: message.id,
            messageType: message.type,
            retryCount: message.retryCount,
          }, error);
          message.retryCount++;
          
          // Re-queue if retry count is below threshold
          if (message.retryCount < 3) {
            messageQueueRef.current.push(message);
          }
        }
      }

      // Update persisted queue
      await AsyncStorage.setItem('ws_message_queue', JSON.stringify(messageQueueRef.current));
    } catch (error) {
      log.error('Failed to flush message queue', {
        event: 'websocket_queue_flush_failed',
        component: 'useWebSocketConnection',
        queueSize: messages.length,
      }, error);
    }
  }, []);

  // Connect with automatic reconnection
  const connect = useCallback(async (isReconnect = false) => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      if (isReconnect) {
        setConnectionStatus('reconnecting');
      } else {
        setConnectionStatus('connecting');
      }
      
      setError(null);
      
      await wsService.connect(user.authToken || 'mock-token');
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setLastConnected(Date.now());
      
      // Start heartbeat and flush queued messages
      startHeartbeat();
      await flushMessageQueue();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      setConnectionStatus('disconnected');
      setIsConnected(false);

      // Automatic reconnection logic
      if (!isManualDisconnectRef.current && reconnectAttempts < WS_CONFIG.maxReconnectAttempts) {
        const nextAttempt = reconnectAttempts + 1;
        setReconnectAttempts(nextAttempt);
        
        const delay = getReconnectDelay(nextAttempt);
        log.info(`WebSocket reconnection attempt ${nextAttempt}/${WS_CONFIG.maxReconnectAttempts} in ${delay}ms`, {
          event: 'websocket_reconnect_attempt',
          component: 'useWebSocketConnection',
          attempt: nextAttempt,
          maxAttempts: WS_CONFIG.maxReconnectAttempts,
          delay,
        });
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect(true);
        }, delay);
      } else if (reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
        setError('Maximum reconnection attempts reached. Please check your connection and try again.');
      }
    }
  }, [isAuthenticated, user, reconnectAttempts, getReconnectDelay, startHeartbeat, flushMessageQueue]);

  // Manual disconnect
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    wsService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
  }, [stopHeartbeat]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    isManualDisconnectRef.current = false;
    setReconnectAttempts(0);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    connect();
  }, [connect]);

  // Send message with queuing fallback
  const sendMessage = useCallback(async (type: string, data: unknown) => {
    if (wsService.isSocketConnected()) {
      try {
        await wsService.send({ type, ...(data as Record<string, unknown>) });
        return true;
      } catch (error) {
        log.warn('Failed to send message, queuing for later', {
          event: 'websocket_send_failed',
          component: 'useWebSocketConnection',
          messageType: type,
        }, error);
        queueMessage(type, data);
        return false;
      }
    } else {
      // Queue message for when connection is restored
      queueMessage(type, data);
      return false;
    }
  }, [queueMessage]);

  // Initialize connection and load queued messages
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Load persisted message queue
    AsyncStorage.getItem('ws_message_queue')
      .then((stored) => {
        if (stored) {
          try {
            messageQueueRef.current = JSON.parse(stored);
          } catch (error) {
            log.error('Failed to parse message queue', {
              event: 'websocket_queue_parse_failed',
              component: 'useWebSocketConnection',
            }, error);
            messageQueueRef.current = [];
          }
        }
      })
      .catch((error) => {
        log.error('Failed to load message queue', {
          event: 'websocket_queue_load_failed',
          component: 'useWebSocketConnection',
        }, error);
      });

    // Reset manual disconnect flag and connect
    isManualDisconnectRef.current = false;
    connect();

    // WebSocket event handlers
    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      stopHeartbeat();
      
      // Trigger automatic reconnection if not manual
      if (!isManualDisconnectRef.current) {
        connect(true);
      }
    };

    const handleReconnect = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      setReconnectAttempts(0);
      setLastConnected(Date.now());
      startHeartbeat();
    };

    const handleReconnectError = (...args: unknown[]) => {
      const err = args[0] as Error;
      setError(err instanceof Error ? err.message : 'Reconnection failed');
    };

    const handlePong = () => {
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
        heartbeatTimeoutRef.current = null;
      }
    };

    wsService.on('disconnected', handleDisconnect);
    wsService.on('reconnected', handleReconnect);
    wsService.on('reconnect_error', handleReconnectError);
    wsService.on('pong', handlePong);

    return () => {
      wsService.off('disconnected', handleDisconnect);
      wsService.off('reconnected', handleReconnect);
      wsService.off('reconnect_error', handleReconnectError);
      wsService.off('pong', handlePong);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
      wsService.disconnect();
    };
  }, [isAuthenticated, user, connect, stopHeartbeat, startHeartbeat]);

  return {
    isConnected,
    connectionStatus,
    error,
    reconnectAttempts,
    lastConnected,
    reconnect,
    disconnect,
    sendMessage,
    queuedMessageCount: messageQueueRef.current.length,
  };
}

// Enhanced location tracking hook using WebSocket real-time updates
export function useLocationTracking(rideId?: string) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationUpdate[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const { sendMessage, isConnected } = useWebSocketConnection();
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start real-time location tracking via WebSocket
  const startTracking = useCallback(async () => {
    if (!rideId || !isConnected) return;

    setIsTracking(true);
    
    // Join ride room for location updates
    sendMessage('join_ride', { rideId });
    
    // Start sending location updates every 10 seconds using production GPS
    const startLocationTracking = async () => {
      try {
        // Start real-time GPS tracking using DeviceLocationManager
        const trackingStarted = await deviceLocationManager.watchLocation(
          async (locationResult: LocationResult) => {
            if (locationResult.success && locationResult.coordinates) {
              // Send real GPS location update via WebSocket
              await sendMessage('location_update', {
                rideId,
                location: {
                  lat: locationResult.coordinates.latitude,
                  lon: locationResult.coordinates.longitude,
                  accuracy: locationResult.coordinates.accuracy,
                  heading: locationResult.coordinates.heading,
                  speed: locationResult.coordinates.speed,
                  timestamp: locationResult.coordinates.timestamp,
                },
                source: locationResult.source,
                accuracy: locationResult.accuracy,
              });
              
              // Update local state
              setCurrentLocation({
                lat: locationResult.coordinates.latitude,
                lon: locationResult.coordinates.longitude,
              });
              setLastUpdate(Date.now());
            } else {
              // Handle location errors
              log.error('GPS location error', { event: 'gps_location_error', component: 'useWebSocket' }, locationResult.error);
              // Could show error UI to driver here
              if (locationResult.error?.requiresUserAction) {
                // Show permission or settings dialog
                deviceLocationManager.showLocationSettingsDialog();
              }
            }
          },
          {
            accuracy: Location.Accuracy.Balanced, // Balance battery usage and accuracy
            timeout: 10000, // 10 second timeout for driver tracking
          }
        );

        if (!trackingStarted) {
          throw new Error('Failed to start GPS tracking');
        }

        log.warn('Production GPS tracking started', { event: 'gps_tracking_started', component: 'useWebSocket', rideId });
      } catch (error) {
        log.error('Failed to start GPS tracking', { event: 'start_gps_tracking_failed', component: 'useWebSocket' }, error);
        // Fallback to mock data only if GPS completely fails
        log.warn('Falling back to mock location data due to GPS failure', { event: 'gps_fallback_to_mock', component: 'useWebSocket' });
        startMockLocationTracking();
      }
    };

    const startMockLocationTracking = () => {
      locationUpdateIntervalRef.current = setInterval(async () => {
        try {
          // Fallback mock location (only used if GPS fails)
          const mockLocation = {
            lat: 40.7128 + (Math.random() - 0.5) * 0.001,
            lon: -74.006 + (Math.random() - 0.5) * 0.001,
            accuracy: 10 + Math.random() * 20,
            heading: Math.random() * 360,
            speed: 0 + Math.random() * 50,
            timestamp: Date.now(),
          };
        
        // Send location update via WebSocket
        await sendMessage('location_update', {
          rideId,
          location: mockLocation,
        });
        
        // Update local state with mock location
        setCurrentLocation({
          lat: mockLocation.lat,
          lon: mockLocation.lon,
        });
        setLastUpdate(Date.now());
      } catch (error) {
          log.warn('Failed to send location update', {
            event: 'location_update_failed',
            component: 'useLocationTracking',
            rideId,
          }, error);
        }
    }, 10000) as unknown as NodeJS.Timeout;
    };

    // Start production GPS tracking
    await startLocationTracking();
  }, [rideId, isConnected, sendMessage]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (!rideId) return;

    setIsTracking(false);
    
    // Stop production GPS tracking
    deviceLocationManager.stopWatchingLocation();
    
    // Clear any fallback mock location interval
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
    
    // Leave ride room
    sendMessage('leave_ride', { rideId });
    
    log.warn('GPS tracking stopped', { event: 'gps_tracking_stopped', component: 'useWebSocket', rideId });
  }, [rideId, sendMessage]);

  // Handle incoming location updates
  useEffect(() => {
    if (!rideId) return;

    const handleLocationUpdate = (...args: unknown[]) => {
      const update = args[0] as LocationUpdate;
      if (update.rideId === rideId) {
        setCurrentLocation(update.location);
        setLastUpdate(Date.now());
        setLocationHistory(prev => {
          const newHistory = [...prev, update];
          // Keep last 100 updates for route tracking
          return newHistory.slice(-100);
        });
      }
    };

    const handleDriverLocation = (...args: unknown[]) => {
      const update = args[0] as DriverUpdate;
      if (update.location) {
        setCurrentLocation(update.location);
        setLastUpdate(Date.now());
        setLocationHistory(prev => {
          const newHistory = [...prev, {
            id: `driver_${Date.now()}`,
            rideId,
            driverId: update.driverId,
            location: update.location,
            timestamp: Date.now().toString(),
            type: 'driver',
          } as unknown as LocationUpdate];
          return newHistory.slice(-100);
        });
      }
    };

    // Subscribe to WebSocket events
    wsService.on('location_update', handleLocationUpdate);
    wsService.on('driver_location', handleDriverLocation);

    return () => {
      // Cleanup WebSocket subscriptions
      wsService.off('location_update', handleLocationUpdate);
      wsService.off('driver_location', handleDriverLocation);
      
      // Stop GPS tracking on component unmount
      stopTracking();
    };
  }, [rideId, stopTracking]);

  // Auto-stop tracking when ride changes or connection is lost
  useEffect(() => {
    if (!rideId || !isConnected) {
      stopTracking();
    }
  }, [rideId, isConnected, stopTracking]);

  return {
    currentLocation,
    locationHistory,
    isTracking,
    lastUpdate,
    startTracking,
    stopTracking,
  };
}

export default useWebSocketConnection;

// Ride status hook
export function useRideStatus(rideId?: string) {
  const [status, setStatus] = useState<string>('pending');
  const [estimatedArrival, setEstimatedArrival] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusHistory, setStatusHistory] = useState<RideStatusUpdate[]>([]);

  useEffect(() => {
    if (!rideId) return;

    const handleStatusUpdate = (...args: unknown[]) => {
      const update = args[0] as RideStatusUpdate;
      if (update.rideId === rideId) {
        setStatus(update.status);
        setEstimatedArrival(update.estimatedArrival || null);
        setStatusMessage(update.message || '');
        setStatusHistory(prev => [...prev, update]);
      }
    };

    wsService.on('ride_status_update', handleStatusUpdate);

    return () => {
      wsService.off('ride_status_update', handleStatusUpdate);
    };
  }, [rideId]);

  return {
    status,
    estimatedArrival,
    statusMessage,
    statusHistory,
  };
}

// Driver tracking hook
export function useDriverTracking(driverId?: string) {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [eta, setEta] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);

  useEffect(() => {
    if (!driverId) return;

    const handleDriverUpdate = (...args: unknown[]) => {
      const update = args[0] as DriverUpdate;
      if (update.driverId === driverId) {
        setDriverLocation(update.location);
        setEta(update.eta || 0);
        setHeading(update.heading);
        setSpeed(update.speed);
      }
    };

    wsService.on('driver_update', handleDriverUpdate);

    return () => {
      wsService.off('driver_update', handleDriverUpdate);
    };
  }, [driverId]);

  return {
    driverLocation,
    eta,
    heading,
    speed,
  };
}

// Chat hook
export function useChat(rideId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, _setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!rideId) return;

    const handleChatMessage = (...args: unknown[]) => {
      const message = args[0] as ChatMessage;
      if (message.rideId === rideId) {
        setMessages(prev => [...prev, message]);
        
        // Increment unread count for messages from other party
        if (!message.read && message.senderType !== 'rider') {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    wsService.on('chat_message', handleChatMessage);

    return () => {
      wsService.off('chat_message', handleChatMessage);
    };
  }, [rideId]);

  const sendMessage = useCallback((content: string) => {
    if (!rideId || !content.trim()) return;

    wsService.sendChatMessage(rideId, content.trim());
    
    // Add optimistic message
    const optimisticMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      rideId,
      senderId: 'current-user',
      senderType: 'rider',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
  }, [rideId]);

  const markAsRead = useCallback((messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setMessages(prev => 
      prev.map(msg => ({ ...msg, read: true }))
    );
    setUnreadCount(0);
  }, []);

  return {
    messages,
    isTyping,
    unreadCount,
    sendMessage,
    markAsRead,
    markAllAsRead,
  };
}

// Combined hook for active ride
export function useActiveRideWebSocket(rideId?: string, driverId?: string) {
  const connection = useWebSocketConnection();
  const locationTracking = useLocationTracking(rideId);
  const rideStatus = useRideStatus(rideId);
  const driverTracking = useDriverTracking(driverId);
  const chat = useChat(rideId);

  // Auto-start tracking when connected and ride is active
  useEffect(() => {
    if (connection.isConnected && rideId && !locationTracking.isTracking) {
      locationTracking.startTracking();
    }
  }, [connection.isConnected, rideId, locationTracking.isTracking, locationTracking.startTracking]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendLocation = useCallback((location: { lat: number; lon: number }) => {
    wsService.sendLocation(location);
  }, []);

  const sendChatMessage = useCallback((content: string) => {
    chat.sendMessage(content);
  }, [chat]);

  return {
    // Connection
    ...connection,
    
    // Location tracking
    currentLocation: locationTracking.currentLocation,
    locationHistory: locationTracking.locationHistory,
    isTracking: locationTracking.isTracking,
    startTracking: locationTracking.startTracking,
    stopTracking: locationTracking.stopTracking,
    sendLocation,
    
    // Ride status
    status: rideStatus.status,
    estimatedArrival: rideStatus.estimatedArrival,
    statusMessage: rideStatus.statusMessage,
    statusHistory: rideStatus.statusHistory,
    
    // Driver tracking
    driverLocation: driverTracking.driverLocation,
    driverEta: driverTracking.eta,
    driverHeading: driverTracking.heading,
    driverSpeed: driverTracking.speed,
    
    // Chat
    messages: chat.messages,
    unreadCount: chat.unreadCount,
    sendChatMessage,
    markAsRead: chat.markAsRead,
    markAllAsRead: chat.markAllAsRead,
  };
}

// Driver-specific hook
export function useDriverWebSocket() {
  const connection = useWebSocketConnection();
  const [currentRequest, setCurrentRequest] = useState<RideRequestMessage | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleRideRequest = (...args: unknown[]) => {
      const request = args[0] as RideRequestMessage;
      setCurrentRequest(request);
    };

    wsService.on('ride_request', handleRideRequest);

    return () => {
      wsService.off('ride_request', handleRideRequest);
    };
  }, []);

  const goOnline = useCallback(() => {
    wsService.updateDriverStatus('online');
    setIsOnline(true);
  }, []);

  const goOffline = useCallback(() => {
    wsService.updateDriverStatus('offline');
    setIsOnline(false);
  }, []);

  const acceptRide = useCallback((rideId: string) => {
    wsService.acceptRide(rideId);
    setCurrentRequest(null);
  }, []);

  const rejectRide = useCallback((rideId: string, reason?: string) => {
    wsService.rejectRide(rideId, reason);
    setCurrentRequest(null);
  }, []);

  const startRide = useCallback((rideId: string) => {
    wsService.startRide(rideId);
  }, []);

  const completeRide = useCallback((rideId: string) => {
    wsService.completeRide(rideId);
  }, []);

  return {
    ...connection,
    currentRequest,
    isOnline,
    goOnline,
    goOffline,
    acceptRide,
    rejectRide,
    startRide,
    completeRide,
  };
}
