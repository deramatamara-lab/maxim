/**
 * API Response Helpers
 * Safe type conversion helpers to replace unsafe casting chains
 */

import type { RideHistory } from '../api/rides';
import type { User } from '../types/user';
import { log } from './logger';

/**
 * Safely convert unknown data to RideHistory array
 * Used for API response parsing with runtime validation
 */
export function toRideHistory(data: unknown): RideHistory[] {
  if (!Array.isArray(data)) {
    log.warn('Expected array for ride history', { event: 'ride_history_type_validation_failed', component: 'apiHelpers', receivedType: typeof data });
    return [];
  }

  return data.filter((item): item is RideHistory => {
    return (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'riderId' in item &&
      'driverId' in item &&
      'pickup' in item &&
      'destination' in item &&
      'status' in item &&
      'price' in item &&
      'duration' in item &&
      'distance' in item &&
      'paymentMethod' in item &&
      'createdAt' in item
    );
  });
}

/**
 * Safely convert unknown data to pricing validation object
 */
export function toPricingValidation(data: unknown): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) {
    log.warn('Expected object for pricing validation', { event: 'pricing_validation_type_failed', component: 'apiHelpers', receivedType: typeof data });
    return {};
  }

  return data as Record<string, unknown>;
}

/**
 * Safely convert unknown data to User object with proper type assertion
 */
export function toUser(data: unknown): User | null {
  if (typeof data !== 'object' || data === null) {
    log.warn('Expected object for user data', { event: 'user_data_type_failed', component: 'apiHelpers', receivedType: typeof data });
    return null;
  }

  const obj = data as Record<string, unknown>;
  
  // Basic runtime validation for required User fields
  if (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.isDriver === 'boolean' &&
    typeof obj.isVerified === 'boolean' &&
    typeof obj.role === 'string' &&
    typeof obj.kycStatus === 'string' &&
    typeof obj.hasCompletedOnboarding === 'boolean' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  ) {
    return obj as unknown as User; 
  }

  log.warn('Invalid user data structure', { event: 'user_data_structure_invalid', component: 'apiHelpers', userData: obj });
  return null;
}

/**
 * Generic helper to convert unknown data to object type
 * Used for API request bodies where structure is known but typing is lost
 */
export function toApiPayload(data: unknown): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) {
    log.warn('Expected object for API payload', { event: 'api_payload_type_failed', component: 'apiHelpers', receivedType: typeof data });
    return {};
  }

  return data as Record<string, unknown>;
}
