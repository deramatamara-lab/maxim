/**
 * Payment Store Slice
 * Handles payment methods management
 */

import { StateCreator } from 'zustand';
import { log } from '../../utils/logger';
import { paymentService, type PaymentMethodInfo } from '../../api/PaymentServiceFactory';
// PRODUCTION: NO MOCKS - All API calls are real

export interface PaymentSlice {
  // State
  paymentMethods: PaymentMethodInfo[];
  isLoadingPaymentMethods: boolean;
  paymentError: string | null;
  selectedPaymentMethodId: string | null;
  
  // Actions
  fetchPaymentMethods: (userId: string) => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethodInfo, 'id' | 'addedAt' | 'isVerified'>) => Promise<boolean>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodInfo>) => Promise<boolean>;
  deletePaymentMethod: (id: string) => Promise<boolean>;
  setDefaultPaymentMethod: (id: string) => Promise<boolean>;
  setSelectedPaymentMethod: (id: string | null) => void;
  validatePaymentMethod: (paymentMethodId: string) => Promise<{ isValid: boolean; error?: string }>;
}

export const createPaymentSlice: StateCreator<PaymentSlice, [], [], PaymentSlice> = (set, get) => ({
  // Initial State
  paymentMethods: [],
  isLoadingPaymentMethods: false,
  paymentError: null,
  selectedPaymentMethodId: null,

  fetchPaymentMethods: async (userId: string) => {
    set({ isLoadingPaymentMethods: true, paymentError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await paymentService.getPaymentMethods(userId);
      
      if (response.success && response.data) {
        set({ paymentMethods: response.data as PaymentMethodInfo[], isLoadingPaymentMethods: false });
      } else {
        set({ paymentError: response.error || 'Failed to fetch payment methods', isLoadingPaymentMethods: false });
      }
    } catch {
      set({ paymentError: 'Network error occurred', isLoadingPaymentMethods: false });
    }
  },

  addPaymentMethod: async (method) => {
    set({ isLoadingPaymentMethods: true, paymentError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await paymentService.addPaymentMethod(method);
      
      if (response.success && response.data) {
        set({ 
          paymentMethods: [...get().paymentMethods, response.data], 
          isLoadingPaymentMethods: false 
        });
        return true;
      } else {
        set({ paymentError: response.error || 'Failed to add payment method', isLoadingPaymentMethods: false });
        return false;
      }
    } catch {
      set({ paymentError: 'Network error occurred', isLoadingPaymentMethods: false });
      return false;
    }
  },

  updatePaymentMethod: async (id: string, updates: Partial<PaymentMethodInfo>) => {
    set({ isLoadingPaymentMethods: true, paymentError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await paymentService.updatePaymentMethod(id, updates);
      
      if (response.success && response.data) {
        set({ 
          paymentMethods: get().paymentMethods.map(method => 
            method.id === id ? response.data! : method
          ), 
          isLoadingPaymentMethods: false 
        });
        return true;
      } else {
        set({ paymentError: response.error || 'Failed to update payment method', isLoadingPaymentMethods: false });
        return false;
      }
    } catch {
      set({ paymentError: 'Network error occurred', isLoadingPaymentMethods: false });
      return false;
    }
  },

  deletePaymentMethod: async (id: string) => {
    set({ isLoadingPaymentMethods: true, paymentError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await paymentService.deletePaymentMethod(id);
      
      if (response.success) {
        set({ 
          paymentMethods: get().paymentMethods.filter(method => method.id !== id), 
          isLoadingPaymentMethods: false 
        });
        return true;
      } else {
        set({ paymentError: response.error || 'Failed to delete payment method', isLoadingPaymentMethods: false });
        return false;
      }
    } catch {
      set({ paymentError: 'Network error occurred', isLoadingPaymentMethods: false });
      return false;
    }
  },

  setDefaultPaymentMethod: async (id: string) => {
    set({ isLoadingPaymentMethods: true, paymentError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await paymentService.setDefaultPaymentMethod(id);
      
      if (response.success) {
        set({ 
          paymentMethods: get().paymentMethods.map(method => ({
            ...method,
            isDefault: method.id === id
          })),
          selectedPaymentMethodId: id,
          isLoadingPaymentMethods: false 
        });
        return true;
      } else {
        set({ paymentError: response.error || 'Failed to set default payment method', isLoadingPaymentMethods: false });
        return false;
      }
    } catch {
      set({ paymentError: 'Network error occurred', isLoadingPaymentMethods: false });
      return false;
    }
  },

  setSelectedPaymentMethod: (id: string | null) => set({ selectedPaymentMethodId: id }),

  validatePaymentMethod: async (paymentMethodId: string) => {
    try {
      const paymentMethods = get().paymentMethods;
      const selectedMethod = paymentMethods.find(method => method.id === paymentMethodId);
      
      if (!selectedMethod) {
        return { isValid: false, error: 'Selected payment method not found' };
      }
      
      if (selectedMethod.type === 'credit_card' && 'expiryMonth' in selectedMethod && 'expiryYear' in selectedMethod) {
        const creditCardMethod = selectedMethod as { expiryMonth: number; expiryYear: number };
        const expiryDate = new Date(creditCardMethod.expiryYear, creditCardMethod.expiryMonth - 1);
        if (expiryDate < new Date()) {
          return { isValid: false, error: 'Payment method has expired. Please update your payment information.' };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      log.error('Payment method validation error', { event: 'payment_validation_failed', component: 'paymentSlice' }, error);
      return { isValid: false, error: 'Unable to validate payment method' };
    }
  },
});

export type { PaymentMethodInfo };
