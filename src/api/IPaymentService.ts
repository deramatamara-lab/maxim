/**
 * Payment Service Interface
 * Defines the contract for payment processing implementations
 * Both real and mock payment services must implement this interface
 */

import { ApiResponse } from './client';
import {
  // PaymentMethod imported but only used in type context - prefix with underscore
  PaymentMethod as _PaymentMethod,
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
} from './payment';

export interface IPaymentService {
  // Payment Processing
  processPayment(request: PaymentRequest): Promise<ApiResponse<PaymentResponse>>;
  validatePayment(request: PaymentRequest): Promise<ApiResponse<PaymentValidation>>;
  
  // Payment Methods
  getPaymentMethods(userId: string): Promise<ApiResponse<PaymentMethodInfo[]>>;
  addPaymentMethod(method: Omit<PaymentMethodInfo, 'id' | 'isVerified' | 'addedAt'>): Promise<ApiResponse<PaymentMethodInfo>>;
  updatePaymentMethod(id: string, updates: Partial<PaymentMethodInfo>): Promise<ApiResponse<PaymentMethodInfo>>;
  deletePaymentMethod(id: string): Promise<ApiResponse<void>>;
  setDefaultPaymentMethod(methodId: string): Promise<ApiResponse<void>>;
  
  // Transactions
  getTransaction(transactionId: string): Promise<ApiResponse<PaymentTransaction>>;
  getTransactionHistory(
    page?: number,
    limit?: number,
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
  }>>;
  
  // Receipts
  getReceipt(rideId: string): Promise<ApiResponse<Receipt>>;
  downloadReceipt(paymentId: string, format?: 'pdf' | 'html'): Promise<ApiResponse<{ url: string; expiresAt: string }>>;
  
  // Refunds
  processRefund(request: RefundRequest): Promise<ApiResponse<RefundResponse>>;
  getRefundStatus(refundId: string): Promise<ApiResponse<RefundResponse>>;
  
  // Tips
  addTip(request: TipRequest): Promise<ApiResponse<PaymentResponse>>;
  
  // Driver Payouts
  getDriverPayouts(driverId: string): Promise<ApiResponse<DriverPayout[]>>;
  requestPayout(driverId: string, rideId: string): Promise<ApiResponse<DriverPayout>>;
  
  // Fare Calculations
  calculateFare(rideData: {
    distance: number;
    duration: number;
    baseFare: number;
    surgeMultiplier?: number;
    tip?: number;
  }): Promise<ApiResponse<FareCalculation>>;
}
