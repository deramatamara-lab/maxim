/**
 * Shared API Types
 * Standardized types used across API, store, and UI layers
 * Resolves ARCH-04 type mismatches between services
 */

// Note: Location type imported from rides.ts when needed for geo operations

// ============================================================================
// Duration & Distance Formatting
// ============================================================================

/**
 * Duration value that can be either numeric (minutes) or formatted string
 * Use formatDuration() to convert to display string
 */
export type DurationValue = number | string;

/**
 * Distance value that can be either numeric (km) or formatted string
 * Use formatDistance() to convert to display string
 */
export type DistanceValue = number | string;

/**
 * Format duration for display
 * @param duration - Duration in minutes (number) or pre-formatted string
 * @returns Formatted string like "15 min" or "1h 30m"
 */
export function formatDuration(duration: DurationValue): string {
  if (typeof duration === 'string') return duration;
  
  if (duration < 60) {
    return `${Math.round(duration)} min`;
  }
  
  const hours = Math.floor(duration / 60);
  const minutes = Math.round(duration % 60);
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

/**
 * Format distance for display
 * @param distance - Distance in km (number) or pre-formatted string
 * @returns Formatted string like "8.2 km" or "500 m"
 */
export function formatDistance(distance: DistanceValue): string {
  if (typeof distance === 'string') return distance;
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  
  return `${distance.toFixed(1)} km`;
}

// ============================================================================
// Standardized Price Estimate
// ============================================================================

/**
 * Unified price estimate structure used across all layers
 * This is the canonical format - all API responses should be mapped to this
 */
export interface StandardPriceEstimate {
  // Pricing breakdown
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  surgePrice: number;
  serviceFee: number;
  totalPrice: number;
  currency: string;
  
  // Surge info
  surgeMultiplier: number;
  
  // Trip metrics (always numeric for calculations)
  estimatedDuration: number; // minutes
  distance: number; // km
  
  // Optional ride option reference
  rideOptionId?: string;
}

/**
 * Surge information structure
 */
export interface StandardSurgeInfo {
  isActive: boolean;
  multiplier: number;
  reason: string;
  estimatedWaitTime: number; // minutes
  area?: {
    lat: number;
    lon: number;
    radius: number;
  };
  expiresAt?: string;
}

// ============================================================================
// Ride Estimate Response
// ============================================================================

/**
 * Standardized ride estimate response
 * Maps from rideService.getRideEstimate() to store/UI consumption
 */
export interface StandardRideEstimate {
  // Primary estimate for selected ride option
  estimate: StandardPriceEstimate;
  
  // All available ride options with their estimates
  rideOptions: StandardRideOptionEstimate[];
  
  // Route information
  route: {
    distance: number; // km
    duration: number; // minutes
    geometry?: string; // encoded polyline
  };
  
  // Surge information
  surgeInfo: StandardSurgeInfo | null;
  
  // Demand level
  demandLevel: 'low' | 'medium' | 'high' | 'peak';
}

/**
 * Individual ride option with estimate
 */
export interface StandardRideOptionEstimate {
  rideOptionId: string;
  name: string;
  description: string;
  vehicleType: 'sedan' | 'suv' | 'luxury' | 'electric' | 'motorcycle';
  capacity: number;
  features: string[];
  icon: string;
  
  // Pricing
  estimate: StandardPriceEstimate;
  
  // ETA
  estimatedArrival: number; // minutes until driver arrives
}

// ============================================================================
// Adapter Functions
// ============================================================================

/**
 * Convert API RideEstimate response to StandardRideEstimate
 * Use this in store actions when receiving API responses
 */
export function toStandardRideEstimate(
  apiResponse: {
    rideOptions: Array<{
      rideOption: {
        id: string;
        name: string;
        description: string;
        vehicleType: string;
        capacity: number;
        features: string[];
        icon: string;
        estimatedTime: string;
      };
      estimatedPrice: number;
      estimatedDuration: number;
      distance: number;
      surgeMultiplier?: number;
      pricingBreakdown: {
        basePrice: number;
        distancePrice: number;
        timePrice: number;
        surgePrice: number;
        serviceFee: number;
        totalPrice: number;
        currency: string;
        estimatedDuration: number;
        distance: number;
      };
    }>;
    route: {
      distance: number;
      duration: number;
      geometry?: string;
    };
    surgeInfo?: {
      isActive: boolean;
      multiplier: number;
      reason: string;
      estimatedWaitTime: number;
      area?: { lat: number; lon: number; radius: number };
      expiresAt?: string;
    };
    demandLevel: 'low' | 'medium' | 'high' | 'peak';
  },
  selectedRideOptionId?: string
): StandardRideEstimate {
  // Map ride options
  const rideOptions: StandardRideOptionEstimate[] = apiResponse.rideOptions.map(opt => ({
    rideOptionId: opt.rideOption.id,
    name: opt.rideOption.name,
    description: opt.rideOption.description,
    vehicleType: opt.rideOption.vehicleType as StandardRideOptionEstimate['vehicleType'],
    capacity: opt.rideOption.capacity,
    features: opt.rideOption.features,
    icon: opt.rideOption.icon,
    estimate: {
      basePrice: opt.pricingBreakdown.basePrice,
      distancePrice: opt.pricingBreakdown.distancePrice,
      timePrice: opt.pricingBreakdown.timePrice,
      surgePrice: opt.pricingBreakdown.surgePrice,
      serviceFee: opt.pricingBreakdown.serviceFee,
      totalPrice: opt.pricingBreakdown.totalPrice,
      currency: opt.pricingBreakdown.currency,
      surgeMultiplier: opt.surgeMultiplier || 1.0,
      estimatedDuration: opt.pricingBreakdown.estimatedDuration,
      distance: opt.pricingBreakdown.distance,
      rideOptionId: opt.rideOption.id,
    },
    estimatedArrival: parseEtaMinutes(opt.rideOption.estimatedTime),
  }));

  // Get primary estimate (selected or first)
  const selectedOption = selectedRideOptionId 
    ? rideOptions.find(o => o.rideOptionId === selectedRideOptionId)
    : rideOptions[0];
  
  const primaryEstimate = selectedOption?.estimate || rideOptions[0]?.estimate || {
    basePrice: 0,
    distancePrice: 0,
    timePrice: 0,
    surgePrice: 0,
    serviceFee: 0,
    totalPrice: 0,
    currency: 'USD',
    surgeMultiplier: 1.0,
    estimatedDuration: 0,
    distance: 0,
  };

  // Map surge info
  const surgeInfo: StandardSurgeInfo | null = apiResponse.surgeInfo ? {
    isActive: apiResponse.surgeInfo.isActive,
    multiplier: apiResponse.surgeInfo.multiplier,
    reason: apiResponse.surgeInfo.reason,
    estimatedWaitTime: apiResponse.surgeInfo.estimatedWaitTime,
    area: apiResponse.surgeInfo.area,
    expiresAt: apiResponse.surgeInfo.expiresAt,
  } : null;

  return {
    estimate: primaryEstimate,
    rideOptions,
    route: {
      distance: apiResponse.route.distance,
      duration: apiResponse.route.duration,
      geometry: apiResponse.route.geometry,
    },
    surgeInfo,
    demandLevel: apiResponse.demandLevel,
  };
}

/**
 * Parse ETA string like "3 min" to minutes number
 */
function parseEtaMinutes(etaString: string): number {
  const match = etaString.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}

/**
 * Create mock StandardPriceEstimate for development
 */
export function createMockPriceEstimate(overrides?: Partial<StandardPriceEstimate>): StandardPriceEstimate {
  return {
    basePrice: 5.00,
    distancePrice: 8.50,
    timePrice: 4.25,
    surgePrice: 0,
    serviceFee: 2.50,
    totalPrice: 20.25,
    currency: 'USD',
    surgeMultiplier: 1.0,
    estimatedDuration: 15,
    distance: 8.2,
    ...overrides,
  };
}

/**
 * Create mock StandardSurgeInfo for development
 */
export function createMockSurgeInfo(overrides?: Partial<StandardSurgeInfo>): StandardSurgeInfo {
  return {
    isActive: false,
    multiplier: 1.0,
    reason: '',
    estimatedWaitTime: 5,
    ...overrides,
  };
}
