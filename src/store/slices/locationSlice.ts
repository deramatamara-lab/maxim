/**
 * Location Store Slice
 * Handles current location, routing, and location services
 */

import { StateCreator } from 'zustand';
import { log } from '../../utils/logger';
import { locationService } from '../../api/location';
import { routingService, type Route } from '../../api/routing';
import { type Location } from '../../api/rides';

// PRODUCTION: NO MOCKS - All API calls are real

export interface LocationSlice {
  // State
  currentLocation: Location | null;
  destination: string;
  isSearching: boolean;
  errorMsg: string | null;
  currentRoute: Route | null;
  isLoadingRoute: boolean;
  routeError: string | null;
  
  // Actions
  setCurrentLocation: (location: Location | null) => void;
  getCurrentLocation: () => Promise<boolean>;
  setDestination: (destination: string) => void;
  setIsSearching: (searching: boolean) => void;
  setErrorMsg: (msg: string | null) => void;
  getRoute: (origin: Location, destination: Location) => Promise<boolean>;
  clearRoute: () => void;
}

export const createLocationSlice: StateCreator<LocationSlice, [], [], LocationSlice> = (set) => ({
  // Initial State
  currentLocation: null,
  destination: '',
  isSearching: false,
  errorMsg: null,
  currentRoute: null,
  isLoadingRoute: false,
  routeError: null,

  setCurrentLocation: (location) => set({ currentLocation: location }),
  setDestination: (destination) => set({ destination }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setErrorMsg: (msg) => set({ errorMsg: msg }),
  clearRoute: () => set({ currentRoute: null, routeError: null }),

  getCurrentLocation: async () => {
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await locationService.getCurrentLocation();
      
      if (response.success && response.data) {
        set({ currentLocation: response.data });
        return true;
      }
      return false;
    } catch (error) {
      log.error('Get location error', { event: 'get_location_failed', component: 'locationSlice' }, error);
      return false;
    }
  },

  getRoute: async (origin: Location, destination: Location) => {
    set({ isLoadingRoute: true, routeError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await routingService.calculateRoute({
        origin,
        destination,
        alternatives: false,
        avoid: { tolls: false, highways: false, ferries: false },
        vehicleType: 'car',
        optimize: 'time',
      });
      
      if (response.success && response.data && response.data.length > 0) {
        set({ currentRoute: response.data[0], isLoadingRoute: false });
        return true;
      } else {
        set({ routeError: response.error || 'Failed to calculate route', isLoadingRoute: false });
        return false;
      }
    } catch {
      set({ routeError: 'Network error occurred', isLoadingRoute: false });
      return false;
    }
  },
});

export type { Location, Route };
