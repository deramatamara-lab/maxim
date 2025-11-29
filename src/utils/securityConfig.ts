/**
 * Security Configuration Manager
 * Centralizes security settings and validation for production deployment
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { log } from './logger';

export interface SecurityConfig {
  // Token Security
  tokenRefreshThreshold: number; // seconds before expiration to refresh
  maxTokenAge: number; // maximum token age in seconds
  requireBiometricForSensitiveOps: boolean;
  
  // Network Security
  enforceHttps: boolean;
  apiTimeout: number; // milliseconds
  maxRetries: number;
  retryBackoffMs: number;
  
  // Data Security
  encryptSensitiveData: boolean;
  dataRetentionDays: number;
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  
  // Feature Security
  allowScreenshots: boolean;
  allowJailbreak: boolean;
  requireDeviceAuth: boolean;
}

export class SecurityConfigManager {
  private static instance: SecurityConfigManager;
  private config: SecurityConfig;

  static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager();
    }
    return SecurityConfigManager.instance;
  }

  private constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): SecurityConfig {
    const env = Constants.expoConfig?.extra?.ENV || 'development';
    const isProduction = env === 'production';
    const isStaging = env === 'staging';
    const isTestEnv = process.env.NODE_ENV === 'test';

    return {
      // Token Security
      tokenRefreshThreshold: parseInt(Constants.expoConfig?.extra?.TOKEN_REFRESH_THRESHOLD || '300'),
      maxTokenAge: isProduction ? 3600 : 7200, // 1 hour production, 2 hours dev
      requireBiometricForSensitiveOps: isProduction,
      
      // Network Security
      // Enforce HTTPS in production, staging, and test to match security expectations
      enforceHttps: isProduction || isStaging || isTestEnv || Constants.expoConfig?.extra?.ENFORCE_HTTPS === 'true',
      apiTimeout: parseInt(Constants.expoConfig?.extra?.API_TIMEOUT || '10000'),
      maxRetries: isProduction ? 3 : 5,
      retryBackoffMs: isProduction ? 1000 : 500,
      
      // Data Security
      encryptSensitiveData: true,
      dataRetentionDays: isProduction ? 30 : 90,
      logLevel: isProduction ? 'error' : isStaging ? 'warn' : 'debug',
      
      // Feature Security
      allowScreenshots: !isProduction,
      allowJailbreak: !isProduction,
      requireDeviceAuth: isProduction,
    };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  isSecureEnvironment(): boolean {
    const env = Constants.expoConfig?.extra?.ENV || 'development';
    return env === 'production' || env === 'staging';
  }

  validateApiUrl(url: string): boolean {
    // Ensure HTTPS in production
    if (this.config.enforceHttps && !url.startsWith('https://')) {
      log.error('Insecure API URL detected', { event: 'insecure_api_url_detected', component: 'securityConfig', url });
      return false;
    }
    
    // Validate domain
    const allowedDomains = [
      'api.auraride.com',
      'api.aura.example.com',
      'staging-api.auraride.com',
    ];
    
    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  getSecureHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.config.enforceHttps) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    // Add security headers for production
    if (this.isSecureEnvironment()) {
      headers['X-Content-Type-Options'] = 'nosniff';
      headers['X-Frame-Options'] = 'DENY';
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    return headers;
  }

  sanitizeLogData(data: unknown): unknown {
    if (this.config.logLevel === 'none') {
      return null;
    }

    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password', 'token', 'accessToken', 'refreshToken',
      'creditCard', 'ssn', 'email', 'phone', 'address',
      'location', 'coordinates', 'latitude', 'longitude'
    ];

    const sanitized = { ...data };
    
    const sanitizeRecursive = (obj: unknown, path: string = ''): unknown => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => sanitizeRecursive(item, `${path}[${index}]`));
      }

      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeRecursive(value, currentPath);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeRecursive(sanitized);
  }

  validateSecurityRequirements(): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check environment variables
    const requiredEnvVars = [
      'EXPO_PUBLIC_API_BASE_URL',
      'EXPO_PUBLIC_MAPBOX_TOKEN',
    ];

    for (const envVar of requiredEnvVars) {
      if (!Constants.expoConfig?.extra?.[envVar.replace('EXPO_PUBLIC_', '')]) {
        issues.push(`Missing required environment variable: ${envVar}`);
      }
    }

    // Validate API URL
    const apiUrl = Constants.expoConfig?.extra?.API_BASE_URL;
    if (apiUrl && !this.validateApiUrl(apiUrl)) {
      issues.push('Invalid API URL configuration');
    }

    // Check platform security
    if (Platform.OS === 'ios' && this.config.requireBiometricForSensitiveOps) {
      // Note: Biometric availability check should be done at runtime
      // This is just a configuration validation
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

// Export singleton instance
export const securityConfig = SecurityConfigManager.getInstance();
