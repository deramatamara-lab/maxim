/**
 * Payment Methods Hook
 * Manages payment methods state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { payment } from '@/services/paymentService';
import type { PaymentMethodInfo } from '@/api/payment';

type CardPaymentType = 'credit_card' | 'debit_card';

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodInfo | null>(null);
  const loadPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const methods = await payment.getPaymentMethods();
      setPaymentMethods(methods);
      
      // Auto-select default payment method
      const defaultMethod = methods.find(method => method.isDefault);
      setSelectedPaymentMethod(defaultMethod || methods[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load payment methods on mount
  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const addPaymentMethod = useCallback(async (paymentData: {
    type: CardPaymentType;
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
    cardholderName?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newMethod = await payment.addPaymentMethod(paymentData);
      setPaymentMethods(prev => [...prev, newMethod]);
      
      // Auto-select the newly added payment method
      setSelectedPaymentMethod(newMethod);
      
      return newMethod;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add payment method';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removePaymentMethod = useCallback(async (paymentMethodId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await payment.removePaymentMethod(paymentMethodId);
      setPaymentMethods(prev => prev.filter(method => method.id !== paymentMethodId));
      
      // Update selection if removed method was selected
      if (selectedPaymentMethod?.id === paymentMethodId) {
        const remaining = paymentMethods.filter(method => method.id !== paymentMethodId);
        const newDefault = remaining.find(method => method.isDefault) || remaining[0] || null;
        setSelectedPaymentMethod(newDefault);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove payment method';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await payment.setDefaultPaymentMethod(paymentMethodId);
      
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === paymentMethodId
        }))
      );
      
      // Update selection
      const newDefault = paymentMethods.find(method => method.id === paymentMethodId);
      if (newDefault) {
        setSelectedPaymentMethod(newDefault);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set default payment method';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [paymentMethods]);

  const selectPaymentMethod = useCallback((paymentMethod: PaymentMethodInfo) => {
    setSelectedPaymentMethod(paymentMethod);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  // Get payment methods by type
  const getPaymentMethodsByType = useCallback((type: PaymentMethodInfo['type']) => {
    return paymentMethods.filter(method => method.type === type);
  }, [paymentMethods]);

  // Get default payment method
  const getDefaultPaymentMethod = useCallback(() => {
    return paymentMethods.find(method => method.isDefault) || null;
  }, [paymentMethods]);

  // Check if user has any payment methods
  const hasPaymentMethods = useCallback(() => {
    return paymentMethods.length > 0;
  }, [paymentMethods]);

  // Get formatted display text for payment method
  const getPaymentMethodDisplay = useCallback((method: PaymentMethodInfo) => {
    if (method.type === 'cash') {
      return 'Cash';
    }

    if (method.type === 'digital_wallet') {
      return 'Wallet';
    }

    const brand = method.brand ? method.brand.toUpperCase() : 'CARD';
    const last4 = method.last4 ?? '';
    return `${brand} •••• ${last4}`;
  }, []);

  return {
    // State
    paymentMethods,
    selectedPaymentMethod,
    isLoading,
    error,
    
    // Actions
    loadPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    selectPaymentMethod,
    clearError,
    refresh,
    
    // Utilities
    getPaymentMethodsByType,
    getDefaultPaymentMethod,
    hasPaymentMethods,
    getPaymentMethodDisplay,
  };
}
