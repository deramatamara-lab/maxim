/**
 * Payment Routes
 * Handles payment methods, transactions, and Stripe integration
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Mock payment methods database
const paymentMethods = new Map();
let paymentMethodIdCounter = 1;

// Mock transactions database
const transactions = new Map();
let transactionIdCounter = 1;

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get payment methods for a user
router.get('/methods', async (req, res) => {
  try {
    const userId = req.query.userId || 1; // In real implementation, get from JWT token
    
    // Mock payment methods
    const userPaymentMethods = Array.from(paymentMethods.values())
      .filter(pm => pm.userId === userId)
      .map(pm => ({
        id: pm.id,
        type: pm.type,
        last4: pm.last4,
        brand: pm.brand,
        expiryMonth: pm.expiryMonth,
        expiryYear: pm.expiryYear,
        isDefault: pm.isDefault,
        createdAt: pm.createdAt
      }));

    res.json({
      success: true,
      paymentMethods: userPaymentMethods
    });

  } catch (error) {
    logger.error('Get payment methods error', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch payment methods',
      code: 'PAYMENT_METHODS_ERROR'
    });
  }
});

// Add new payment method
router.post('/methods', [
  body('type').isIn(['credit_card', 'debit_card']),
  body('stripePaymentMethodId').notEmpty(),
  body('isDefault').optional().isBoolean(),
  handleValidationErrors
], async (req, res) => {
  try {
    const userId = req.body.userId || 1; // In real implementation, get from JWT token
    const { type, stripePaymentMethodId, isDefault = false, billingAddress } = req.body;

    // Mock Stripe payment method details
    const mockStripeDetails = {
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025
      }
    };

    // Create payment method record
    const paymentMethod = {
      id: paymentMethodIdCounter++,
      userId,
      type,
      stripePaymentMethodId,
      brand: mockStripeDetails.card.brand,
      last4: mockStripeDetails.card.last4,
      expiryMonth: mockStripeDetails.card.exp_month,
      expiryYear: mockStripeDetails.card.exp_year,
      billingAddress,
      isDefault,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // If setting as default, unset other defaults
    if (isDefault) {
      Array.from(paymentMethods.values())
        .filter(pm => pm.userId === userId)
        .forEach(pm => pm.isDefault = false);
    }

    paymentMethods.set(paymentMethod.id, paymentMethod);

    logger.info('Payment method added', {
      paymentMethodId: paymentMethod.id,
      userId,
      type,
      brand: paymentMethod.brand,
      last4: paymentMethod.last4
    });

    res.status(201).json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        brand: paymentMethod.brand,
        last4: paymentMethod.last4,
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        isDefault: paymentMethod.isDefault,
        createdAt: paymentMethod.createdAt
      }
    });

  } catch (error) {
    logger.error('Add payment method error', { error: error.message });
    res.status(500).json({
      error: 'Failed to add payment method',
      code: 'ADD_PAYMENT_METHOD_ERROR'
    });
  }
});

// Update payment method
router.put('/methods/:id', [
  body('isDefault').optional().isBoolean(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault } = req.body;

    const paymentMethod = paymentMethods.get(parseInt(id));
    if (!paymentMethod) {
      return res.status(404).json({
        error: 'Payment method not found',
        code: 'PAYMENT_METHOD_NOT_FOUND'
      });
    }

    // Update default status
    if (isDefault !== undefined) {
      if (isDefault) {
        // Unset other defaults
        Array.from(paymentMethods.values())
          .filter(pm => pm.userId === paymentMethod.userId)
          .forEach(pm => pm.isDefault = false);
      }
      paymentMethod.isDefault = isDefault;
    }

    paymentMethods.set(paymentMethod.id, paymentMethod);

    logger.info('Payment method updated', {
      paymentMethodId: paymentMethod.id,
      isDefault: paymentMethod.isDefault
    });

    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        brand: paymentMethod.brand,
        last4: paymentMethod.last4,
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        isDefault: paymentMethod.isDefault
      }
    });

  } catch (error) {
    logger.error('Update payment method error', { error: error.message });
    res.status(500).json({
      error: 'Failed to update payment method',
      code: 'UPDATE_PAYMENT_METHOD_ERROR'
    });
  }
});

// Delete payment method
router.delete('/methods/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const paymentMethod = paymentMethods.get(parseInt(id));
    if (!paymentMethod) {
      return res.status(404).json({
        error: 'Payment method not found',
        code: 'PAYMENT_METHOD_NOT_FOUND'
      });
    }

    paymentMethods.delete(parseInt(id));

    logger.info('Payment method deleted', {
      paymentMethodId: paymentMethod.id,
      userId: paymentMethod.userId
    });

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    logger.error('Delete payment method error', { error: error.message });
    res.status(500).json({
      error: 'Failed to delete payment method',
      code: 'DELETE_PAYMENT_METHOD_ERROR'
    });
  }
});

// Process payment
router.post('/process', [
  body('paymentIntentId').notEmpty(),
  body('rideId').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { paymentIntentId, rideId } = req.body;

    // Mock payment processing
    const transaction = {
      id: transactionIdCounter++,
      rideId,
      paymentIntentId,
      amount: Math.floor(Math.random() * 50) + 10, // $10-60
      currency: 'USD',
      status: 'succeeded',
      paymentMethodId: 1,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      receiptUrl: `https://aura-backend.receipts.com/txn_${transactionIdCounter}`
    };

    transactions.set(transaction.id, transaction);

    logger.info('Payment processed successfully', {
      transactionId: transaction.id,
      rideId,
      amount: transaction.amount,
      currency: transaction.currency
    });

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        rideId: transaction.rideId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        receiptUrl: transaction.receiptUrl,
        processedAt: transaction.processedAt
      }
    });

  } catch (error) {
    logger.error('Process payment error', { error: error.message });
    res.status(500).json({
      error: 'Payment processing failed',
      code: 'PAYMENT_PROCESSING_ERROR'
    });
  }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.query.userId || 1; // In real implementation, get from JWT token
    
    // Mock transactions for user
    const userTransactions = Array.from(transactions.values())
      .filter(t => t.userId === userId || true) // For demo, return all
      .map(t => ({
        id: t.id,
        rideId: t.rideId,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
        processedAt: t.processedAt,
        receiptUrl: t.receiptUrl
      }));

    res.json({
      success: true,
      transactions: userTransactions
    });

  } catch (error) {
    logger.error('Get transactions error', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch transactions',
      code: 'TRANSACTIONS_ERROR'
    });
  }
});

module.exports = router;
