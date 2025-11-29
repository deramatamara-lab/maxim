/**
 * WebSocket Event Types and Schemas
 * Shared event definitions for rider/driver consistency
 */

// Base event structure with idempotency
export interface BaseWebSocketEvent {
  id: string; // Unique event ID for deduplication
  type: WebSocketEventType;
  timestamp: string; // ISO 8601 timestamp
  payload: unknown;
  metadata?: {
    userId?: string;
    rideId?: string;
    driverId?: string;
    sequence?: number; // Event sequence per ride
    version?: string; // Event schema version
  };
}

// All WebSocket event types
export type WebSocketEventType =
  // Connection events
  | 'connect'
  | 'disconnect'
  | 'reconnect'
  
  // Heartbeat
  | 'heartbeat'
  | 'pong'
  
  // Ride lifecycle
  | 'ride_request'
  | 'ride_accepted'
  | 'ride_declined'
  | 'ride_cancelled'
  | 'ride_started'
  | 'ride_completed'
  
  // Location updates
  | 'driver_location_update'
  | 'rider_location_update'
  
  // Chat
  | 'chat_message'
  | 'chat_typing'
  | 'chat_read'
  
  // Driver status
  | 'driver_online'
  | 'driver_offline'
  | 'driver_busy'
  
  // Payment
  | 'payment_required'
  | 'payment_completed'
  | 'payment_failed'
  
  // Notifications
  | 'notification'
  | 'system_message';

// Event payload schemas
export interface RideRequestPayload {
  rideId: string;
  riderId: string;
  rider: {
    name: string;
    rating: number;
    avatar?: string;
  };
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    address: string;
    latitude: number;
    longitude: number;
  };
  rideOption: {
    id: string;
    name: string;
    estimatedPrice: number;
    currency: string;
    estimatedDuration: number;
    distance: number;
  };
  countdownSeconds: number;
}

export interface RideAcceptedPayload {
  rideId: string;
  driverId: string;
  driver: {
    name: string;
    rating: number;
    avatar?: string;
    vehicle: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
    };
  };
  etaMinutes: number;
  pickupDistance: number;
}

export interface RideStartedPayload {
  rideId: string;
  startedAt: string;
  route?: {
    polyline: string;
    distance: number;
    estimatedDuration: number;
  };
}

export interface RideCompletedPayload {
  rideId: string;
  completedAt: string;
  finalPrice: number;
  currency: string;
  route: {
    distance: number;
    duration: number;
  };
}

export interface LocationUpdatePayload {
  rideId?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface ChatMessagePayload {
  rideId: string;
  messageId: string;
  senderId: string;
  senderType: 'rider' | 'driver';
  content: string;
  timestamp: string;
}

export interface DriverStatusPayload {
  driverId: string;
  status: 'online' | 'offline' | 'busy';
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface NotificationPayload {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    url?: string;
    data?: unknown;
  };
  timestamp: string;
}

// Event schema mapping
export const EVENT_SCHEMAS: Record<WebSocketEventType, unknown> = {
  connect: {},
  disconnect: {},
  reconnect: {},
  heartbeat: {},
  pong: {},
  ride_request: {} as RideRequestPayload,
  ride_accepted: {} as RideAcceptedPayload,
  ride_declined: { rideId: '', reason: '' } as const,
  ride_cancelled: { rideId: '', reason: '', cancelledBy: 'rider' as const } as const,
  ride_started: {} as RideStartedPayload,
  ride_completed: {} as RideCompletedPayload,
  driver_location_update: {} as LocationUpdatePayload,
  rider_location_update: {} as LocationUpdatePayload,
  chat_message: {} as ChatMessagePayload,
  chat_typing: { rideId: '', senderId: '', isTyping: false } as const,
  chat_read: { rideId: '', messageId: '', readAt: '' } as const,
  driver_online: {} as DriverStatusPayload,
  driver_offline: {} as DriverStatusPayload,
  driver_busy: {} as DriverStatusPayload,
  payment_required: { rideId: '', amount: 0, currency: '' } as const,
  payment_completed: { rideId: '', paymentId: '', amount: 0, currency: '' } as const,
  payment_failed: { rideId: '', reason: '', amount: 0, currency: '' } as const,
  notification: {} as NotificationPayload,
  system_message: { message: '', severity: 'info' as const } as const,
};

// Helper to validate event payload
export function validateEventPayload<T>(
  eventType: WebSocketEventType,
  payload: unknown
): payload is T {
  // Basic validation - in production, use Zod or similar
  return payload !== null && typeof payload === 'object';
}

// Helper to create typed events
export function createWebSocketEvent<T>(
  type: WebSocketEventType,
  payload: T,
  metadata?: BaseWebSocketEvent['metadata']
): BaseWebSocketEvent {
  return {
    id: generateEventId(),
    type,
    timestamp: new Date().toISOString(),
    payload,
    metadata: {
      ...metadata,
      version: '1.0',
    },
  };
}

// Generate unique event ID
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// Event handler interface for idempotency
export interface IdempotentEventHandler<T = unknown> {
  handle(event: BaseWebSocketEvent & { payload: T }): Promise<void>;
  isProcessed(eventId: string): Promise<boolean>;
  markProcessed(eventId: string): Promise<void>;
}

// Base class for idempotent handlers
export abstract class BaseEventHandler<T = unknown> implements IdempotentEventHandler<T> {
  protected processedEvents = new Set<string>();
  protected readonly maxProcessedEvents: number = 1000;

  abstract handle(event: BaseWebSocketEvent & { payload: T }): Promise<void>;

  async isProcessed(eventId: string): Promise<boolean> {
    return this.processedEvents.has(eventId);
  }

  async markProcessed(eventId: string): Promise<void> {
    this.processedEvents.add(eventId);
    
    // Cleanup old events to prevent memory leaks
    if (this.processedEvents.size > this.maxProcessedEvents) {
      const eventsArray = Array.from(this.processedEvents);
      // Keep only the most recent events
      const keepCount = Math.floor(this.maxProcessedEvents / 2);
      this.processedEvents = new Set(eventsArray.slice(-keepCount));
    }
  }

  async processEvent(event: BaseWebSocketEvent & { payload: T }): Promise<void> {
    if (await this.isProcessed(event.id)) {
      return; // Skip duplicate event
    }

    await this.handle(event);
    await this.markProcessed(event.id);
  }
}
