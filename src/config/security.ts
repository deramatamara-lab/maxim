/**
 * Security Configuration
 * Centralized security settings including certificate pinning, HTTPS enforcement,
 * and security headers for the Aura Ride App
 */

import { Platform } from 'react-native';
import { log } from '../utils/logger';

// Certificate pins for production API servers
// These should be updated when certificates are rotated
export interface CertificatePin {
  host: string;
  pins: string[]; // SHA-256 fingerprints
  includeSubdomains: boolean;
}

// Production certificate pins (placeholder - update with actual pins before deployment)
export const CERTIFICATE_PINS: CertificatePin[] = [
  {
    host: 'api.auraride.com',
    pins: [
      // Primary certificate pin (SHA-256)
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      // Backup certificate pin (SHA-256)
      'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    ],
    includeSubdomains: true,
  },
];

// Security configuration
export interface SecurityConfig {
  enforceHttps: boolean;
  enableCertificatePinning: boolean;
  enableStrictTransportSecurity: boolean;
  maxTokenAge: number; // milliseconds
  sessionTimeout: number; // milliseconds
  requireSecureContext: boolean;
}

const SECURITY_CONFIG: SecurityConfig = {
  enforceHttps: process.env.EXPO_PUBLIC_ENV === 'production',
  enableCertificatePinning: process.env.EXPO_PUBLIC_ENV === 'production',
  enableStrictTransportSecurity: true,
  maxTokenAge: 3600000, // 1 hour
  sessionTimeout: 1800000, // 30 minutes
  requireSecureContext: process.env.EXPO_PUBLIC_ENV === 'production',
};

/**
 * Get security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  return { ...SECURITY_CONFIG };
}

/**
 * Validate URL security
 * Ensures HTTPS is used in production environments
 */
export function validateUrlSecurity(url: string): { isSecure: boolean; error?: string } {
  if (!SECURITY_CONFIG.enforceHttps) {
    return { isSecure: true };
  }

  try {
    const parsedUrl = new URL(url);
    
    if (parsedUrl.protocol !== 'https:') {
      return {
        isSecure: false,
        error: 'Insecure HTTP connections are not allowed in production',
      };
    }

    return { isSecure: true };
  } catch (_error) {
    return {
      isSecure: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Get security headers for API requests
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };

  if (SECURITY_CONFIG.enableStrictTransportSecurity) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // Add platform-specific security headers
  headers['X-Platform'] = Platform.OS;
  headers['X-App-Version'] = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';

  return headers;
}

/**
 * Validate certificate pin (placeholder for native implementation)
 * In production, this should be implemented using a native module
 * like react-native-ssl-pinning or expo-dev-client custom native code
 */
export function validateCertificatePin(host: string, _certificate: string): boolean {
  if (!SECURITY_CONFIG.enableCertificatePinning) {
    return true;
  }

  const pinConfig = CERTIFICATE_PINS.find(pin => {
    if (pin.includeSubdomains) {
      return host.endsWith(pin.host) || host === pin.host;
    }
    return host === pin.host;
  });

  if (!pinConfig) {
    log.warn('No certificate pin found for host', {
      event: 'certificate_pin_missing',
      component: 'security',
      host,
    });
    // In strict mode, reject unknown hosts in production
    return !SECURITY_CONFIG.requireSecureContext;
  }

  // NOTE: Actual certificate validation requires native implementation
  // This is a placeholder that logs the attempt
  log.info('Certificate pin validation requested', {
    event: 'certificate_pin_check',
    component: 'security',
    host,
    pinCount: pinConfig.pins.length,
  });

  // Return true for now - actual implementation requires native module
  return true;
}

/**
 * Check if session is expired based on last activity
 */
export function isSessionExpired(lastActivityTimestamp: number): boolean {
  const now = Date.now();
  return now - lastActivityTimestamp > SECURITY_CONFIG.sessionTimeout;
}

/**
 * Check if token needs refresh
 */
export function shouldRefreshToken(tokenExpiresAt: number): boolean {
  const now = Date.now();
  // Refresh token 5 minutes before expiry
  const bufferTime = 5 * 60 * 1000;
  return tokenExpiresAt - now < bufferTime;
}

/**
 * Sanitize sensitive data for logging
 * Removes or masks sensitive fields before logging
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'pin',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Security audit log
 * Logs security-related events for audit purposes
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  severity: 'info' | 'warn' | 'error' = 'info'
): void {
  const sanitizedDetails = sanitizeForLogging(details);
  
  const logData = {
    event: `security:${event}`,
    component: 'security_audit',
    timestamp: new Date().toISOString(),
    ...sanitizedDetails,
  };

  switch (severity) {
    case 'error':
      log.error('Security event', logData);
      break;
    case 'warn':
      log.warn('Security event', logData);
      break;
    default:
      log.info('Security event', logData);
  }
}

export default {
  getSecurityConfig,
  validateUrlSecurity,
  getSecurityHeaders,
  validateCertificatePin,
  isSessionExpired,
  shouldRefreshToken,
  sanitizeForLogging,
  logSecurityEvent,
  CERTIFICATE_PINS,
};
