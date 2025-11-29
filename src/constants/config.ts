/**
 * Typed configuration module with environment variable validation.
 * Fails fast at startup if required values are missing or malformed.
 * 
 * SECURITY: All secrets must come from environment variables, never hardcoded.
 * Use .env.development, .env.staging, or .env.production files.
 */

interface Config {
  // API & Network
  apiBaseUrl: string;
  wsUrl: string;
  mapboxToken: string;
  stripePublishableKey: string;
  
  // Environment
  environment: 'development' | 'staging' | 'production';
  nodeEnv: string;
  
  // Security
  enableDebug: boolean;
  analyticsEnabled: boolean;
  enforceHttps: boolean;
  apiTimeout: number;
  tokenRefreshThreshold: number;
  
  // Crash Tracking
  sentryDsn: string | null;
  enableCrashReporting: boolean;
  
  // Feature Flags
  enableBiometricAuth: boolean;
  enableRideSharing: boolean;
  enableSOSFeature: boolean;
  enableVoiceNavigation: boolean;
  
  // Payment
  paymentGateway: 'stripe' | 'mock';
  currency: string;
  minRideFare: number;
  maxRideFare: number;
  
  // Map & Location
  mapStyle: string;
  locationAccuracy: 'high' | 'balanced' | 'low';
  locationUpdateInterval: number;
  
  // Development
  useMockAPI: boolean;
  verboseLogging: boolean;
  enableDevMenu: boolean;
  skipOnboarding: boolean;
}

const getEnvVar = (key: string, required = true): string | undefined => {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(
      `FATAL: Missing required environment variable: ${key}\n` +
      `Please ensure ${key} is set in your .env file or environment.`
    );
  }
  
  return value;
};

const validateUrl = (url: string): void => {
  try {
    new URL(url);
  } catch {
    throw new Error(
      `FATAL: Invalid URL format for API_BASE_URL: "${url}"\n` +
      `Expected format: https://api.example.com`
    );
  }
};

// Initialize and validate configuration at module load time
const initConfig = (): Config => {
  // API & Network
  const apiBaseUrl = getEnvVar('EXPO_PUBLIC_API_BASE_URL', true) ?? '';
  validateUrl(apiBaseUrl);
  const wsUrl = getEnvVar('EXPO_PUBLIC_WS_URL', false) ?? apiBaseUrl.replace('http', 'ws');
  const mapboxToken = getEnvVar('EXPO_PUBLIC_MAPBOX_TOKEN', true) ?? '';
  const stripePublishableKey = getEnvVar('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY', true) ?? '';
  
  // Environment
  const environment = (getEnvVar('EXPO_PUBLIC_ENV', false) ?? 'development') as Config['environment'];
  const nodeEnv = getEnvVar('NODE_ENV', false) ?? 'development';
  
  // Security
  const enableDebug = getEnvVar('EXPO_PUBLIC_DEBUG', false) === 'true';
  const analyticsEnabled = getEnvVar('EXPO_PUBLIC_ANALYTICS_ENABLED', false) === 'true';
  const enforceHttps = getEnvVar('EXPO_PUBLIC_ENFORCE_HTTPS', false) === 'true';
  const apiTimeout = parseInt(getEnvVar('EXPO_PUBLIC_API_TIMEOUT', false) ?? '10000', 10);
  const tokenRefreshThreshold = parseInt(getEnvVar('EXPO_PUBLIC_TOKEN_REFRESH_THRESHOLD', false) ?? '300', 10);
  
  // Crash Tracking
  const sentryDsn = getEnvVar('EXPO_PUBLIC_SENTRY_DSN', false) || null;
  const enableCrashReporting = getEnvVar('EXPO_PUBLIC_ENABLE_CRASH_REPORTING', false) === 'true';
  
  // Feature Flags
  const enableBiometricAuth = getEnvVar('EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH', false) !== 'false';
  const enableRideSharing = getEnvVar('EXPO_PUBLIC_ENABLE_RIDE_SHARING', false) !== 'false';
  const enableSOSFeature = getEnvVar('EXPO_PUBLIC_ENABLE_SOS_FEATURE', false) !== 'false';
  const enableVoiceNavigation = getEnvVar('EXPO_PUBLIC_ENABLE_VOICE_NAVIGATION', false) === 'true';
  
  // Payment
  const paymentGateway = (getEnvVar('EXPO_PUBLIC_PAYMENT_GATEWAY', false) ?? 'stripe') as Config['paymentGateway'];
  const currency = getEnvVar('EXPO_PUBLIC_CURRENCY', false) ?? 'USD';
  const minRideFare = parseFloat(getEnvVar('EXPO_PUBLIC_MIN_RIDE_FARE', false) ?? '5.00');
  const maxRideFare = parseFloat(getEnvVar('EXPO_PUBLIC_MAX_RIDE_FARE', false) ?? '500.00');
  
  // Map & Location
  const mapStyle = getEnvVar('EXPO_PUBLIC_MAP_STYLE', false) ?? 'mapbox://styles/mapbox/dark-v11';
  const locationAccuracy = (getEnvVar('EXPO_PUBLIC_LOCATION_ACCURACY', false) ?? 'high') as Config['locationAccuracy'];
  const locationUpdateInterval = parseInt(getEnvVar('EXPO_PUBLIC_LOCATION_UPDATE_INTERVAL', false) ?? '5000', 10);
  
  // Development
  const useMockAPI = getEnvVar('EXPO_PUBLIC_USE_MOCK_API', false) === 'true';
  const verboseLogging = getEnvVar('EXPO_PUBLIC_VERBOSE_LOGGING', false) === 'true';
  const enableDevMenu = getEnvVar('EXPO_PUBLIC_ENABLE_DEV_MENU', false) === 'true';
  const skipOnboarding = getEnvVar('EXPO_PUBLIC_SKIP_ONBOARDING', false) === 'true';
  
  return {
    apiBaseUrl,
    wsUrl,
    mapboxToken,
    stripePublishableKey,
    environment,
    nodeEnv,
    enableDebug,
    analyticsEnabled,
    enforceHttps,
    apiTimeout,
    tokenRefreshThreshold,
    sentryDsn,
    enableCrashReporting,
    enableBiometricAuth,
    enableRideSharing,
    enableSOSFeature,
    enableVoiceNavigation,
    paymentGateway,
    currency,
    minRideFare,
    maxRideFare,
    mapStyle,
    locationAccuracy,
    locationUpdateInterval,
    useMockAPI,
    verboseLogging,
    enableDevMenu,
    skipOnboarding,
  };
};

// Export singleton instance
export const config = initConfig();
