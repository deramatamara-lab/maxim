/**
 * Ride Service
 * Handles ride booking, ride options, and ride management
 * Orchestrates pricing, routing, and payment services
 */

import { apiClient, ApiResponse, PaginatedResponse } from './client';
import { pricingService, PriceEstimate, DynamicPricingRequest, SurgeInfo } from './pricing';
import { routingService, Route, RouteOptions } from './routing';
import { paymentService, PaymentMethodInfo, PaymentRequest } from './PaymentServiceFactory';
import { log } from '@/utils/logger';

export interface Location {
  lat: number;
  lon: number;
  address?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  vehicle: Vehicle;
  photo?: string;
  completedRides: number; // Add missing completedRides property
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  type: 'sedan' | 'suv' | 'luxury' | 'electric';
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderType: 'rider' | 'driver';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface RideHistory {
  id: string;
  riderId: string;
  driverId: string;
  pickup: Location;
  destination: Location;
  status: 'completed' | 'cancelled';
  price: number;
  duration: number;
  distance: number;
  driverRating?: number;
  riderRating?: number;
  paymentMethod: PaymentMethodInfo;
  createdAt: string;
  completedAt?: string;
  // Optional driver details for enhanced history display
  driver?: {
    id: string;
    name: string;
    photo?: string;
    vehicle: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
    };
    rating: number;
  };
}

// NEW: Driver Earnings Types
export interface DriverEarnings {
  driverId: string;
  period: 'today' | 'week' | 'month';
  totalEarnings: number;
  totalRides: number;
  averageEarningsPerRide: number;
  surgeEarnings: number;
  baseEarnings: number;
  tips: number;
  // NEW: Performance Metrics for Analytics
  totalDistance: number; // km
  totalDuration: number; // minutes
  averageSpeed: number; // km/h
  acceptanceRate: number; // percentage
  completionRate: number; // percentage
  averageRating: number; // driver rating
  peakHoursEarnings: number; // earnings during peak hours
  efficiencyScore: number; // 0-100 performance score
  bonuses: number;
  expenses: number;
  netEarnings: number;
  currency: string;
  lastUpdated: string;
}

export interface DriverAnalytics {
  earnings: DriverEarnings;
  trends: {
    dailyEarnings: Array<{ date: string; earnings: number; rides: number }>;
    hourlyPerformance: Array<{ hour: number; earnings: number; rides: number }>;
    weeklyComparison: Array<{ week: string; earnings: number; rides: number }>;
  };
  performance: {
    topEarningDay: string;
    averageTripDistance: number; // km
    averageTripDuration: number; // minutes
    mostProfitableArea: string;
    peakHours: Array<{ start: string; end: string; earnings: number }>;
  };
}

export interface EarningsHistory {
  id: string;
  driverId: string;
  rideId: string;
  earnings: number;
  surgeMultiplier: number;
  baseFare: number;
  surgeFare: number;
  tip: number;
  bonus: number;
  expenses: number;
  netEarnings: number;
  currency: string;
  completedAt: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  rideType: string;
  distance: number;
  duration: number;
}

export interface RideOption {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  pricePerKm: number;
  capacity: number;
  estimatedTime: string;
  icon: string;
  features: string[];
  vehicleType: 'sedan' | 'suv' | 'luxury' | 'electric' | 'motorcycle';
}

export interface RideRequest {
  id: string;
  riderId: string;
  driverId?: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  rideOptionId: string;
  status: 'pending' | 'accepted' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  estimatedPrice: number;
  estimatedDuration: number;
  distance: number;
  createdAt: string;
  updatedAt: string;
  // Enhanced with new services
  pricingEstimate?: PriceEstimate;
  route?: Route;
  paymentMethodId?: string;
  scheduledTime?: string;
  isShared?: boolean;
  passengerCount?: number;
  notes?: string;
}

export interface RideEstimate {
  rideOptions: Array<{
    rideOption: RideOption;
    estimatedPrice: number;
    estimatedDuration: number;
    distance: number;
    surgeMultiplier?: number;
    pricingBreakdown: PriceEstimate;
    routeInfo: Route;
  }>;
  route: {
    distance: number;
    duration: number;
    geometry: string; // Encoded polyline
    alternatives?: Route[];
  };
  surgeInfo?: SurgeInfo;
  demandLevel: 'low' | 'medium' | 'high' | 'peak';
}

export interface ActiveRide extends RideRequest {
  driver?: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    vehicle: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
    };
    rating: number;
    completedRides: number;
  };
  tracking?: {
    currentLocation: Location;
    estimatedArrival: number;
    route: string;
  };
  // Additional properties for active ride screen
  pickup: {
    address: string;
  };
  destination: {
    address: string;
  };
  duration: number; // in minutes
  price: number; // total price
  fare: {
    total: number;
    base: number;
    distance: number;
    time: number;
    surge?: number;
  };
  paymentMethod?: PaymentMethodInfo;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  tip?: number;
  receiptUrl?: string;
}

class RideService {
  /**
   * Get available ride options
   */
  async getRideOptions(): Promise<ApiResponse<RideOption[]>> {
    return apiClient.get<RideOption[]>('/rides/options');
  }

  /**
   * Get ride estimate for pickup and dropoff locations (enhanced with all services)
   */
  async getRideEstimate(
    pickup: Location,
    dropoff: Location,
    rideOptionIds?: string[],
    paymentMethodId?: string,
    scheduledTime?: string,
    passengerCount: number = 1,
    isShared: boolean = false
  ): Promise<ApiResponse<RideEstimate>> {
    try {
      // Get available ride options if not provided
      const optionsResponse = rideOptionIds 
        ? await apiClient.get<RideOption[]>('/rides/options')
        : await this.getRideOptions();
      
      if (!optionsResponse.success || !optionsResponse.data) {
        return { success: false, error: 'Failed to get ride options' };
      }

      const rideOptions = optionsResponse.data;
      const targetOptionIds = rideOptionIds || rideOptions.map(opt => opt.id);

      // Get pricing estimates
      const pricingRequest: DynamicPricingRequest = {
        pickup,
        destination: dropoff,
        rideOptionIds: targetOptionIds,
        scheduledTime,
        passengerCount,
        isShared,
      };

      const pricingResponse = await pricingService.getPriceEstimate(pricingRequest);
      if (!pricingResponse.success || !pricingResponse.data) {
        return { success: false, error: 'Failed to get pricing estimates' };
      }

      // Get route information
      const routeOptions: RouteOptions = {
        origin: pickup,
        destination: dropoff,
        alternatives: true,
        avoid: { tolls: false, highways: false, ferries: false },
        vehicleType: 'car',
        optimize: 'time',
      };

      const routeResponse = await routingService.calculateRoute(routeOptions);
      if (!routeResponse.success || !routeResponse.data) {
        return { success: false, error: 'Failed to calculate routes' };
      }

      // Get surge information
      const surgeResponse = await pricingService.getSurgeInfo(pickup);
      const surgeInfo = surgeResponse.success ? surgeResponse.data : undefined;

      // Combine all information
      const enhancedRideOptions = pricingResponse.data?.map((priceEstimate, index) => {
        const rideOption = rideOptions.find(opt => opt.id === priceEstimate.rideOptionId);
        const route = routeResponse.data?.[index] || routeResponse.data?.[0];
        
        if (!rideOption) {
          throw new Error(`Ride option ${priceEstimate.rideOptionId} not found`);
        }

        return {
          rideOption,
          estimatedPrice: priceEstimate.totalPrice,
          estimatedDuration: priceEstimate.estimatedDuration,
          distance: priceEstimate.distance,
          surgeMultiplier: priceEstimate.surgeMultiplier,
          pricingBreakdown: priceEstimate,
          routeInfo: route!,
        };
      });

      const mainRoute = routeResponse.data[0] || routeResponse.data[0];

      return {
        success: true,
        data: {
          rideOptions: enhancedRideOptions,
          route: {
            distance: mainRoute.distance,
            duration: mainRoute.duration,
            geometry: mainRoute.geometry,
            alternatives: routeResponse.data.slice(1),
          },
          surgeInfo: surgeInfo ? {
            isActive: surgeInfo.isActive,
            multiplier: surgeInfo.multiplier,
            reason: surgeInfo.reason,
            area: surgeInfo.area || { lat: 0, lon: 0, radius: 1000 },
            estimatedWaitTime: surgeInfo.estimatedWaitTime || 5,
          } : undefined,
          demandLevel: surgeInfo ? 
            (surgeInfo.multiplier <= 1.0 ? 'low' : 
             surgeInfo.multiplier <= 1.5 ? 'medium' : 
             surgeInfo.multiplier <= 2.0 ? 'high' : 'peak') : 'low',
        },
      };
    } catch (error) {
      log.error('Ride estimate error', { event: 'ride_estimate_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to calculate ride estimate' };
    }
  }

  /**
   * Book a ride (enhanced with payment processing)
   */
  async bookRide(
    pickup: Location,
    dropoff: Location,
    rideOptionId: string,
    notes?: string,
    paymentMethodId?: string,
    scheduledTime?: string,
    passengerCount: number = 1,
    isShared: boolean = false
  ): Promise<ApiResponse<RideRequest>> {
    try {
      // Get enhanced ride estimate first
      const estimateResponse = await this.getRideEstimate(
        pickup,
        dropoff,
        [rideOptionId],
        paymentMethodId,
        scheduledTime,
        passengerCount,
        isShared
      );

      if (!estimateResponse.success || !estimateResponse.data) {
        return { success: false, error: 'Failed to get ride estimate' };
      }

      const selectedOption = estimateResponse.data.rideOptions.find(
        opt => opt.rideOption.id === rideOptionId
      );

      if (!selectedOption) {
        return { success: false, error: 'Ride option not available' };
      }

      // Create ride request with enhanced data
      const rideData = {
        pickup,
        dropoff,
        rideOptionId,
        notes,
        paymentMethodId,
        scheduledTime,
        passengerCount,
        isShared,
        estimatedPrice: selectedOption.estimatedPrice,
        estimatedDuration: selectedOption.estimatedDuration,
        distance: selectedOption.distance,
        pricingEstimate: selectedOption.pricingBreakdown,
        route: selectedOption.routeInfo,
      };

      // Book the ride
      const bookingResponse = await apiClient.post<RideRequest>('/rides/book', rideData);
      
      if (!bookingResponse.success || !bookingResponse.data) {
        return bookingResponse;
      }

      // If payment method is provided, pre-authorize payment
      if (paymentMethodId) {
        const paymentRequest: PaymentRequest = {
          idempotencyKey: `payment-${bookingResponse.data.id}-${Date.now()}`,
          rideId: bookingResponse.data.id,
          amount: selectedOption.estimatedPrice,
          currency: selectedOption.pricingBreakdown.currency,
          paymentMethodId,
          metadata: {
            breakdown: {
              baseFare: selectedOption.pricingBreakdown.basePrice,
              distance: selectedOption.pricingBreakdown.distancePrice,
              time: selectedOption.pricingBreakdown.timePrice,
              surge: selectedOption.pricingBreakdown.surgePrice,
              serviceFee: selectedOption.pricingBreakdown.serviceFee,
              tax: 0, // Will be calculated server-side
            },
          },
        };

        // Validate payment method first
        const validationResponse = await paymentService.validatePayment(paymentRequest);
        if (!validationResponse.success || !validationResponse.data?.isValid) {
          return { 
            success: false, 
            error: 'Payment validation failed: ' + (validationResponse.data?.errors?.join(', ') || 'Unknown error')
          };
        }

        // Pre-authorize payment (hold the amount)
        const paymentResponse = await paymentService.processPayment({
          ...paymentRequest,
          // Add metadata to indicate this is a pre-authorization
          metadata: {
            breakdown: {
              baseFare: 12.00,
              distance: 8.50,
              time: 5.00,
              surge: 0.00,
              serviceFee: 2.50,
              tax: 1.00,
            },
          },
        });

        if (!paymentResponse.success) {
          // Cancel the ride if payment fails
          await this.cancelRide(bookingResponse.data.id, 'Payment pre-authorization failed');
          return { success: false, error: 'Payment pre-authorization failed' };
        }
      }

      return bookingResponse;
    } catch (error) {
      log.error('Book ride error', { event: 'book_ride_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to book ride' };
    }
  }

  /**
   * Get user's ride history
   */
  async getRideHistory(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<PaginatedResponse<RideHistory>> {
    const params: Record<string, string | number> = { page, limit };
    if (status) params.status = status;
    
    return apiClient.get<RideHistory[]>('/rides/history', params) as Promise<PaginatedResponse<RideHistory>>;
  }

  /**
   * Get ride details by ID
   */
  async getRideDetails(rideId: string): Promise<ApiResponse<ActiveRide>> {
    return apiClient.get<ActiveRide>(`/rides/${rideId}`);
  }

  /**
   * Cancel a ride
   */
  async cancelRide(rideId: string, reason?: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/rides/${rideId}/cancel`, { reason });
  }

  /**
   * Update ride status (for drivers)
   */
  async updateRideStatus(
    rideId: string,
    status: 'accepted' | 'in_progress' | 'completed',
    location?: Location
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/rides/${rideId}/status`, {
      status,
      location,
    });
  }

  /**
   * Rate a ride (after completion)
   */
  async rateRide(
    rideId: string,
    rating: number,
    comment?: string
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/rides/${rideId}/rate`, {
      rating,
      comment,
    });
  }

  /**
   * Report an issue with a ride
   */
  async reportRideIssue(
    rideId: string,
    issue: string,
    description?: string
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/rides/${rideId}/report`, {
      issue,
      description,
    });
  }

  /**
   * Get active ride for current user
   */
  async getActiveRide(): Promise<ApiResponse<ActiveRide>> {
    return apiClient.get<ActiveRide>('/rides/active');
  }

  /**
   * Update ride tracking location (for drivers)
   */
  async updateRideLocation(
    rideId: string,
    location: Location
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/rides/${rideId}/location`, { location });
  }

  /**
   * Add tip to completed ride
   */
  async addTip(rideId: string, amount: number): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/rides/${rideId}/tip`, { amount });
  }

  /**
   * Complete ride payment and process final charges
   */
  async completeRidePayment(
    rideId: string,
    finalAmount: number,
    tip: number = 0,
    paymentMethodId?: string
  ): Promise<ApiResponse<{
    paymentId: string;
    totalCharged: number;
    receiptUrl: string;
  }>> {
    try {
      // Get ride details to verify payment method
      const rideResponse = await this.getRideDetails(rideId);
      if (!rideResponse.success || !rideResponse.data) {
        return { success: false, error: 'Failed to get ride details' };
      }

      const methodId = paymentMethodId || rideResponse.data.paymentMethodId;
      if (!methodId) {
        return { success: false, error: 'No payment method available' };
      }

      // Process final payment
      const paymentRequest: PaymentRequest = {
        idempotencyKey: `payment-${rideId}-${Date.now()}`,
        rideId,
        amount: finalAmount + tip,
        currency: 'USD', // Should be dynamic based on location
        paymentMethodId: methodId,
        tip,
        metadata: {
          breakdown: {
            baseFare: 12.00,
            distance: 8.50,
            time: 5.00,
            surge: 0.00,
            serviceFee: 2.50,
            tax: 1.00,
          },
        },
      };

      const paymentResponse = await paymentService.processPayment(paymentRequest);
      if (!paymentResponse.success || !paymentResponse.data) {
        return { success: false, error: paymentResponse.error || 'Payment failed' };
      }

      // Generate receipt
      const receiptResponse = await paymentService.downloadReceipt(paymentResponse.data.id);
      
      return {
        success: true,
        data: {
          paymentId: paymentResponse.data.id,
          totalCharged: finalAmount + tip,
          receiptUrl: receiptResponse.success ? receiptResponse.data?.url || '' : '',
        },
      };
    } catch (error) {
      log.error('Complete ride payment error', { event: 'complete_ride_payment_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to process ride payment' };
    }
  }

  /**
   * Add tip to completed ride
   */
  async addRideTip(rideId: string, amount: number, paymentMethodId: string): Promise<ApiResponse<void>> {
    try {
      const tipRequest = {
        rideId,
        amount,
        paymentMethodId,
        isPercentage: false,
      };

      const tipResponse = await paymentService.addTip(tipRequest);
      return tipResponse.success ? { success: true, data: undefined } : { success: false, error: tipResponse.error || 'Tip failed' };
    } catch (error) {
      log.error('Add tip error', { event: 'add_tip_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to add tip' };
    }
  }

  /**
   * Get ride receipt with full breakdown
   */
  async getRideReceipt(rideId: string): Promise<ApiResponse<{
    id: string;
    rideId: string;
    totalAmount: number;
    currency: string;
    breakdown: {
      baseFare: number;
      distance: number;
      time: number;
      surge: number;
      tip: number;
      tax: number;
      serviceFee: number;
    };
    paymentMethod: PaymentMethodInfo;
    createdAt: string;
    receiptUrl: string;
  }>> {
    try {
      const response = await paymentService.downloadReceipt(rideId);
      if (!response.success || !response.data) {
        return { success: false, error: 'Failed to get receipt' };
      }

      // Get ride details for additional information
      const rideResponse = await this.getRideDetails(rideId);
      if (!rideResponse.success || !rideResponse.data) {
        return { success: false, error: 'Failed to get ride details' };
      }

      return {
        success: true,
        data: {
          id: rideId,
          rideId,
          totalAmount: rideResponse.data.price,
          currency: 'USD',
          breakdown: {
            baseFare: rideResponse.data.pricingEstimate?.basePrice || 0,
            distance: rideResponse.data.pricingEstimate?.distancePrice || 0,
            time: rideResponse.data.pricingEstimate?.timePrice || 0,
            surge: rideResponse.data.pricingEstimate?.surgePrice || 0,
            tip: rideResponse.data.tip || 0,
            tax: 0, // Will be calculated server-side
            serviceFee: rideResponse.data.pricingEstimate?.serviceFee || 0,
          },
          paymentMethod: rideResponse.data.paymentMethod || {
            id: 'unknown',
            type: 'cash',
            isDefault: false,
            isVerified: true,
            addedAt: new Date().toISOString(),
          } as PaymentMethodInfo,
          createdAt: rideResponse.data.createdAt,
          receiptUrl: response.data.url,
        },
      };
    } catch (error) {
      log.error('Get ride receipt error', { event: 'get_ride_receipt_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to get ride receipt' };
    }
  }

  /**
   * Schedule a ride for future time
   */
  async scheduleRide(
    pickup: Location,
    dropoff: Location,
    rideOptionId: string,
    scheduledTime: string,
    notes?: string,
    paymentMethodId?: string,
    passengerCount: number = 1
  ): Promise<ApiResponse<RideRequest>> {
    return this.bookRide(
      pickup,
      dropoff,
      rideOptionId,
      notes,
      paymentMethodId,
      scheduledTime,
      passengerCount,
      false
    );
  }

  /**
   * Get available ride options with real-time pricing
   */
  async getAvailableRideOptions(
    pickup: Location,
    destination?: Location
  ): Promise<ApiResponse<Array<{
    option: RideOption;
    estimatedPrice?: number;
    estimatedDuration?: number;
    surgeMultiplier?: number;
    availability: {
      available: boolean;
      estimatedWaitTime: number;
      nearbyDrivers: number;
    };
  }>>> {
    try {
      // Get basic ride options
      const optionsResponse = await this.getRideOptions();
      if (!optionsResponse.success || !optionsResponse.data) {
        return { success: false, error: 'Failed to get ride options' };
      }

      let enhancedOptions = optionsResponse.data.map(option => ({
        option,
        availability: {
          available: true,
          estimatedWaitTime: Math.floor(Math.random() * 10) + 3, // 3-12 minutes
          nearbyDrivers: Math.floor(Math.random() * 5) + 1, // 1-5 drivers
        },
      }));

      // If destination provided, get pricing estimates
      if (destination) {
        const estimateResponse = await this.getRideEstimate(pickup, destination);
        if (estimateResponse.success && estimateResponse.data) {
          enhancedOptions = enhancedOptions.map((enhanced, index) => {
            const pricing = estimateResponse.data!.rideOptions[index];
            return {
              ...enhanced,
              estimatedPrice: pricing?.estimatedPrice,
              estimatedDuration: pricing?.estimatedDuration,
              surgeMultiplier: pricing?.surgeMultiplier,
            };
          });
        }
      }

      return { success: true, data: enhancedOptions };
    } catch (error) {
      log.error('Get available ride options error', { event: 'get_ride_options_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to get available ride options' };
    }
  }

  /**
   * Update ride tracking with real-time location
   */
  async updateRideTracking(
    rideId: string,
    currentLocation: Location,
    targetLocation: Location
  ): Promise<ApiResponse<{
    estimatedArrival: string;
    remainingDistance: number;
    remainingDuration: number;
    confidence: number;
  }>> {
    try {
      const etaResponse = await routingService.updateETA(rideId, currentLocation, targetLocation);
      
      if (!etaResponse.success || !etaResponse.data) {
        return { success: false, error: 'Failed to update ETA' };
      }

      return {
        success: true,
        data: {
          estimatedArrival: etaResponse.data.estimatedArrival,
          remainingDistance: etaResponse.data.remainingDistance,
          remainingDuration: etaResponse.data.remainingDuration,
          confidence: etaResponse.data.confidence,
        },
      };
    } catch (error) {
      log.error('Update ride tracking error', { event: 'update_ride_tracking_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to update ride tracking' };
    }
  }

  /**
   * Get driver earnings for a specific period
   * PRODUCTION: Real API endpoint
   */
  async getDriverEarnings(period: 'today' | 'week' | 'month'): Promise<ApiResponse<{
    earnings: DriverEarnings;
    history: EarningsHistory[];
  }>> {
    try {
      const response = await apiClient.get<{ earnings: DriverEarnings; history: EarningsHistory[] }>(
        `/driver/earnings?period=${period}`
      );
      return response;
    } catch (error) {
      log.error('Get driver earnings error', { event: 'get_driver_earnings_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to fetch driver earnings' };
    }
  }

  /**
   * Get driver analytics for a specific period
   * PRODUCTION: Real API endpoint
   */
  async getDriverAnalytics(period: 'today' | 'week' | 'month'): Promise<ApiResponse<DriverAnalytics>> {
    try {
      const response = await apiClient.get<DriverAnalytics>(`/driver/analytics?period=${period}`);
      return response;
    } catch (error) {
      log.error('Get driver analytics error', { event: 'get_driver_analytics_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to fetch driver analytics' };
    }
  }

  /**
   * Complete a ride with rating and tip
   * PRODUCTION: Real API endpoint
   */
  async completeRide(rideId: string, data: { rating?: number; tip?: number }): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<void, { rating?: number; tip?: number }>(
        `/rides/${rideId}/complete`,
        data
      );
      return response;
    } catch (error) {
      log.error('Complete ride error', { event: 'complete_ride_failed', component: 'ridesApi' }, error);
      return { success: false, error: 'Failed to complete ride' };
    }
  }
}

export const rideService = new RideService();
