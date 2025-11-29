/**
 * Ride Lifecycle Types & Contracts
 * Defines explicit types and invariants for each stage of the ride journey
 */

import { FareCalculation, PaymentMethodInfo } from '../api/payment';

// === Ride Request Stage ===
export interface RideRequest {
  id: string;
  riderId: string;
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
    placeName?: string;
  };
  dropoff: {
    latitude: number;
    longitude: number;
    address: string;
    placeName?: string;
  };
  requestedAt: string;
  status: 'pending' | 'searching' | 'no_drivers_available';
  preferences?: {
    vehicleType?: 'standard' | 'premium' | 'xl';
    accessibility?: boolean;
    notes?: string;
  };
}

// === Driver Assignment Stage ===
export interface RideAssignment {
  rideId: string;
  driverId: string;
  driver: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    vehicle: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
      photo?: string;
    };
    rating: number;
    completedRides: number;
  };
  estimatedArrival: {
    minutes: number;
    distance: number;
  };
  assignedAt: string;
  status: 'assigned' | 'driver_en_route' | 'arrived';
}

// === Active Ride Stage ===
export interface ActiveRide {
  id: string;
  riderId: string;
  driverId: string;
  status: 'in_progress' | 'pickup_confirmed' | 'dropoff_confirmed';
  route: {
    pickup: RideRequest['pickup'];
    dropoff: RideRequest['dropoff'];
    polyline?: string;
    distance: number;
    estimatedDuration: number;
  };
  pricing: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeMultiplier: number;
    total: number;
    currency: string;
  };
  timing: {
    requestedAt: string;
    assignedAt: string;
    driverArrivedAt?: string;
    pickupConfirmedAt?: string;
    dropoffConfirmedAt?: string;
    estimatedDropoff: string;
  };
  safety: {
    shareTripLink?: string;
    emergencyContact?: string;
    rideTracking: boolean;
  };
}

// === Completed Ride Stage ===
export interface CompletedRide extends Omit<ActiveRide, 'status' | 'timing'> {
  status: 'completed' | 'cancelled' | 'no_show';
  finalRoute: {
    actualDistance: number;
    actualDuration: number;
    finalPolyline: string;
  };
  finalPricing: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeFare: number;
    tolls: number;
    taxes: number;
    tip: number;
    total: number;
    currency: string;
  };
  completedAt: string;
}

// === Rating & Feedback Stage ===
export interface RideRating {
  rideId: string;
  riderId: string;
  driverId: string;
  rating: number; // 1-5 stars
  feedback?: string;
  tipAmount?: number;
  submittedAt: string;
  categories?: {
    cleanliness: number;
    safety: number;
    navigation: number;
    communication: number;
  };
}

// === Receipt Stage ===
export interface ReceiptData {
  rideId: string;
  riderId: string;
  driverId: string;
  issuedAt: string;
  fare: FareCalculation; // Standardized with payment system
  paymentMethod: PaymentMethodInfo; // Standardized with payment system
  tripDetails: {
    pickupTime: string;
    dropoffTime: string;
    duration: number;
    distance: number;
    route: string;
  };
  driverInfo: {
    name: string;
    vehicle: string;
    licensePlate: string;
  };
}

// === Error States ===
export interface RideError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  suggestedAction: 'retry' | 'cancel' | 'contact_support' | 'wait';
}

export type RideFlowError = 
  | { type: 'network_failure'; message: string; retryable: boolean }
  | { type: 'no_drivers_available'; message: string; retryable: boolean }
  | { type: 'payment_declined'; message: string; retryable: boolean }
  | { type: 'driver_cancelled'; message: string; retryable: boolean }
  | { type: 'rider_cancelled'; message: string; retryable: boolean }
  | { type: 'gps_error'; message: string; retryable: boolean }
  | { type: 'server_error'; message: string; retryable: boolean };

// === Ride State Machine ===
export type RideStatus = 
  | 'searching'
  | 'no_drivers_available'
  | 'assigned'
  | 'driver_en_route'
  | 'arrived'
  | 'in_progress'
  | 'pickup_confirmed'
  | 'dropoff_confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface RideStateMachine {
  currentStatus: RideStatus;
  previousStatus?: RideStatus;
  canCancel: boolean;
  canTrack: boolean;
  canContactDriver: boolean;
  canShareTrip: boolean;
  estimatedTimeRemaining?: number;
  nextStatuses: RideStatus[];
  error?: RideFlowError;
}

// === Rider Journey Contract ===
export interface RiderJourney {
  // Input: Search & Destination
  searchInput: {
    destination: string;
    coordinates?: { latitude: number; longitude: number };
  };
  
  // Output: Ride Options
  rideOptions: {
    id: string;
    type: string;
    price: number;
    estimatedTime: number;
    available: boolean;
  }[];
  
  // Input: Option Selection
  selectedOption: string;
  
  // Output: Price Confirmation
  priceConfirmation: {
    confirmedPrice: number;
    estimatedTime: number;
    surgeMultiplier: number;
  };
  
  // Output: Driver Assignment
  driverAssignment: RideAssignment;
  
  // Output: Active Ride
  activeRide: ActiveRide;
  
  // Output: Completion
  completedRide: CompletedRide;
  
  // Input: Rating & Tip
  rating: RideRating;
  
  // Output: Receipt
  receipt: ReceiptData;
}

// === Error Handling Contract ===
export interface ErrorHandlingContract {
  networkFailure: {
    message: string;
    retryable: boolean;
    maxRetries: number;
    backoffMs: number;
  };
  noDriversAvailable: {
    message: string;
    retryable: boolean;
    suggestedRetryTime: number;
    alternativeOptions: string[];
  };
  paymentDeclined: {
    message: string;
    retryable: boolean;
    tryAnotherPayment: boolean;
    contactSupport: boolean;
  };
  driverCancelled: {
    message: string;
    retryable: boolean;
    autoRetry: boolean;
    priorityQueue: boolean;
  };
}

// === Unified Types ===
export type RideLifecycle = RideRequest | RideAssignment | ActiveRide | CompletedRide;

// === Invariants ===
export const RideInvariants = {
  // Pricing invariants
  totalFarePositive: (pricing: CompletedRide['finalPricing']) => pricing.total > 0,
  tipNonNegative: (pricing: CompletedRide['finalPricing']) => pricing.tip >= 0,
  
  // Timing invariants
  chronologicalOrder: (ride: CompletedRide) => {
    const times = [
      new Date(ride.completedAt),
      ride.finalPricing.total > 0 ? new Date(ride.completedAt) : null,
    ].filter(Boolean) as Date[];
    return times.every((time, i) => i === 0 || time >= times[i - 1]);
  },
  
  // Status invariants
  validStatusTransition: (from: RideStatus, to: RideStatus) => {
    const validTransitions: Record<RideStatus, RideStatus[]> = {
      'searching': ['assigned', 'no_drivers_available', 'cancelled'],
      'no_drivers_available': ['searching', 'cancelled'],
      'assigned': ['driver_en_route', 'cancelled'],
      'driver_en_route': ['arrived', 'cancelled'],
      'arrived': ['in_progress', 'cancelled', 'no_show'],
      'in_progress': ['pickup_confirmed', 'dropoff_confirmed', 'cancelled'],
      'pickup_confirmed': ['dropoff_confirmed', 'cancelled'],
      'dropoff_confirmed': ['completed'],
      'completed': [],
      'cancelled': [],
      'no_show': ['cancelled'],
    };
    return validTransitions[from]?.includes(to) ?? false;
  },
};
