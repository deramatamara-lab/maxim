/**
 * WebSocket Service for Real-time Updates
 * Handles live location tracking, ride status updates, and driver communication
 */

import { io, Socket } from 'socket.io-client';
import { Location } from '@/api/rides';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/utils/logger';
import { 
  WebSocketEventType,
  type RideRequestPayload,
  type RideAcceptedPayload,
  type RideStartedPayload,
  type RideCompletedPayload,
  type LocationUpdatePayload,
  type ChatMessagePayload,
} from '@/types/websocketEvents';

// WebSocket event types
export interface LocationUpdate {
  rideId: string;
  driverId: string;
  location: Location;
  timestamp: string;
  heading?: number;
  speed?: number;
}

export interface RideStatusUpdate {
  rideId: string;
  status: 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  estimatedArrival?: number;
  message?: string;
}

export interface DriverUpdate {
  driverId: string;
  location: Location;
  heading: number;
  speed: number;
  eta: number; // minutes
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderType: 'rider' | 'driver';
  content: string;
  timestamp: string;
  read: boolean;
}

// Presence tracking types
export interface PresenceUpdate {
  userId: string;
  userType: 'rider' | 'driver';
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  rideId?: string; // If currently in a ride
}

export interface PresenceState {
  [userId: string]: PresenceUpdate;
}

// WebSocket service class
// WebSocket event data types
export interface WebSocketEventData {
  ride_request?: {
    rideId: string;
    pickup: Location;
    destination: Location;
    passengerId: string;
    fare: number;
  };
  message?: {
    type: string;
    data: unknown;
    timestamp: string;
  };
  [key: string]: unknown;
}

// Queued message type for offline support
interface QueuedMessage {
  event: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

// Protocol version for compatibility checking
const PROTOCOL_VERSION = '1.0.0';
const MIN_SUPPORTED_VERSION = '1.0.0';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private serverProtocolVersion: string | null = null;
  private reconnectDelay = 1000;
  
  /**
   * Check if server protocol version is compatible with client
   * NET-02: Protocol version detection
   */
  private checkProtocolCompatibility(serverVersion: string): boolean {
    // Parse version strings (major.minor.patch)
    const parseVersion = (v: string) => {
      const parts = v.split('.').map(Number);
      return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
    };
    
    const server = parseVersion(serverVersion);
    const minSupported = parseVersion(MIN_SUPPORTED_VERSION);
    
    // Major version must match, minor/patch can be higher
    if (server.major < minSupported.major) return false;
    if (server.major > minSupported.major) return true;
    if (server.minor < minSupported.minor) return false;
    
    return true;
  }
  
  /**
   * Get current protocol version info
   */
  public getProtocolInfo(): { clientVersion: string; serverVersion: string | null; isCompatible: boolean } {
    return {
      clientVersion: PROTOCOL_VERSION,
      serverVersion: this.serverProtocolVersion,
      isCompatible: this.serverProtocolVersion 
        ? this.checkProtocolCompatibility(this.serverProtocolVersion) 
        : true,
    };
  }
  private listeners: Map<string, ((data?: unknown) => void)[]> = new Map();
  
  // Idempotency tracking
  private processedEvents = new Set<string>();
  private readonly maxProcessedEvents = 1000;
  
  // Heartbeat configuration
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly HEARTBEAT_INTERVAL = 25000; // 25 seconds (server usually expects 30s)
  private readonly HEARTBEAT_TIMEOUT = 10000;  // 10 seconds to wait for pong
  private lastPongReceived = 0;
  private missedHeartbeats = 0;
  private readonly MAX_MISSED_HEARTBEATS = 3;

  // Offline message queue
  private messageQueue: QueuedMessage[] = [];
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly MAX_MESSAGE_AGE_MS = 5 * 60 * 1000; // 5 minutes
  private readonly QUEUE_STORAGE_KEY = 'websocket_message_queue';
  private readonly MAX_RETRIES = 3;

  // Backoff configuration
  private readonly BASE_RECONNECT_DELAY = 1000;
  private readonly MAX_RECONNECT_DELAY = 30000; // 30 seconds max
  private readonly JITTER_FACTOR = 0.1; // 10% jitter
  
  // Debounced persistence
  private persistenceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly PERSISTENCE_DEBOUNCE_MS = 2000; // 2 seconds
  private needsPersistence = false;

  // Presence tracking
  private presenceState: PresenceState = {};
  private myPresenceStatus: 'online' | 'offline' | 'away' | 'busy' = 'offline';

  // Connection management
  async connect(authToken: string): Promise<void> {
    // Load persisted queue before connecting
    await this.loadPersistedQueue();
    
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      try {
        // Production-ready WebSocket URL configuration
        const env = process.env.EXPO_PUBLIC_ENV || 'development';
        let url: string;
        
        if (process.env.EXPO_PUBLIC_WS_URL) {
          // Environment-specific WebSocket URL
          url = process.env.EXPO_PUBLIC_WS_URL;
        } else {
          // Fallback URLs by environment
          switch (env) {
            case 'production':
              url = 'wss://api.aura.app';
              break;
            case 'staging':
              url = 'wss://api-staging.aura.app';
              break;
            default:
              url = 'ws://localhost:3001';
          }
        }
        
        log.info('Initializing WebSocket connection', {
          event: 'websocket_init',
          component: 'websocketService',
          environment: env,
          url,
        });
        
        this.socket = io(url, {
          auth: { token: authToken },
          transports: ['websocket'],
          timeout: 10000,
          forceNew: true,
        });

        this.setupEventListeners();
        
        this.socket.on('connect', () => {
          log.info('WebSocket connected', { 
            event: 'websocket_connected', 
            component: 'websocketService', 
            url,
            clientProtocolVersion: PROTOCOL_VERSION,
          });
          
          // Request server protocol version
          this.socket?.emit('protocol_version_request', { version: PROTOCOL_VERSION });
        });
        
        // Handle protocol version response
        this.socket.on('protocol_version', (data: { version: string }) => {
          this.serverProtocolVersion = data.version;
          
          // Check version compatibility
          const isCompatible = this.checkProtocolCompatibility(data.version);
          
          log.info('Protocol version check', {
            event: 'protocol_version_check',
            component: 'websocketService',
            clientVersion: PROTOCOL_VERSION,
            serverVersion: data.version,
            isCompatible,
          });
          
          if (!isCompatible) {
            log.warn('Protocol version mismatch', {
              event: 'protocol_version_mismatch',
              component: 'websocketService',
              clientVersion: PROTOCOL_VERSION,
              serverVersion: data.version,
              minSupported: MIN_SUPPORTED_VERSION,
            });
            this.emit('protocol_mismatch', { 
              clientVersion: PROTOCOL_VERSION, 
              serverVersion: data.version 
            });
          }
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.missedHeartbeats = 0;
          this.startHeartbeat();
          this.emit('connected');
          
          // Flush any queued messages from offline period
          this.flushMessageQueue();
          
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          log.error('WebSocket connection error', { event: 'websocket_connection_error', component: 'websocketService' }, error);
          this.isConnected = false;
          reject(error);
        });

      } catch (error) {
        log.error('Failed to initialize WebSocket', { event: 'websocket_init_failed', component: 'websocketService' }, error);
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    
    // Force persist queue before disconnect
    await this.forcePersistQueue();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
    this.processedEvents.clear();
    
    // Clear persistence timer
    if (this.persistenceTimer) {
      clearTimeout(this.persistenceTimer);
      this.persistenceTimer = null;
    }
  }

  // Idempotency methods
  private isEventProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  private markEventProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
    
    // Cleanup old events to prevent memory leaks
    if (this.processedEvents.size > this.maxProcessedEvents) {
      const eventsArray = Array.from(this.processedEvents);
      // Keep only the most recent events
      this.processedEvents = new Set(eventsArray.slice(-this.maxProcessedEvents / 2));
    }
  }

  // Process event with idempotency check
  private async processEvent(eventType: WebSocketEventType, data: unknown): Promise<void> {
    // Check if event has ID for idempotency
    const eventData = data as { id?: string };
    if (eventData?.id) {
      if (this.isEventProcessed(eventData.id)) {
        log.debug('Skipping duplicate WebSocket event', {
          event: 'duplicate_event_skipped',
          component: 'websocketService',
          eventId: eventData.id,
          eventType,
        });
        return;
      }
      this.markEventProcessed(eventData.id);
    }

    // Emit to listeners
    this.emit(eventType, data);
  }

  // Heartbeat methods for connection health monitoring
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    this.lastPongReceived = Date.now();
    
    log.debug('Starting WebSocket heartbeat', { 
      event: 'heartbeat_start', 
      component: 'websocketService',
      interval: this.HEARTBEAT_INTERVAL 
    });

    this.heartbeatInterval = setInterval(() => {
      this.sendPing();
    }, this.HEARTBEAT_INTERVAL);

    // Listen for pong response
    this.socket?.on('pong', () => {
      this.handlePong();
    });
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    this.socket?.off('pong');
  }

  private sendPing(): void {
    if (!this.socket?.connected) {
      log.warn('Cannot send ping - socket not connected', { 
        event: 'heartbeat_skip', 
        component: 'websocketService' 
      });
      return;
    }

    log.debug('Sending WebSocket ping', { 
      event: 'heartbeat_ping', 
      component: 'websocketService',
      lastPong: Date.now() - this.lastPongReceived 
    });

    this.socket.emit('ping');
    
    // Set timeout to detect missed pong
    this.heartbeatTimeout = setTimeout(() => {
      this.handleMissedPong();
    }, this.HEARTBEAT_TIMEOUT);
  }

  private handlePong(): void {
    // Clear the timeout since we got a response
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    
    this.lastPongReceived = Date.now();
    this.missedHeartbeats = 0;
    
    log.debug('Received WebSocket pong', { 
      event: 'heartbeat_pong', 
      component: 'websocketService',
      latency: Date.now() - this.lastPongReceived 
    });
    
    this.emit('heartbeat', { timestamp: this.lastPongReceived });
  }

  private handleMissedPong(): void {
    this.missedHeartbeats++;
    
    log.warn('Missed WebSocket pong', { 
      event: 'heartbeat_missed', 
      component: 'websocketService',
      missedCount: this.missedHeartbeats,
      maxAllowed: this.MAX_MISSED_HEARTBEATS 
    });
    
    this.emit('heartbeat_missed', { missedCount: this.missedHeartbeats });
    
    if (this.missedHeartbeats >= this.MAX_MISSED_HEARTBEATS) {
      log.error('WebSocket connection appears dead - initiating reconnect', { 
        event: 'heartbeat_connection_dead', 
        component: 'websocketService',
        missedHeartbeats: this.missedHeartbeats 
      });
      
      // Force disconnect and reconnect
      this.socket?.disconnect();
      this.attemptReconnect();
    }
  }

  // Get heartbeat health status
  getHeartbeatStatus(): { 
    isHealthy: boolean; 
    lastPong: number; 
    missedHeartbeats: number;
    timeSinceLastPong: number;
  } {
    return {
      isHealthy: this.missedHeartbeats < this.MAX_MISSED_HEARTBEATS,
      lastPong: this.lastPongReceived,
      missedHeartbeats: this.missedHeartbeats,
      timeSinceLastPong: Date.now() - this.lastPongReceived,
    };
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      log.warn('WebSocket disconnected', { event: 'websocket_disconnected', component: 'websocketService', reason });
      this.isConnected = false;
      this.emit('disconnected', reason);
      
      // Auto-reconnect for unexpected disconnections
      if (reason === 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      log.info('WebSocket reconnected', { event: 'websocket_reconnected', component: 'websocketService', attemptNumber });
      this.isConnected = true;
      this.emit('reconnected', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      log.error('WebSocket reconnection error', { event: 'websocket_reconnection_error', component: 'websocketService' }, error);
      this.emit('reconnect_error', error);
    });

    // Real-time ride events with idempotency
    this.socket.on('location_update', (data: LocationUpdatePayload) => {
      this.processEvent('driver_location_update', data);
    });

    this.socket.on('ride_status_update', (data: RideStatusUpdate) => {
      this.processEvent('ride_status_update' as WebSocketEventType, data);
    });

    this.socket.on('driver_update', (data: DriverUpdate) => {
      this.processEvent('driver_update' as WebSocketEventType, data);
    });

    this.socket.on('chat_message', (data: ChatMessagePayload) => {
      this.processEvent('chat_message', data);
    });

    this.socket.on('ride_request', (data: RideRequestPayload) => {
      this.processEvent('ride_request', data);
    });

    this.socket.on('ride_accepted', (data: RideAcceptedPayload) => {
      this.processEvent('ride_accepted', data);
    });

    this.socket.on('ride_started', (data: RideStartedPayload) => {
      this.processEvent('ride_started', data);
    });

    this.socket.on('ride_completed', (data: RideCompletedPayload) => {
      this.processEvent('ride_completed', data);
    });

    this.socket.on('ride_cancelled', (data: { rideId: string; reason: string }) => {
      this.processEvent('ride_cancelled', data);
    });

    // Presence events
    this.socket.on('presence_update', (data: PresenceUpdate) => {
      this.presenceState[data.userId] = data;
      log.debug('Presence update received', {
        event: 'presence_update',
        component: 'websocketService',
        userId: data.userId,
        status: data.status,
      });
      this.emit('presence_update', data);
    });

    this.socket.on('presence_batch', (data: PresenceUpdate[]) => {
      data.forEach(update => {
        this.presenceState[update.userId] = update;
      });
      log.debug('Presence batch received', {
        event: 'presence_batch',
        component: 'websocketService',
        count: data.length,
      });
      this.emit('presence_batch', data);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.error('Max reconnection attempts reached', { event: 'websocket_max_reconnect_reached', component: 'websocketService', attempts: this.reconnectAttempts });
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const exponentialDelay = this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1);
    const jitteredDelay = this.addJitter(exponentialDelay);
    const finalDelay = Math.min(jitteredDelay, this.MAX_RECONNECT_DELAY);

    log.warn('Attempting reconnection', { 
      event: 'websocket_reconnect_attempt', 
      component: 'websocketService',
      currentAttempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      baseDelay: exponentialDelay,
      jitteredDelay: finalDelay,
      jitterMs: finalDelay - exponentialDelay
    });

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, finalDelay);
  }

  // Add jitter to prevent thundering herd
  private addJitter(delay: number): number {
    const jitter = delay * this.JITTER_FACTOR;
    const randomJitter = (Math.random() - 0.5) * 2 * jitter; // ±jitter
    return delay + randomJitter;
  }

  // AsyncStorage persistence methods
  private async persistQueue(): Promise<void> {
    if (!this.needsPersistence) return;
    
    try {
      const queueData = JSON.stringify(this.messageQueue);
      await AsyncStorage.setItem(this.QUEUE_STORAGE_KEY, queueData);
      this.needsPersistence = false;
    } catch (error) {
      log.error('Failed to persist message queue to AsyncStorage', {
        event: 'websocket_queue_persist_error',
        component: 'websocketService',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private schedulePersistence(): void {
    this.needsPersistence = true;
    
    // Clear existing timer
    if (this.persistenceTimer) {
      clearTimeout(this.persistenceTimer);
    }
    
    // Schedule new persistence
    this.persistenceTimer = setTimeout(() => {
      this.persistQueue().catch(error => {
        log.error('Debounced persistence failed', {
          event: 'websocket_debounced_persist_error',
          component: 'websocketService',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
      this.persistenceTimer = null;
    }, this.PERSISTENCE_DEBOUNCE_MS);
  }

  private async forcePersistQueue(): Promise<void> {
    // Cancel any pending debounced persistence
    if (this.persistenceTimer) {
      clearTimeout(this.persistenceTimer);
      this.persistenceTimer = null;
    }
    
    await this.persistQueue();
  }

  private async loadPersistedQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.QUEUE_STORAGE_KEY);
      if (queueData) {
        const parsedQueue = JSON.parse(queueData) as QueuedMessage[];
        // Filter out old messages
        const now = Date.now();
        this.messageQueue = parsedQueue.filter(
          msg => now - msg.timestamp < this.MAX_MESSAGE_AGE_MS
        );
        
        log.info('Loaded persisted message queue', {
          event: 'websocket_queue_loaded',
          component: 'websocketService',
          totalMessages: parsedQueue.length,
          validMessages: this.messageQueue.length,
        });
      }
    } catch (error) {
      log.error('Failed to load persisted message queue', {
        event: 'websocket_queue_load_error',
        component: 'websocketService',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Start with empty queue on error
      this.messageQueue = [];
    }
  }

  private async clearPersistedQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUEUE_STORAGE_KEY);
    } catch (error) {
      log.error('Failed to clear persisted message queue', {
        event: 'websocket_queue_clear_error',
        component: 'websocketService',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Offline message queue methods
  private async queueMessage(event: string, data: unknown): Promise<void> {
    // Clean up old messages first
    this.pruneMessageQueue();

    if (this.messageQueue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest message to make room
      const removed = this.messageQueue.shift();
      log.warn('Message queue full, dropped oldest message', {
        event: 'websocket_queue_overflow',
        component: 'websocketService',
        droppedEvent: removed?.event,
      });
    }

    const queuedMessage: QueuedMessage = {
      event,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.messageQueue.push(queuedMessage);

    // Schedule debounced persistence
    this.schedulePersistence();

    log.debug('Message queued for offline', {
      event: 'websocket_message_queued',
      component: 'websocketService',
      eventType: event,
      queueSize: this.messageQueue.length,
    });

    this.emit('message_queued', { event, queueSize: this.messageQueue.length });
  }

  private pruneMessageQueue(): void {
    const now = Date.now();
    const beforeSize = this.messageQueue.length;
    
    this.messageQueue = this.messageQueue.filter(msg => {
      const isExpired = now - msg.timestamp > this.MAX_MESSAGE_AGE_MS;
      const tooManyRetries = msg.retries >= this.MAX_RETRIES;
      return !isExpired && !tooManyRetries;
    });

    const pruned = beforeSize - this.messageQueue.length;
    if (pruned > 0) {
      log.debug('Pruned expired messages from queue', {
        event: 'websocket_queue_pruned',
        component: 'websocketService',
        prunedCount: pruned,
        remainingCount: this.messageQueue.length,
      });
    }
  }

  private async flushMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;
    if (!this.socket?.connected) return;

    log.info('Flushing offline message queue', {
      event: 'websocket_queue_flush_start',
      component: 'websocketService',
      messageCount: this.messageQueue.length,
    });

    const messagesToSend = [...this.messageQueue];
    this.messageQueue = [];

    let successCount = 0;
    let failedCount = 0;

    for (const msg of messagesToSend) {
      try {
        this.socket.emit(msg.event, msg.data);
        successCount++;
      } catch {
        msg.retries++;
        if (msg.retries < this.MAX_RETRIES) {
          this.messageQueue.push(msg);
        }
        failedCount++;
      }
    }

    // Clear persisted queue if all messages sent successfully
    if (failedCount === 0 && this.messageQueue.length === 0) {
      await this.clearPersistedQueue();
    } else if (this.messageQueue.length > 0) {
      // Persist remaining failed messages for retry
      await this.forcePersistQueue();
    }

    log.info('Message queue flush complete', {
      event: 'websocket_queue_flush_complete',
      component: 'websocketService',
      successCount,
      failedCount,
      remainingInQueue: this.messageQueue.length,
    });

    this.emit('queue_flushed', { successCount, failedCount });
  }

  // Get queue status for monitoring
  getQueueStatus(): { size: number; oldestMessage: number | null } {
    return {
      size: this.messageQueue.length,
      oldestMessage: this.messageQueue.length > 0 
        ? this.messageQueue[0].timestamp 
        : null,
    };
  }

  // Event emission and listening
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) return;

    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Ride-specific methods
  joinRide(rideId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_ride', { rideId });
    }
  }

  leaveRide(rideId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_ride', { rideId });
    }
  }

  sendLocation(location: Location): void {
    if (this.socket?.connected) {
      this.socket.emit('location_update', {
        location,
        timestamp: new Date().toISOString(),
      });
    }
  }

  sendLocationUpdate(locationUpdate: LocationUpdate): void {
    if (this.socket?.connected) {
      this.socket.emit('driver_location_update', locationUpdate);
    }
  }

  sendChatMessage(rideId: string, content: string): void {
    const data = {
      rideId,
      content,
      timestamp: new Date().toISOString(),
    };
    
    if (this.socket?.connected) {
      this.socket.emit('chat_message', data);
    } else {
      // Queue for later delivery
      this.queueMessage('chat_message', data);
    }
  }

  // Generic send method for arbitrary messages
  send(data: WebSocketEventData, queueIfOffline = true): void {
    if (this.socket?.connected) {
      this.socket.emit('message', data);
    } else if (queueIfOffline) {
      this.queueMessage('message', data);
    }
  }

  // Driver-specific methods
  updateDriverStatus(status: 'online' | 'offline' | 'busy'): void {
    if (this.socket?.connected) {
      this.socket.emit('driver_status_update', { status });
    }
  }

  acceptRide(rideId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('accept_ride', { rideId });
    }
  }

  rejectRide(rideId: string, reason?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('reject_ride', { rideId, reason });
    }
  }

  startRide(rideId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('start_ride', { rideId });
    }
  }

  completeRide(rideId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('complete_ride', { rideId });
    }
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' | 'reconnecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    if (this.reconnectAttempts > 0) return 'reconnecting';
    return 'connecting';
  }

  // Presence methods
  /**
   * Update own presence status
   * API: Emits 'presence_update' to server
   */
  updatePresence(status: 'online' | 'offline' | 'away' | 'busy', rideId?: string): void {
    this.myPresenceStatus = status;
    
    if (this.socket?.connected) {
      this.socket.emit('presence_update', { status, rideId });
      log.debug('Presence status updated', {
        event: 'presence_self_update',
        component: 'websocketService',
        status,
        rideId,
      });
    }
  }

  /**
   * Subscribe to presence updates for specific users (e.g., driver during ride)
   */
  subscribeToPresence(userIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('presence_subscribe', { userIds });
      log.debug('Subscribed to presence updates', {
        event: 'presence_subscribe',
        component: 'websocketService',
        userCount: userIds.length,
      });
    }
  }

  /**
   * Unsubscribe from presence updates
   */
  unsubscribeFromPresence(userIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('presence_unsubscribe', { userIds });
      userIds.forEach(id => delete this.presenceState[id]);
    }
  }

  /**
   * Get presence status for a user
   */
  getPresence(userId: string): PresenceUpdate | null {
    return this.presenceState[userId] || null;
  }

  /**
   * Get all tracked presence states
   */
  getAllPresence(): PresenceState {
    return { ...this.presenceState };
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    const presence = this.presenceState[userId];
    return presence?.status === 'online' || presence?.status === 'busy';
  }

  /**
   * Get own presence status
   */
  getMyPresenceStatus(): 'online' | 'offline' | 'away' | 'busy' {
    return this.myPresenceStatus;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Compatibility export for existing imports
export const wsService = websocketService;

export default websocketService;
