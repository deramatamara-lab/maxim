/**
 * Test Adapters for API Contract Mismatches
 * Bridges the gaps between test expectations and actual API/store interfaces
 */

import { User } from '../../src/types/user';
import { Location, RideOption, ActiveRide } from '../../src/api/rides';
import { PaymentMethodInfo } from '../../src/api/PaymentServiceFactory';

// Complete User mock for tests
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+1234567890',
  isDriver: false,
  isVerified: true,
  role: 'rider',
  kycStatus: 'verified',
  hasCompletedOnboarding: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Card Payment Method mock
export const createMockCardPaymentMethod = (overrides: Partial<PaymentMethodInfo> = {}): PaymentMethodInfo => ({
  id: 'payment-123',
  type: 'credit_card',
  isDefault: true,
  isVerified: true,
  addedAt: new Date().toISOString(),
  last4: '4242',
  brand: 'visa',
  expiryMonth: 12,
  expiryYear: 2025,
  cardholderName: 'Test User',
  token: 'tok_stripe_test',
  fingerprint: 'fp_stripe_test',
  ...overrides,
} as PaymentMethodInfo);

// Digital Wallet Payment Method mock
export const createMockDigitalWalletPaymentMethod = (overrides: Partial<PaymentMethodInfo> = {}): PaymentMethodInfo => ({
  id: 'payment-456',
  type: 'digital_wallet',
  isDefault: false,
  isVerified: true,
  addedAt: new Date().toISOString(),
  provider: 'apple_pay',
  email: 'test@example.com',
  accountId: 'apple-account-123',
  displayName: 'Apple Pay',
  ...overrides,
} as PaymentMethodInfo);

// Cash Payment Method mock
export const createMockCashPaymentMethod = (overrides: Partial<PaymentMethodInfo> = {}): PaymentMethodInfo => ({
  id: 'payment-789',
  type: 'cash',
  isDefault: false,
  isVerified: true,
  addedAt: new Date().toISOString(),
  preferredCurrency: 'USD',
  requiresChange: false,
  ...overrides,
} as PaymentMethodInfo);

// Default payment method mock (uses card payment)
export const createMockPaymentMethod = (overrides: Partial<PaymentMethodInfo> = {}): PaymentMethodInfo => 
  createMockCardPaymentMethod(overrides);

// RideOption mock
export const createMockRideOption = (overrides: Partial<RideOption> = {}): RideOption => ({
  id: 'lux',
  name: 'Aura Lux',
  description: 'Premium luxury ride',
  basePrice: 25.00,
  pricePerKm: 2.50,
  capacity: 4,
  estimatedTime: '15 min',
  icon: 'luxury-car',
  features: ['leather seats', 'climate control', 'premium sound'],
  vehicleType: 'luxury',
  ...overrides,
});

// Location mock
export const createMockLocation = (overrides: Partial<Location> = {}): Location => ({
  lat: 40.7128,
  lon: -74.0060,
  address: 'New York, NY',
  ...overrides,
});

// ActiveRide mock
export const createMockActiveRide = (overrides: Partial<ActiveRide> = {}): ActiveRide => ({
  id: 'ride-123',
  riderId: 'user-123',
  driverId: 'driver-456',
  pickupLocation: createMockLocation(),
  dropoffLocation: createMockLocation({ address: 'Times Square, NY' }),
  rideOptionId: 'lux',
  status: 'confirmed',
  estimatedPrice: 36.25,
  price: 36.25, // Add missing price property
  fare: { // Add missing fare property
    total: 36.25,
    base: 25.00,
    distance: 8.50,
    time: 2.75,
  },
  estimatedDuration: 15,
  distance: 5.2,
  duration: 15, // Add missing duration property
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  driver: {
    id: 'driver-456',
    name: 'John Driver',
    phone: '+1234567890',
    vehicle: {
      make: 'BMW',
      model: 'i7',
      color: 'Black',
      licensePlate: 'ABC 123',
    },
    rating: 4.8,
    completedRides: 342,
  },
  pickup: {
    address: 'New York, NY',
  },
  destination: {
    address: 'Times Square, NY',
  },
  ...overrides,
});

// API Response adapters
export const createAuthResponse = (user: User, token: string = 'mock-jwt-token') => ({
  success: true as const,
  data: {
    user,
    token,
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  },
});

export const createRideEstimateResponse = (
  options: RideOption[] = [createMockRideOption()]
) => {
  const distanceKm = 5.2;
  const durationMinutes = 15;

  const baseRoute = {
    id: 'route-123',
    distance: distanceKm * 1000,
    duration: durationMinutes * 60,
    geometry: 'encoded-polyline',
    segments: [],
    waypoints: [],
    trafficCondition: 'moderate' as const,
  };

  const rideOptions = options.map(option => {
    const basePrice = option.basePrice;
    const distancePrice = option.pricePerKm * distanceKm;
    const timePrice = (option.basePrice * 0.02) * durationMinutes;
    const serviceFee = 2.5;
    const surgePrice = 0;
    const totalPrice = basePrice + distancePrice + timePrice + serviceFee + surgePrice;

    return {
      rideOption: option,
      estimatedPrice: totalPrice,
      estimatedDuration: durationMinutes,
      distance: distanceKm,
      surgeMultiplier: 1,
      pricingBreakdown: {
        rideOptionId: option.id,
        basePrice,
        distancePrice,
        timePrice,
        surgePrice,
        serviceFee,
        totalPrice,
        currency: 'USD',
        surgeMultiplier: 1,
        estimatedDuration: durationMinutes,
        distance: distanceKm,
      },
      routeInfo: baseRoute,
    };
  });

  return {
    success: true as const,
    data: {
      rideOptions,
      route: {
        distance: baseRoute.distance,
        duration: baseRoute.duration,
        geometry: baseRoute.geometry,
        alternatives: [],
      },
      surgeInfo: undefined,
      demandLevel: 'low' as const,
    },
  };
};

export const createBookRideResponse = (ride: ActiveRide) => ({
  success: true as const,
  data: ride,
});

export const createPaymentMethodsResponse = (methods: PaymentMethodInfo[] = [createMockPaymentMethod()]) => ({
  success: true as const,
  data: methods,
});

export const createAddPaymentMethodResponse = (method: PaymentMethodInfo) => ({
  success: true as const,
  data: method,
});

export const createValidatePaymentResponse = (isValid: boolean, error?: string) => ({
  isValid,
  error,
});

export const createProcessPaymentResponse = (transactionId: string = 'txn-123', amount: number = 36.25) => ({
  success: true as const,
  data: {
    transactionId,
    status: 'completed' as const,
    amount,
    currency: 'USD',
  },
});

// Store method adapters for testing
export const createStoreAdapter = () => {
  const store: any = {};
  
  // Mock store methods that don't exist
  store.reset = jest.fn();
  store.processPayment = jest.fn();
  store.setSelectedPaymentMethodId = jest.fn();
  store.isLoadingPayment = false;
  store.paymentError = null;
  
  return store;
};

// Payment service adapter
export const createPaymentServiceAdapter = () => {
  const service: any = {};
  
  // Add validatePaymentMethod method that tests expect
  service.validatePaymentMethod = jest.fn().mockResolvedValue(createValidatePaymentResponse(true));
  service.validatePayment = jest.fn().mockResolvedValue(createValidatePaymentResponse(true));
  
  return service;
};

// Type guards for test validation
export const isValidUser = (user: any): user is User => {
  return user && 
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.phone === 'string' &&
    typeof user.isDriver === 'boolean' &&
    typeof user.isVerified === 'boolean' &&
    typeof user.role === 'string' &&
    typeof user.kycStatus === 'string';
};

export const isValidPaymentMethod = (method: any): method is PaymentMethodInfo => {
  return method &&
    typeof method.id === 'string' &&
    typeof method.type === 'string' &&
    typeof method.provider === 'string' &&
    typeof method.isDefault === 'boolean' &&
    typeof method.isVerified === 'boolean' &&
    typeof method.addedAt === 'string';
};

// Test data factory
export const TestDataFactory = {
  user: createMockUser,
  paymentMethod: createMockPaymentMethod,
  rideOption: createMockRideOption,
  location: createMockLocation,
  activeRide: createMockActiveRide,
  
  responses: {
    auth: createAuthResponse,
    rideEstimate: createRideEstimateResponse,
    bookRide: createBookRideResponse,
    paymentMethods: createPaymentMethodsResponse,
    addPaymentMethod: createAddPaymentMethodResponse,
    validatePayment: createValidatePaymentResponse,
    processPayment: createProcessPaymentResponse,
  },
  
  adapters: {
    store: createStoreAdapter,
    paymentService: createPaymentServiceAdapter,
  },
  
  validators: {
    isValidUser,
    isValidPaymentMethod,
  },
};

export default TestDataFactory;
