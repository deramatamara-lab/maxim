/**
 * Production Configuration
 * Forces real API calls - NO MOCKS, NO PLACEHOLDERS
 * All features must be fully implemented and wired
 */

export const PRODUCTION_CONFIG = {
  // Force real API calls regardless of environment
  FORCE_REAL_APIS: true,
  
  // Disable all mock data
  DISABLE_MOCKS: true,
  
  // API Configuration
  API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.aura.app/v1',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://api.aura.app',
    TIMEOUT: 30000,
    RETRY_COUNT: 3,
  },
  
  // Feature Flags - All ON for production
  FEATURES: {
    REAL_PAYMENTS: true,
    REAL_AUTH: true,
    REAL_LOCATION: true,
    REAL_RIDES: true,
    REAL_DRIVER_FEATURES: true,
    REAL_NOTIFICATIONS: true,
    REAL_CHAT: true,
    REAL_RATINGS: true,
  },
  
  // UI Configuration - All components fully rendered
  UI: {
    SHOW_ALL_FEATURES: true,
    ENABLE_ANIMATIONS: true,
    ENABLE_HAPTICS: true,
    ENABLE_SOUNDS: true,
  },
  
  // Logging
  LOGGING: {
    LEVEL: 'info',
    REDACT_PII: true,
    SEND_TO_SERVER: true,
  },
};

/**
 * Determines if we should use real APIs
 * ALWAYS returns true - no more mocks
 */
export function shouldUseRealAPI(): boolean {
  return true; // Always use real APIs
}

/**
 * Validates that all required environment variables are set for production
 */
export function validateProductionConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    errors.push('EXPO_PUBLIC_API_BASE_URL is required');
  }
  
  if (!process.env.EXPO_PUBLIC_WS_URL) {
    errors.push('EXPO_PUBLIC_WS_URL is required');
  }
  
  if (!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    errors.push('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is required for payments');
  }
  
  if (!process.env.EXPO_PUBLIC_MAPBOX_TOKEN) {
    errors.push('EXPO_PUBLIC_MAPBOX_TOKEN is required for maps');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export default PRODUCTION_CONFIG;
