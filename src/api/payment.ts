/**
 * Real Payment Service
 * Production payment processing with Stripe/PSP integration
 * Enhanced with state validation and idempotency protection
 */

import { apiClient, ApiResponse } from './client';
import { type IPaymentService } from './IPaymentService';
import { PaymentStateValidator } from './PaymentStateValidator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '../utils/logger';

export interface PaymentMethod {
  id: string;
  type: 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet';
  isDefault: boolean;
  isVerified: boolean;
  addedAt: string;
}

export interface CardPaymentMethod extends PaymentMethod {
  type: 'credit_card' | 'debit_card';
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unionpay';
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  token: string; // Stripe/payment processor token
  fingerprint: string; // For fraud detection
}

export interface DigitalWalletPaymentMethod extends PaymentMethod {
  type: 'digital_wallet';
  provider: 'apple_pay' | 'google_pay' | 'paypal' | 'venmo' | 'cash_app';
  email?: string;
  accountId: string;
  displayName: string;
}

export interface CashPaymentMethod extends PaymentMethod {
  type: 'cash';
  preferredCurrency: string;
  requiresChange: boolean;
}

export type PaymentMethodInfo = CardPaymentMethod | DigitalWalletPaymentMethod | CashPaymentMethod;

// Additional interfaces needed by components (from excluded paymentService.ts)
export type PaymentType = 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet';

export interface PaymentTransaction {
  id: string;
  rideId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  paymentMethodId: string;
  createdAt: string;
  updatedAt?: string; // From original API version
  processedAt?: string; // From services version
  failureReason?: string;
  refundAmount?: number; // From services version
  refundReason?: string; // From services version
  receiptUrl?: string; // From services version
  stripePaymentIntentId?: string; // From services version
  metadata?: Record<string, unknown>; // From original API version
}

// Standardized payment status enum for consistency across Transaction and Response
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'requires_action';

export interface FareCalculation {
  base: number;
  distance: number;
  time: number;
  tip?: number;
  surge?: number; // Surge pricing amount in dollars (e.g., 5.00), not percentage or multiplier
  tolls?: number;
  taxes?: number;
  discount?: number;
  total: number;
  currency: string;
  breakdown?: {
    type: string;
    amount: number;
    description: string;
  }[];
}

export interface Receipt {
  id: string;
  rideId: string;
  transactionId: string;
  amount: number;
  currency: string;
  paymentMethod: {
    type: PaymentType;
    last4?: string;
    brand?: string;
  };
  fare: FareCalculation;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  url?: string; // Download URL
  emailedAt?: string;
  metadata?: Record<string, unknown>; // Enhanced receipt data for tax compliance
}

export interface PaymentRequest {
  idempotencyKey: string; // Prevents double charges
  rideId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  tip?: number;
  metadata?: {
    breakdown: {
      baseFare: number;
      distance: number;
      time: number;
      surge: number;
      serviceFee: number;
      tax: number;
    };
    promoCode?: string;
    discountAmount?: number;
    userId?: string; // Required for user-scoped operations
  };
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus; // Using standardized enum
  amount: number;
  currency: string;
  processedAt?: string;
  failureReason?: PaymentFailureReason;
  retryAvailable: boolean;
  suggestedActions: PaymentAction[];
  fallbackMethodsUsed?: string[];
  paymentMethod: PaymentMethodInfo;
}

export interface PaymentFailureReason {
  type: 'card_declined' | 'insufficient_funds' | 'network_error' | 'fraud_block' | 'expired_card' | 'invalid_cvv' | 'processing_error' | 'timeout';
  code: string;
  message: string;
  userFriendlyMessage: string;
  isRetryable: boolean;
  requiresUserAction: boolean;
  suggestedWaitTime?: number; // in minutes
}

export interface PaymentAction {
  type: 'retry' | 'try_different_card' | 'use_cash' | 'update_card_details' | 'contact_support' | 'wait_and_retry';
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // If not provided, full refund
  reason: string;
  initiatedBy: 'rider' | 'driver' | 'system' | 'support';
}

export interface RefundResponse {
  id: string;
  originalPaymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  reason: string;
  processedAt?: string;
  estimatedCompletion?: string;
}

export interface TipRequest {
  rideId: string;
  amount: number;
  paymentMethodId: string;
  isPercentage: boolean;
}

export interface DriverPayout {
  id: string;
  driverId: string;
  rideId: string;
  grossEarnings: number;
  commission: number;
  netEarnings: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledFor: string;
  processedAt?: string;
  method: 'bank_transfer' | 'debit_card' | 'instant_pay';
}

export interface PaymentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAmount?: number;
  currencyValidation?: {
    supported: boolean;
    recommendedCurrency: string;
    exchangeRate?: number;
  };
  fraudRisk?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    requiresVerification: boolean;
  };
}

export interface PaymentRetryConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackMethods: string[];
  requiresVerification: boolean;
}

export interface TransactionHistory {
  id: string;
  type: 'payment' | 'refund' | 'tip' | 'payout' | 'adjustment';
  amount: number;
  currency: string;
  status: string;
  description: string;
  rideId?: string;
  createdAt: string;
  receiptAvailable: boolean;
}

export class RealPaymentService implements IPaymentService {
  private readonly PAYMENT_RETRY_CONFIGS: Record<string, PaymentRetryConfig> = {
    'credit_card': {
      maxRetries: 2,
      retryDelay: 5000,
      fallbackMethods: ['debit_card', 'digital_wallet'],
      requiresVerification: false,
    },
    'debit_card': {
      maxRetries: 2,
      retryDelay: 3000,
      fallbackMethods: ['credit_card', 'digital_wallet'],
      requiresVerification: false,
    },
    'digital_wallet': {
      maxRetries: 3,
      retryDelay: 2000,
      fallbackMethods: ['credit_card', 'debit_card'],
      requiresVerification: false,
    },
    'cash': {
      maxRetries: 1,
      retryDelay: 1000,
      fallbackMethods: [],
      requiresVerification: true,
    },
  };

  /**
   * Enhanced payment processing with device-side validation and smart retry
   * Integrates PaymentStateValidator for comprehensive state management
   */
  async processPaymentWithRetry(request: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
    // Validate idempotency key is present
    if (!request.idempotencyKey) {
      return {
        success: false,
        error: 'MISSING_IDEMPOTENCY_KEY',
        message: 'Idempotency key is required to prevent duplicate charges',
      };
    }

    // Device-side validation first
    const validation = await this.validatePaymentEnhanced(request);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        message: 'Payment validation failed',
      };
    }

    // Check fraud risk
    if (validation.fraudRisk?.level === 'high') {
      return {
        success: false,
        error: 'High fraud risk detected',
        message: 'Additional verification required. Please contact support.',
      };
    }

    let attemptCount = 0;
    const maxRetries = PaymentStateValidator.getRetryConfig().maxRetries;

    while (attemptCount <= maxRetries) {
      try {
        // Process payment with idempotency key
        const response = await this.processPayment(request);
        
        if (!response.success) {
          return response;
        }

        // Validate payment state using PaymentStateValidator
        const stateValidation = PaymentStateValidator.validatePaymentState(
          response.data!,
          attemptCount
        );

        // If payment succeeded or requires user action, return response
        if (stateValidation.isValid || stateValidation.requiresAction) {
          return response;
        }

        // If payment failed but can be retried
        if (stateValidation.canRetry && attemptCount < maxRetries) {
          attemptCount++;
          const retryDelay = PaymentStateValidator.calculateRetryDelay(attemptCount);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // Cannot retry or max retries reached
        return {
          success: false,
          error: 'PAYMENT_FAILED_NO_RETRY',
          message: stateValidation.userMessage,
        };

      } catch {
        if (attemptCount >= maxRetries) {
          return {
            success: false,
            error: 'PAYMENT_ERROR_MAX_RETRIES',
            message: 'Payment failed after maximum retry attempts. Please try again later.',
          };
        }

        attemptCount++;
        const retryDelay = PaymentStateValidator.calculateRetryDelay(attemptCount);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return {
      success: false,
      error: 'PAYMENT_FAILED',
      message: 'Payment processing failed. Please try again.',
    };
  }

  /**
   * Process payment with fallback methods and enhanced error classification
   */
  private async processPaymentWithFallback(
    request: PaymentRequest,
    paymentMethod: PaymentMethodInfo
  ): Promise<ApiResponse<PaymentResponse>> {
    const retryConfig = this.PAYMENT_RETRY_CONFIGS[paymentMethod.type] || this.PAYMENT_RETRY_CONFIGS['credit_card'];
    let lastError: string = '';
    let lastErrorType: PaymentFailureReason['type'] = 'processing_error';
    let fallbackMethodsUsed: string[] = [];

    // Try primary payment method with error classification
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await this.processPayment(request);
        if (result.success) {
          return {
            ...result,
            data: result.data ? {
              ...result.data,
              retryAvailable: false,
              suggestedActions: [],
            } : undefined,
          };
        }
        
        lastError = result.error || 'Payment failed';
        lastErrorType = this.classifyPaymentError(lastError);
        
        // For certain error types, don't retry
        if (!this.isRetryableError(lastErrorType)) {
          break;
        }
        
        // Wait before retry (except for last attempt)
        if (attempt < retryConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown payment error';
        lastErrorType = this.classifyPaymentError(lastError);
      }
    }

    // Try fallback payment methods
    for (const fallbackMethodId of retryConfig.fallbackMethods) {
      try {
        const fallbackRequest = { ...request, paymentMethodId: fallbackMethodId };
        const result = await this.processPayment(fallbackRequest);
        if (result.success) {
          fallbackMethodsUsed.push(fallbackMethodId);
          return {
            ...result,
            data: result.data ? {
              ...result.data,
              fallbackMethodsUsed,
              retryAvailable: false,
              suggestedActions: [],
            } : undefined,
          };
        }
      } catch (error) {
        log.warn('Fallback payment method also failed', { event: 'fallback_payment_failed', component: 'paymentApi', fallbackMethodId }, error);
      }
    }

    // All methods failed - return structured error with recovery suggestions
    const failureReason = this.createFailureReason(lastErrorType, lastError);
    const suggestedActions = this.generateSuggestedActions(lastErrorType, paymentMethod);

    return {
      success: false,
      error: lastError,
      data: {
        id: `failed_${Date.now()}`,
        status: 'failed',
        amount: request.amount,
        currency: request.currency,
        processedAt: new Date().toISOString(),
        failureReason,
        retryAvailable: failureReason.isRetryable,
        suggestedActions,
        fallbackMethodsUsed: fallbackMethodsUsed.length > 0 ? fallbackMethodsUsed : undefined,
        paymentMethod,
      },
      message: failureReason.userFriendlyMessage,
    };
  }

  /**
   * Classify payment errors into actionable categories
   */
  private classifyPaymentError(error: string): PaymentFailureReason['type'] {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('declined') || lowerError.includes('do not honor')) {
      return 'card_declined';
    }
    if (lowerError.includes('insufficient') || lowerError.includes('funds')) {
      return 'insufficient_funds';
    }
    if (lowerError.includes('expired') || lowerError.includes('expiration')) {
      return 'expired_card';
    }
    if (lowerError.includes('cvv') || lowerError.includes('security code')) {
      return 'invalid_cvv';
    }
    if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('timeout')) {
      return 'network_error';
    }
    if (lowerError.includes('fraud') || lowerError.includes('blocked') || lowerError.includes('suspicious')) {
      return 'fraud_block';
    }
    if (lowerError.includes('timeout')) {
      return 'timeout';
    }
    
    return 'processing_error';
  }

  /**
   * Determine if an error type is retryable
   */
  private isRetryableError(errorType: PaymentFailureReason['type']): boolean {
    const retryableErrors = ['network_error', 'processing_error', 'timeout'];
    return retryableErrors.includes(errorType);
  }

  /**
   * Create structured failure reason with user-friendly messaging
   */
  private createFailureReason(
    errorType: PaymentFailureReason['type'],
    originalMessage: string
  ): PaymentFailureReason {
    const reasons: Record<PaymentFailureReason['type'], Omit<PaymentFailureReason, 'type'>> = {
      card_declined: {
        code: 'CARD_DECLINED',
        message: originalMessage,
        userFriendlyMessage: 'Your card was declined. Please try a different payment method or contact your bank.',
        isRetryable: false,
        requiresUserAction: true,
      },
      insufficient_funds: {
        code: 'INSUFFICIENT_FUNDS',
        message: originalMessage,
        userFriendlyMessage: 'Insufficient funds. Please use a different payment method or add funds to your account.',
        isRetryable: false,
        requiresUserAction: true,
      },
      expired_card: {
        code: 'EXPIRED_CARD',
        message: originalMessage,
        userFriendlyMessage: 'Your card has expired. Please update your card details or use a different payment method.',
        isRetryable: false,
        requiresUserAction: true,
      },
      invalid_cvv: {
        code: 'INVALID_CVV',
        message: originalMessage,
        userFriendlyMessage: 'Invalid security code. Please check your card details and try again.',
        isRetryable: true,
        requiresUserAction: true,
      },
      network_error: {
        code: 'NETWORK_ERROR',
        message: originalMessage,
        userFriendlyMessage: 'Network connection issue. Please check your connection and try again.',
        isRetryable: true,
        requiresUserAction: false,
        suggestedWaitTime: 1,
      },
      fraud_block: {
        code: 'FRAUD_BLOCK',
        message: originalMessage,
        userFriendlyMessage: 'Payment blocked for security reasons. Please contact support or try a different payment method.',
        isRetryable: false,
        requiresUserAction: true,
      },
      processing_error: {
        code: 'PROCESSING_ERROR',
        message: originalMessage,
        userFriendlyMessage: 'Payment processing failed. Please try again or use a different payment method.',
        isRetryable: true,
        requiresUserAction: false,
        suggestedWaitTime: 2,
      },
      timeout: {
        code: 'TIMEOUT',
        message: originalMessage,
        userFriendlyMessage: 'Payment timed out. Please try again with a better connection.',
        isRetryable: true,
        requiresUserAction: false,
        suggestedWaitTime: 1,
      },
    };

    return {
      type: errorType,
      ...reasons[errorType],
    };
  }

  /**
   * Generate suggested actions based on error type and payment method
   */
  private generateSuggestedActions(
    errorType: PaymentFailureReason['type'],
    _paymentMethod: PaymentMethodInfo
  ): PaymentAction[] {
    const actions: PaymentAction[] = [];

    switch (errorType) {
      case 'card_declined':
        actions.push({
          type: 'try_different_card',
          label: 'Try Different Card',
          description: 'Use another payment method',
          priority: 'high',
        });
        actions.push({
          type: 'use_cash',
          label: 'Pay with Cash',
          description: 'Switch to cash payment',
          priority: 'medium',
        });
        break;

      case 'insufficient_funds':
        actions.push({
          type: 'try_different_card',
          label: 'Try Different Card',
          description: 'Use a card with sufficient funds',
          priority: 'high',
        });
        break;

      case 'expired_card':
      case 'invalid_cvv':
        actions.push({
          type: 'update_card_details',
          label: 'Update Card Details',
          description: 'Fix the card information',
          priority: 'high',
        });
        actions.push({
          type: 'try_different_card',
          label: 'Try Different Card',
          description: 'Use another payment method',
          priority: 'medium',
        });
        break;

      case 'network_error':
      case 'processing_error':
      case 'timeout':
        actions.push({
          type: 'retry',
          label: 'Try Again',
          description: 'Retry the payment',
          priority: 'high',
        });
        actions.push({
          type: 'wait_and_retry',
          label: 'Wait and Retry',
          description: 'Wait a moment and try again',
          priority: 'medium',
        });
        break;

      case 'fraud_block':
        actions.push({
          type: 'contact_support',
          label: 'Contact Support',
          description: 'Get help with payment verification',
          priority: 'high',
        });
        actions.push({
          type: 'try_different_card',
          label: 'Try Different Card',
          description: 'Use another payment method',
          priority: 'medium',
        });
        break;
    }

    return actions;
  }

  /**
   * Enhanced payment validation with fraud detection
   */
  async validatePaymentEnhanced(request: PaymentRequest): Promise<PaymentValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fraudFactors: string[] = [];

    // Basic validation
    const basicErrors = this.validatePaymentRequest(request);
    errors.push(...basicErrors);

    // Amount validation with business rules
    if (request.amount > 5000) {
      warnings.push('Large payment amount detected');
      fraudFactors.push('high_amount');
    }

    if (request.amount < 1) {
      errors.push('Minimum payment amount is $1.00');
    }

    // Currency validation
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
    if (!supportedCurrencies.includes(request.currency)) {
      errors.push(`Currency ${request.currency} is not supported`);
    }

    // Tip validation
    if (request.tip && request.tip > request.amount * 0.5) {
      warnings.push('Tip amount exceeds 50% of ride cost');
      fraudFactors.push('excessive_tip');
    }

    // Ride ID format validation
    if (!/^[a-zA-Z0-9_-]{10,50}$/.test(request.rideId)) {
      errors.push('Invalid ride ID format');
    }

    // Check for rapid successive payments (fraud prevention)
    const recentPayments = await this.getRecentPaymentAttempts();
    if (recentPayments.length > 3) {
      fraudFactors.push('rapid_payments');
      errors.push('Too many payment attempts. Please wait before trying again.');
    }

    // Determine fraud risk level
    let fraudLevel: 'low' | 'medium' | 'high' = 'low';
    let requiresVerification = false;

    if (fraudFactors.length >= 3) {
      fraudLevel = 'high';
      requiresVerification = true;
    } else if (fraudFactors.length >= 1) {
      fraudLevel = 'medium';
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fraudRisk: fraudFactors.length > 0 ? {
        level: fraudLevel,
        factors: fraudFactors,
        requiresVerification,
      } : undefined,
    };
  }

  /**
   * Get recent payment attempts for fraud detection
   */
  private async getRecentPaymentAttempts(): Promise<Array<{ timestamp: number; amount: number }>> {
    try {
      const stored = await AsyncStorage.getItem('recentPaymentAttempts');
      if (!stored) return [];

      const attempts = JSON.parse(stored);
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      // Filter to last hour and clean old entries
      const recentAttempts = attempts.filter((attempt: { timestamp: number }) => 
        attempt.timestamp > oneHourAgo
      );

      // Update storage with cleaned list
      await AsyncStorage.setItem('recentPaymentAttempts', JSON.stringify(recentAttempts));
      
      return recentAttempts;
    } catch (error) {
      log.error('Failed to get recent payment attempts', { event: 'get_recent_payment_attempts_failed', component: 'paymentApi' }, error);
      return [];
    }
  }

  /**
   * Record payment attempt for fraud detection
   */
  private async recordPaymentAttempt(amount: number): Promise<void> {
    try {
      const attempts = await this.getRecentPaymentAttempts();
      attempts.push({
        timestamp: Date.now(),
        amount,
      });

      // Keep only last 24 hours of attempts
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const validAttempts = attempts.filter(attempt => attempt.timestamp > oneDayAgo);

      await AsyncStorage.setItem('recentPaymentAttempts', JSON.stringify(validAttempts));
    } catch (error) {
      log.error('Failed to record payment attempt', { event: 'record_payment_attempt_failed', component: 'paymentApi' }, error);
    }
  }
  /**
   * Get user's payment methods
   */
  async getPaymentMethods(userId: string): Promise<ApiResponse<PaymentMethodInfo[]>> {
    return apiClient.get<PaymentMethodInfo[]>(`/payment/methods?userId=${userId}`);
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(
    method: Omit<PaymentMethodInfo, 'id' | 'addedAt' | 'isVerified'>
  ): Promise<ApiResponse<PaymentMethodInfo>> {
    return apiClient.post<PaymentMethodInfo>('/payment/methods', method);
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    id: string,
    updates: Partial<PaymentMethodInfo>
  ): Promise<ApiResponse<PaymentMethodInfo>> {
    return apiClient.put<PaymentMethodInfo>(`/payment/methods/${id}`, updates);
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/payment/methods/${id}`);
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(id: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/payment/methods/${id}/default`);
  }

  /**
   * Process payment for ride
   */
  async processPayment(request: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
    return apiClient.post<PaymentResponse, PaymentRequest>('/payment/process', request);
  }

  /**
   * Validate payment before processing
   */
  async validatePayment(request: PaymentRequest): Promise<ApiResponse<PaymentValidation>> {
    return apiClient.post<PaymentValidation, PaymentRequest>('/payment/validate', request);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<ApiResponse<PaymentResponse>> {
    return apiClient.get<PaymentResponse>(`/payment/${paymentId}`);
  }

  /**
   * Process refund
   */
  async processRefund(request: RefundRequest): Promise<ApiResponse<RefundResponse>> {
    return apiClient.post<RefundResponse, RefundRequest>('/payment/refund', request);
  }

  /**
   * Add tip to completed ride
   */
  async addTip(request: TipRequest): Promise<ApiResponse<PaymentResponse>> {
    return apiClient.post<PaymentResponse, TipRequest>('/payment/tip', request);
  }

  /**
   * Get driver payout information
   */
  async getDriverPayouts(driverId: string, status?: string): Promise<ApiResponse<DriverPayout[]>> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    
    return apiClient.get<DriverPayout[]>(`/payment/payouts/${driverId}`, params);
  }

  /**
   * Request instant payout for driver
   */
  async requestInstantPayout(driverId: string, amount: number): Promise<ApiResponse<{
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    fee: number;
    netAmount: number;
    estimatedArrival: string;
  }>> {
    return apiClient.post('/payment/payouts/instant', {
      driverId,
      amount,
    });
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    page: number = 1,
    limit: number = 20,
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
    const params: Record<string, string | number> = { page, limit };
    if (type) params.type = type;
    if (dateRange) {
      params.startDate = dateRange.startDate;
      params.endDate = dateRange.endDate;
    }
    
    return apiClient.get('/payment/history', params);
  }

  /**
   * Download receipt
   */
  async downloadReceipt(paymentId: string, format: 'pdf' | 'html' = 'pdf'): Promise<ApiResponse<{
    url: string;
    expiresAt: string;
  }>> {
    return apiClient.get(`/payment/${paymentId}/receipt`, { format });
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<ApiResponse<PaymentTransaction>> {
    return apiClient.get(`/payment/transactions/${transactionId}`);
  }

  /**
   * Get receipt by ride ID
   */
  async getReceipt(rideId: string): Promise<ApiResponse<Receipt>> {
    return apiClient.get(`/payment/receipts/${rideId}`);
  }

  /**
   * Get refund status
   */
  async getRefundStatus(refundId: string): Promise<ApiResponse<RefundResponse>> {
    return apiClient.get(`/payment/refunds/${refundId}`);
  }

  /**
   * Request driver payout
   */
  async requestPayout(driverId: string, rideId: string): Promise<ApiResponse<DriverPayout>> {
    return apiClient.post(`/payment/payouts/request`, { driverId, rideId });
  }

  /**
   * Calculate fare
   */
  async calculateFare(rideData: {
    distance: number;
    duration: number;
    baseFare: number;
    surgeMultiplier?: number;
    tip?: number;
  }): Promise<ApiResponse<FareCalculation>> {
    return apiClient.post('/payment/calculate-fare', rideData);
  }

  /**
   * Get payment analytics for driver
   */
  async getDriverAnalytics(
    driverId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    totalEarnings: number;
    totalRides: number;
    averageFare: number;
    totalTips: number;
    totalCommission: number;
    netEarnings: number;
    breakdown: {
      daily: Array<{
        date: string;
        earnings: number;
        rides: number;
        tips: number;
      }>;
      byPaymentMethod: Array<{
        method: string;
        amount: number;
        percentage: number;
      }>;
    };
  }>> {
    return apiClient.get(`/payment/analytics/${driverId}`, { period });
  }

  /**
   * Validate payment method locally (for offline/demo mode)
   */
  validatePaymentMethod(method: Omit<PaymentMethodInfo, 'id' | 'addedAt' | 'isVerified'>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (method.type === 'credit_card' || method.type === 'debit_card') {
      const card = method as CardPaymentMethod;
      
      if (!card.last4 || card.last4.length !== 4) {
        errors.push('Invalid card number format');
      }
      
      if (!card.cardholderName || card.cardholderName.trim().length < 2) {
        errors.push('Cardholder name is required');
      }
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      if (card.expiryYear < currentYear || 
          (card.expiryYear === currentYear && card.expiryMonth < currentMonth)) {
        errors.push('Card has expired');
      }
      
      if (card.expiryMonth < 1 || card.expiryMonth > 12) {
        errors.push('Invalid expiry month');
      }
      
      const validBrands = ['visa', 'mastercard', 'amex', 'discover', 'unionpay'];
      if (!validBrands.includes(card.brand)) {
        errors.push('Unsupported card brand');
      }
    }

    if (method.type === 'digital_wallet') {
      const wallet = method as DigitalWalletPaymentMethod;
      
      if (!wallet.provider) {
        errors.push('Digital wallet provider is required');
      }
      
      if (!wallet.accountId) {
        errors.push('Account ID is required');
      }
    }

    if (method.type === 'cash') {
      const cash = method as CashPaymentMethod;
      
      if (!cash.preferredCurrency || cash.preferredCurrency.length !== 3) {
        errors.push('Valid currency code is required for cash payments');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate processing fees
   */
  calculateProcessingFees(
    amount: number,
    paymentMethodType: PaymentMethod['type']
  ): {
    processingFee: number;
    stripeFee: number;
    platformFee: number;
    total: number;
  } {
    let stripeFee = 0;
    let platformFee = 0;

    switch (paymentMethodType) {
      case 'credit_card':
        stripeFee = amount * 0.029 + 0.30; // 2.9% + $0.30
        platformFee = amount * 0.05; // 5% platform fee
        break;
      case 'debit_card':
        stripeFee = amount * 0.025 + 0.25; // 2.5% + $0.25
        platformFee = amount * 0.03; // 3% platform fee
        break;
      case 'digital_wallet':
        stripeFee = amount * 0.028 + 0.25; // 2.8% + $0.25
        platformFee = amount * 0.04; // 4% platform fee
        break;
      case 'cash':
        stripeFee = 0;
        platformFee = amount * 0.02; // 2% platform fee for cash handling
        break;
    }

    const processingFee = stripeFee + platformFee;
    const total = amount + processingFee;

    return {
      processingFee,
      stripeFee,
      platformFee,
      total,
    };
  }

  /**
   * Mask sensitive payment information for logging
   */
  maskPaymentInfo(payment: PaymentMethodInfo): PaymentMethodInfo {
    const masked = { ...payment };

    if (payment.type === 'credit_card' || payment.type === 'debit_card') {
      const card = masked as CardPaymentMethod;
      card.token = '****';
      card.fingerprint = '****';
    }

    if (payment.type === 'digital_wallet') {
      const wallet = masked as DigitalWalletPaymentMethod;
      wallet.accountId = wallet.accountId.substring(0, 4) + '****';
    }

    return masked;
  }

  /**
   * Validate payment request parameters
   */
  validatePaymentRequest(request: PaymentRequest): string[] {
    const errors: string[] = [];
    
    if (!request.rideId) {
      errors.push('Ride ID is required');
    }
    
    if (request.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }
    
    if (!request.currency || request.currency.length !== 3) {
      errors.push('Valid currency code is required');
    }
    
    if (!request.paymentMethodId) {
      errors.push('Payment method ID is required');
    }
    
    if (request.tip && request.tip < 0) {
      errors.push('Tip cannot be negative');
    }
    
    if (request.amount > 10000) {
      errors.push('Amount exceeds maximum limit');
    }

    return errors;
  }
}

// Note: The default paymentService export is now handled by PaymentServiceFactory
// Import paymentService from '../api/PaymentServiceFactory' for the correct environment-aware instance
