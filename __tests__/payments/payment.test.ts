/**
 * Payment Flow Tests
 * Tests critical payment functionality: payment methods, validation, processing
 */

import { renderHook, act } from '@testing-library/react-native';
import { useEnhancedAppStore } from '../../src/store/useEnhancedAppStore';
import { paymentService } from '../../src/api/PaymentServiceFactory';

// Mock dependencies
jest.mock('../../src/api/PaymentServiceFactory');
jest.mock('../../src/utils/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockPaymentService = paymentService as jest.Mocked<typeof paymentService>;

describe('Payment Flow', () => {
  const mockPaymentMethod = {
    id: 'payment-123',
    type: 'card' as const,
    provider: 'stripe' as const,
    isDefault: true,
    card: {
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2025,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useEnhancedAppStore.getState().reset?.();
    
    // Default mocks
    mockPaymentService.getPaymentMethods.mockResolvedValue({
      success: true,
      data: [mockPaymentMethod],
    });

    mockPaymentService.addPaymentMethod.mockResolvedValue({
      success: true,
      data: mockPaymentMethod,
    });

    mockPaymentService.validatePaymentMethod.mockResolvedValue({
      isValid: true,
    });

    mockPaymentService.processPayment.mockResolvedValue({
      success: true,
      data: {
        transactionId: 'txn-123',
        status: 'completed',
        amount: 36.25,
        currency: 'USD',
      },
    });
  });

  describe('Payment Methods Management', () => {
    it('should fetch payment methods successfully', async () => {
      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.fetchPaymentMethods();
      });

      // Assert
      expect(result.current.paymentMethods).toHaveLength(1);
      expect(result.current.paymentMethods[0]).toEqual(mockPaymentMethod);
      expect(result.current.isLoadingPayment).toBe(false);
      expect(mockPaymentService.getPaymentMethods).toHaveBeenCalled();
    });

    it('should handle empty payment methods list', async () => {
      // Arrange
      mockPaymentService.getPaymentMethods.mockResolvedValue({
        success: true,
        data: [],
      });

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.fetchPaymentMethods();
      });

      // Assert
      expect(result.current.paymentMethods).toHaveLength(0);
      expect(result.current.selectedPaymentMethodId).toBe(null);
    });

    it('should set first payment method as default when none selected', async () => {
      // Arrange
      mockPaymentService.getPaymentMethods.mockResolvedValue({
        success: true,
        data: [mockPaymentMethod],
      });

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.fetchPaymentMethods();
      });

      // Assert
      expect(result.current.selectedPaymentMethodId).toBe(mockPaymentMethod.id);
    });

    it('should handle payment methods fetch failure', async () => {
      // Arrange
      mockPaymentService.getPaymentMethods.mockRejectedValue(new Error('Network error'));

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.fetchPaymentMethods();
      });

      // Assert
      expect(result.current.paymentError).toBeTruthy();
      expect(result.current.isLoadingPayment).toBe(false);
      expect(result.current.paymentMethods).toHaveLength(0);
    });
  });

  describe('Add Payment Method', () => {
    it('should add new payment method successfully', async () => {
      // Arrange
      const newPaymentMethod = {
        type: 'card' as const,
        provider: 'stripe' as const,
        card: {
          number: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
        },
      };

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const addResult = await result.current.addPaymentMethod(newPaymentMethod);
        expect(addResult.success).toBe(true);
      });

      // Assert
      expect(result.current.paymentMethods).toHaveLength(1);
      expect(result.current.paymentMethods[0]).toEqual(mockPaymentMethod);
      expect(mockPaymentService.addPaymentMethod).toHaveBeenCalledWith(newPaymentMethod);
    });

    it('should handle add payment method failure', async () => {
      // Arrange
      mockPaymentService.addPaymentMethod.mockRejectedValue(new Error('Invalid card'));
      const newPaymentMethod = {
        type: 'card' as const,
        provider: 'stripe' as const,
        card: {
          number: '4000000000000002', // Declined card
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
        },
      };

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const addResult = await result.current.addPaymentMethod(newPaymentMethod);
        expect(addResult.success).toBe(false);
      });

      // Assert
      expect(result.current.paymentError).toContain('Invalid card');
      expect(result.current.paymentMethods).toHaveLength(0);
    });

    it('should validate card details before adding', async () => {
      // Arrange
      const invalidPaymentMethod = {
        type: 'card' as const,
        provider: 'stripe' as const,
        card: {
          number: '123', // Invalid card number
          expiryMonth: 13, // Invalid month
          expiryYear: 2020, // Expired
          cvv: '12', // Invalid CVV
        },
      };

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const addResult = await result.current.addPaymentMethod(invalidPaymentMethod);
        expect(addResult.success).toBe(false);
      });

      // Assert
      expect(result.current.paymentError).toContain('Invalid card details');
      expect(mockPaymentService.addPaymentMethod).not.toHaveBeenCalled();
    });
  });

  describe('Payment Method Validation', () => {
    it('should validate payment method successfully', async () => {
      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const validationResult = await result.current.validatePaymentMethod(mockPaymentMethod.id);
        expect(validationResult.isValid).toBe(true);
      });

      // Assert
      expect(mockPaymentService.validatePaymentMethod).toHaveBeenCalledWith(mockPaymentMethod.id);
    });

    it('should handle expired payment method', async () => {
      // Arrange
      mockPaymentService.validatePaymentMethod.mockResolvedValue({
        isValid: false,
        error: 'Card expired',
      });

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const validationResult = await result.current.validatePaymentMethod(mockPaymentMethod.id);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.error).toBe('Card expired');
      });

      // Assert
      expect(mockPaymentService.validatePaymentMethod).toHaveBeenCalledWith(mockPaymentMethod.id);
    });

    it('should handle validation service error', async () => {
      // Arrange
      mockPaymentService.validatePaymentMethod.mockRejectedValue(new Error('Service unavailable'));

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const validationResult = await result.current.validatePaymentMethod(mockPaymentMethod.id);
        expect(validationResult.isValid).toBe(false);
      });

      // Assert
      expect(validationResult.error).toContain('Service unavailable');
    });
  });

  describe('Payment Processing', () => {
    beforeEach(async () => {
      // Set up payment methods first
      const { result } = renderHook(() => useEnhancedAppStore());
      await act(async () => {
        await result.current.fetchPaymentMethods();
      });
    });

    it('should process payment successfully', async () => {
      // Arrange
      const paymentRequest = {
        amount: 36.25,
        currency: 'USD',
        paymentMethodId: mockPaymentMethod.id,
        rideId: 'ride-123',
      };

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const paymentResult = await result.current.processPayment(paymentRequest);
        expect(paymentResult.success).toBe(true);
      });

      // Assert
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith(paymentRequest);
      expect(result.current.isLoadingPayment).toBe(false);
    });

    it('should handle payment decline', async () => {
      // Arrange
      mockPaymentService.processPayment.mockResolvedValue({
        success: false,
        error: 'Insufficient funds',
      });

      const paymentRequest = {
        amount: 36.25,
        currency: 'USD',
        paymentMethodId: mockPaymentMethod.id,
        rideId: 'ride-123',
      };

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const paymentResult = await result.current.processPayment(paymentRequest);
        expect(paymentResult.success).toBe(false);
      });

      // Assert
      expect(paymentResult.error).toBe('Insufficient funds');
      expect(result.current.paymentError).toContain('Insufficient funds');
    });

    it('should prevent payment without selected method', async () => {
      // Arrange
      const { result } = renderHook(() => useEnhancedAppStore());
      
      // Clear selected payment method
      await act(async () => {
        result.current.setSelectedPaymentMethodId(null);
      });

      const paymentRequest = {
        amount: 36.25,
        currency: 'USD',
        paymentMethodId: mockPaymentMethod.id,
        rideId: 'ride-123',
      };

      // Act
      await act(async () => {
        const paymentResult = await result.current.processPayment(paymentRequest);
        expect(paymentResult.success).toBe(false);
      });

      // Assert
      expect(paymentResult.error?.userMessage).toContain('No payment method selected');
      expect(mockPaymentService.processPayment).not.toHaveBeenCalled();
    });

    it('should handle payment service error', async () => {
      // Arrange
      mockPaymentService.processPayment.mockRejectedValue(new Error('Payment gateway error'));

      const paymentRequest = {
        amount: 36.25,
        currency: 'USD',
        paymentMethodId: mockPaymentMethod.id,
        rideId: 'ride-123',
      };

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const paymentResult = await result.current.processPayment(paymentRequest);
        expect(paymentResult.success).toBe(false);
      });

      // Assert
      expect(paymentResult.error?.userMessage).toContain('Payment gateway error');
    });
  });

  describe('Payment Method Selection', () => {
    beforeEach(async () => {
      // Set up multiple payment methods
      const mockPaymentMethods = [
        mockPaymentMethod,
        {
          ...mockPaymentMethod,
          id: 'payment-456',
          isDefault: false,
          card: {
            ...mockPaymentMethod.card!,
            last4: '5555',
          },
        },
      ];

      mockPaymentService.getPaymentMethods.mockResolvedValue({
        success: true,
        data: mockPaymentMethods,
      });

      const { result } = renderHook(() => useEnhancedAppStore());
      await act(async () => {
        await result.current.fetchPaymentMethods();
      });
    });

    it('should change selected payment method', async () => {
      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        result.current.setSelectedPaymentMethodId('payment-456');
      });

      // Assert
      expect(result.current.selectedPaymentMethodId).toBe('payment-456');
    });

    it('should validate payment method when selecting', async () => {
      // Arrange
      mockPaymentService.validatePaymentMethod.mockResolvedValueOnce({
        isValid: false,
        error: 'Card expired',
      });

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        result.current.setSelectedPaymentMethodId('payment-456');
      });

      // Assert
      expect(result.current.selectedPaymentMethodId).toBe(mockPaymentMethod.id); // Should revert to valid method
    });
  });

  describe('Input Validation', () => {
    it('should reject payment with negative amount', async () => {
      // Arrange
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.fetchPaymentMethods();
      });

      const invalidPaymentRequest = {
        amount: -10,
        currency: 'USD',
        paymentMethodId: mockPaymentMethod.id,
        rideId: 'ride-123',
      };

      // Act
      await act(async () => {
        const paymentResult = await result.current.processPayment(invalidPaymentRequest);
        expect(paymentResult.success).toBe(false);
      });

      // Assert
      expect(paymentResult.error?.userMessage).toContain('Invalid payment amount');
      expect(mockPaymentService.processPayment).not.toHaveBeenCalled();
    });

    it('should reject payment with zero amount', async () => {
      // Arrange
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.fetchPaymentMethods();
      });

      const invalidPaymentRequest = {
        amount: 0,
        currency: 'USD',
        paymentMethodId: mockPaymentMethod.id,
        rideId: 'ride-123',
      };

      // Act
      await act(async () => {
        const paymentResult = await result.current.processPayment(invalidPaymentRequest);
        expect(paymentResult.success).toBe(false);
      });

      // Assert
      expect(paymentResult.error?.userMessage).toContain('Invalid payment amount');
    });

    it('should reject payment with invalid currency', async () => {
      // Arrange
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        await result.current.fetchPaymentMethods();
      });

      const invalidPaymentRequest = {
        amount: 36.25,
        currency: 'INVALID',
        paymentMethodId: mockPaymentMethod.id,
        rideId: 'ride-123',
      };

      // Act
      await act(async () => {
        const paymentResult = await result.current.processPayment(invalidPaymentRequest);
        expect(paymentResult.success).toBe(false);
      });

      // Assert
      expect(paymentResult.error?.userMessage).toContain('Invalid currency');
    });
  });
});
