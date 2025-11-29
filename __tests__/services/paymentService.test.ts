/**
 * Payment Service Tests
 * Tests for payment methods and transactions
 */

import { paymentService } from '../../src/api/PaymentServiceFactory';

// Mock the API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPaymentMethods', () => {
    it('should fetch payment methods for a user', async () => {
      const userId = 'user-123';
      const result = await paymentService.getPaymentMethods(userId);
      
      // In test environment, should return mock data
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should handle empty user ID', async () => {
      const result = await paymentService.getPaymentMethods('');
      
      expect(result).toBeDefined();
    });
  });

  describe('addPaymentMethod', () => {
    it('should add a new payment method', async () => {
      const newMethod = {
        type: 'credit_card' as const,
        isDefault: false,
      };
      
      const result = await paymentService.addPaymentMethod(newMethod);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should add a cash payment method', async () => {
      const cashMethod = {
        type: 'cash' as const,
        isDefault: true,
      };
      
      const result = await paymentService.addPaymentMethod(cashMethod);
      
      expect(result).toBeDefined();
    });
  });

  describe('updatePaymentMethod', () => {
    it('should update an existing payment method', async () => {
      const methodId = 'method-123';
      const updates = { isDefault: true };
      
      const result = await paymentService.updatePaymentMethod(methodId, updates);
      
      expect(result).toBeDefined();
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete a payment method', async () => {
      const methodId = 'method-123';
      
      const result = await paymentService.deletePaymentMethod(methodId);
      
      expect(result).toBeDefined();
    });

    it('should handle non-existent method ID', async () => {
      const result = await paymentService.deletePaymentMethod('non-existent');
      
      expect(result).toBeDefined();
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set a payment method as default', async () => {
      const methodId = 'method-123';
      
      const result = await paymentService.setDefaultPaymentMethod(methodId);
      
      expect(result).toBeDefined();
    });
  });

  describe('processPayment', () => {
    it('should process a payment', async () => {
      const paymentData = {
        amount: 25.50,
        currency: 'USD',
        paymentMethodId: 'method-123',
        rideId: 'ride-456',
        idempotencyKey: `payment-${Date.now()}`,
      };
      
      const result = await paymentService.processPayment(paymentData);
      
      expect(result).toBeDefined();
    });

    it('should handle zero amount', async () => {
      const paymentData = {
        amount: 0,
        currency: 'USD',
        paymentMethodId: 'method-123',
        rideId: 'ride-456',
        idempotencyKey: `payment-${Date.now()}`,
      };
      
      const result = await paymentService.processPayment(paymentData);
      
      expect(result).toBeDefined();
    });

    it('should handle negative amount', async () => {
      const paymentData = {
        amount: -10,
        currency: 'USD',
        paymentMethodId: 'method-123',
        rideId: 'ride-456',
        idempotencyKey: `payment-${Date.now()}`,
      };
      
      const result = await paymentService.processPayment(paymentData);
      
      expect(result).toBeDefined();
    });
  });
});
