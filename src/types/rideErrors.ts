/**
 * Ride Booking Error Types
 * Defines specific error states for the rider journey to enable explicit UI handling
 */

export enum RideErrorType {
  // Network & Connectivity
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  
  // Driver Availability
  NO_DRIVERS_AVAILABLE = 'NO_DRIVERS_AVAILABLE',
  DRIVER_DECLINED = 'DRIVER_DECLINED',
  DRIVER_TIMEOUT = 'DRIVER_TIMEOUT',
  
  // Payment Issues
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  PAYMENT_INSUFFICIENT_FUNDS = 'PAYMENT_INSUFFICIENT_FUNDS',
  PAYMENT_METHOD_INVALID = 'PAYMENT_METHOD_INVALID',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  
  // Validation & Input
  INVALID_LOCATION = 'INVALID_LOCATION',
  INVALID_RIDE_OPTION = 'INVALID_RIDE_OPTION',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  
  // Business Logic
  CONCURRENT_RIDE_REQUEST = 'CONCURRENT_RIDE_REQUEST',
  ACTIVE_RIDE_EXISTS = 'ACTIVE_RIDE_EXISTS',
  PRICING_MISMATCH = 'PRICING_MISMATCH',
  SURGE_PRICING_CHANGED = 'SURGE_PRICING_CHANGED',
  
  // Fraud & Rate Limiting
  RATE_LIMITED = 'RATE_LIMITED',
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  
  // System Errors
  SERVER_ERROR = 'SERVER_ERROR',
  BOOKING_FAILED = 'BOOKING_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface RideError {
  type: RideErrorType;
  message: string;
  userMessage: string;
  code?: string;
  retryable: boolean;
  metadata?: Record<string, unknown>;
}

export interface RideBookingResult {
  success: boolean;
  rideId?: string;
  error?: RideError;
}

// Error factory functions for creating specific error types
export const createRideError = (
  type: RideErrorType,
  message: string,
  userMessage: string,
  retryable: boolean = false,
  metadata?: Record<string, unknown>
): RideError => ({
  type,
  message,
  userMessage,
  retryable,
  metadata
});

// Specific error creators
export const createNetworkError = (message: string = 'Network connection failed'): RideError =>
  createRideError(
    RideErrorType.NETWORK_ERROR,
    message,
    'Network error occurred. Unable to connect to our servers. Please check your internet connection and try again.',
    true
  );

export const createNoDriversError = (estimatedWaitTime?: number): RideError =>
  createRideError(
    RideErrorType.NO_DRIVERS_AVAILABLE,
    'No drivers available in the area',
    estimatedWaitTime 
      ? `No drivers are currently available. Estimated wait time: ${estimatedWaitTime} minutes.`
      : 'No drivers are currently available in your area. Please try again in a few minutes.',
    true,
    { estimatedWaitTime }
  );

export const createPaymentDeclinedError = (reason?: string): RideError =>
  createRideError(
    RideErrorType.PAYMENT_DECLINED,
    `Payment declined: ${reason || 'Unknown reason'}`,
    'Your payment was declined. Please check your payment method or try a different one.',
    true,
    { reason }
  );

export const createInsufficientFundsError = (amount?: number): RideError =>
  createRideError(
    RideErrorType.PAYMENT_INSUFFICIENT_FUNDS,
    'Insufficient funds for payment',
    amount 
      ? `Insufficient funds. Required amount: €${amount.toFixed(2)}. Please add funds to your account.`
      : 'Insufficient funds. Please add funds to your account or try a different payment method.',
    false,
    { amount }
  );

export const createPricingMismatchError = (expectedPrice: number, actualPrice: number): RideError =>
  createRideError(
    RideErrorType.PRICING_MISMATCH,
    `Pricing mismatch: expected €${expectedPrice}, got €${actualPrice}`,
    `The price has changed from €${expectedPrice.toFixed(2)} to €${actualPrice.toFixed(2)}. Please confirm the new price to continue.`,
    true,
    { expectedPrice, actualPrice }
  );

export const createRateLimitedError = (retryAfter?: number): RideError =>
  createRideError(
    RideErrorType.RATE_LIMITED,
    'Too many booking attempts',
    retryAfter 
      ? `Please wait ${retryAfter} seconds before trying to book again.`
      : 'You\'ve made too many booking attempts. Please wait a moment before trying again.',
    true,
    { retryAfter }
  );

export const createServerError = (message: string = 'Internal server error'): RideError =>
  createRideError(
    RideErrorType.SERVER_ERROR,
    message,
    'Something went wrong on our end. Please try again in a moment.',
    true
  );

// Helper function to determine if error is retryable
export const isRetryableError = (error: RideError): boolean => {
  return error.retryable;
};

// Helper function to get user-friendly error message
export const getUserErrorMessage = (error: RideError): string => {
  return error.userMessage;
};
