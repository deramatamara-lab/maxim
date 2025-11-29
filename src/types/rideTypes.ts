/**
 * Shared Ride Types
 * Standardizes types across API responses and component expectations
 * Resolves ARCH-04: Rider Journey Integration Type Mismatches
 */

import { PriceEstimate, SurgeInfo } from '@/api/pricing';
import { RideEstimate } from '@/api/rides';

// =============================================================================
// Duration & Distance Types
// =============================================================================

/**
 * Numeric format for API responses (internal use)
 */
export interface NumericDurationDistance {
  duration: number;  // minutes
  distance: number;  // kilometers or miles
}

/**
 * Formatted strings for UI display
 */
export interface FormattedDurationDistance {
  duration: string;  // e.g., "15 min"
  distance: string;  // e.g., "5.2 mi"
}

// =============================================================================
// Price Confirmation Types (UI-ready)
// =============================================================================

/**
 * Standardized price confirmation for UI components
 * Uses formatted strings for display
 */
export interface PriceConfirmation {
  rideOptionId: string;
  rideOptionName: string;
  vehicleType: string;
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  surgePrice: number;
  serviceFee: number;
  totalPrice: number;
  currency: string;
  estimatedDuration: string;  // Formatted: "15 min"
  estimatedDistance: string;  // Formatted: "5.2 mi"
  surgeMultiplier?: number;
  surgeActive: boolean;
  eta: string;  // Formatted: "3-5 min"
}

/**
 * Surge information for UI display
 */
export interface SurgeDisplayInfo {
  isActive: boolean;
  multiplier: number;
  displayText: string;  // e.g., "1.5x surge pricing"
  reason?: string;
  waitTime?: string;  // Formatted: "5 min"
}

// =============================================================================
// Adapter Functions
// =============================================================================

/**
 * Format duration from minutes to display string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Format distance from km/miles to display string
 */
export function formatDistance(distance: number, unit: 'km' | 'mi' = 'mi'): string {
  if (distance < 0.1) return `< 0.1 ${unit}`;
  return `${distance.toFixed(1)} ${unit}`;
}

/**
 * Format ETA range
 */
export function formatETA(minMinutes: number, maxMinutes?: number): string {
  if (!maxMinutes || minMinutes === maxMinutes) {
    return formatDuration(minMinutes);
  }
  return `${Math.round(minMinutes)}-${Math.round(maxMinutes)} min`;
}

/**
 * Convert RideEstimate API response to PriceConfirmation for UI
 */
export function adaptRideEstimateToPriceConfirmation(
  estimate: RideEstimate,
  selectedOptionIndex: number = 0
): PriceConfirmation | null {
  const option = estimate.rideOptions[selectedOptionIndex];
  if (!option) return null;

  const { rideOption, pricingBreakdown, surgeMultiplier, estimatedDuration } = option;

  return {
    rideOptionId: rideOption.id,
    rideOptionName: rideOption.name,
    vehicleType: rideOption.vehicleType,
    basePrice: pricingBreakdown.basePrice,
    distancePrice: pricingBreakdown.distancePrice,
    timePrice: pricingBreakdown.timePrice,
    surgePrice: pricingBreakdown.surgePrice,
    serviceFee: pricingBreakdown.serviceFee,
    totalPrice: pricingBreakdown.totalPrice,
    currency: pricingBreakdown.currency,
    estimatedDuration: formatDuration(pricingBreakdown.estimatedDuration),
    estimatedDistance: formatDistance(pricingBreakdown.distance),
    surgeMultiplier: surgeMultiplier,
    surgeActive: (surgeMultiplier ?? 1) > 1,
    eta: rideOption.estimatedTime || formatETA(estimatedDuration),
  };
}

/**
 * Extract surge display info from RideEstimate
 */
export function adaptSurgeInfo(surgeInfo?: SurgeInfo): SurgeDisplayInfo {
  if (!surgeInfo || !surgeInfo.isActive) {
    return {
      isActive: false,
      multiplier: 1,
      displayText: 'Normal pricing',
    };
  }

  return {
    isActive: true,
    multiplier: surgeInfo.multiplier,
    displayText: `${surgeInfo.multiplier}x surge pricing`,
    reason: surgeInfo.reason,
    waitTime: surgeInfo.estimatedWaitTime 
      ? formatDuration(surgeInfo.estimatedWaitTime) 
      : undefined,
  };
}

/**
 * Convert PriceEstimate to flat structure for components
 */
export function adaptPriceEstimateToFlat(
  priceEstimate: PriceEstimate,
  rideOption: { name: string; vehicleType: string; estimatedTime?: string }
): PriceConfirmation {
  return {
    rideOptionId: priceEstimate.rideOptionId,
    rideOptionName: rideOption.name,
    vehicleType: rideOption.vehicleType,
    basePrice: priceEstimate.basePrice,
    distancePrice: priceEstimate.distancePrice,
    timePrice: priceEstimate.timePrice,
    surgePrice: priceEstimate.surgePrice,
    serviceFee: priceEstimate.serviceFee,
    totalPrice: priceEstimate.totalPrice,
    currency: priceEstimate.currency,
    estimatedDuration: formatDuration(priceEstimate.estimatedDuration),
    estimatedDistance: formatDistance(priceEstimate.distance),
    surgeMultiplier: priceEstimate.surgeMultiplier,
    surgeActive: (priceEstimate.surgeMultiplier ?? 1) > 1,
    eta: rideOption.estimatedTime || formatDuration(priceEstimate.estimatedDuration),
  };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for PriceConfirmation
 */
export function isPriceConfirmation(obj: unknown): obj is PriceConfirmation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'rideOptionId' in obj &&
    'totalPrice' in obj &&
    'estimatedDuration' in obj &&
    typeof (obj as PriceConfirmation).estimatedDuration === 'string'
  );
}

/**
 * Type guard for PriceEstimate (numeric format)
 */
export function isPriceEstimate(obj: unknown): obj is PriceEstimate {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'rideOptionId' in obj &&
    'totalPrice' in obj &&
    'estimatedDuration' in obj &&
    typeof (obj as PriceEstimate).estimatedDuration === 'number'
  );
}

export default {
  formatDuration,
  formatDistance,
  formatETA,
  adaptRideEstimateToPriceConfirmation,
  adaptSurgeInfo,
  adaptPriceEstimateToFlat,
  isPriceConfirmation,
  isPriceEstimate,
};
