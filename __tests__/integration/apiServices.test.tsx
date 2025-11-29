/**
 * API Service Integration Tests
 * Tests the integration between store functions and API services with realistic mocks
 */

import { act, renderHook } from '@testing-library/react-native';
import { useEnhancedAppStore } from '@/store/useEnhancedAppStore';
import {
  resetAllMocks,
  setupDefaultMocks,
  createMockUser,
  createMockLocation,
  createMockActiveRide,
  createMockPaymentMethod,
  createMockPriceEstimate,
  createMockRoute,
  createMockSurgeInfo,
  waitForAsync,
} from '../utils/testUtils';

// Mock the API services with realistic implementations
jest.mock('@/api/auth', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock('@/api/rides', () => ({
  rideService: {
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
  },
}));

jest.mock('@/api/payment', () => ({
  paymentService: {
    getPaymentMethods: jest.fn(),
    addPaymentMethod: jest.fn(),
    updatePaymentMethod: jest.fn(),
    deletePaymentMethod: jest.fn(),
    setDefaultPaymentMethod: jest.fn(),
    validatePayment: jest.fn(),
    processPayment: jest.fn(),
    downloadReceipt: jest.fn(),
    addTip: jest.fn(),
  },
}));

jest.mock('@/api/pricing', () => ({
  pricingService: {
    getPriceEstimate: jest.fn(),
    getSurgeInfo: jest.fn(),
    calculateDynamicPricing: jest.fn(),
  },
}));

jest.mock('@/api/routing', () => ({
  routingService: {
    calculateRoute: jest.fn(),
    updateETA: jest.fn(),
    getRouteAlternatives: jest.fn(),
  },
}));

jest.mock('@/api/location', () => ({
  locationService: {
    getCurrentLocation: jest.fn(),
    geocodeAddress: jest.fn(),
    reverseGeocode: jest.fn(),
  },
}));

describe('API Service Integration - Complete Ride Booking Flow', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should complete full ride booking flow from search to active ride', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const mockUser = createMockUser();
    const pickup = createMockLocation(0);
    const destination = createMockLocation(1);
    const paymentMethod = createMockPaymentMethod();
    const mockActiveRide = createMockActiveRide(pickup, destination, 'lux', mockUser.id);

    // Step 1: User login
    await act(async () => {
      const success = await result.current.login('john@example.com', 'password');
      expect(success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);

    // Step 2: Get current location
    await act(async () => {
      const success = await result.current.getCurrentLocation();
      expect(success).toBe(true);
    });

    expect(result.current.currentLocation).toEqual(pickup);

    // Step 3: Fetch ride options
    await act(async () => {
      await result.current.fetchRideOptions();
    });

    expect(result.current.rideOptions).toHaveLength(3);

    // Step 4: Get ride estimate
    await act(async () => {
      const success = await result.current.getRideEstimate(pickup, destination, ['lux']);
      expect(success).toBe(true);
    });

    expect(result.current.currentEstimate).not.toBeNull();

    // Step 5: Set payment method
    await act(async () => {
      await result.current.fetchPaymentMethods();
      result.current.setSelectedPaymentMethod(paymentMethod.id);
    });

    expect(result.current.selectedPaymentMethodId).toBe(paymentMethod.id);

    // Step 6: Book the ride
    await act(async () => {
      const success = await result.current.bookRide(pickup, destination, 'lux', 'Test ride');
      expect(success).toBe(true);
    });

    expect(result.current.currentRide).toEqual(mockActiveRide);
    expect(result.current.isLoadingRide).toBe(false);
  });

  it('should handle ride booking with payment pre-authorization', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const mockUser = createMockUser();
    const pickup = createMockLocation(0);
    const destination = createMockLocation(1);
    const paymentMethod = createMockPaymentMethod();

    // Setup payment validation and processing mocks
    const { paymentService } = require('@/api/payment');
    paymentService.validatePayment.mockResolvedValue({
      success: true,
      data: { isValid: true, errors: [] },
    });
    paymentService.processPayment.mockResolvedValue({
      success: true,
      data: { id: 'payment-123', status: 'pre_authorized' },
    });

    // Login and set up payment method
    await act(async () => {
      await result.current.login('john@example.com', 'password');
      await result.current.fetchPaymentMethods();
      result.current.setSelectedPaymentMethod(paymentMethod.id);
    });

    // Book ride with payment
    await act(async () => {
      const success = await result.current.bookRide(pickup, destination, 'lux', 'Test ride');
      expect(success).toBe(true);
    });

    // Verify payment validation was called
    expect(paymentService.validatePayment).toHaveBeenCalled();
    expect(paymentService.processPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        rideId: expect.any(String),
        amount: expect.any(Number),
        metadata: expect.objectContaining({ preAuth: true }),
      })
    );
  });

  it('should handle payment failure during ride booking', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const pickup = createMockLocation(0);
    const destination = createMockLocation(1);
    const paymentMethod = createMockPaymentMethod();

    // Setup payment failure
    const { paymentService } = require('@/api/payment');
    paymentService.validatePayment.mockResolvedValue({
      success: false,
      data: { isValid: false, errors: ['Insufficient funds'] },
    });

    // Login and set up payment method
    await act(async () => {
      await result.current.login('john@example.com', 'password');
      await result.current.fetchPaymentMethods();
      result.current.setSelectedPaymentMethod(paymentMethod.id);
    });

    // Attempt to book ride with failing payment
    await act(async () => {
      const success = await result.current.bookRide(pickup, destination, 'lux', 'Test ride');
      expect(success).toBe(false);
    });

    expect(result.current.rideError).toContain('Payment validation failed');
    expect(result.current.currentRide).toBeNull();
  });

  it('should handle surge pricing correctly', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const pickup = createMockLocation(0);
    const destination = createMockLocation(1);
    const surgeInfo = createMockSurgeInfo({ multiplier: 1.5 });

    // Setup surge pricing
    const { pricingService } = require('@/api/pricing');
    pricingService.getSurgeInfo.mockResolvedValue({
      success: true,
      data: surgeInfo,
    });

    // Get ride estimate during surge
    await act(async () => {
      const success = await result.current.getRideEstimate(pickup, destination);
      expect(success).toBe(true);
    });

    expect(result.current.surgeInfo).toEqual(surgeInfo);
    expect(result.current.currentEstimate).not.toBeNull();
  });

  it('should handle route calculation with alternatives', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const origin = createMockLocation(0);
    const destination = createMockLocation(1);
    const mainRoute = createMockRoute();
    const alternativeRoute = createMockRoute({ id: 'route-2', distance: 9000 });

    // Setup routing with alternatives
    const { routingService } = require('@/api/routing');
    routingService.calculateRoute.mockResolvedValue({
      success: true,
      data: [mainRoute, alternativeRoute],
    });

    // Get route information
    await act(async () => {
      const success = await result.current.getRoute(origin, destination);
      expect(success).toBe(true);
    });

    expect(result.current.currentRoute).toEqual(mainRoute);
  });

  it('should handle real-time ride tracking updates', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const pickup = createMockLocation(0);
    const destination = createMockLocation(1);
    const mockActiveRide = createMockActiveRide(pickup, destination, 'lux', 'user-1');

    // Setup tracking update
    const { rideService } = require('@/api/rides');
    rideService.updateRideTracking.mockResolvedValue({
      success: true,
      data: {
        estimatedArrival: '2023-01-01T12:15:00.000Z',
        remainingDistance: 5000,
        remainingDuration: 600,
        confidence: 0.95,
      },
    });

    // Book a ride first
    await act(async () => {
      await result.current.bookRide(pickup, destination, 'lux');
    });

    // Update tracking
    await act(async () => {
      const success = await result.current.updateRideTracking(
        mockActiveRide.id,
        { lat: 40.7200, lon: -74.0000 },
        destination
      );
      expect(success).toBe(true);
    });

    expect(rideService.updateRideTracking).toHaveBeenCalled();
  });
});

describe('API Service Integration - Payment Method Management', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should handle complete payment method lifecycle', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const newPaymentMethod = {
      type: 'credit_card' as const,
      last4: '1234',
      brand: 'Mastercard',
      expiryMonth: 6,
      expiryYear: 2024,
      isDefault: false,
    };

    // Step 1: Fetch payment methods
    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    expect(result.current.paymentMethods).toHaveLength(2);

    // Step 2: Add new payment method
    await act(async () => {
      const success = await result.current.addPaymentMethod(newPaymentMethod);
      expect(success).toBe(true);
    });

    expect(result.current.paymentMethods).toHaveLength(3);

    // Step 3: Update payment method
    const newMethodId = result.current.paymentMethods[2].id;
    await act(async () => {
      const success = await result.current.updatePaymentMethod(newMethodId, { isDefault: true });
      expect(success).toBe(true);
    });

    expect(result.current.paymentMethods[2].isDefault).toBe(true);

    // Step 4: Delete payment method
    await act(async () => {
      const success = await result.current.deletePaymentMethod(newMethodId);
      expect(success).toBe(true);
    });

    expect(result.current.paymentMethods).toHaveLength(2);
  });

  it('should handle payment method validation failures', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const invalidPaymentMethod = {
      type: 'credit_card' as const,
      last4: '1234',
      brand: 'Mastercard',
      expiryMonth: 6,
      expiryYear: 2024,
      isDefault: false,
    };

    // Setup validation failure
    const { paymentService } = require('@/api/payment');
    paymentService.addPaymentMethod.mockResolvedValue({
      success: false,
      error: 'Invalid card details',
    });

    // Attempt to add invalid payment method
    await act(async () => {
      const success = await result.current.addPaymentMethod(invalidPaymentMethod);
      expect(success).toBe(false);
    });

    expect(result.current.paymentError).toBe('Invalid card details');
    expect(result.current.paymentMethods).toHaveLength(0);
  });
});

describe('API Service Integration - Driver Flow', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should handle complete driver request flow', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());

    // Step 1: Toggle driver online
    await act(async () => {
      const success = await result.current.toggleDriverOnline();
      expect(success).toBe(true);
    });

    expect(result.current.driverState).toBe('online');

    // Step 2: Simulate incoming request
    act(() => {
      result.current.simulateIncomingRequest();
    });

    expect(result.current.driverState).toBe('incoming_request');
    expect(result.current.currentRequest).not.toBeNull();

    // Step 3: Accept ride request
    await act(async () => {
      const success = await result.current.acceptRideRequest('ride-1');
      expect(success).toBe(true);
    });

    expect(result.current.driverState).toBe('accepted');

    // Step 4: Start ride
    await act(async () => {
      const success = await result.current.startRide();
      expect(success).toBe(true);
    });

    expect(result.current.driverState).toBe('in_progress');

    // Step 5: Complete ride
    await act(async () => {
      const success = await result.current.completeRide();
      expect(success).toBe(true);
    });

    expect(result.current.driverState).toBe('online');
  });

  it('should handle request rejection and return to online state', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());

    // Go online and receive request
    await act(async () => {
      await result.current.toggleDriverOnline();
      result.current.simulateIncomingRequest();
    });

    expect(result.current.driverState).toBe('incoming_request');

    // Reject the request
    await act(async () => {
      const success = await result.current.rejectRideRequest();
      expect(success).toBe(true);
    });

    expect(result.current.driverState).toBe('online');
    expect(result.current.currentRequest).toBeNull();
  });

  it('should handle countdown timeout and automatic rejection', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());

    // Go online and receive request
    await act(async () => {
      await result.current.toggleDriverOnline();
      result.current.simulateIncomingRequest();
    });

    expect(result.current.countdownRemaining).toBe(30);

    // Simulate countdown reaching zero
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.decrementCountdown();
      });
    }

    expect(result.current.countdownRemaining).toBe(0);
    expect(result.current.driverState).toBe('online');
    expect(result.current.currentRequest).toBeNull();
  });
});

describe('API Service Integration - Error Handling', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should handle network errors gracefully', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());

    // Setup network error
    const { rideService } = require('@/api/rides');
    rideService.getRideOptions.mockRejectedValue(new Error('Network error'));

    // Attempt to fetch ride options
    await act(async () => {
      await result.current.fetchRideOptions();
    });

    expect(result.current.rideOptionsError).toBe('Network error occurred');
    expect(result.current.rideOptions).toHaveLength(0);
  });

  it('should handle API rate limiting', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());

    // Setup rate limit error
    const { rideService } = require('@/api/rides');
    rideService.bookRide.mockResolvedValue({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
    });

    // Attempt to book ride
    await act(async () => {
      const success = await result.current.bookRide(
        createMockLocation(0),
        createMockLocation(1),
        'lux'
      );
      expect(success).toBe(false);
    });

    expect(result.current.rideError).toContain('Rate limit exceeded');
  });

  it('should handle authentication token expiration', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());

    // Setup auth error
    const { authService } = require('@/api/auth');
    authService.refreshToken.mockRejectedValue(new Error('Token expired'));

    // Attempt to refresh token
    await act(async () => {
      await result.current.initializeAuth();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe('API Service Integration - Data Consistency', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should maintain data consistency across store updates', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());

    // Login and fetch initial data
    await act(async () => {
      await result.current.login('john@example.com', 'password');
      await result.current.fetchRideOptions();
      await result.current.fetchPaymentMethods();
    });

    const initialRideOptions = result.current.rideOptions;
    const initialPaymentMethods = result.current.paymentMethods;

    // Add new payment method
    await act(async () => {
      await result.current.addPaymentMethod({
        type: 'credit_card',
        last4: '9999',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: false,
      });
    });

    // Verify data consistency
    expect(result.current.paymentMethods).toHaveLength(initialPaymentMethods.length + 1);
    expect(result.current.rideOptions).toEqual(initialRideOptions);
    expect(result.current.user).not.toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle concurrent API requests correctly', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());

    // Trigger multiple concurrent requests
    await act(async () => {
      await Promise.all([
        result.current.fetchRideOptions(),
        result.current.fetchPaymentMethods(),
        result.current.getCurrentLocation(),
      ]);
    });

    // Verify all requests completed successfully
    expect(result.current.rideOptions).toHaveLength(3);
    expect(result.current.paymentMethods).toHaveLength(2);
    expect(result.current.currentLocation).not.toBeNull();
    expect(result.current.isLoadingRideOptions).toBe(false);
    expect(result.current.isLoadingPaymentMethods).toBe(false);
  });
});
