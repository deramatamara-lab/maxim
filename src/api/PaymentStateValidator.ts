/**
 * Payment State Validator
 * Comprehensive validation and retry rules for all payment states
 * Ensures proper state transitions and user messaging
 */

import { PaymentStatus, PaymentResponse, PaymentFailureReason } from './payment';

export interface PaymentStateValidation {
  isValid: boolean;
  canRetry: boolean;
  requiresAction: boolean;
  userMessage: string;
  technicalMessage: string;
  suggestedDelay: number; // milliseconds
  maxRetries: number;
  nextStates: PaymentStatus[];
}

export interface PaymentRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStates: PaymentStatus[];
}

export class PaymentStateValidator {
  private static retryConfig: PaymentRetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStates: ['pending', 'processing', 'failed'],
  };

  /**
   * Validate payment response and determine next actions
   */
  static validatePaymentState(
    response: PaymentResponse,
    _attemptCount: number = 0
  ): PaymentStateValidation {
    const { status, failureReason } = response;

    switch (status) {
      case 'pending':
        return this.validatePendingState(_attemptCount);
      
      case 'processing':
        return this.validateProcessingState(_attemptCount);
      
      case 'requires_action':
        return this.validateRequiresActionState(response);
      
      case 'succeeded':
        return this.validateSucceededState();
      
      case 'failed':
        return this.validateFailedState(failureReason, _attemptCount);
      
      case 'cancelled':
        return this.validateCancelledState();
      
      case 'refunded':
        return this.validateRefundedState();
      
      default:
        return this.validateUnknownState(status);
    }
  }

  /**
   * Check if payment can be retried based on state and attempt count
   */
  static canRetryPayment(
    status: PaymentStatus,
    attemptCount: number,
    failureReason?: PaymentFailureReason
  ): boolean {
    if (!this.retryConfig.retryableStates.includes(status)) {
      return false;
    }

    if (attemptCount >= this.retryConfig.maxRetries) {
      return false;
    }

    // Check specific failure reasons that are not retryable
    if (failureReason) {
      const nonRetryableReasons = [
        'fraud_block',
        'expired_card',
        'invalid_cvv',
        'insufficient_funds',
      ];
      if (nonRetryableReasons.includes(failureReason.type)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(attemptCount: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attemptCount),
      this.retryConfig.maxDelay
    );
    return delay;
  }

  /**
   * Get user-friendly message for payment state
   */
  static getUserMessage(status: PaymentStatus, failureReason?: PaymentFailureReason): string {
    switch (status) {
      case 'pending':
        return 'Payment is being prepared...';
      
      case 'processing':
        return 'Payment is being processed by your bank...';
      
      case 'requires_action':
        return 'Please complete the required action to continue payment.';
      
      case 'succeeded':
        return 'Payment completed successfully!';
      
      case 'failed':
        return failureReason?.userFriendlyMessage || 'Payment failed. Please try again.';
      
      case 'cancelled':
        return 'Payment was cancelled.';
      
      case 'refunded':
        return 'Payment has been refunded.';
      
      default:
        return 'Payment status unknown. Please contact support.';
    }
  }

  private static validatePendingState(attemptCount: number): PaymentStateValidation {
    return {
      isValid: true,
      canRetry: attemptCount < this.retryConfig.maxRetries,
      requiresAction: false,
      userMessage: 'Payment is being prepared...',
      technicalMessage: 'Payment in pending state, awaiting processing',
      suggestedDelay: 2000,
      maxRetries: this.retryConfig.maxRetries,
      nextStates: ['processing', 'failed', 'cancelled'],
    };
  }

  private static validateProcessingState(_attemptCount: number): PaymentStateValidation {
    return {
      isValid: true,
      canRetry: false, // Processing payments should not be retried, only monitored
      requiresAction: false,
      userMessage: 'Payment is being processed by your bank...',
      technicalMessage: 'Payment in processing state, awaiting final confirmation',
      suggestedDelay: 5000,
      maxRetries: 0,
      nextStates: ['succeeded', 'failed', 'requires_action'],
    };
  }

  private static validateRequiresActionState(response: PaymentResponse): PaymentStateValidation {
    const action = response.suggestedActions[0];
    return {
      isValid: false, // Requires user action to be valid
      canRetry: false,
      requiresAction: true,
      userMessage: action?.description || 'Please complete the required action to continue payment.',
      technicalMessage: 'Payment requires additional user action',
      suggestedDelay: 0,
      maxRetries: 0,
      nextStates: ['processing', 'cancelled'],
    };
  }

  private static validateSucceededState(): PaymentStateValidation {
    return {
      isValid: true,
      canRetry: false,
      requiresAction: false,
      userMessage: 'Payment completed successfully!',
      technicalMessage: 'Payment succeeded and is complete',
      suggestedDelay: 0,
      maxRetries: 0,
      nextStates: [], // Terminal state
    };
  }

  private static validateFailedState(
    failureReason?: PaymentFailureReason,
    attemptCount: number = 0
  ): PaymentStateValidation {
    const canRetry = this.canRetryPayment('failed', attemptCount, failureReason);
    const retryDelay = canRetry ? this.calculateRetryDelay(attemptCount) : 0;

    return {
      isValid: false,
      canRetry,
      requiresAction: false,
      userMessage: failureReason?.userFriendlyMessage || 'Payment failed. Please try again.',
      technicalMessage: failureReason?.message || 'Payment processing failed',
      suggestedDelay: retryDelay,
      maxRetries: this.retryConfig.maxRetries,
      nextStates: canRetry ? ['pending', 'processing'] : ['cancelled'],
    };
  }

  private static validateCancelledState(): PaymentStateValidation {
    return {
      isValid: false,
      canRetry: false,
      requiresAction: false,
      userMessage: 'Payment was cancelled.',
      technicalMessage: 'Payment was cancelled by user or system',
      suggestedDelay: 0,
      maxRetries: 0,
      nextStates: [], // Terminal state
    };
  }

  private static validateRefundedState(): PaymentStateValidation {
    return {
      isValid: true, // Refunded is a valid terminal state
      canRetry: false,
      requiresAction: false,
      userMessage: 'Payment has been refunded.',
      technicalMessage: 'Payment was successfully refunded',
      suggestedDelay: 0,
      maxRetries: 0,
      nextStates: [], // Terminal state
    };
  }

  private static validateUnknownState(status: PaymentStatus): PaymentStateValidation {
    return {
      isValid: false,
      canRetry: false,
      requiresAction: true,
      userMessage: 'Payment status unknown. Please contact support.',
      technicalMessage: `Unknown payment state: ${status}`,
      suggestedDelay: 0,
      maxRetries: 0,
      nextStates: [],
    };
  }

  /**
   * Configure retry behavior
   */
  static configureRetry(config: Partial<PaymentRetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get current retry configuration
   */
  static getRetryConfig(): PaymentRetryConfig {
    return { ...this.retryConfig };
  }
}
