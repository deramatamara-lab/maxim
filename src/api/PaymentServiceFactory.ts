/**
 * Payment Service Factory
 * Provides clean separation between mock and production payment services
 * Returns appropriate service implementation based on environment configuration
 */

import { type IPaymentService } from './IPaymentService';
import { RealPaymentService } from './payment';
import { MockPaymentService } from './MockPaymentService';
import { type PaymentMethodInfo } from './payment';

// Re-export PaymentMethodInfo and PaymentRequest for convenience
export { type PaymentMethodInfo };
export { type PaymentRequest } from './payment';

export interface PaymentServiceConfig {
  useMockService: boolean;
  mockConfig?: {
    simulateDelays: boolean;
    defaultDelay: number;
    failureRate: number;
  };
}

/**
 * Factory function that returns the appropriate payment service
 * based on environment configuration and feature flags
 */
export function createPaymentService(config?: Partial<PaymentServiceConfig>): IPaymentService {
  // Determine which service to use
  const useMock = config?.useMockService ?? shouldUseMockService();
  
  if (useMock) {
    const mockService = new MockPaymentService();
    
    // Apply mock configuration if provided
    if (config?.mockConfig) {
      mockService.setConfig(config.mockConfig);
    }
    
    return mockService;
  }
  
  // Return real payment service for production
  return new RealPaymentService();
}

/**
 * Determines if mock service should be used based on environment
 */
function shouldUseMockService(): boolean {
  // Check environment variable
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  
  // Use mock for development and test environments
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    return true;
  }
  
  // Check explicit mock flag (useful for staging/demo)
  if (process.env.USE_MOCK_PAYMENT_SERVICE === 'true') {
    return true;
  }
  
  // Check if we're in a demo/preview environment
  if (process.env.EXPO_PUBLIC_APP_ENV === 'demo' || 
      process.env.EXPO_PUBLIC_APP_ENV === 'preview') {
    return true;
  }
  
  // Default to real service for production
  return false;
}

/**
 * Default payment service instance (singleton pattern)
 * This is the main export that should be used throughout the app
 */
export const paymentService: IPaymentService = createPaymentService();

/**
 * Utility function to create a mock service with custom configuration
 * Useful for testing specific scenarios
 */
export function createMockPaymentService(config?: PaymentServiceConfig['mockConfig']): IPaymentService {
  return createPaymentService({
    useMockService: true,
    mockConfig: config,
  });
}

/**
 * Utility function to create a real payment service
 * Useful for explicitly testing production flows in development
 */
export function createRealPaymentService(): IPaymentService {
  return createPaymentService({
    useMockService: false,
  });
}
