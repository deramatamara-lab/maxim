/**
 * PII Protection Utilities
 * Ensures no Personally Identifiable Information is logged
 * Production requirement: OBS-01 - Ensure no PII logged
 */

import { log } from './logger';

/**
 * List of PII field names to redact
 */
const PII_FIELDS = [
  // Personal identification
  'email', 'phone', 'phoneNumber', 'mobile', 'telephone',
  'ssn', 'socialSecurityNumber', 'taxId', 'nationalId',
  
  // Names
  'name', 'firstName', 'lastName', 'fullName', 'displayName',
  'username', 'userName',
  
  // Financial
  'cardNumber', 'creditCard', 'debitCard', 'accountNumber',
  'bankAccount', 'routingNumber', 'cvv', 'cvc', 'pin',
  
  // Authentication
  'password', 'secret', 'token', 'accessToken', 'refreshToken',
  'apiKey', 'privateKey', 'sessionId', 'authToken',
  
  // Address
  'address', 'streetAddress', 'street', 'city', 'state', 'zipCode',
  'postalCode', 'country', 'homeAddress', 'workAddress',
  
  // Identity documents
  'driversLicense', 'driverLicense', 'passport', 'passportNumber',
  'licenseNumber', 'vehicleRegistration',
  
  // Other PII
  'dateOfBirth', 'dob', 'birthDate', 'age',
  'ipAddress', 'ip', 'deviceId', 'imei',
  'biometric', 'fingerprint', 'faceId',
];

/**
 * Patterns to detect PII in string values
 */
const PII_PATTERNS = [
  // Email
  { name: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  // Phone (various formats)
  { name: 'phone', pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g },
  // Credit card (basic pattern)
  { name: 'creditCard', pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g },
  // SSN
  { name: 'ssn', pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g },
  // IP address
  { name: 'ipAddress', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
];

/**
 * Redacts a single value if it matches PII patterns
 */
function redactValue(value: string): string {
  let redacted = value;
  
  for (const { name, pattern } of PII_PATTERNS) {
    if (pattern.test(redacted)) {
      redacted = redacted.replace(pattern, `[REDACTED_${name.toUpperCase()}]`);
    }
  }
  
  return redacted;
}

/**
 * Deep clones and redacts PII from an object
 */
export function redactPII<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return redactValue(data) as T;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactPII(item)) as T;
  }

  const redacted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field name is PII
    const isPIIField = PII_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (isPIIField) {
      // Redact the entire value
      if (typeof value === 'string') {
        redacted[key] = `[REDACTED_${key.toUpperCase()}]`;
      } else if (typeof value === 'number') {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        redacted[key] = '[REDACTED_OBJECT]';
      } else {
        redacted[key] = '[REDACTED]';
      }
    } else {
      // Recursively redact nested objects
      redacted[key] = redactPII(value);
    }
  }

  return redacted as T;
}

/**
 * Creates a safe logging wrapper that automatically redacts PII
 */
export function createSafeLogger() {
  return {
    info: (message: string, data?: Record<string, unknown>) => {
      log.info(message, data ? redactPII(data) : undefined);
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      log.warn(message, data ? redactPII(data) : undefined);
    },
    error: (message: string, data?: Record<string, unknown>, error?: Error) => {
      log.error(message, data ? redactPII(data) : undefined, error);
    },
    debug: (message: string, data?: Record<string, unknown>) => {
      log.debug(message, data ? redactPII(data) : undefined);
    },
  };
}

/**
 * Validates that a log payload doesn't contain PII
 * Used for testing and compliance verification
 */
export function containsPII(data: unknown): { hasPII: boolean; fields: string[] } {
  const foundFields: string[] = [];

  const checkValue = (value: unknown, path: string = ''): void => {
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      for (const { name, pattern } of PII_PATTERNS) {
        if (pattern.test(value)) {
          foundFields.push(`${path}: ${name}`);
        }
      }
    }

    if (typeof value === 'object') {
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();
        const isPIIField = PII_FIELDS.some(field => 
          lowerKey.includes(field.toLowerCase())
        );
        
        if (isPIIField && val !== null && val !== undefined) {
          foundFields.push(`${path ? path + '.' : ''}${key}`);
        } else {
          checkValue(val, path ? `${path}.${key}` : key);
        }
      }
    }
  };

  checkValue(data);

  return {
    hasPII: foundFields.length > 0,
    fields: foundFields,
  };
}

/**
 * Masks sensitive values for display (not logging)
 * Shows partial information for UX purposes
 */
export function maskForDisplay(value: string, type: 'email' | 'phone' | 'card'): string {
  switch (type) {
    case 'email': {
      const [local, domain] = value.split('@');
      if (!domain) return value;
      return `${local.charAt(0)}***@${domain}`;
    }
    case 'phone': {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 4) return value;
      return `***-***-${digits.slice(-4)}`;
    }
    case 'card': {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 4) return value;
      return `****-****-****-${digits.slice(-4)}`;
    }
    default:
      return value;
  }
}

// Export singleton safe logger
export const safeLog = createSafeLogger();
