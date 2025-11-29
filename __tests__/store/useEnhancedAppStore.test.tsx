/**
 * Enhanced Store Unit Tests
 * Tests authentication, ride booking, payment methods, and state management
 */

// Set environment to production BEFORE any imports to avoid Jest module caching
process.env.EXPO_PUBLIC_ENV = 'production';

import { act, renderHook } from '@testing-library/react-native';
import { useEnhancedAppStore } from '@/store/useEnhancedAppStore';
import {
  resetAllMocks,
  setupDefaultMocks,
  mockAsyncStorageSetup,
  createMockUser,
  createMockLocation,
  createMockActiveRide,
  createMockPaymentMethod,
  waitForAsync,
} from '../utils/testUtils';

// Mock the dependencies
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
  },
}));

jest.mock('@/api/routing', () => ({
  routingService: {
    calculateRoute: jest.fn(),
  },
}));

jest.mock('@/api/location', () => ({
  locationService: {
    getCurrentLocation: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/api/client', () => ({
  apiClient: {
    setAuthToken: jest.fn(),
    clearAuthToken: jest.fn(),
  },
}));

describe('Enhanced Store - Authentication', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should initialize with default auth state', () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.authError).toBeNull();
  });

  it('should handle successful login', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const mockUser = createMockUser();
    
    await act(async () => {
      const success = await result.current.login('john@example.com', 'password');
      expect(success).toBe(true);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.authError).toBeNull();
  });

  it('should handle login failure', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    // Mock login failure
    const { authService } = require('@/api/auth');
    authService.login.mockResolvedValue({
      success: false,
      data: null,
      error: 'Invalid credentials',
    });

    await act(async () => {
      const success = await result.current.login('john@example.com', 'wrongpassword');
      expect(success).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.authError).toBe('Invalid credentials');
  });

  it('should handle successful registration', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const mockUser = createMockUser({ name: 'New User' });
    
    await act(async () => {
      const success = await result.current.register('New User', 'new@example.com', 'password');
      expect(success).toBe(true);
    });

    expect(result.current.user).toEqual(
      expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        isDriver: mockUser.isDriver,
        isVerified: mockUser.isVerified,
      })
    );
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle logout', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    // First login
    await act(async () => {
      await result.current.login('john@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.authError).toBeNull();
  });

  it('should handle profile update', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const mockUser = createMockUser();
    
    // First login
    await act(async () => {
      await result.current.login('john@example.com', 'password');
    });

    // Update profile
    await act(async () => {
      const success = await result.current.updateProfile({ name: 'Updated Name' });
      expect(success).toBe(true);
    });

    expect(result.current.user?.name).toBe('Updated Name');
  });
});

describe('Enhanced Store - Ride Booking', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should fetch ride options', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    await act(async () => {
      await result.current.fetchRideOptions();
    });

    expect(result.current.rideOptions).toHaveLength(3);
    expect(result.current.isLoadingRideOptions).toBe(false);
    expect(result.current.rideOptionsError).toBeNull();
  });

  it('should handle ride booking successfully', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const pickup = createMockLocation(0);
    const destination = createMockLocation(1);
    const mockActiveRide = createMockActiveRide(pickup, destination, 'lux', 'user-1');
    
    await act(async () => {
      const bookingResult = await result.current.bookRide(pickup, destination, 'lux', 'Test ride');
      expect(bookingResult.success).toBe(true);
    });

    expect(result.current.currentRide).toEqual(
      expect.objectContaining({
        rideOptionId: 'lux',
        status: 'pending',
        riderId: 'user-1',
      })
    );
    expect(result.current.isLoadingRide).toBe(false);
    expect(result.current.rideError).toBeNull();
  });

  it('should handle ride booking failure', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const pickup = createMockLocation(0);
    const destination = createMockLocation(1);
    
    // Mock booking failure - use mockResolvedValueOnce to override setupDefaultMocks
    const { rideService } = require('@/api/rides');
    rideService.bookRide.mockResolvedValueOnce({
      success: false,
      data: null,
      error: 'No drivers available',
    });

    await act(async () => {
      const bookingResult = await result.current.bookRide(pickup, destination, 'lux');
      expect(bookingResult.success).toBe(false);
    });

    expect(result.current.currentRide).toBeNull();
    expect(result.current.rideError).toContain('No drivers are currently available');
  });

  it('should handle ride cancellation', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const pickup = createMockLocation(0);
    const destination = createMockLocation(1);
    
    // First book a ride
    await act(async () => {
      await result.current.bookRide(pickup, destination, 'lux');
    });

    expect(result.current.currentRide).not.toBeNull();

    // Then cancel it
    await act(async () => {
      const success = await result.current.cancelRide(result.current.currentRide!.id, 'User cancelled');
      expect(success).toBe(true);
    });

    expect(result.current.currentRide).toBeNull();
  });

  it('should fetch ride history', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    await act(async () => {
      await result.current.fetchRideHistory();
    });

    expect(result.current.rideHistory).toHaveLength(5); // Mock generates 5 rides
  });

  it('should get active ride', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    await act(async () => {
      await result.current.getActiveRide();
    });

    expect(result.current.currentRide).toBeNull(); // No active ride in mock
  });
});

describe('Enhanced Store - Payment Methods', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should fetch payment methods', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    expect(result.current.paymentMethods).toHaveLength(2);
    expect(result.current.isLoadingPaymentMethods).toBe(false);
    expect(result.current.paymentError).toBeNull();
  });

  it('should add a new payment method', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const newPaymentMethod = {
      type: 'credit_card' as const,
      last4: '1234',
      brand: 'Mastercard',
      expiryMonth: 6,
      expiryYear: 2024,
      isDefault: false,
    };
    
    await act(async () => {
      const success = await result.current.addPaymentMethod(newPaymentMethod);
      expect(success).toBe(true);
    });

    expect(result.current.paymentMethods).toHaveLength(3);
  });

  it('should update a payment method', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    // First fetch payment methods
    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    const methodId = result.current.paymentMethods[0].id;
    
    await act(async () => {
      const success = await result.current.updatePaymentMethod(methodId, { isDefault: false });
      expect(success).toBe(true);
    });

    expect(result.current.paymentMethods[0].isDefault).toBe(false);
  });

  it('should delete a payment method', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    // First fetch payment methods
    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    const methodId = result.current.paymentMethods[0].id;
    
    await act(async () => {
      const success = await result.current.deletePaymentMethod(methodId);
      expect(success).toBe(true);
    });

    expect(result.current.paymentMethods).toHaveLength(1);
  });

  it('should set default payment method', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    // First fetch payment methods
    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    const methodId = result.current.paymentMethods[1].id;
    
    await act(async () => {
      const success = await result.current.setDefaultPaymentMethod(methodId);
      expect(success).toBe(true);
    });

    expect(result.current.paymentMethods[1].isDefault).toBe(true);
    expect(result.current.selectedPaymentMethodId).toBe(methodId);
  });

  it('should set selected payment method', () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    act(() => {
      result.current.setSelectedPaymentMethod('payment-1');
    });

    expect(result.current.selectedPaymentMethodId).toBe('payment-1');
  });
});

describe('Enhanced Store - Pricing and Routing', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should get ride estimate', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const pickup = createMockLocation(0);
    const destination = createMockLocation(1);
    
    await act(async () => {
      const success = await result.current.getRideEstimate(pickup, destination);
      expect(success).toBe(true);
    });

    expect(result.current.currentEstimate).not.toBeNull();
    expect(result.current.isLoadingEstimate).toBe(false);
    expect(result.current.estimateError).toBeNull();
  });

  it('should get route information', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    const origin = createMockLocation(0);
    const destination = createMockLocation(1);
    
    await act(async () => {
      const success = await result.current.getRoute(origin, destination);
      expect(success).toBe(true);
    });

    expect(result.current.currentRoute).not.toBeNull();
    expect(result.current.isLoadingRoute).toBe(false);
    expect(result.current.routeError).toBeNull();
  });
});

describe('Enhanced Store - Location Services', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should get current location', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    await act(async () => {
      const success = await result.current.getCurrentLocation();
      expect(success).toBe(true);
    });

    // Store uses mock location in test mode (Sofia, Bulgaria)
    expect(result.current.currentLocation).toEqual({
      lat: 42.6977,
      lon: 23.3219,
      address: 'Sofia, Bulgaria',
    });
  });
});

describe('Enhanced Store - Driver State', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should toggle driver online status', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    expect(result.current.driverState).toBe('offline');
    
    await act(async () => {
      const success = await result.current.toggleDriverOnline();
      expect(success).toBe(true);
    });

    expect(result.current.driverState).toBe('online');
    
    await act(async () => {
      const success = await result.current.toggleDriverOnline();
      expect(success).toBe(true);
    });

    expect(result.current.driverState).toBe('offline');
  });

  it('should accept ride request', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    // Simulate incoming request
    act(() => {
      result.current.simulateIncomingRequest();
    });

    expect(result.current.driverState).toBe('incoming_request');
    expect(result.current.currentRequest).not.toBeNull();
    
    await act(async () => {
      const success = await result.current.acceptRideRequest('ride-1');
      expect(success).toBe(true);
    });

    expect(result.current.driverState).toBe('accepted');
  });

  it('should reject ride request', async () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    // Simulate incoming request
    act(() => {
      result.current.simulateIncomingRequest();
    });

    expect(result.current.driverState).toBe('incoming_request');
    
    await act(async () => {
      const success = await result.current.rejectRideRequest();
      expect(success).toBe(true);
    });

    expect(result.current.driverState).toBe('online');
    expect(result.current.currentRequest).toBeNull();
  });

  it('should decrement countdown', () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    act(() => {
      result.current.simulateIncomingRequest();
    });

    const initialCountdown = result.current.countdownRemaining;
    
    act(() => {
      result.current.decrementCountdown();
    });

    expect(result.current.countdownRemaining).toBe(initialCountdown - 1);
  });
});

describe('Enhanced Store - Navigation', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should set active tab', () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    expect(result.current.activeTab).toBe('home');
    
    act(() => {
      result.current.setActiveTab('activity');
    });

    expect(result.current.activeTab).toBe('activity');
  });
});

describe('Enhanced Store - Search State', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  it('should manage search state', () => {
    const { result } = renderHook(() => useEnhancedAppStore());
    
    expect(result.current.destination).toBe('');
    expect(result.current.isSearching).toBe(false);
    expect(result.current.errorMsg).toBeNull();
    
    act(() => {
      result.current.setDestination('Times Square');
      result.current.setIsSearching(true);
      result.current.setErrorMsg('No results found');
    });

    expect(result.current.destination).toBe('Times Square');
    expect(result.current.isSearching).toBe(true);
    expect(result.current.errorMsg).toBe('No results found');
  });
});
