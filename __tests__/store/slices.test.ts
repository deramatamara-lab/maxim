/**
 * Store Slices Tests
 * Tests for domain-specific Zustand store slices
 */

import { createAuthSlice, AuthSlice } from '../../src/store/slices/authSlice';
import { createPaymentSlice, PaymentSlice } from '../../src/store/slices/paymentSlice';
import { createDriverSlice, DriverSlice } from '../../src/store/slices/driverSlice';
import { createLocationSlice, LocationSlice } from '../../src/store/slices/locationSlice';
import { createRideSlice, RideSlice } from '../../src/store/slices/rideSlice';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock API services
jest.mock('@/api/auth', () => ({
  authService: {
    login: jest.fn().mockResolvedValue({ success: true, data: { user: { id: '1', name: 'Test' } } }),
    register: jest.fn().mockResolvedValue({ success: true, data: { user: { id: '1', name: 'Test' } } }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    refreshToken: jest.fn().mockResolvedValue({ success: true }),
    updateProfile: jest.fn().mockResolvedValue({ success: true, data: { id: '1', name: 'Updated' } }),
  },
}));

jest.mock('@/api/PaymentServiceFactory', () => ({
  paymentService: {
    getPaymentMethods: jest.fn().mockResolvedValue({ 
      success: true, 
      data: [
        { id: 'card-1', type: 'credit_card', isDefault: true, isVerified: true, addedAt: new Date().toISOString(), last4: '4242', brand: 'visa' },
      ]
    }),
    addPaymentMethod: jest.fn().mockResolvedValue({ success: true, data: { id: 'new-card', type: 'credit_card', isDefault: false, isVerified: true, addedAt: new Date().toISOString() } }),
    updatePaymentMethod: jest.fn().mockResolvedValue({ success: true, data: { id: 'card-1', type: 'credit_card', isDefault: true, isVerified: true, addedAt: new Date().toISOString() } }),
    deletePaymentMethod: jest.fn().mockResolvedValue({ success: true }),
    setDefaultPaymentMethod: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('@/api/rides', () => ({
  rideService: {
    getRideOptions: jest.fn().mockResolvedValue({ 
      success: true, 
      data: [
        { id: 'lux', name: 'Aura Lux', basePrice: 12, pricePerKm: 2.5, capacity: 4, estimatedTime: '2 min', features: [] },
        { id: 'pulse', name: 'Aura Pulse', basePrice: 8, pricePerKm: 1.8, capacity: 4, estimatedTime: '3 min', features: [] },
      ]
    }),
    bookRide: jest.fn().mockResolvedValue({ success: true, data: { id: 'ride-1', status: 'confirmed' } }),
    cancelRide: jest.fn().mockResolvedValue({ success: true }),
    getRideHistory: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getActiveRide: jest.fn().mockResolvedValue({ success: true, data: null }),
    getRideEstimate: jest.fn().mockResolvedValue({ success: true, data: { rideOptions: [] } }),
    getDriverEarnings: jest.fn().mockResolvedValue({ success: true, data: { earnings: {}, history: [] } }),
    getDriverAnalytics: jest.fn().mockResolvedValue({ success: true, data: {} }),
    completeRide: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('@/api/location', () => ({
  locationService: {
    getCurrentLocation: jest.fn().mockResolvedValue({ success: true, data: { lat: 0, lon: 0 } }),
  },
}));

jest.mock('@/api/routing', () => ({
  routingService: {
    calculateRoute: jest.fn().mockResolvedValue({ success: true, data: [{ id: 'route-1' }] }),
  },
}));

jest.mock('@/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/utils/secureStorage', () => ({
  secureStorage: {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(undefined),
  },
  StorageKey: {
    USER_DATA: 'userData',
  },
}));

jest.mock('@/api/client', () => ({
  apiClient: {
    setAuthToken: jest.fn().mockResolvedValue(undefined),
    clearAuthToken: jest.fn().mockResolvedValue(undefined),
  },
}));

// Helper to create a mock store state updater
const createMockSetGet = <T>(initialState: T) => {
  let state = initialState;
  const set = (partial: Partial<T> | ((s: T) => Partial<T>)) => {
    const update = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...update };
  };
  const get = () => state;
  return { set, get, getState: () => state };
};

describe('AuthSlice', () => {
  let slice: AuthSlice;
  let mockStore: ReturnType<typeof createMockSetGet<AuthSlice>>;

  beforeEach(() => {
    mockStore = createMockSetGet<AuthSlice>({} as AuthSlice);
    slice = createAuthSlice(
      mockStore.set as any,
      mockStore.get as any,
      {} as any
    );
    Object.assign(mockStore.getState(), slice);
  });

  it('initializes with correct default state', () => {
    expect(slice.user).toBeNull();
    expect(slice.isAuthenticated).toBe(false);
    expect(slice.isLoading).toBe(true);
    expect(slice.authError).toBeNull();
  });

  it('has all required actions', () => {
    expect(typeof slice.login).toBe('function');
    expect(typeof slice.register).toBe('function');
    expect(typeof slice.logout).toBe('function');
    expect(typeof slice.refreshToken).toBe('function');
    expect(typeof slice.updateProfile).toBe('function');
    expect(typeof slice.initializeAuth).toBe('function');
    expect(typeof slice.clearAuthError).toBe('function');
  });
});

describe('PaymentSlice', () => {
  let slice: PaymentSlice;
  let mockStore: ReturnType<typeof createMockSetGet<PaymentSlice>>;

  beforeEach(() => {
    mockStore = createMockSetGet<PaymentSlice>({} as PaymentSlice);
    slice = createPaymentSlice(
      mockStore.set as any,
      mockStore.get as any,
      {} as any
    );
    Object.assign(mockStore.getState(), slice);
  });

  it('initializes with correct default state', () => {
    expect(slice.paymentMethods).toEqual([]);
    expect(slice.isLoadingPaymentMethods).toBe(false);
    expect(slice.paymentError).toBeNull();
    expect(slice.selectedPaymentMethodId).toBeNull();
  });

  it('has all required actions', () => {
    expect(typeof slice.fetchPaymentMethods).toBe('function');
    expect(typeof slice.addPaymentMethod).toBe('function');
    expect(typeof slice.updatePaymentMethod).toBe('function');
    expect(typeof slice.deletePaymentMethod).toBe('function');
    expect(typeof slice.setDefaultPaymentMethod).toBe('function');
    expect(typeof slice.setSelectedPaymentMethod).toBe('function');
    expect(typeof slice.validatePaymentMethod).toBe('function');
  });

  it('setSelectedPaymentMethod updates selectedPaymentMethodId', () => {
    slice.setSelectedPaymentMethod('payment-123');
    const state = mockStore.getState();
    expect(state.selectedPaymentMethodId).toBe('payment-123');
  });
});

describe('DriverSlice', () => {
  let slice: DriverSlice;
  let mockStore: ReturnType<typeof createMockSetGet<DriverSlice>>;

  beforeEach(() => {
    mockStore = createMockSetGet<DriverSlice>({} as DriverSlice);
    slice = createDriverSlice(
      mockStore.set as any,
      mockStore.get as any,
      {} as any
    );
    Object.assign(mockStore.getState(), slice);
  });

  it('initializes with correct default state', () => {
    expect(slice.driverState).toBe('offline');
    expect(slice.currentRequest).toBeNull();
    expect(slice.countdownRemaining).toBe(30);
    expect(slice.driverAnalytics).toBeNull();
    expect(slice.analyticsPeriod).toBe('today');
  });

  it('has all required actions', () => {
    expect(typeof slice.toggleDriverOnline).toBe('function');
    expect(typeof slice.acceptRideRequest).toBe('function');
    expect(typeof slice.rejectRideRequest).toBe('function');
    expect(typeof slice.decrementCountdown).toBe('function');
    expect(typeof slice.simulateIncomingRequest).toBe('function');
    expect(typeof slice.fetchEarnings).toBe('function');
    expect(typeof slice.fetchAnalytics).toBe('function');
    expect(typeof slice.completeRide).toBe('function');
    expect(typeof slice.startRide).toBe('function');
  });

  it('decrementCountdown reduces countdown', () => {
    slice.decrementCountdown();
    const state = mockStore.getState();
    expect(state.countdownRemaining).toBe(29);
  });

  it('handleIncomingRequest sets driver state (production method)', () => {
    // In production, requests come from WebSocket via handleIncomingRequest
    const mockRequest = {
      id: 'req-1',
      riderName: 'Test Rider',
      pickupAddress: '123 Main St',
      dropoffAddress: '456 Oak Ave',
      estimatedPrice: '15.00',
      estimatedTime: '10 min',
      distance: '5 km',
      countdownSeconds: 30,
    };
    slice.handleIncomingRequest(mockRequest);
    const state = mockStore.getState();
    expect(state.driverState).toBe('incoming_request');
    expect(state.currentRequest).not.toBeNull();
    expect(state.countdownRemaining).toBe(30);
  });

  it('setAnalyticsPeriod updates period', () => {
    slice.setAnalyticsPeriod('week');
    const state = mockStore.getState();
    expect(state.analyticsPeriod).toBe('week');
  });
});

describe('LocationSlice', () => {
  let slice: LocationSlice;
  let mockStore: ReturnType<typeof createMockSetGet<LocationSlice>>;

  beforeEach(() => {
    mockStore = createMockSetGet<LocationSlice>({} as LocationSlice);
    slice = createLocationSlice(
      mockStore.set as any,
      mockStore.get as any,
      {} as any
    );
    Object.assign(mockStore.getState(), slice);
  });

  it('initializes with correct default state', () => {
    expect(slice.currentLocation).toBeNull();
    expect(slice.destination).toBe('');
    expect(slice.isSearching).toBe(false);
    expect(slice.errorMsg).toBeNull();
    expect(slice.currentRoute).toBeNull();
    expect(slice.isLoadingRoute).toBe(false);
  });

  it('has all required actions', () => {
    expect(typeof slice.setCurrentLocation).toBe('function');
    expect(typeof slice.getCurrentLocation).toBe('function');
    expect(typeof slice.setDestination).toBe('function');
    expect(typeof slice.setIsSearching).toBe('function');
    expect(typeof slice.setErrorMsg).toBe('function');
    expect(typeof slice.getRoute).toBe('function');
    expect(typeof slice.clearRoute).toBe('function');
  });

  it('setDestination updates destination', () => {
    slice.setDestination('Times Square, NYC');
    const state = mockStore.getState();
    expect(state.destination).toBe('Times Square, NYC');
  });

  it('setIsSearching updates searching state', () => {
    slice.setIsSearching(true);
    const state = mockStore.getState();
    expect(state.isSearching).toBe(true);
  });

  it('setErrorMsg updates error message', () => {
    slice.setErrorMsg('Location not found');
    const state = mockStore.getState();
    expect(state.errorMsg).toBe('Location not found');
  });

  it('clearRoute clears route state', () => {
    slice.clearRoute();
    const state = mockStore.getState();
    expect(state.currentRoute).toBeNull();
    expect(state.routeError).toBeNull();
  });
});

describe('RideSlice', () => {
  let slice: RideSlice;
  let mockStore: ReturnType<typeof createMockSetGet<RideSlice>>;

  beforeEach(() => {
    mockStore = createMockSetGet<RideSlice>({} as RideSlice);
    slice = createRideSlice(
      mockStore.set as any,
      mockStore.get as any,
      {} as any
    );
    Object.assign(mockStore.getState(), slice);
  });

  it('initializes with correct default state', () => {
    expect(slice.rideOptions).toEqual([]);
    expect(slice.selectedRideOptionId).toBeNull();
    expect(slice.isLoadingRideOptions).toBe(false);
    expect(slice.rideOptionsError).toBeNull();
    expect(slice.currentRide).toBeNull();
    expect(slice.rideHistory).toEqual([]);
    expect(slice.isLoadingRide).toBe(false);
    expect(slice.currentEstimate).toBeNull();
  });

  it('has all required actions', () => {
    expect(typeof slice.fetchRideOptions).toBe('function');
    expect(typeof slice.setSelectedRideOption).toBe('function');
    expect(typeof slice.bookRide).toBe('function');
    expect(typeof slice.cancelRide).toBe('function');
    expect(typeof slice.fetchRideHistory).toBe('function');
    expect(typeof slice.getActiveRide).toBe('function');
    expect(typeof slice.getRideEstimate).toBe('function');
    expect(typeof slice.clearCurrentRide).toBe('function');
  });

  it('setSelectedRideOption updates selected option', () => {
    slice.setSelectedRideOption('option-premium');
    const state = mockStore.getState();
    expect(state.selectedRideOptionId).toBe('option-premium');
  });

  it('clearCurrentRide clears ride state', () => {
    slice.clearCurrentRide();
    const state = mockStore.getState();
    expect(state.currentRide).toBeNull();
    expect(state.rideError).toBeNull();
  });
});
