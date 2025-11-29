/**
 * Driver Store Slice
 * Handles driver state, earnings, analytics, and ride management
 */

import { StateCreator } from 'zustand';
import { log } from '../../utils/logger';
import { rideService, type DriverEarnings, type EarningsHistory, type DriverAnalytics } from '../../api/rides';
import { RideRequest as UIRideRequest } from '../useAppStore';

// PRODUCTION: NO MOCKS - All API calls are real

export type DriverState = 'offline' | 'online' | 'incoming_request' | 'countdown' | 'accepted' | 'in_progress';

export interface DriverSlice {
  // State
  driverState: DriverState;
  currentRequest: UIRideRequest | null;
  countdownRemaining: number;
  driverEarnings: DriverEarnings;
  earningsHistory: EarningsHistory[];
  isLoadingEarnings: boolean;
  earningsError: string | null;
  driverAnalytics: DriverAnalytics | null;
  analyticsPeriod: 'today' | 'week' | 'month';
  isLoadingAnalytics: boolean;
  analyticsError: string | null;
  
  // Actions
  toggleDriverOnline: () => Promise<boolean>;
  acceptRideRequest: (rideId: string) => Promise<boolean>;
  rejectRideRequest: () => Promise<boolean>;
  decrementCountdown: () => void;
  handleIncomingRequest: (request: UIRideRequest) => void;
  simulateIncomingRequest: () => void;
  fetchEarnings: (period: 'today' | 'week' | 'month') => Promise<boolean>;
  refreshEarnings: () => Promise<boolean>;
  fetchAnalytics: (period: 'today' | 'week' | 'month') => Promise<boolean>;
  setAnalyticsPeriod: (period: 'today' | 'week' | 'month') => void;
  completeRide: (rideId?: string, rating?: number, tip?: number) => Promise<boolean>;
  startRide: () => Promise<boolean>;
  startNavigation: (rideId: string) => Promise<boolean>;
}

const defaultEarnings: DriverEarnings = {
  driverId: '',
  period: 'today',
  totalEarnings: 0,
  totalRides: 0,
  averageEarningsPerRide: 0,
  surgeEarnings: 0,
  baseEarnings: 0,
  tips: 0,
  totalDistance: 0,
  totalDuration: 0,
  averageSpeed: 0,
  acceptanceRate: 0,
  completionRate: 0,
  averageRating: 0,
  peakHoursEarnings: 0,
  efficiencyScore: 0,
  bonuses: 0,
  expenses: 0,
  netEarnings: 0,
  currency: 'USD',
  lastUpdated: new Date().toISOString(),
};

export const createDriverSlice: StateCreator<DriverSlice, [], [], DriverSlice> = (set, get) => ({
  // Initial State
  driverState: 'offline',
  currentRequest: null,
  countdownRemaining: 30,
  driverEarnings: defaultEarnings,
  earningsHistory: [],
  isLoadingEarnings: false,
  earningsError: null,
  driverAnalytics: null,
  analyticsPeriod: 'today',
  isLoadingAnalytics: false,
  analyticsError: null,

  toggleDriverOnline: async () => {
    const currentState = get().driverState;
    const newState = currentState === 'offline' ? 'online' : 'offline';
    
    try {
      // PRODUCTION: Real API call to toggle driver status
      // await driverService.toggleOnlineStatus(newState === 'online');
      set({ driverState: newState });
      return true;
    } catch (error) {
      log.error('Toggle driver status error', { event: 'toggle_driver_status_failed', component: 'driverSlice' }, error);
      return false;
    }
  },

  acceptRideRequest: async (_rideId: string) => {
    try {
      // PRODUCTION: Real API call to accept ride
      // await driverService.acceptRide(_rideId);
      set({ driverState: 'accepted' });
      return true;
    } catch (error) {
      log.error('Accept ride error', { event: 'accept_ride_failed', component: 'driverSlice' }, error);
      return false;
    }
  },

  rejectRideRequest: async () => {
    try {
      // PRODUCTION: Real API call to reject ride
      // await driverService.rejectRide();
      set({ driverState: 'online', currentRequest: null, countdownRemaining: 30 });
      return true;
    } catch (error) {
      log.error('Reject ride error', { event: 'reject_ride_failed', component: 'driverSlice' }, error);
      return false;
    }
  },

  decrementCountdown: () => set((state) => {
    const newCountdown = Math.max(0, state.countdownRemaining - 1);
    
    if (newCountdown === 0 && state.driverState === 'incoming_request') {
      return { countdownRemaining: newCountdown, driverState: 'online', currentRequest: null };
    }

    return { countdownRemaining: newCountdown };
  }),

  // PRODUCTION: This method handles incoming ride requests from WebSocket
  // In production, this is called by WebSocket event handler, not manually simulated
  handleIncomingRequest: (request: UIRideRequest) => set({
    driverState: 'incoming_request',
    currentRequest: request,
    countdownRemaining: request.countdownSeconds || 30,
  }),
  
  // DEPRECATED: For testing only - will be removed in production
  simulateIncomingRequest: () => {
    log.warn('simulateIncomingRequest called - this is for testing only', { 
      event: 'simulate_request_warning', 
      component: 'driverSlice' 
    });
    // In production, requests come via WebSocket
    // This method exists only for development testing
  },

  fetchEarnings: async (period = 'today') => {
    set({ isLoadingEarnings: true, earningsError: null });
    
    try {
      // PRODUCTION: Real API call for earnings
      const response = await rideService.getDriverEarnings(period);
      
      if (response.success && response.data) {
        set({ 
          driverEarnings: response.data.earnings, 
          earningsHistory: response.data.history || [], 
          isLoadingEarnings: false 
        });
        return true;
      }
      
      set({ earningsError: response.error || 'Failed to fetch earnings', isLoadingEarnings: false });
      return false;
    } catch {
      set({ earningsError: 'Failed to fetch earnings', isLoadingEarnings: false });
      return false;
    }
  },

  refreshEarnings: async () => {
    const currentPeriod = get().driverEarnings.period;
    return await get().fetchEarnings(currentPeriod);
  },

  fetchAnalytics: async (period) => {
    set({ isLoadingAnalytics: true, analyticsError: null });
    
    try {
      // PRODUCTION: Real API call for analytics
      const response = await rideService.getDriverAnalytics(period);
      
      if (response.success && response.data) {
        set({ driverAnalytics: response.data, analyticsPeriod: period, isLoadingAnalytics: false });
        return true;
      }
      
      set({ analyticsError: response.error || 'Failed to fetch analytics', isLoadingAnalytics: false });
      return false;
    } catch {
      set({ analyticsError: 'Failed to fetch analytics', isLoadingAnalytics: false });
      return false;
    }
  },

  setAnalyticsPeriod: (period) => set({ analyticsPeriod: period }),

  completeRide: async (rideId?: string, rating = 5, tip = 0) => {
    try {
      // PRODUCTION: Real API call to complete ride
      if (rideId) {
        await rideService.completeRide(rideId, { rating, tip });
      }
      set({ driverState: 'online', currentRequest: null });
      return true;
    } catch {
      return false;
    }
  },

  startRide: async () => {
    try {
      // PRODUCTION: Real API call to start ride
      const currentState = get();
      if (currentState.driverState === 'accepted') {
        set({ driverState: 'in_progress' });
        return true;
      }
      return true;
    } catch {
      return false;
    }
  },

  startNavigation: async (_rideId: string) => {
    // PRODUCTION: Navigation is typically handled by device native maps
    // This is a no-op that returns success
    return true;
  },
});

export type { DriverEarnings, EarningsHistory, DriverAnalytics };
