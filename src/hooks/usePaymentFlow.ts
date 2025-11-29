/**
 * Payment Flow Hook
 * Manages the complete payment process for ride booking
 */

import { useState, useCallback } from 'react';
import { payment, Receipt } from '@/services/paymentService';
import type { PaymentTransaction, FareCalculation } from '@/api/payment';
import { Location } from '@/api/rides';
import { usePaymentMethods } from './usePaymentMethods';

type CardPaymentType = 'credit_card' | 'debit_card';

interface PaymentMethodData {
  type: CardPaymentType;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  cardholderName?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isDefault?: boolean;
}

interface PaymentFlowParams {
  pickup: Location;
  destination: Location;
  distance: number; // in miles
  duration: number; // in minutes
  rideOptionId: string;
  surgeMultiplier?: number;
  tolls?: number;
}

interface PaymentFlowState {
  fare: FareCalculation | null;
  tip: number;
  isProcessing: boolean;
  transaction: PaymentTransaction | null;
  receipt: Receipt | null;
  error: string | null;
  step: 'calculation' | 'payment' | 'processing' | 'completed' | 'failed';
}

export function usePaymentFlow() {
  const [state, setState] = useState<PaymentFlowState>({
    fare: null,
    tip: 0,
    isProcessing: false,
    transaction: null,
    receipt: null,
    error: null,
    step: 'calculation',
  });

  const {
    paymentMethods,
    selectedPaymentMethod,
    addPaymentMethod,
    setDefaultPaymentMethod,
    hasPaymentMethods,
  } = usePaymentMethods();

  // Calculate fare when parameters change
  const calculateFare = useCallback(async (params: PaymentFlowParams) => {
    try {
      const fare = await payment.calculateFare({
        distance: params.distance,
        duration: params.duration,
        rideOptionId: params.rideOptionId,
        surgeMultiplier: params.surgeMultiplier || 1.0,
        tolls: params.tolls || 0,
        tip: state.tip,
      });

      setState(prev => ({
        ...prev,
        fare,
        step: hasPaymentMethods() ? 'payment' : 'calculation',
        error: null,
      }));

      return fare;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate fare';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        step: 'failed',
      }));
      throw new Error(errorMessage);
    }
  }, [state.tip, hasPaymentMethods]);

  // Update tip
  const updateTip = useCallback((tip: number) => {
    setState(prev => ({
      ...prev,
      tip,
      fare: prev.fare ? {
        ...prev.fare,
        tip,
        total: (prev.fare.total - (prev.fare.tip ?? 0)) + tip,
      } : null,
    }));
  }, []);

  // Add payment method and set as default
  const addAndSetPaymentMethod = useCallback(async (paymentData: PaymentMethodData) => {
    try {
      const newMethod = await addPaymentMethod(paymentData);
      await setDefaultPaymentMethod(newMethod.id);
      return newMethod;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to add payment method',
        step: 'failed',
      }));
      throw err;
    }
  }, [addPaymentMethod, setDefaultPaymentMethod]);

  // Process payment
  const processPayment = useCallback(async (rideId: string, description?: string) => {
    if (!selectedPaymentMethod || !state.fare) {
      throw new Error('No payment method or fare calculated');
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      step: 'processing',
      error: null,
    }));

    try {
      const transaction = await payment.processPayment({
        rideId,
        amount: state.fare.total,
        currency: state.fare.currency,
        paymentMethodId: selectedPaymentMethod.id,
        description,
      });

      setState(prev => ({
        ...prev,
        transaction,
        isProcessing: false,
        step: 'completed',
        error: null,
      }));

      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        step: 'failed',
      }));
      throw new Error(errorMessage);
    }
  }, [selectedPaymentMethod, state.fare]);

  // Generate receipt
  const generateReceipt = useCallback(async () => {
    if (!state.transaction) {
      throw new Error('No transaction available');
    }

    try {
      const receipt = await payment.generateReceipt(state.transaction.id);
      setState(prev => ({
        ...prev,
        receipt,
      }));
      return receipt;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate receipt';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, [state.transaction]);

  // Email receipt
  const emailReceipt = useCallback(async (emailAddress: string) => {
    if (!state.receipt) {
      throw new Error('No receipt available');
    }

    try {
      await payment.emailReceipt(state.receipt.id, emailAddress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to email receipt';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, [state.receipt]);

  // Refund payment
  const refundPayment = useCallback(async (_amount?: number, _reason?: string) => {
    if (!state.transaction) {
      throw new Error('No transaction available');
    }

    try {
      const refund = await payment.refundTransaction(state.transaction.id);
      
      setState(prev => ({
        ...prev,
        transaction: refund,
      }));
      
      return refund;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Refund failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, [state.transaction]);

  // Reset payment flow
  const resetPaymentFlow = useCallback(() => {
    setState({
      fare: null,
      tip: 0,
      isProcessing: false,
      transaction: null,
      receipt: null,
      error: null,
      step: 'calculation',
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Check if payment is ready
  const isPaymentReady = useCallback(() => {
    return state.fare !== null && 
           selectedPaymentMethod !== null && 
           !state.isProcessing &&
           state.error === null;
  }, [state.fare, selectedPaymentMethod, state.isProcessing, state.error]);

  // Get payment summary
  const getPaymentSummary = useCallback(() => {
    if (!state.fare || !selectedPaymentMethod) {
      return null;
    }

    const baseComponents = state.fare.base + state.fare.distance + state.fare.time;
    const surge = state.fare.surge ?? 0;
    const tolls = state.fare.tolls ?? 0;
    const taxes = state.fare.taxes ?? 0;
    const discount = state.fare.discount ?? 0;

    return {
      subtotal: baseComponents + surge + tolls + taxes - discount,
      taxes,
      serviceFee: 0,
      tip: state.fare.tip ?? 0,
      total: state.fare.total,
      paymentMethod: selectedPaymentMethod,
      currency: state.fare.currency,
    };
  }, [state.fare, selectedPaymentMethod]);

  // Validate payment flow
  const validatePaymentFlow = useCallback(() => {
    const errors: string[] = [];

    if (!state.fare) {
      errors.push('Fare not calculated');
    }

    if (!selectedPaymentMethod) {
      errors.push('No payment method selected');
    }

    if (state.fare && state.fare.total <= 0) {
      errors.push('Invalid fare amount');
    }

    if (errors.length > 0) {
      setState(prev => ({
        ...prev,
        error: errors.join(', '),
        step: 'failed',
      }));
      return false;
    }

    return true;
  }, [state.fare, selectedPaymentMethod]);

  return {
    // State
    ...state,
    paymentMethods,
    selectedPaymentMethod,
    
    // Actions
    calculateFare,
    updateTip,
    addAndSetPaymentMethod,
    processPayment,
    generateReceipt,
    emailReceipt,
    refundPayment,
    resetPaymentFlow,
    clearError,
    
    // Utilities
    isPaymentReady,
    getPaymentSummary,
    validatePaymentFlow,
    hasPaymentMethods,
  };
}
