import { PaymentMethod } from '../types';

// Simulated Stripe Response
interface StripeToken {
    id: string;
    object: 'token';
    card: {
        id: string;
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    };
}

export const mockStripeTokenize = async (cardNumber: string, expiry: string, cvc: string): Promise<StripeToken> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: `tok_${Math.random().toString(36).substr(2, 9)}`,
                object: 'token',
                card: {
                    id: `card_${Math.random().toString(36).substr(2, 9)}`,
                    brand: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
                    last4: cardNumber.slice(-4),
                    exp_month: parseInt(expiry.split('/')[0]),
                    exp_year: parseInt(expiry.split('/')[1])
                }
            });
        }, 1200);
    });
};

export const processPayment = async (amount: number, paymentMethodId: string): Promise<{ success: boolean; transactionId: string }> => {
    // Simulate backend processing
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                transactionId: `tx_${Math.random().toString(36).substr(2, 12)}`
            });
        }, 2000);
    });
};