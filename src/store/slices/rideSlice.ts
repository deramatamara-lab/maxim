/**
 * Ride Store Slice
 * Handles ride options, booking, history, and active rides
 */

import { StateCreator } from 'zustand';
import { log } from '../../utils/logger';
import { rideService, type RideOption, type Location, type ActiveRide, type RideHistory } from '../../api/rides';
import { type PriceEstimate, SurgeInfo } from '../../api/pricing';
import { 
  RideErrorType,
  type RideBookingResult,
  createRideError
} from '../../types/rideErrors';

// PRODUCTION: NO MOCKS - All API calls are real

export interface RideSlice {
  // State
  rideOptions: RideOption[];
  selectedRideOptionId: string | null;
  isLoadingRideOptions: boolean;
  rideOptionsError: string | null;
  currentRide: ActiveRide | null;
  rideHistory: RideHistory[];
  isLoadingRide: boolean;
  rideError: string | null;
  currentEstimate: PriceEstimate | null;
  isLoadingEstimate: boolean;
  estimateError: string | null;
  surgeInfo: SurgeInfo | null;
  
  // Actions
  fetchRideOptions: () => Promise<void>;
  setSelectedRideOption: (id: string | null) => void;
  bookRide: (pickup: Location, dropoff: Location, rideOptionId: string, userId: string, notes?: string) => Promise<RideBookingResult>;
  cancelRide: (rideId: string, reason?: string) => Promise<boolean>;
  fetchRideHistory: (userId: string) => Promise<void>;
  getActiveRide: () => Promise<void>;
  getRideEstimate: (pickup: Location, dropoff: Location, rideOptionIds?: string[]) => Promise<boolean>;
  clearCurrentRide: () => void;
}

export const createRideSlice: StateCreator<RideSlice, [], [], RideSlice> = (set, get) => ({
  // Initial State
  rideOptions: [],
  selectedRideOptionId: null,
  isLoadingRideOptions: false,
  rideOptionsError: null,
  currentRide: null,
  rideHistory: [],
  isLoadingRide: false,
  rideError: null,
  currentEstimate: null,
  isLoadingEstimate: false,
  estimateError: null,
  surgeInfo: null,

  setSelectedRideOption: (id) => set({ selectedRideOptionId: id }),
  clearCurrentRide: () => set({ currentRide: null, rideError: null }),

  fetchRideOptions: async () => {
    set({ isLoadingRideOptions: true, rideOptionsError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await rideService.getRideOptions();
      
      if (response.success && response.data) {
        const rideOptions = response.data as RideOption[];
        if (Array.isArray(rideOptions) && rideOptions.length > 0) {
          set({ rideOptions, isLoadingRideOptions: false, rideOptionsError: null });
        } else {
          set({ rideOptionsError: 'No ride options available in your area', isLoadingRideOptions: false, rideOptions: [] });
        }
      } else {
        let errorMessage = response.error || 'Failed to fetch ride options';
        
        if (response.error?.includes('network') || response.error?.includes('connection')) {
          errorMessage = 'Unable to load ride options. Please check your connection and try again.';
        } else if (response.error?.includes('location') || response.error?.includes('geolocation')) {
          errorMessage = 'Unable to determine your location. Please enable location services.';
        } else if (response.error?.includes('server') || response.error?.includes('500')) {
          errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
        }
        
        set({ rideOptionsError: errorMessage, isLoadingRideOptions: false, rideOptions: [] });
      }
    } catch (error) {
      log.error('Fetch ride options error', { event: 'fetch_ride_options_failed', component: 'rideSlice' }, error);
      
      let errorMessage = 'Unable to load ride options';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network connection issue. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      set({ rideOptionsError: errorMessage, isLoadingRideOptions: false, rideOptions: [] });
    }
  },

  bookRide: async (pickup, dropoff, rideOptionId, userId, notes) => {
    const currentState = get();
    
    if (currentState.isLoadingRide) {
      log.warn('Concurrent ride request prevented', { event: 'concurrent_ride_request', component: 'rideSlice' });
      return {
        success: false,
        error: createRideError(
          RideErrorType.CONCURRENT_RIDE_REQUEST,
          'Concurrent ride request prevented',
          'A ride request is already in progress. Please wait for it to complete.',
          false
        )
      };
    }
    
    if (currentState.currentRide && currentState.currentRide.status !== 'completed') {
      const error = createRideError(
        RideErrorType.ACTIVE_RIDE_EXISTS,
        'Active ride exists',
        'You already have an active ride. Please complete or cancel the current ride before booking a new one.',
        false
      );
      set({ rideError: error.userMessage, isLoadingRide: false, currentRide: null });
      return { success: false, error };
    }
    
    set({ isLoadingRide: true, rideError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      if (!pickup || !dropoff || !rideOptionId) {
        const error = createRideError(
          RideErrorType.MISSING_REQUIRED_FIELDS,
          'Missing required information for ride booking',
          'Please provide all required information: pickup location, destination, and ride option.',
          false
        );
        set({ rideError: error.userMessage, isLoadingRide: false, currentRide: null });
        return { success: false, error };
      }
      
      if (!pickup.lat || !pickup.lon || !dropoff.lat || !dropoff.lon) {
        const error = createRideError(
          RideErrorType.INVALID_LOCATION,
          'Invalid pickup or dropoff location coordinates',
          'Invalid pickup or dropoff location. Please select valid locations on the map.',
          false
        );
        set({ rideError: error.userMessage, isLoadingRide: false, currentRide: null });
        return { success: false, error };
      }
      
      const response = await rideService.bookRide(
        pickup,
        dropoff,
        rideOptionId,
        notes
      );
      
      if (response.success && response.data) {
        // Adapt RideRequest to ActiveRide format
        const rideData = response.data;
        const activeRide: ActiveRide = {
          ...rideData,
          pickup: { address: pickup.address || 'Pickup Location' },
          destination: { address: dropoff.address || 'Destination' },
          duration: Math.round((rideData.estimatedDuration || 0) / 60),
          price: rideData.estimatedPrice || 0,
          fare: {
            total: rideData.estimatedPrice || 0,
            base: (rideData.estimatedPrice || 0) * 0.6,
            distance: (rideData.estimatedPrice || 0) * 0.25,
            time: (rideData.estimatedPrice || 0) * 0.15,
          },
        };
        set({ currentRide: activeRide, isLoadingRide: false });
        return { success: true, rideId: activeRide.id };
      } else {
        const error = createRideError(
          RideErrorType.BOOKING_FAILED,
          response.error || 'Failed to book ride',
          response.error || 'Unable to complete your booking. Please try again.',
          true
        );
        set({ rideError: error.userMessage, isLoadingRide: false });
        return { success: false, error };
      }
    } catch (error) {
      log.error('Book ride error', { event: 'book_ride_failed', component: 'rideSlice' }, error);
      const rideError = createRideError(
        RideErrorType.NETWORK_ERROR,
        'Network error during booking',
        'Unable to complete your booking due to a network error. Please check your connection and try again.',
        true
      );
      set({ rideError: rideError.userMessage, isLoadingRide: false });
      return { success: false, error: rideError };
    }
  },

  cancelRide: async (rideId, reason) => {
    try {
      // PRODUCTION: Always use real API
      await rideService.cancelRide(rideId, reason);
      set({ currentRide: null });
      return true;
    } catch (error) {
      log.error('Cancel ride error', { event: 'cancel_ride_failed', component: 'rideSlice' }, error);
      return false;
    }
  },

  fetchRideHistory: async (_userId) => {
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await rideService.getRideHistory();

      if (response.success && response.data) {
        const history = response.data as unknown as RideHistory[];
        set({ rideHistory: history });
      }
    } catch (error) {
      log.error('Fetch ride history error', { event: 'fetch_ride_history_failed', component: 'rideSlice' }, error);
    }
  },

  getActiveRide: async () => {
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await rideService.getActiveRide();
      
      if (response.success && response.data) {
        set({ currentRide: response.data });
      } else {
        set({ currentRide: null });
      }
    } catch (error) {
      log.error('Get active ride error', { event: 'get_active_ride_failed', component: 'rideSlice' }, error);
      set({ currentRide: null });
    }
  },

  getRideEstimate: async (pickup, dropoff, rideOptionIds) => {
    set({ isLoadingEstimate: true, estimateError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await rideService.getRideEstimate(pickup, dropoff, rideOptionIds, undefined, undefined, 1, false);
      
      if (response.success && response.data) {
        let priceEstimate: PriceEstimate | null = null;
        
        if (response.data.rideOptions && Array.isArray(response.data.rideOptions) && response.data.rideOptions.length > 0) {
          const firstRideOption = response.data.rideOptions[0];
          if (firstRideOption.pricingBreakdown) {
            priceEstimate = firstRideOption.pricingBreakdown as PriceEstimate;
          }
        } else {
          priceEstimate = response.data as unknown as PriceEstimate;
        }
        
        set({ 
          currentEstimate: priceEstimate, 
          surgeInfo: response.data.surgeInfo ? {
            isActive: response.data.surgeInfo.isActive || false,
            multiplier: response.data.surgeInfo.multiplier || 1.0,
            reason: response.data.surgeInfo.reason || 'Normal demand',
            area: response.data.surgeInfo.area || { lat: 0, lon: 0, radius: 1000 },
            estimatedWaitTime: response.data.surgeInfo.estimatedWaitTime || 5,
          } : null,
          isLoadingEstimate: false 
        });
        return true;
      } else {
        set({ estimateError: response.error || 'Failed to get ride estimate', isLoadingEstimate: false });
        return false;
      }
    } catch {
      set({ estimateError: 'Network error occurred', isLoadingEstimate: false });
      return false;
    }
  },
});

export type { RideOption, ActiveRide, RideHistory, PriceEstimate, SurgeInfo };
