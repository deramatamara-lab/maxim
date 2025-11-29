/**
 * Ride Booking Flow Tests
 * Tests critical ride booking functionality: price estimation, booking, cancellation
 */

import { renderHook, act } from '@testing-library/react-native';
import { useEnhancedAppStore } from '../../src/store/useEnhancedAppStore';
import { rideService } from '../../src/api/rides';
import { TestDataFactory } from '../utils/testAdapters';

// Mock dependencies
jest.mock('../../src/api/rides');
jest.mock('../../src/utils/logger', () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    event: jest.fn(),
    performance: jest.fn(),
    userAction: jest.fn(),
    apiCall: jest.fn(),
    createComponent: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
    setContext: jest.fn(),
    clearContext: jest.fn(),
  },
}));

const mockRideService = rideService as jest.Mocked<typeof rideService>;

describe('Ride Booking Flow', () => {
  const mockPickup = { lat: 40.7128, lon: -74.0060, address: 'New York, NY' };
  const mockDropoff = { lat: 40.7589, lon: -73.9851, address: 'Times Square, NY' };
  const mockRideOption = 'lux';

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset and stub heavy store internals for deterministic tests
    const store = useEnhancedAppStore.getState() as any;
    if ('resetJourney' in store) {
      store.resetJourney();
    }

    store.getRecentRideAttempts = jest.fn().mockResolvedValue([]);
    store.recordRideAttempt = jest.fn().mockResolvedValue(undefined);
    store.validatePricing = jest.fn().mockResolvedValue({
      isValid: true,
      expectedPrice: 36.25,
    });
    store.validateFinalPricing = jest.fn().mockResolvedValue({
      isValid: true,
      actualPrice: 36.25,
    });
    store.requestPricingConfirmation = jest.fn().mockResolvedValue(true);
    store.validatePaymentMethod = jest.fn().mockResolvedValue({
      isValid: true,
    });

    // Default ride estimate and booking mocks using TestDataFactory
    const rideOption = TestDataFactory.rideOption({ id: mockRideOption });
    mockRideService.getRideEstimate.mockResolvedValue(
      TestDataFactory.responses.rideEstimate([rideOption])
    );

    const rideRequest = {
      id: 'ride-123',
      riderId: 'user-123',
      driverId: 'driver-456',
      pickupLocation: mockPickup,
      dropoffLocation: mockDropoff,
      rideOptionId: mockRideOption,
      status: 'confirmed',
      estimatedPrice: 36.25,
      estimatedDuration: 15,
      distance: 5.2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    mockRideService.bookRide.mockResolvedValue(
      TestDataFactory.responses.bookRide(rideRequest)
    );

    mockRideService.cancelRide.mockResolvedValue({
      success: true,
      data: undefined,
    });
  });

  describe('Price Estimation', () => {
    it('should fetch ride estimates successfully', async () => {
      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.getRideEstimate(mockPickup, mockDropoff, [mockRideOption]);
      });

      // Assert
      expect(result.current.currentEstimate).toBeDefined();
      expect(result.current.currentEstimate?.rideOptionId).toBe(mockRideOption);
      expect(result.current.isLoadingEstimate).toBe(false);
      expect(mockRideService.getRideEstimate).toHaveBeenCalledWith(
        mockPickup,
        mockDropoff,
        [mockRideOption]
      );
    });

    it('should handle estimation failure', async () => {
      // Arrange
      mockRideService.getRideEstimate.mockRejectedValue(new Error('API error'));

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.getRideEstimate(mockPickup, mockDropoff, [mockRideOption]);
      });

      // Assert
      expect(result.current.estimateError).toBeTruthy();
      expect(result.current.isLoadingEstimate).toBe(false);
      // Store does not explicitly clear currentEstimate on failure; we only assert error/loading flags
    });

  });

  describe('Ride Booking', () => {
    beforeEach(async () => {
      // Set up estimate first
      const { result } = renderHook(() => useEnhancedAppStore());
      await act(async () => {
        await result.current.getRideEstimate(mockPickup, mockDropoff, [mockRideOption]);
        result.current.setSelectedRideOption(mockRideOption);
      });
    });

    it('should book ride successfully', async () => {
      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const bookingResult = await result.current.bookRide(mockPickup, mockDropoff, mockRideOption);
        expect(bookingResult.success).toBe(true);
      });

      // Assert
      expect(result.current.currentRide).toBeDefined();
      expect(result.current.currentRide?.id).toBe('ride-123');
      expect(result.current.currentRide?.status).toBe('confirmed');
      expect(result.current.isLoadingRide).toBe(false);
      expect(mockRideService.bookRide).toHaveBeenCalledWith(
        mockPickup,
        mockDropoff,
        mockRideOption,
        undefined,
        undefined
      );
    });

    it('should validate payment method before booking', async () => {
      // Arrange - override validatePaymentMethod to simulate expiry
      const store = useEnhancedAppStore.getState() as any;
      store.validatePaymentMethod = jest.fn().mockResolvedValue({
        isValid: false,
        error: 'Payment method has expired. Please update your payment information.',
      });

      // Ensure no active ride is present so payment validation path is exercised
      store.currentRide = null;

      const { result } = renderHook(() => useEnhancedAppStore());
      
      // Set a selected payment method ID
      await act(async () => {
        result.current.setSelectedPaymentMethod('payment-123');
      });

      await act(async () => {
        const bookingResult = await result.current.bookRide(mockPickup, mockDropoff, mockRideOption);
        expect(bookingResult.success).toBe(false);
      });

      // Assert - store maps this to a PAYMENT_DECLINED RideError with a user-friendly message
      expect(result.current.rideError).toContain('Your payment was declined');
      expect(mockRideService.bookRide).not.toHaveBeenCalled();
    });

    it('should prevent booking with active ride', async () => {
      // Arrange - First book a ride
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.bookRide(mockPickup, mockDropoff, mockRideOption);
      });

      // Act - Try to book another ride
      await act(async () => {
        const bookingResult = await result.current.bookRide(mockPickup, mockDropoff, mockRideOption);
        expect(bookingResult.success).toBe(false);
      });

      // Assert
      expect(result.current.rideError).toContain('You already have an active ride');
      expect(mockRideService.bookRide).toHaveBeenCalledTimes(1);
    });

    it('should handle booking failure', async () => {
      // Arrange
      mockRideService.bookRide.mockRejectedValue(new Error('Booking failed'));

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const bookingResult = await result.current.bookRide(mockPickup, mockDropoff, mockRideOption);
        expect(bookingResult.success).toBe(false);
      });

      // Assert - generic booking failure message from store
      expect(result.current.rideError).toContain('Unable to book ride');
      expect(result.current.currentRide).toBe(null);
    });
  });

  describe('Ride Cancellation', () => {
    beforeEach(async () => {
      // Set up active ride
      const { result } = renderHook(() => useEnhancedAppStore());
      await act(async () => {
        await result.current.getRideEstimate(mockPickup, mockDropoff, [mockRideOption]);
        result.current.setSelectedRideOption(mockRideOption);
        await result.current.bookRide(mockPickup, mockDropoff, mockRideOption);
      });
    });

    it('should cancel ride successfully', async () => {
      // Arrange - cancelRide already mocked to success in beforeEach

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const cancelResult = await result.current.cancelRide('ride-123', 'User requested');
        expect(cancelResult).toBe(true);
      });

      // Assert
      expect(result.current.currentRide).toBe(null);
      expect(mockRideService.cancelRide).toHaveBeenCalledWith('ride-123', 'User requested');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid pickup location', async () => {
      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const bookingResult = await result.current.bookRide(
          { lat: 0, lon: 0, address: '' }, // Invalid location
          mockDropoff,
          mockRideOption
        );
        expect(bookingResult.success).toBe(false);
      });

      // Assert
      expect(result.current.rideError).toContain('Invalid pickup or dropoff location');
      expect(mockRideService.bookRide).not.toHaveBeenCalled();
    });

    it('should reject invalid dropoff location', async () => {
      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const bookingResult = await result.current.bookRide(
          mockPickup,
          { lat: 0, lon: 0, address: '' }, // Invalid location
          mockRideOption
        );
        expect(bookingResult.success).toBe(false);
      });

      // Assert
      expect(result.current.rideError).toContain('Invalid pickup or dropoff location');
      expect(mockRideService.bookRide).not.toHaveBeenCalled();
    });

    it('should reject empty ride option', async () => {
      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const bookingResult = await result.current.bookRide(
          mockPickup,
          mockDropoff,
          '' // Empty ride option
        );
        expect(bookingResult.success).toBe(false);
      });

      // Assert
      // Exact user-facing message from createRideError(MISSING_REQUIRED_FIELDS,...)
      expect(result.current.rideError).toContain('Please provide all required information: pickup location, destination, and ride option.');
      expect(mockRideService.bookRide).not.toHaveBeenCalled();
    });
  });
});
