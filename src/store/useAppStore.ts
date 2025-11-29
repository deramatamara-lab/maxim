import { create } from 'zustand/index.js';
import { User } from '../types/user';

// Types
export type TabId = 'home' | 'activity' | 'location' | 'profile';
export type AppState = 'idle' | 'searching' | 'zooming' | 'map' | 'selection';
export type DriverState = 'offline' | 'online' | 'incoming_request' | 'countdown' | 'accepted';

export interface Location {
  lat: number;
  lon: number;
  address?: string;
}

export interface RideOption {
  id: string;
  name: string;
  time: string;
  price: string;
  icon: string;
}

export interface RideRequest {
  id: string;
  riderName: string;
  riderAvatar?: string;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedPrice: string;
  estimatedTime: string;
  distance: string;
  countdownSeconds: number;
}

// Store Interface
export interface AppStore {
  // Navigation State
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  
  // User Profile
  user: User | null;
  setUser: (user: User | null) => void;
  
  // App State Flow
  appState: AppState;
  setAppState: (state: AppState) => void;
  
  // Search & Location
  destination: string;
  setDestination: (destination: string) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  currentLocation: Location | null;
  setCurrentLocation: (location: Location | null) => void;
  targetLocation: Location | null;
  setTargetLocation: (location: Location | null) => void;
  
  // Error Handling
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
  
  // Map State
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  
  // Ride Selection
  selectedRide: RideOption | null;
  setSelectedRide: (ride: RideOption | null) => void;
  rideOptions: RideOption[];
  setRideOptions: (options: RideOption[]) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Driver Flow State
  driverState: DriverState;
  setDriverState: (state: DriverState) => void;
  currentRequest: RideRequest | null;
  setCurrentRequest: (request: RideRequest | null) => void;
  countdownRemaining: number;
  setCountdownRemaining: (seconds: number) => void;
  
  // Actions
  resetSearch: () => void;
  startSearch: (destination: string) => void;
  completeSearch: (location: Location) => void;
  
  // Driver Actions
  toggleDriverOnline: () => void;
  acceptRideRequest: () => void;
  rejectRideRequest: () => void;
  simulateIncomingRequest: () => void;
  decrementCountdown: () => void;
}

// Create Store
export const useAppStore = create<AppStore>()(
  (set, _get) => ({
      // Navigation State
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      // User Profile
      user: {
        id: '1',
        name: 'Tony Stark',
        email: 'tony@starkindustries.com',
        avatar: undefined,
        phone: '+1-555-STARK',
        isDriver: false,
        isVerified: true,
        role: 'rider',
        kycStatus: 'not_started',
        kycDocuments: [],
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User,
      setUser: (user) => set({ user }),
      
      // App State Flow
      appState: 'idle',
      setAppState: (state) => set({ appState: state }),
      
      // Search & Location
      destination: '',
      setDestination: (destination) => set({ destination }),
      isSearching: false,
      setIsSearching: (searching) => set({ isSearching: searching }),
      currentLocation: null,
      setCurrentLocation: (location) => set({ currentLocation: location }),
      targetLocation: null,
      setTargetLocation: (location) => set({ targetLocation: location }),
      
      // Error Handling
      errorMsg: null,
      setErrorMsg: (msg) => set({ errorMsg: msg }),
      
      // Map State
      showMap: false,
      setShowMap: (show) => set({ showMap: show }),
      
      // Ride Selection
      selectedRide: null,
      setSelectedRide: (ride) => set({ selectedRide: ride }),
      rideOptions: [],
      setRideOptions: (options) => set({ rideOptions: options }),
      
      // UI State
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Driver Flow State
      driverState: 'offline',
      setDriverState: (state) => set({ driverState: state }),
      currentRequest: null,
      setCurrentRequest: (request) => set({ currentRequest: request }),
      countdownRemaining: 30,
      setCountdownRemaining: (seconds) => set({ countdownRemaining: seconds }),
      
      // Actions
      resetSearch: () => set({
        destination: '',
        isSearching: false,
        errorMsg: null,
        appState: 'idle',
        targetLocation: null,
        showMap: false,
        selectedRide: null,
        rideOptions: [],
      }),
      
      startSearch: (destination) => set({
        destination,
        isSearching: true,
        errorMsg: null,
        appState: 'searching',
        isLoading: true,
      }),
      
      completeSearch: (location) => set({
        targetLocation: location,
        isSearching: false,
        appState: 'zooming',
        isLoading: false,
      }),
      
      // Driver Actions
      toggleDriverOnline: () => set((state: AppStore) => ({
        driverState: state.driverState === 'offline' ? 'online' : 'offline',
      })),
      
      acceptRideRequest: () => set({
        driverState: 'accepted',
        countdownRemaining: 0,
      }),
      
      rejectRideRequest: () => set({
        driverState: 'online',
        currentRequest: null,
        countdownRemaining: 30,
      }),
      
      simulateIncomingRequest: () => set({
        driverState: 'incoming_request',
        currentRequest: {
          id: 'req-1',
          riderName: 'Peter Parker',
          pickupAddress: '123 Main Street, Sofia',
          dropoffAddress: 'Vitosha Mountain Resort',
          estimatedPrice: '24.50 BGN',
          estimatedTime: '18 min',
          distance: '12.3 km',
          countdownSeconds: 30,
        },
        countdownRemaining: 30,
      }),
      
      decrementCountdown: () => set((state: AppStore) => ({
        countdownRemaining: Math.max(0, state.countdownRemaining - 1),
      })),
    })
);

// Selectors for optimized re-renders
export const useNavigationState = () => useAppStore((state) => ({
  activeTab: state.activeTab,
  setActiveTab: state.setActiveTab,
}));

export const useSearchState = () => useAppStore((state) => ({
  destination: state.destination,
  setDestination: state.setDestination,
  isSearching: state.isSearching,
  setIsSearching: state.setIsSearching,
  errorMsg: state.errorMsg,
  setErrorMsg: state.setErrorMsg,
}));

export const useLocationState = () => useAppStore((state) => ({
  currentLocation: state.currentLocation,
  setCurrentLocation: state.setCurrentLocation,
  targetLocation: state.targetLocation,
  setTargetLocation: state.setTargetLocation,
}));

export const useMapState = () => useAppStore((state) => ({
  showMap: state.showMap,
  setShowMap: state.setShowMap,
  appState: state.appState,
  setAppState: state.setAppState,
}));

export const useRideState = () => useAppStore((state) => ({
  selectedRide: state.selectedRide,
  setSelectedRide: state.setSelectedRide,
  rideOptions: state.rideOptions,
  setRideOptions: state.setRideOptions,
}));

export const useDriverState = () => useAppStore((state) => ({
  driverState: state.driverState,
  setDriverState: state.setDriverState,
  currentRequest: state.currentRequest,
  setCurrentRequest: state.setCurrentRequest,
  countdownRemaining: state.countdownRemaining,
  setCountdownRemaining: state.setCountdownRemaining,
  decrementCountdown: state.decrementCountdown,
  toggleDriverOnline: state.toggleDriverOnline,
  acceptRideRequest: state.acceptRideRequest,
  rejectRideRequest: state.rejectRideRequest,
  simulateIncomingRequest: state.simulateIncomingRequest,
}));
