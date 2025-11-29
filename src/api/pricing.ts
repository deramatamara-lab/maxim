/**
 * Pricing Service
 * Handles dynamic pricing, surge calculations, and fare estimates
 */

import { apiClient, ApiResponse } from './client';
import { Location } from './location';

export interface PricingFactors {
  distance: number; // in kilometers
  duration: number; // in minutes
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  surgeMultiplier: number;
  demandLevel: 'low' | 'medium' | 'high' | 'peak';
  timeOfDay: 'morning_rush' | 'day' | 'evening_rush' | 'night' | 'late_night';
  weatherMultiplier?: number;
  eventMultiplier?: number;
}

export interface RateCard {
  id: string;
  name: string;
  vehicleType: 'sedan' | 'suv' | 'luxury' | 'electric' | 'motorcycle';
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  serviceFee: number;
  cancellationFee: number;
  bookingFee: number;
  features: string[];
}

export interface SurgeInfo {
  isActive: boolean;
  multiplier: number;
  reason: string;
  area: {
    lat: number;
    lon: number;
    radius: number; // in meters
  };
  estimatedWaitTime: number; // in minutes
  expiresAt?: string;
}

export interface PriceEstimate {
  rideOptionId: string;
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  surgePrice: number;
  serviceFee: number;
  totalPrice: number;
  currency: string;
  surgeMultiplier?: number;
  estimatedDuration: number;
  distance: number;
}

export interface DynamicPricingRequest {
  pickup: Location;
  destination: Location;
  rideOptionIds: string[];
  scheduledTime?: string; // ISO string for scheduled rides
  passengerCount: number;
  isShared: boolean;
}

export interface PricingRule {
  id: string;
  name: string;
  type: 'surge' | 'discount' | 'peak_pricing' | 'event_pricing';
  conditions: {
    timeOfDay?: { start: string; end: string };
    daysOfWeek?: number[];
    area?: { lat: number; lon: number; radius: number };
    demandLevel?: string;
    weatherConditions?: string[];
  };
  action: {
    multiplier?: number;
    fixedAmount?: number;
    percentage?: number;
  };
  isActive: boolean;
  priority: number;
}

class PricingService {
  /**
   * Get current rate cards for all vehicle types
   */
  async getRateCards(): Promise<ApiResponse<RateCard[]>> {
    return apiClient.get<RateCard[]>('/pricing/rate-cards');
  }

  /**
   * Get pricing estimate for ride options
   */
  async getPriceEstimate(request: DynamicPricingRequest): Promise<ApiResponse<PriceEstimate[]>> {
    return apiClient.post<PriceEstimate[], DynamicPricingRequest>('/pricing/estimate', request);
  }

  /**
   * Get current surge information for area
   */
  async getSurgeInfo(location: Location): Promise<ApiResponse<SurgeInfo>> {
    return apiClient.get<SurgeInfo>('/pricing/surge', {
      lat: location.lat,
      lon: location.lon,
    });
  }

  /**
   * Calculate price using local rate card (for offline/demo mode)
   */
  calculatePrice(
    distance: number, // in km
    duration: number, // in minutes
    rateCard: RateCard,
    surgeMultiplier: number = 1,
    additionalFactors: Partial<PricingFactors> = {}
  ): PricingFactors {
    const basePrice = rateCard.baseFare;
    const distancePrice = distance * rateCard.perKmRate;
    const timePrice = duration * rateCard.perMinuteRate;
    
    const subtotal = basePrice + distancePrice + timePrice;
    const surgePrice = subtotal * (surgeMultiplier - 1);
    const serviceFee = rateCard.serviceFee;
    
    const _totalPrice = Math.max(
      (subtotal + surgePrice + serviceFee) * surgeMultiplier,
      rateCard.minimumFare
    );

    return {
      distance,
      duration,
      baseFare: rateCard.baseFare,
      perKmRate: rateCard.perKmRate,
      perMinuteRate: rateCard.perMinuteRate,
      surgeMultiplier,
      demandLevel: this.getDemandLevel(surgeMultiplier),
      timeOfDay: this.getTimeOfDay(),
      ...additionalFactors,
    };
  }

  /**
   * Get pricing rules for dynamic adjustments
   */
  async getPricingRules(): Promise<ApiResponse<PricingRule[]>> {
    return apiClient.get<PricingRule[]>('/pricing/rules');
  }

  /**
   * Apply promotional code to price
   */
  async applyPromoCode(
    code: string,
    originalPrice: number,
    rideOptionId: string
  ): Promise<ApiResponse<{
    discountedPrice: number;
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
    validUntil: string;
  }>> {
    return apiClient.post('/pricing/promo', {
      code,
      originalPrice,
      rideOptionId,
    });
  }

  /**
   * Get pricing history for analytics
   */
  async getPricingHistory(
    startDate: string,
    endDate: string,
    location?: Location
  ): Promise<ApiResponse<Array<{
    date: string;
    averagePrice: number;
    surgeMultiplier: number;
    demandLevel: string;
    rideCount: number;
  }>>> {
    const params: Record<string, string> = { startDate, endDate };
    if (location) {
      params.lat = location.lat.toString();
      params.lon = location.lon.toString();
    }
    
    return apiClient.get('/pricing/history', params);
  }

  /**
   * Helper method to determine demand level from surge multiplier
   */
  private getDemandLevel(surgeMultiplier: number): 'low' | 'medium' | 'high' | 'peak' {
    if (surgeMultiplier <= 1.0) return 'low';
    if (surgeMultiplier <= 1.5) return 'medium';
    if (surgeMultiplier <= 2.0) return 'high';
    return 'peak';
  }

  /**
   * Helper method to get time of day category
   */
  private getTimeOfDay(): 'morning_rush' | 'day' | 'evening_rush' | 'night' | 'late_night' {
    const hour = new Date().getHours();
    
    if (hour >= 7 && hour <= 9) return 'morning_rush';
    if (hour >= 10 && hour <= 16) return 'day';
    if (hour >= 17 && hour <= 19) return 'evening_rush';
    if (hour >= 20 && hour <= 23) return 'night';
    return 'late_night';
  }

  /**
   * Calculate estimated fare breakdown for receipt
   */
  calculateFareBreakdown(
    distance: number,
    duration: number,
    rateCard: RateCard,
    surgeMultiplier: number = 1,
    tip: number = 0,
    tax: number = 0
  ): {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeFare: number;
    serviceFee: number;
    tip: number;
    tax: number;
    total: number;
  } {
    const baseFare = rateCard.baseFare;
    const distanceFare = distance * rateCard.perKmRate;
    const timeFare = duration * rateCard.perMinuteRate;
    const subtotal = baseFare + distanceFare + timeFare;
    const surgeFare = subtotal * (surgeMultiplier - 1);
    const serviceFee = rateCard.serviceFee;
    
    const total = Math.max(
      subtotal + surgeFare + serviceFee + tip + tax,
      rateCard.minimumFare + tip + tax
    );

    return {
      baseFare,
      distanceFare,
      timeFare,
      surgeFare,
      serviceFee,
      tip,
      tax,
      total,
    };
  }

  /**
   * Validate pricing parameters
   */
  validatePricingRequest(request: DynamicPricingRequest): string[] {
    const errors: string[] = [];
    
    if (!request.pickup.lat || !request.pickup.lon) {
      errors.push('Valid pickup location is required');
    }
    
    if (!request.destination.lat || !request.destination.lon) {
      errors.push('Valid destination location is required');
    }
    
    if (!request.rideOptionIds || request.rideOptionIds.length === 0) {
      errors.push('At least one ride option must be selected');
    }
    
    if (request.passengerCount < 1 || request.passengerCount > 8) {
      errors.push('Passenger count must be between 1 and 8');
    }
    
    if (request.scheduledTime && new Date(request.scheduledTime) <= new Date()) {
      errors.push('Scheduled time must be in the future');
    }
    
    return errors;
  }
}

export const pricingService = new PricingService();
