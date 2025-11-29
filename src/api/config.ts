/**
 * API Configuration for Production Deployment
 * Centralizes all API-related environment variables and settings
 */

export interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
  timeout: number;
  retries: number;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
  analytics: boolean;
  enforceHttps: boolean;
}

export function getApiConfig(): ApiConfig {
  const env = process.env.EXPO_PUBLIC_ENV || 'development';
  
  // Base configuration with default URLs
  const config: ApiConfig = {
    baseUrl: 'http://localhost:3001/api',
    wsUrl: 'ws://localhost:3001',
    environment: env as 'development' | 'staging' | 'production',
    debug: process.env.EXPO_PUBLIC_DEBUG === 'true',
    analytics: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== 'false',
    enforceHttps: process.env.EXPO_PUBLIC_ENFORCE_HTTPS !== 'false',
    timeout: 10000,
    retries: 3,
  };

  // Environment-specific URLs
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    // Explicit environment variable takes precedence
    config.baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    config.wsUrl = process.env.EXPO_PUBLIC_WS_URL || config.baseUrl.replace('http', 'ws');
  } else {
    // Default URLs by environment
    switch (env) {
      case 'production':
        config.baseUrl = 'https://api.aura.app/v1';
        config.wsUrl = 'wss://api.aura.app';
        break;
      case 'staging':
        config.baseUrl = 'https://api-staging.aura.app/v1';
        config.wsUrl = 'wss://api-staging.aura.app';
        break;
      default:
        // HARDCODED for reliability during dev
        config.baseUrl = 'http://localhost:3001/api';
        config.wsUrl = 'ws://localhost:3001';
    }
  }

  return config;
}

/**
 * Expected Backend API Contract
 * This document defines the endpoints that the frontend expects
 * Backend team should implement these endpoints for production
 */

export const API_CONTRACT = {
  // Authentication endpoints
  auth: {
    login: 'POST /auth/login',
    register: 'POST /auth/register',
    refresh: 'POST /auth/refresh',
    logout: 'POST /auth/logout',
    profile: 'GET /auth/profile',
    updateProfile: 'PUT /auth/profile',
  },
  
  // Ride management endpoints
  rides: {
    estimate: 'POST /rides/estimate',
    book: 'POST /rides',
    cancel: 'POST /rides/{rideId}/cancel',
    getStatus: 'GET /rides/{rideId}',
    getHistory: 'GET /rides/history',
    getActive: 'GET /rides/active',
    updateLocation: 'POST /rides/{rideId}/location',
  },
  
  // Driver endpoints
  drivers: {
    getAvailable: 'GET /drivers/available',
    acceptRide: 'POST /drivers/{driverId}/accept',
    updateLocation: 'POST /drivers/{driverId}/location',
    getProfile: 'GET /drivers/{driverId}',
    getEarnings: 'GET /drivers/{driverId}/earnings',
  },
  
  // Payment endpoints
  payments: {
    getMethods: 'GET /payments/methods',
    addMethod: 'POST /payments/methods',
    deleteMethod: 'DELETE /payments/methods/{methodId}',
    processPayment: 'POST /payments/process',
    getHistory: 'GET /payments/history',
  },
  
  // Pricing endpoints
  pricing: {
    calculate: 'POST /pricing/calculate',
    getSurgeInfo: 'GET /pricing/surge',
    getEstimate: 'POST /pricing/estimate',
  },
  
  // Location endpoints
  location: {
    geocode: 'GET /location/geocode',
    reverseGeocode: 'GET /location/reverse-geocode',
    searchPlaces: 'GET /location/search',
    getETA: 'POST /location/eta',
  },
  
  // WebSocket events
  websocket: {
    connection: 'WebSocket connection with JWT auth',
    events: [
      'ride_request',
      'ride_accepted',
      'ride_started',
      'ride_completed',
      'ride_cancelled',
      'location_update',
      'driver_location_update',
      'chat_message',
      'presence_update',
    ],
  },
} as const;

/**
 * Environment validation
 * Ensures all required environment variables are present
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const env = process.env.EXPO_PUBLIC_ENV || 'development';
  
  if (env === 'production') {
    if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
      errors.push('EXPO_PUBLIC_API_BASE_URL is required in production');
    }
    if (!process.env.EXPO_PUBLIC_WS_URL) {
      errors.push('EXPO_PUBLIC_WS_URL is required in production');
    }
    if (process.env.EXPO_PUBLIC_ENFORCE_HTTPS !== 'true') {
      errors.push('EXPO_PUBLIC_ENFORCE_HTTPS should be true in production');
    }
  }
  
  // Optional but recommended
  if (env !== 'development' && !process.env.EXPO_PUBLIC_MAPBOX_TOKEN) {
    errors.push('EXPO_PUBLIC_MAPBOX_TOKEN is recommended for non-development environments');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Export singleton config instance
 */
export const apiConfig = getApiConfig();
