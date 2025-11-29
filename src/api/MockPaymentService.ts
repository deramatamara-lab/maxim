/**
 * Mock Payment Service
 * Provides mock payment functionality for development and demo environments
 * Simulates payment processing with configurable delays and success/failure scenarios
 */

import { ApiResponse } from './client';
import { type IPaymentService } from './IPaymentService';
import { PaymentStateValidator } from './PaymentStateValidator';
import {
  PaymentMethodInfo,
  PaymentTransaction,
  PaymentRequest,
  PaymentResponse,
  FareCalculation,
  Receipt,
  RefundRequest,
  RefundResponse,
  TipRequest,
  DriverPayout,
  PaymentValidation,
  TransactionHistory,
  PaymentStatus,
} from './payment';

export class MockPaymentService implements IPaymentService {
  private mockPaymentMethods: PaymentMethodInfo[] = [
    {
      id: 'mock-card-1',
      type: 'credit_card',
      isDefault: true,
      isVerified: true,
      addedAt: new Date().toISOString(),
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2025,
      cardholderName: 'John Doe',
      token: 'tok_mock_visa',
      fingerprint: 'fp_mock_123',
    },
    {
      id: 'mock-wallet-1',
      type: 'digital_wallet',
      isDefault: false,
      isVerified: true,
      addedAt: new Date().toISOString(),
      provider: 'apple_pay',
      email: 'john@example.com',
      accountId: 'apple_mock_123',
      displayName: 'Apple Pay',
    },
  ];

  private mockTransactions: PaymentTransaction[] = [];

  // Configuration for mock behavior
  private config = {
    simulateDelays: true,
    defaultDelay: 1500,
    failureRate: 0.1, // 10% chance of failure for testing
  };

  /**
   * Simulate network delay for realistic testing
   */
  private async simulateDelay(customDelay?: number): Promise<void> {
    if (this.config.simulateDelays) {
      const delay = customDelay || this.config.defaultDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Simulate random failures for testing error scenarios
   */
  private shouldSimulateFailure(): boolean {
    return Math.random() < this.config.failureRate;
  }

  async processPayment(request: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
    await this.simulateDelay();

    // Check for existing payment with same idempotency key (mock implementation)
    const existingTransaction = this.mockTransactions.find(t => 
      t.metadata?.idempotencyKey === request.idempotencyKey
    );
    
    if (existingTransaction) {
      return {
        success: true,
        data: {
          id: existingTransaction.id,
          status: existingTransaction.status as PaymentStatus,
          amount: existingTransaction.amount,
          currency: existingTransaction.currency,
          processedAt: existingTransaction.updatedAt,
          retryAvailable: false,
          suggestedActions: [],
          paymentMethod: this.mockPaymentMethods.find(m => m.id === request.paymentMethodId) || this.mockPaymentMethods[0],
        },
      };
    }

    if (this.shouldSimulateFailure()) {
      const failureStatus: PaymentStatus = 'failed';
      const validation = PaymentStateValidator.validatePaymentState({
        id: `mock-failed-${Date.now()}`,
        status: failureStatus,
        amount: request.amount,
        currency: request.currency,
        failureReason: {
          type: 'card_declined',
          code: 'MOCK_DECLINE',
          message: 'Mock payment declined for testing',
          userFriendlyMessage: 'Payment was declined. Please try another payment method.',
          isRetryable: true,
          requiresUserAction: false,
        },
        retryAvailable: true,
        suggestedActions: [
          {
            type: 'retry',
            label: 'Try Again',
            description: 'Attempt the payment again',
            priority: 'high',
          },
        ],
        paymentMethod: this.mockPaymentMethods.find(m => m.id === request.paymentMethodId) || this.mockPaymentMethods[0],
      });

      return {
        success: false,
        data: {
          id: `mock-failed-${Date.now()}`,
          status: failureStatus,
          amount: request.amount,
          currency: request.currency,
          failureReason: {
            type: 'card_declined',
            code: 'MOCK_DECLINE',
            message: 'Mock payment declined for testing',
            userFriendlyMessage: validation.userMessage,
            isRetryable: validation.canRetry,
            requiresUserAction: validation.requiresAction,
          },
          retryAvailable: validation.canRetry,
          suggestedActions: validation.canRetry ? [
            {
              type: 'retry',
              label: 'Try Again',
              description: 'Attempt the payment again',
              priority: 'high',
            },
          ] : [],
          paymentMethod: this.mockPaymentMethods.find(m => m.id === request.paymentMethodId) || this.mockPaymentMethods[0],
        },
        error: validation.technicalMessage,
      };
    }

    const successStatus: PaymentStatus = 'succeeded';
    const transaction: PaymentTransaction = {
      id: `mock-tx-${Date.now()}`,
      rideId: request.rideId,
      amount: request.amount,
      currency: request.currency,
      status: successStatus,
      paymentMethodId: request.paymentMethodId,
      createdAt: new Date().toISOString(),
      metadata: { idempotencyKey: request.idempotencyKey },
    };

    this.mockTransactions.push(transaction);

    const _validation = PaymentStateValidator.validatePaymentState({
      id: transaction.id,
      status: successStatus,
      amount: request.amount,
      currency: request.currency,
      processedAt: new Date().toISOString(),
      retryAvailable: false,
      suggestedActions: [],
      paymentMethod: this.mockPaymentMethods.find(m => m.id === request.paymentMethodId) || this.mockPaymentMethods[0],
    });

    return {
      success: true,
      data: {
        id: transaction.id,
        status: successStatus,
        amount: request.amount,
        currency: request.currency,
        processedAt: new Date().toISOString(),
        retryAvailable: false,
        suggestedActions: [],
        paymentMethod: this.mockPaymentMethods.find(m => m.id === request.paymentMethodId) || this.mockPaymentMethods[0],
      },
    };
  }

  async validatePayment(_request: PaymentRequest): Promise<ApiResponse<PaymentValidation>> {
    await this.simulateDelay(500);

    return {
      success: true,
      data: {
        isValid: true,
        errors: [],
        warnings: [],
        fraudRisk: {
          level: 'low',
          factors: [],
          requiresVerification: false,
        },
      },
    };
  }

  async getPaymentMethods(_userId: string): Promise<ApiResponse<PaymentMethodInfo[]>> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: [...this.mockPaymentMethods],
    };
  }

  async addPaymentMethod(method: Omit<PaymentMethodInfo, 'id' | 'isVerified' | 'addedAt'>): Promise<ApiResponse<PaymentMethodInfo>> {
    await this.simulateDelay(800);

    let newMethod: PaymentMethodInfo;
    
    if (method.type === 'cash') {
      newMethod = {
        ...method,
        id: `mock-method-${Date.now()}`,
        addedAt: new Date().toISOString(),
        isVerified: true,
        preferredCurrency: 'USD',
        requiresChange: true,
      } as PaymentMethodInfo;
    } else if (method.type === 'digital_wallet') {
      const walletMethod = method as {
        type: 'digital_wallet';
        provider?: string;
        email?: string;
        accountId?: string;
        displayName?: string;
      };
      newMethod = {
        ...method,
        id: `mock-method-${Date.now()}`,
        addedAt: new Date().toISOString(),
        isVerified: true,
        provider: walletMethod.provider || 'apple_pay',
        email: walletMethod.email || 'mock@example.com',
        accountId: walletMethod.accountId || 'mock-account-123',
        displayName: walletMethod.displayName || 'Digital Wallet',
      } as PaymentMethodInfo;
    } else {
      // credit_card or debit_card
      const cardMethod = method as {
        type: 'credit_card' | 'debit_card';
        last4?: string;
        brand?: string;
        expiryMonth?: number;
        expiryYear?: number;
        cardholderName?: string;
        token?: string;
        fingerprint?: string;
      };
      newMethod = {
        ...method,
        id: `mock-method-${Date.now()}`,
        addedAt: new Date().toISOString(),
        isVerified: true,
        last4: cardMethod.last4 || '4242',
        brand: cardMethod.brand || 'visa',
        expiryMonth: cardMethod.expiryMonth || 12,
        expiryYear: cardMethod.expiryYear || 2025,
        cardholderName: cardMethod.cardholderName || 'John Doe',
        token: cardMethod.token || 'tok_mock_visa',
        fingerprint: cardMethod.fingerprint || 'fp_mock_123',
      } as PaymentMethodInfo;
    }

    this.mockPaymentMethods.push(newMethod);
    return {
      success: true,
      data: newMethod,
    };
  }

  async updatePaymentMethod(id: string, updates: Partial<PaymentMethodInfo>): Promise<ApiResponse<PaymentMethodInfo>> {
    await this.simulateDelay(500);
    
    const methodIndex = this.mockPaymentMethods.findIndex(m => m.id === id);
    if (methodIndex === -1) {
      return {
        success: false,
        error: 'Payment method not found',
      };
    }

    const updatedMethod = { ...this.mockPaymentMethods[methodIndex], ...updates } as PaymentMethodInfo;
    this.mockPaymentMethods[methodIndex] = updatedMethod;
    
    return {
      success: true,
      data: updatedMethod,
    };
  }

  async deletePaymentMethod(id: string): Promise<ApiResponse<void>> {
    await this.simulateDelay(500);
    this.mockPaymentMethods = this.mockPaymentMethods.filter(m => m.id !== id);
    return {
      success: true,
    };
  }

  async setDefaultPaymentMethod(methodId: string): Promise<ApiResponse<void>> {
    await this.simulateDelay(300);
    this.mockPaymentMethods.forEach(method => {
      method.isDefault = method.id === methodId;
    });
    return {
      success: true,
    };
  }

  async getTransaction(transactionId: string): Promise<ApiResponse<PaymentTransaction>> {
    await this.simulateDelay(400);
    const transaction = this.mockTransactions.find(t => t.id === transactionId);
    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }
    return {
      success: true,
      data: transaction,
    };
  }

  async getTransactionHistory(
    page = 1,
    limit = 20,
    type?: string,
    dateRange?: {
      startDate: string;
      endDate: string;
    }
  ): Promise<ApiResponse<{
    transactions: TransactionHistory[];
    total: number;
    page: number;
    totalPages: number;
  }>> {
    await this.simulateDelay(600);
    
    // Filter by type if specified
    let filteredTransactions = this.mockTransactions;
    if (type) {
      filteredTransactions = filteredTransactions.filter(t => t.status === type);
    }
    
    // Filter by date range if specified
    if (dateRange) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      filteredTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    const history = paginatedTransactions.map(t => ({
      id: t.id,
      type: 'payment' as const,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      description: `Payment for ride ${t.rideId}`,
      rideId: t.rideId,
      createdAt: t.createdAt,
      receiptAvailable: t.status === 'succeeded',
    }));
    
    return {
      success: true,
      data: {
        transactions: history,
        total: filteredTransactions.length,
        page,
        totalPages: Math.ceil(filteredTransactions.length / limit),
      },
    };
  }

  async getReceipt(rideId: string): Promise<ApiResponse<Receipt>> {
    await this.simulateDelay(500);
    const transaction = this.mockTransactions.find(t => t.rideId === rideId);
    
    if (!transaction) {
      return {
        success: false,
        error: 'Receipt not found',
      };
    }

    return {
      success: true,
      data: {
        id: `mock-receipt-${rideId}`,
        rideId,
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: {
          type: 'credit_card',
          last4: '4242',
          brand: 'visa',
        },
        fare: {
          base: 10.00,
          distance: 5.50,
          time: 2.00,
          total: transaction.amount,
          currency: transaction.currency,
        },
        status: 'paid',
        createdAt: transaction.createdAt,
      },
    };
  }

  async downloadReceipt(paymentId: string, format: 'pdf' | 'html' = 'pdf'): Promise<ApiResponse<{ url: string; expiresAt: string }>> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: {
        url: `https://mock.example.com/receipts/${paymentId}.${format}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      },
    };
  }

  async processRefund(request: RefundRequest): Promise<ApiResponse<RefundResponse>> {
    await this.simulateDelay(1000);

    return {
      success: true,
      data: {
        id: `mock-refund-${Date.now()}`,
        originalPaymentId: request.paymentId,
        status: 'completed',
        amount: request.amount || 25.00, // Mock amount
        reason: request.reason,
        processedAt: new Date().toISOString(),
      },
    };
  }

  async getRefundStatus(refundId: string): Promise<ApiResponse<RefundResponse>> {
    await this.simulateDelay(400);
    return {
      success: true,
      data: {
        id: refundId,
        originalPaymentId: 'mock-payment-123',
        status: 'completed',
        amount: 25.00,
        reason: 'Customer request',
        processedAt: new Date().toISOString(),
      },
    };
  }

  async addTip(request: TipRequest): Promise<ApiResponse<PaymentResponse>> {
    await this.simulateDelay(800);

    return {
      success: true,
      data: {
        id: `mock-tip-${Date.now()}`,
        status: 'succeeded',
        amount: request.amount,
        currency: 'USD',
        processedAt: new Date().toISOString(),
        retryAvailable: false,
        suggestedActions: [],
        paymentMethod: this.mockPaymentMethods.find(m => m.id === request.paymentMethodId) || this.mockPaymentMethods[0],
      },
    };
  }

  async getDriverPayouts(driverId: string): Promise<ApiResponse<DriverPayout[]>> {
    await this.simulateDelay(600);
    return {
      success: true,
      data: [
        {
          id: 'mock-payout-1',
          driverId,
          rideId: 'mock-ride-1',
          grossEarnings: 20.00,
          commission: 3.00,
          netEarnings: 17.00,
          status: 'completed',
          scheduledFor: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          method: 'bank_transfer',
        },
      ],
    };
  }

  async requestPayout(driverId: string, rideId: string): Promise<ApiResponse<DriverPayout>> {
    await this.simulateDelay(800);

    return {
      success: true,
      data: {
        id: `mock-payout-${Date.now()}`,
        driverId,
        rideId,
        grossEarnings: 20.00,
        commission: 3.00,
        netEarnings: 17.00,
        status: 'pending',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        method: 'bank_transfer',
      },
    };
  }

  async calculateFare(rideData: {
    distance: number;
    duration: number;
    baseFare: number;
    surgeMultiplier?: number;
    tip?: number;
  }): Promise<ApiResponse<FareCalculation>> {
    await this.simulateDelay(300);

    const { distance, duration, baseFare, surgeMultiplier = 1, tip = 0 } = rideData;
    
    const distanceCharge = distance * 2.50; // $2.50 per mile/km
    const timeCharge = duration * 0.50; // $0.50 per minute
    const surgeAmount = (baseFare + distanceCharge + timeCharge) * (surgeMultiplier - 1);
    const subtotal = baseFare + distanceCharge + timeCharge + surgeAmount;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax + tip;

    return {
      success: true,
      data: {
        base: baseFare,
        distance: distanceCharge,
        time: timeCharge,
        surge: surgeAmount,
        taxes: tax,
        tip,
        total,
        currency: 'USD',
        breakdown: [
          { type: 'Base Fare', amount: baseFare, description: 'Starting fare' },
          { type: 'Distance', amount: distanceCharge, description: `${distance} miles` },
          { type: 'Time', amount: timeCharge, description: `${duration} minutes` },
          ...(surgeAmount > 0 ? [{ type: 'Surge Pricing', amount: surgeAmount, description: `${surgeMultiplier}x multiplier` }] : []),
          { type: 'Tax', amount: tax, description: '8% tax' },
          ...(tip > 0 ? [{ type: 'Tip', amount: tip, description: 'Driver tip' }] : []),
        ],
      },
    };
  }

  // Configuration methods for testing
  setConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config };
  }

  resetMockData(): void {
    this.mockTransactions = [];
    this.mockPaymentMethods = this.mockPaymentMethods.slice(0, 2); // Keep original cards
  }
}
