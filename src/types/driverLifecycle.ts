/**
 * Driver Lifecycle State Machine
 * Comprehensive state management for driver ride flow
 */

import { log } from '../utils/logger';

// All possible driver states
export type DriverLifecycleState = 
  | 'offline'
  | 'going_online'
  | 'online'
  | 'incoming_request'
  | 'countdown'
  | 'accepting'
  | 'accepted'
  | 'navigating_to_pickup'
  | 'arrived_at_pickup'
  | 'waiting_for_rider'
  | 'starting_ride'
  | 'in_progress'
  | 'arriving_at_destination'
  | 'completing'
  | 'completed'
  | 'cancelling'
  | 'cancelled';

// Valid state transitions
export const VALID_TRANSITIONS: Record<DriverLifecycleState, DriverLifecycleState[]> = {
  offline: ['going_online'],
  going_online: ['online', 'offline'], // Can fail to go online
  online: ['incoming_request', 'offline'],
  incoming_request: ['countdown', 'online'], // Auto-decline returns to online
  countdown: ['accepting', 'online'], // Timeout or manual decline
  accepting: ['accepted', 'online'], // Accept can fail
  accepted: ['navigating_to_pickup', 'cancelling'],
  navigating_to_pickup: ['arrived_at_pickup', 'cancelling'],
  arrived_at_pickup: ['waiting_for_rider', 'cancelling'],
  waiting_for_rider: ['starting_ride', 'cancelling'],
  starting_ride: ['in_progress', 'cancelling'],
  in_progress: ['arriving_at_destination', 'cancelling'],
  arriving_at_destination: ['completing'],
  completing: ['completed', 'in_progress'], // Can fail to complete
  completed: ['online', 'offline'],
  cancelling: ['cancelled'],
  cancelled: ['online', 'offline'],
};

// State metadata
export interface StateMetadata {
  state: DriverLifecycleState;
  displayName: string;
  description: string;
  isTerminal: boolean;
  requiresRide: boolean;
  allowsCancel: boolean;
  timeout?: number; // Auto-transition timeout in ms
  nextAutoState?: DriverLifecycleState;
}

export const STATE_METADATA: Record<DriverLifecycleState, StateMetadata> = {
  offline: {
    state: 'offline',
    displayName: 'Offline',
    description: 'Not accepting rides',
    isTerminal: false,
    requiresRide: false,
    allowsCancel: false,
  },
  going_online: {
    state: 'going_online',
    displayName: 'Going Online',
    description: 'Connecting to ride network',
    isTerminal: false,
    requiresRide: false,
    allowsCancel: false,
    timeout: 10000,
    nextAutoState: 'offline',
  },
  online: {
    state: 'online',
    displayName: 'Online',
    description: 'Ready to accept rides',
    isTerminal: false,
    requiresRide: false,
    allowsCancel: false,
  },
  incoming_request: {
    state: 'incoming_request',
    displayName: 'New Request',
    description: 'Ride request received',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: false,
    timeout: 3000,
    nextAutoState: 'countdown',
  },
  countdown: {
    state: 'countdown',
    displayName: 'Accept Ride?',
    description: 'Decide within time limit',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: false,
    timeout: 30000,
    nextAutoState: 'online', // Auto-decline on timeout
  },
  accepting: {
    state: 'accepting',
    displayName: 'Accepting',
    description: 'Confirming ride acceptance',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: false,
    timeout: 5000,
    nextAutoState: 'online',
  },
  accepted: {
    state: 'accepted',
    displayName: 'Accepted',
    description: 'Ride confirmed',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: true,
  },
  navigating_to_pickup: {
    state: 'navigating_to_pickup',
    displayName: 'En Route',
    description: 'Heading to pickup location',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: true,
  },
  arrived_at_pickup: {
    state: 'arrived_at_pickup',
    displayName: 'Arrived',
    description: 'At pickup location',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: true,
  },
  waiting_for_rider: {
    state: 'waiting_for_rider',
    displayName: 'Waiting',
    description: 'Waiting for rider',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: true,
    timeout: 300000, // 5 min wait limit
    nextAutoState: 'cancelling',
  },
  starting_ride: {
    state: 'starting_ride',
    displayName: 'Starting',
    description: 'Beginning ride',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: true,
    timeout: 5000,
  },
  in_progress: {
    state: 'in_progress',
    displayName: 'In Progress',
    description: 'Ride underway',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: true,
  },
  arriving_at_destination: {
    state: 'arriving_at_destination',
    displayName: 'Arriving',
    description: 'Approaching destination',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: false,
  },
  completing: {
    state: 'completing',
    displayName: 'Completing',
    description: 'Finalizing ride',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: false,
    timeout: 10000,
  },
  completed: {
    state: 'completed',
    displayName: 'Completed',
    description: 'Ride finished',
    isTerminal: true,
    requiresRide: false,
    allowsCancel: false,
  },
  cancelling: {
    state: 'cancelling',
    displayName: 'Cancelling',
    description: 'Processing cancellation',
    isTerminal: false,
    requiresRide: true,
    allowsCancel: false,
    timeout: 5000,
  },
  cancelled: {
    state: 'cancelled',
    displayName: 'Cancelled',
    description: 'Ride cancelled',
    isTerminal: true,
    requiresRide: false,
    allowsCancel: false,
  },
};

/**
 * Driver Lifecycle State Machine
 */
export class DriverStateMachine {
  private currentState: DriverLifecycleState = 'offline';
  private rideId: string | null = null;
  private stateHistory: Array<{ state: DriverLifecycleState; timestamp: number; rideId: string | null }> = [];
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private onStateChange?: (state: DriverLifecycleState, rideId: string | null) => void;

  constructor(onStateChange?: (state: DriverLifecycleState, rideId: string | null) => void) {
    this.onStateChange = onStateChange;
  }

  getState(): DriverLifecycleState {
    return this.currentState;
  }

  getRideId(): string | null {
    return this.rideId;
  }

  getStateMetadata(): StateMetadata {
    return STATE_METADATA[this.currentState];
  }

  /**
   * Attempt state transition
   */
  transition(newState: DriverLifecycleState, rideId?: string): boolean {
    const validNextStates = VALID_TRANSITIONS[this.currentState];
    
    if (!validNextStates.includes(newState)) {
      log.warn('Invalid state transition attempted', {
        event: 'invalid_driver_transition',
        component: 'DriverStateMachine',
        from: this.currentState,
        to: newState,
        validStates: validNextStates,
      });
      return false;
    }

    // Clear any existing timeout
    this.clearTimeout();

    const previousState = this.currentState;
    this.currentState = newState;
    
    // Handle ride ID
    if (rideId) {
      this.rideId = rideId;
    } else if (STATE_METADATA[newState].isTerminal || !STATE_METADATA[newState].requiresRide) {
      this.rideId = null;
    }

    // Record in history
    this.stateHistory.push({
      state: newState,
      timestamp: Date.now(),
      rideId: this.rideId,
    });

    // Trim history to last 50 entries
    if (this.stateHistory.length > 50) {
      this.stateHistory = this.stateHistory.slice(-50);
    }

    log.info('Driver state transition', {
      event: 'driver_state_change',
      component: 'DriverStateMachine',
      from: previousState,
      to: newState,
      rideId: this.rideId ?? undefined,
    });

    // Setup auto-transition timeout if configured
    const metadata = STATE_METADATA[newState];
    if (metadata.timeout && metadata.nextAutoState) {
      this.timeoutHandle = setTimeout(() => {
        this.transition(metadata.nextAutoState!);
      }, metadata.timeout);
    }

    // Notify listener
    this.onStateChange?.(newState, this.rideId);

    return true;
  }

  /**
   * Check if transition is valid
   */
  canTransition(newState: DriverLifecycleState): boolean {
    return VALID_TRANSITIONS[this.currentState].includes(newState);
  }

  /**
   * Check if current state allows cancellation
   */
  canCancel(): boolean {
    return STATE_METADATA[this.currentState].allowsCancel;
  }

  /**
   * Force cancel (for emergencies)
   */
  forceCancel(reason: string): void {
    log.warn('Force cancel triggered', {
      event: 'driver_force_cancel',
      component: 'DriverStateMachine',
      state: this.currentState,
      rideId: this.rideId ?? undefined,
      reason,
    });
    
    this.clearTimeout();
    this.currentState = 'cancelled';
    this.rideId = null;
    this.onStateChange?.('cancelled', null);
  }

  /**
   * Reset to offline
   */
  reset(): void {
    this.clearTimeout();
    this.currentState = 'offline';
    this.rideId = null;
    this.stateHistory = [];
    this.onStateChange?.('offline', null);
  }

  /**
   * Get state history
   */
  getHistory(): Array<{ state: DriverLifecycleState; timestamp: number; rideId: string | null }> {
    return [...this.stateHistory];
  }

  private clearTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
let driverStateMachineInstance: DriverStateMachine | null = null;

export function getDriverStateMachine(
  onStateChange?: (state: DriverLifecycleState, rideId: string | null) => void
): DriverStateMachine {
  if (!driverStateMachineInstance) {
    driverStateMachineInstance = new DriverStateMachine(onStateChange);
  }
  return driverStateMachineInstance;
}

export function resetDriverStateMachine(): void {
  driverStateMachineInstance?.reset();
  driverStateMachineInstance = null;
}
