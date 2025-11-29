/**
 * Rider Journey Types
 * Comprehensive type definitions for the complete rider flow
 * Search → destination → ride option select → price confirmation → payment selection → 
 * request → driver assignment → active ride → completion → rating/tip → receipt
 */

import type { RideOption, Location } from '../api/rides';
import type { PaymentMethod } from '../api/payment';
import { log } from '../utils/logger';

// Journey State Machine Types
export type RiderJourneyStep = 
  | 'search'
  | 'destination_input'
  | 'ride_options'
  | 'price_confirmation'
  | 'payment_selection'
  | 'ride_request'
  | 'driver_assignment'
  | 'active_ride'
  | 'ride_completion'
  | 'rating_tip'
  | 'receipt';

export type RiderJourneyState = {
  currentStep: RiderJourneyStep;
  isProcessing: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  error: RiderJourneyError | null;
  data: RiderJourneyData;
};

// Journey Data for Each Step
export interface RiderJourneyData {
  // Search & Destination
  searchQuery?: string;
  destination?: Location;
  pickupLocation?: Location;
  
  // Ride Options & Pricing
  selectedRideOption?: RideOption;
  rideOptions?: RideOption[];
  estimatedPrice?: number;
  surgeMultiplier?: number;
  
  // Payment
  selectedPaymentMethod?: PaymentMethod;
  paymentMethods?: PaymentMethod[];
  
  // Ride Request
  rideRequestId?: string;
  requestTimestamp?: string;
  
  // Driver Assignment
  driverInfo?: {
    id: string;
    name: string;
    rating: number;
    vehicle: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
    };
    etaMinutes: number;
    distanceToPickup: number;
  };
  
  // Active Ride
  activeRide?: {
    id: string;
    startTime: string;
    currentLocation?: Location;
    route?: Array<Location>;
    estimatedDropoffTime: string;
    actualPrice?: number;
  };
  
  // Completion & Rating
  completedRide?: {
    id: string;
    endTime: string;
    finalPrice: number;
    duration: number;
    distance: number;
    receiptUrl?: string;
  };
  
  rating?: {
    stars: number;
    comment?: string;
    tip?: number;
  };
}

// Comprehensive Error Types
export type RiderJourneyErrorType = 
  // Network & Connectivity
  | 'network_offline'
  | 'network_timeout'
  | 'server_error'
  | 'api_rate_limited'
  
  // Location & Search
  | 'location_permission_denied'
  | 'location_services_disabled'
  | 'geocoding_failed'
  | 'invalid_destination'
  | 'destination_too_far'
  
  // Ride Options & Pricing
  | 'no_ride_options_available'
  | 'pricing_calculation_failed'
  | 'surge_pricing_too_high'
  | 'ride_option_unavailable'
  
  // Payment
  | 'payment_method_required'
  | 'payment_method_invalid'
  | 'payment_declined'
  | 'insufficient_funds'
  | 'payment_gateway_error'
  | 'payment_timeout'
  
  // Ride Request & Assignment
  | 'ride_request_failed'
  | 'no_drivers_available'
  | 'driver_assignment_timeout'
  | 'ride_cancelled_by_driver'
  
  // Active Ride
  | 'ride_tracking_failed'
  | 'driver_offline'
  | 'route_calculation_failed'
  | 'emergency_stop_required'
  
  // Completion & Rating
  | 'ride_completion_failed'
  | 'rating_submission_failed'
  | 'tip_processing_failed'
  | 'receipt_generation_failed'
  
  // System Errors
  | 'authentication_required'
  | 'kyc_verification_required'
  | 'account_suspended'
  | 'unknown_error';

export interface RiderJourneyError {
  type: RiderJourneyErrorType;
  message: string;
  userMessage: string; // Friendly message for UI
  code?: string; // Error code for analytics
  retryable: boolean;
  retryAction?: () => Promise<void>;
  recoveryOptions?: Array<{
    label: string;
    action: () => Promise<void>;
    variant: 'primary' | 'secondary';
  }>;
  metadata?: Record<string, unknown>;
}

// Error State Handlers
export interface RiderJourneyErrorHandler {
  handleError: (error: RiderJourneyError) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  canRetry: boolean;
}

// Journey Transition Types
export type RiderJourneyTransition = {
  from: RiderJourneyStep;
  to: RiderJourneyStep;
  trigger: 'user_action' | 'system_event' | 'error_recovery';
  data?: Partial<RiderJourneyData>;
};

// Validation Types
export interface RiderJourneyValidation {
  step: RiderJourneyStep;
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  canProceed: boolean;
}

// Analytics & Tracking Types
export interface RiderJourneyEvent {
  step: RiderJourneyStep;
  action: 'enter' | 'complete' | 'error' | 'abandon';
  timestamp: string;
  data?: Record<string, unknown>;
  error?: RiderJourneyErrorType;
}

// Helper Functions for Error Creation
export function createRiderJourneyError(
  type: RiderJourneyErrorType,
  message: string,
  userMessage: string,
  retryable: boolean = false,
  retryAction?: () => Promise<void>,
  recoveryOptions?: RiderJourneyError['recoveryOptions']
): RiderJourneyError {
  return {
    type,
    message,
    userMessage,
    code: type.toUpperCase(),
    retryable,
    retryAction,
    recoveryOptions,
    metadata: {
      timestamp: new Date().toISOString(),
      step: getCurrentJourneyStep(), // Implementation needed
    },
  };
}

// Common Error Pattern Helpers
export function createNetworkError(
  message: string = 'Network connection failed',
  retryAction?: () => Promise<void>
): RiderJourneyError {
  return createRiderJourneyError(
    'network_offline',
    message,
    RIDER_JOURNEY_ERROR_MESSAGES.network_offline,
    true,
    retryAction,
    [
      {
        label: 'Retry',
        action: retryAction || (async () => {}),
        variant: 'primary'
      }
    ]
  );
}

export function createPaymentError(
  type: 'payment_declined' | 'insufficient_funds' | 'payment_gateway_error',
  message?: string,
  retryAction?: () => Promise<void>
): RiderJourneyError {
  return createRiderJourneyError(
    type,
    message || `Payment failed: ${type}`,
    RIDER_JOURNEY_ERROR_MESSAGES[type],
    true,
    retryAction,
    [
      {
        label: 'Try Different Payment',
        action: retryAction || (async () => {}),
        variant: 'primary'
      },
      {
        label: 'Add Payment Method',
        action: async () => log.warn('Navigate to add payment method', { event: 'navigate_add_payment_method', component: 'riderJourneyTypes' }),
        variant: 'secondary'
      }
    ]
  );
}

export function createRideError(
  type: 'no_drivers_available' | 'ride_request_failed' | 'driver_assignment_timeout',
  message?: string,
  retryAction?: () => Promise<void>
): RiderJourneyError {
  return createRiderJourneyError(
    type,
    message || `Ride request failed: ${type}`,
    RIDER_JOURNEY_ERROR_MESSAGES[type],
    true,
    retryAction,
    [
      {
        label: 'Try Again',
        action: retryAction || (async () => {}),
        variant: 'primary'
      },
      {
        label: 'Change Ride Option',
        action: async () => log.warn('Navigate to ride options', { event: 'navigate_ride_options', component: 'riderJourneyTypes' }),
        variant: 'secondary'
      }
    ]
  );
}

export function createServerError(
  message?: string,
  retryAction?: () => Promise<void>
): RiderJourneyError {
  return createRiderJourneyError(
    'server_error',
    message || 'Server error occurred',
    RIDER_JOURNEY_ERROR_MESSAGES.server_error,
    true,
    retryAction,
    [
      {
        label: 'Retry',
        action: retryAction || (async () => {}),
        variant: 'primary'
      }
    ]
  );
}

// Error Message Mapping
export const RIDER_JOURNEY_ERROR_MESSAGES: Record<RiderJourneyErrorType, string> = {
  // Network & Connectivity
  network_offline: "You're offline. Please check your internet connection.",
  network_timeout: "Request timed out. Please try again.",
  server_error: "Our servers are having trouble. Please try again in a moment.",
  api_rate_limited: "Too many requests. Please wait a moment and try again.",
  
  // Location & Search
  location_permission_denied: "Location permission is required to find rides near you.",
  location_services_disabled: "Please enable location services in your device settings.",
  geocoding_failed: "Couldn't find that location. Please try a different address.",
  invalid_destination: "Please enter a valid destination address.",
  destination_too_far: "This destination is too far for our service area.",
  
  // Ride Options & Pricing
  no_ride_options_available: "No rides available in your area right now.",
  pricing_calculation_failed: "Couldn't calculate pricing. Please try again.",
  surge_pricing_too_high: "Surge pricing is temporarily unavailable.",
  ride_option_unavailable: "This ride option is currently unavailable.",
  
  // Payment
  payment_method_required: "Please select a payment method to continue.",
  payment_method_invalid: "This payment method is invalid. Please select another.",
  payment_declined: "Payment was declined. Please try a different payment method.",
  insufficient_funds: "Insufficient funds. Please add a payment method or try another.",
  payment_gateway_error: "Payment service is temporarily unavailable.",
  payment_timeout: "Payment timed out. Please try again.",
  
  // Ride Request & Assignment
  ride_request_failed: "Couldn't request ride. Please try again.",
  no_drivers_available: "No drivers available right now. Please try again later.",
  driver_assignment_timeout: "Couldn't find a driver in time. Please try again.",
  ride_cancelled_by_driver: "Driver cancelled the ride. Please request a new ride.",
  
  // Active Ride
  ride_tracking_failed: "Couldn't track ride location. Please check your connection.",
  driver_offline: "Driver is temporarily offline. Please wait or contact support.",
  route_calculation_failed: "Couldn't calculate route to destination.",
  emergency_stop_required: "Emergency stop required. Please contact support.",
  
  // Completion & Rating
  ride_completion_failed: "Couldn't complete ride. Please contact support.",
  rating_submission_failed: "Couldn't submit rating. Please try again.",
  tip_processing_failed: "Couldn't process tip. Please try again.",
  receipt_generation_failed: "Couldn't generate receipt. Please try again later.",
  
  // System Errors
  authentication_required: "Please sign in to continue.",
  kyc_verification_required: "Identity verification required to ride.",
  account_suspended: "Your account is temporarily suspended. Please contact support.",
  unknown_error: "Something went wrong. Please try again.",
};

// Helper function to get current journey step (implementation depends on context)
function getCurrentJourneyStep(): RiderJourneyStep {
  // This would be implemented based on current app state
  // For now, return a default
  return 'search';
}
