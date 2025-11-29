/**
 * Payment Service - Web Stub
 * Payment functionality not available on web platform
 */

import {
  PaymentTransaction,
  PaymentMethodInfo,
  FareCalculation,
} from '../api/payment';
import { log } from '../utils/logger';

// Mock payment service for web platform
class MockPaymentService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
    log.info('Payment service initialized (web stub)');
  }

  async getPaymentMethods(): Promise<PaymentMethodInfo[]> {
    // Return empty array for web platform
    return [];
  }

  async addPaymentMethod(_method: unknown): Promise<PaymentMethodInfo> {
    throw new Error('Payment methods cannot be added on web platform');
  }

  async removePaymentMethod(_id: string): Promise<void> {
    throw new Error('Payment methods cannot be removed on web platform');
  }

  async processPayment(_params: {
    rideId: string;
    amount: number;
    currency: string;
    paymentMethodId: string;
    description?: string;
  }): Promise<PaymentTransaction> {
    throw new Error('Payment processing not available on web platform');
  }

  async calculateFare(_params: {
    pickupLocation: { lat: number; lon: number };
    dropoffLocation: { lat: number; lon: number };
    rideOptionId: string;
  }): Promise<FareCalculation> {
    // Return mock fare calculation for web platform
    return {
      base: 5.0,
      distance: 10.0,
      time: 2.0,
      total: 17.0,
      currency: 'BGN',
    };
  }

  async refundPayment(_transactionId: string): Promise<PaymentTransaction> {
    throw new Error('Refunds not available on web platform');
  }

  async getPaymentHistory(): Promise<PaymentTransaction[]> {
    return [];
  }

  async validatePaymentMethod(_method: unknown): Promise<boolean> {
    return false;
  }

  // Stub methods for compilation - not implemented on web platform
  async generateReceipt(_transactionId: string): Promise<PaymentTransaction> {
    throw new Error('Receipt generation not available on web platform');
  }

  async emailReceipt(_receiptId: string, _emailAddress: string): Promise<void> {
    throw new Error('Email receipt not available on web platform');
  }

  async refundTransaction(_transactionId: string): Promise<PaymentTransaction> {
    throw new Error('Refunds not available on web platform');
  }

  async setDefaultPaymentMethod(_paymentMethodId: string): Promise<void> {
    throw new Error('Setting default payment method not available on web platform');
  }

  cleanup(): void {
    this.isInitialized = false;
  }
}

// Export singleton instance and types
export const paymentService = new MockPaymentService();
export const payment = paymentService; // Add payment export
export default paymentService;

// Export Receipt type from payment API
export { PaymentTransaction as Receipt } from '../api/payment';
