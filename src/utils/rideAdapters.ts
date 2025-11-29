/**
 * Ride Adapters
 * Converts between API and store data structures for ride pricing
 * Handles type mismatches and formatting consistently
 */

import type { RideEstimate, RideOption } from '@/api/rides';
import type { PriceEstimate, SurgeInfo } from '@/api/pricing';

// Store-compatible pricing structure
export interface StorePriceEstimate {
  rideOptionId: string;
  name: string;
  description: string;
  estimatedPrice: number;
  estimatedDuration: string; // Formatted for display
  distance: string; // Formatted for display
  estimatedDurationMinutes: number; // Raw numeric for calculations
  distanceKm: number; // Raw numeric for calculations
  surgeMultiplier?: number;
  currency: string;
  vehicleType: 'sedan' | 'suv' | 'luxury' | 'electric' | 'motorcycle';
  capacity: number;
  icon: string;
  features: string[];
  pricingBreakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeFare?: number;
    serviceFee: number;
    total: number;
  };
}

// Store-compatible surge info
export interface StoreSurgeInfo {
  isActive: boolean;
  multiplier: number;
  reason: string;
  estimatedWaitTime: number;
  expiresAt?: string;
}

/**
 * Convert API RideEstimate to store-compatible PriceEstimate array
 */
export function rideEstimateToStore(rideEstimate: RideEstimate): {
  priceEstimates: StorePriceEstimate[];
  surgeInfo: StoreSurgeInfo | null;
} {
  const priceEstimates: StorePriceEstimate[] = rideEstimate.rideOptions.map(option => ({
    rideOptionId: option.rideOption.id,
    name: option.rideOption.name,
    description: option.rideOption.description,
    estimatedPrice: option.estimatedPrice,
    estimatedDuration: formatDuration(option.estimatedDuration),
    distance: formatDistance(option.distance),
    estimatedDurationMinutes: option.estimatedDuration,
    distanceKm: option.distance,
    surgeMultiplier: option.surgeMultiplier,
    currency: 'USD', // TODO: Get from user locale or ride estimate
    vehicleType: option.rideOption.vehicleType,
    capacity: option.rideOption.capacity,
    icon: option.rideOption.icon,
    features: option.rideOption.features,
    pricingBreakdown: {
      baseFare: option.pricingBreakdown.basePrice,
      distanceFare: option.pricingBreakdown.distancePrice,
      timeFare: option.pricingBreakdown.timePrice,
      surgeFare: option.pricingBreakdown.surgePrice,
      serviceFee: option.pricingBreakdown.serviceFee,
      total: option.pricingBreakdown.totalPrice,
    },
  }));

  const surgeInfo = rideEstimate.surgeInfo ? {
    isActive: rideEstimate.surgeInfo.isActive,
    multiplier: rideEstimate.surgeInfo.multiplier,
    reason: rideEstimate.surgeInfo.reason,
    estimatedWaitTime: rideEstimate.surgeInfo.estimatedWaitTime,
    expiresAt: rideEstimate.surgeInfo.expiresAt,
  } : null;

  return { priceEstimates, surgeInfo };
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Format distance in kilometers to human-readable string
 */
export function formatDistance(kilometers: number): string {
  if (kilometers < 1) {
    const meters = Math.round(kilometers * 1000);
    return `${meters} m`;
  }
  
  if (kilometers < 10) {
    return `${kilometers.toFixed(1)} km`;
  }
  
  return `${Math.round(kilometers)} km`;
}

/**
 * Extract surge multiplier from ride estimate for legacy store compatibility
 */
export function extractSurgeMultiplier(rideEstimate: RideEstimate): number {
  return rideEstimate.surgeInfo?.multiplier ?? 1.0;
}

/**
 * Convert store PriceEstimate back to API format (for requests)
 */
export function storePriceEstimateToApi(storeEstimate: StorePriceEstimate): {
  rideOptionId: string;
  pricingData: {
    estimatedPrice: number;
    estimatedDuration: number;
    distance: number;
  };
} {
  return {
    rideOptionId: storeEstimate.rideOptionId,
    pricingData: {
      estimatedPrice: storeEstimate.estimatedPrice,
      estimatedDuration: storeEstimate.estimatedDurationMinutes,
      distance: storeEstimate.distanceKm,
    },
  };
}

/**
 * Validate price estimate data structure
 */
export function validatePriceEstimate(estimate: StorePriceEstimate): boolean {
  return (
    typeof estimate.rideOptionId === 'string' &&
    typeof estimate.estimatedPrice === 'number' &&
    typeof estimate.estimatedDurationMinutes === 'number' &&
    typeof estimate.distanceKm === 'number' &&
    estimate.estimatedPrice > 0 &&
    estimate.estimatedDurationMinutes > 0 &&
    estimate.distanceKm > 0
  );
}

/**
 * Calculate total fare with surge applied
 */
export function calculateTotalWithSurge(basePrice: number, surgeMultiplier: number): number {
  return Math.round(basePrice * surgeMultiplier * 100) / 100; // Round to 2 decimal places
}

/**
 * Get formatted price with currency
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
