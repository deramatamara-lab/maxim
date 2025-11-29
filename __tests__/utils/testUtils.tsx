/**
 * Comprehensive Test Utilities for Enhanced Ride-Hailing Application
 * Provides mocks, helpers, and test data factories for unit, integration, and E2E tests
 */

import { act, render, RenderOptions } from '@testing-library/react-native';
import React, { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import mock data factories
import {
  createMockDriver,
  createMockVehicle,
  createMockPaymentMethod,
  createMockLocation,
  createMockRideHistory,
  createMockActiveRide,
  generateMockRideHistory,
  getMockDrivers,
  getMockVehicles,
  getMockPaymentMethods,
  getMockLocations,
} from '@/store/mockDataFactory';

// Import types
import { User as AuthUser } from '@/api/auth';
import { Location, RideOption, ActiveRide } from '@/api/rides';
import { PaymentMethodInfo } from '@/api/payment';
import { PriceEstimate, SurgeInfo } from '@/api/pricing';
import { Route } from '@/api/routing';

// Mock API services
export const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  updateProfile: jest.fn(),
};

export const mockRideService = {
  getRideOptions: jest.fn(),
  getRideEstimate: jest.fn(),
  bookRide: jest.fn(),
  cancelRide: jest.fn(),
  getRideHistory: jest.fn(),
  getActiveRide: jest.fn(),
  getRideDetails: jest.fn(),
  getRideReceipt: jest.fn(),
  completeRidePayment: jest.fn(),
  addRideTip: jest.fn(),
  scheduleRide: jest.fn(),
  getAvailableRideOptions: jest.fn(),
  updateRideTracking: jest.fn(),
};

export const mockPaymentService = {
  getPaymentMethods: jest.fn(),
  addPaymentMethod: jest.fn(),
  updatePaymentMethod: jest.fn(),
  deletePaymentMethod: jest.fn(),
  setDefaultPaymentMethod: jest.fn(),
  validatePayment: jest.fn(),
  processPayment: jest.fn(),
  downloadReceipt: jest.fn(),
  addTip: jest.fn(),
};

export const mockPricingService = {
  getPriceEstimate: jest.fn(),
  getSurgeInfo: jest.fn(),
  calculateDynamicPricing: jest.fn(),
};

export const mockRoutingService = {
  calculateRoute: jest.fn(),
  updateETA: jest.fn(),
  getRouteAlternatives: jest.fn(),
};

export const mockLocationService = {
  getCurrentLocation: jest.fn(),
  geocodeAddress: jest.fn(),
  reverseGeocode: jest.fn(),
};

// Mock API client
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  setAuthToken: jest.fn(),
  clearAuthToken: jest.fn(),
};

// Mock AsyncStorage
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
};

// Test data factories
export const createMockUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  phone: '+1-555-0101',
  isDriver: false,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockRideOption = (overrides: Partial<RideOption> = {}): RideOption => ({
  id: 'lux',
  name: 'Aura Lux',
  description: 'BMW i7 · Private · 2 pax',
  basePrice: 12.00,
  pricePerKm: 2.50,
  capacity: 2,
  estimatedTime: '2 min',
  icon: 'car-sports',
  features: ['2 seats', 'Luxury vehicles', 'Professional drivers', 'Premium amenities'],
  vehicleType: 'luxury',
  ...overrides,
});

export const createMockPriceEstimate = (overrides: Partial<PriceEstimate> = {}): PriceEstimate => ({
  rideOptionId: 'lux',
  basePrice: 12.00,
  distancePrice: 8.50,
  timePrice: 5.00,
  surgePrice: 0.00,
  serviceFee: 2.00,
  totalPrice: 27.50,
  currency: 'USD',
  estimatedDuration: 1200,
  distance: 8500,
  surgeMultiplier: 1.0,
  ...overrides,
});

export const createMockSurgeInfo = (overrides: Partial<SurgeInfo> = {}): SurgeInfo => ({
  isActive: true,
  multiplier: 2.0,
  reason: 'High demand in downtown area',
  area: { lat: 40.7128, lon: -74.006, radius: 1000 },
  estimatedWaitTime: 8,
  ...overrides,
});

export const createMockRoute = (overrides: Partial<Route> = {}): Route => ({
  id: 'route-1',
  distance: 8500,
  duration: 1200,
  geometry: 'encoded_polyline_string',
  segments: [],
  waypoints: [
    { lat: 40.7128, lon: -74.006, type: 'pickup' },
    { lat: 40.7589, lon: -73.9851, type: 'dropoff' },
  ],
  trafficCondition: 'moderate',
  ...overrides,
});

// Mock response helpers
export const createMockSuccessResponse = <T,>(data: T) => ({
  success: true as const,
  data,
  error: null,
});

export const createMockErrorResponse = (error: string) => ({
  success: false as const,
  data: null,
  error,
});

// Test wrapper for React Query
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  queryClient = createTestQueryClient() 
}) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) => {
  const { queryClient, ...renderOptions } = options || {};
  return render(ui, { 
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
    ), 
    ...renderOptions 
  });
};

// Test helpers
export const waitForAsync = () => act(async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
});

export const mockAsyncStorageSetup = async (data: Record<string, string>) => {
  mockAsyncStorage.getItem.mockImplementation((key) => 
    Promise.resolve(data[key] || null)
  );
  mockAsyncStorage.setItem.mockImplementation((key, value) => 
    Promise.resolve()
  );
  mockAsyncStorage.removeItem.mockImplementation((key) => 
    Promise.resolve()
  );
};

export const resetAllMocks = () => {
  jest.clearAllMocks();
  
  // Reset API service mocks
  Object.values(mockAuthService).forEach(mock => mock.mockReset());
  Object.values(mockRideService).forEach(mock => mock.mockReset());
  Object.values(mockPaymentService).forEach(mock => mock.mockReset());
  Object.values(mockPricingService).forEach(mock => mock.mockReset());
  Object.values(mockRoutingService).forEach(mock => mock.mockReset());
  Object.values(mockLocationService).forEach(mock => mock.mockReset());
  Object.values(mockApiClient).forEach(mock => mock.mockReset());
  Object.values(mockAsyncStorage).forEach(mock => mock.mockReset());
};

// Setup default mock implementations
export const setupDefaultMocks = () => {
  // Import the actual Jest-mocked services
  const { authService } = require('@/api/auth');
  const { rideService } = require('@/api/rides');
  const { paymentService } = require('@/api/payment');
  const { pricingService } = require('@/api/pricing');
  const { routingService } = require('@/api/routing');
  const { locationService } = require('@/api/location');
  
  // Auth service defaults
  authService.login.mockResolvedValue(createMockSuccessResponse({
    user: createMockUser(),
    token: 'mock-token',
    refreshToken: 'mock-refresh-token',
  }));
  
  authService.register.mockResolvedValue(createMockSuccessResponse({
    user: createMockUser(),
    token: 'mock-token',
    refreshToken: 'mock-refresh-token',
  }));
  
  authService.updateProfile.mockImplementation((userData: Partial<AuthUser>) =>
    Promise.resolve(
      createMockSuccessResponse({
        ...createMockUser(),
        ...userData,
      })
    )
  );
  
  // Ride service defaults
  rideService.getRideOptions.mockResolvedValue(createMockSuccessResponse([
    createMockRideOption(),
    createMockRideOption({ id: 'pulse', name: 'Aura Pulse' }),
    createMockRideOption({ id: 'share', name: 'Aura Share' }),
  ]));

  // Book ride default: propagate requested rideOptionId/notes into the created ActiveRide
  rideService.bookRide.mockImplementation((
    pickup: Location,
    dropoff: Location,
    rideOptionId: string,
    notes?: string,
  ) => {
    const active = createMockActiveRide(
      pickup,
      dropoff,
      rideOptionId,
      'user-1',
      notes || 'Test ride'
    );
    return Promise.resolve(createMockSuccessResponse(active));
  });

  // Ride estimate defaults (used by store.getRideEstimate)
  const basePriceEstimate = createMockPriceEstimate();
  const baseRoute = createMockRoute();
  const baseSurge = createMockSurgeInfo();

  rideService.getRideEstimate.mockResolvedValue(
    createMockSuccessResponse({
      rideOptions: [
        {
          rideOption: createMockRideOption(),
          estimatedPrice: basePriceEstimate.totalPrice,
          estimatedDuration: basePriceEstimate.estimatedDuration,
          distance: basePriceEstimate.distance,
          surgeMultiplier: baseSurge.multiplier,
          pricingBreakdown: basePriceEstimate,
          routeInfo: baseRoute,
        },
      ],
      route: {
        distance: baseRoute.distance,
        duration: baseRoute.duration,
        geometry: baseRoute.geometry,
        alternatives: [],
      },
      surgeInfo: baseSurge,
      demandLevel: 'high',
    })
  );
  
  rideService.getRideHistory.mockResolvedValue(createMockSuccessResponse(
    generateMockRideHistory('user-1', 5)
  ));
  
  rideService.getActiveRide.mockResolvedValue(createMockSuccessResponse(null));
  
  rideService.cancelRide.mockResolvedValue(createMockSuccessResponse({
    id: 'ride-123',
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  }));
  
  // Payment service defaults
  paymentService.getPaymentMethods.mockResolvedValue(createMockSuccessResponse([
    createMockPaymentMethod(),
    createMockPaymentMethod(1),
  ]));
  
  paymentService.addPaymentMethod.mockResolvedValue(createMockSuccessResponse(
    createMockPaymentMethod(2)
  ));
  
  paymentService.updatePaymentMethod.mockResolvedValue(createMockSuccessResponse(
    createMockPaymentMethod(0)
  ));
  
  paymentService.deletePaymentMethod.mockResolvedValue(createMockSuccessResponse({ deleted: true }));
  
  paymentService.setDefaultPaymentMethod.mockResolvedValue(createMockSuccessResponse({ success: true }));
  
  // Pricing service defaults
  pricingService.getPriceEstimate.mockResolvedValue(createMockSuccessResponse([
    createMockPriceEstimate(),
  ]));
  
  // Routing service defaults
  routingService.calculateRoute.mockResolvedValue(createMockSuccessResponse([
    createMockRoute(),
  ]));
  
  // Location service defaults
  locationService.getCurrentLocation.mockResolvedValue(createMockSuccessResponse(
    createMockLocation(0)
  ));
};

// E2E test scenario builders
export const createRideBookingScenario = {
  user: createMockUser(),
  pickup: createMockLocation(0),
  destination: createMockLocation(1),
  rideOption: createMockRideOption(),
  paymentMethod: createMockPaymentMethod(),
  priceEstimate: createMockPriceEstimate(),
  route: createMockRoute(),
  activeRide: createMockActiveRide(
    createMockLocation(0),
    createMockLocation(1),
    'lux',
    'user-1',
    'Test ride'
  ),
};

export const createDriverFlowScenario = {
  driver: createMockDriver(),
  incomingRequest: {
    id: 'req-1',
    riderName: 'Jane Smith',
    riderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    pickupAddress: '123 Main Street, Sofia',
    dropoffAddress: 'Vitosha Mountain Resort',
    estimatedPrice: '24.50 BGN',
    estimatedTime: '18 min',
    distance: '12.3 km',
    countdownSeconds: 30,
  },
};

// Re-export everything for convenience
export * from '@/store/mockDataFactory';
export { createMockLocation, createMockActiveRide, createMockPaymentMethod };
export { customRender as render };
export { act };

// Additional utility exports
export const sleep = (ms: number = 0): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
