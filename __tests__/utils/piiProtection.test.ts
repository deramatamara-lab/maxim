/**
 * PII Protection Tests
 * Tests for OBS-01: Ensure no PII logged
 */

import { redactPII, containsPII, maskForDisplay, createSafeLogger } from '@/utils/piiProtection';

// Mock logger
jest.mock('@/utils/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('PII Protection', () => {
  describe('redactPII', () => {
    it('should redact email fields', () => {
      const data = { email: 'john@example.com', name: 'John Doe' };
      const redacted = redactPII(data);
      
      expect(redacted.email).toBe('[REDACTED_EMAIL]');
      expect(redacted.name).toBe('[REDACTED_NAME]');
    });

    it('should redact phone numbers', () => {
      const data = { phone: '+1234567890', phoneNumber: '555-123-4567' };
      const redacted = redactPII(data);
      
      expect(redacted.phone).toBe('[REDACTED_PHONE]');
      expect(redacted.phoneNumber).toBe('[REDACTED_PHONENUMBER]');
    });

    it('should redact credit card numbers', () => {
      const data = { cardNumber: '4111111111111111' };
      const redacted = redactPII(data);
      
      expect(redacted.cardNumber).toBe('[REDACTED_CARDNUMBER]');
    });

    it('should redact authentication tokens', () => {
      const data = { 
        accessToken: 'abc123token',
        password: 'secretpass',
        apiKey: 'key_12345',
      };
      const redacted = redactPII(data);
      
      expect(redacted.accessToken).toBe('[REDACTED_ACCESSTOKEN]');
      expect(redacted.password).toBe('[REDACTED_PASSWORD]');
      expect(redacted.apiKey).toBe('[REDACTED_APIKEY]');
    });

    it('should redact address fields', () => {
      const data = { 
        address: '123 Main St',
        streetAddress: '456 Oak Ave',
        zipCode: '12345',
      };
      const redacted = redactPII(data);
      
      expect(redacted.address).toBe('[REDACTED_ADDRESS]');
      expect(redacted.streetAddress).toBe('[REDACTED_STREETADDRESS]');
      expect(redacted.zipCode).toBe('[REDACTED_ZIPCODE]');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          email: 'user@example.com',
          profile: {
            phone: '555-123-4567',
          },
        },
      };
      const redacted = redactPII(data);
      
      expect(redacted.user.email).toBe('[REDACTED_EMAIL]');
      expect(redacted.user.profile.phone).toBe('[REDACTED_PHONE]');
    });

    it('should handle arrays', () => {
      const data = {
        users: [
          { email: 'user1@example.com' },
          { email: 'user2@example.com' },
        ],
      };
      const redacted = redactPII(data);
      
      expect(redacted.users[0].email).toBe('[REDACTED_EMAIL]');
      expect(redacted.users[1].email).toBe('[REDACTED_EMAIL]');
    });

    it('should preserve non-PII fields', () => {
      const data = {
        rideId: 'ride_123',
        status: 'completed',
        timestamp: '2025-01-01T00:00:00Z',
      };
      const redacted = redactPII(data);
      
      expect(redacted.rideId).toBe('ride_123');
      expect(redacted.status).toBe('completed');
      expect(redacted.timestamp).toBe('2025-01-01T00:00:00Z');
    });

    it('should handle null and undefined', () => {
      expect(redactPII(null)).toBeNull();
      expect(redactPII(undefined)).toBeUndefined();
    });

    it('should redact PII patterns in strings', () => {
      const message = 'Contact john@example.com or call 555-123-4567';
      const redacted = redactPII(message);
      
      expect(redacted).toContain('[REDACTED_EMAIL]');
      expect(redacted).toContain('[REDACTED_PHONE]');
    });
  });

  describe('containsPII', () => {
    it('should detect email addresses', () => {
      const data = { message: 'Email: test@example.com' };
      const result = containsPII(data);
      
      expect(result.hasPII).toBe(true);
      expect(result.fields.length).toBeGreaterThan(0);
    });

    it('should detect phone numbers', () => {
      const data = { message: 'Call 555-123-4567' };
      const result = containsPII(data);
      
      expect(result.hasPII).toBe(true);
    });

    it('should detect PII field names', () => {
      const data = { email: 'test@test.com' };
      const result = containsPII(data);
      
      expect(result.hasPII).toBe(true);
      expect(result.fields).toContain('email');
    });

    it('should return false for clean data', () => {
      const data = { rideId: 'ride_123', status: 'active' };
      const result = containsPII(data);
      
      expect(result.hasPII).toBe(false);
      expect(result.fields).toHaveLength(0);
    });
  });

  describe('maskForDisplay', () => {
    it('should mask email addresses', () => {
      const masked = maskForDisplay('john.doe@example.com', 'email');
      
      expect(masked).toBe('j***@example.com');
    });

    it('should mask phone numbers', () => {
      const masked = maskForDisplay('555-123-4567', 'phone');
      
      expect(masked).toBe('***-***-4567');
    });

    it('should mask credit card numbers', () => {
      const masked = maskForDisplay('4111111111111111', 'card');
      
      expect(masked).toBe('****-****-****-1111');
    });

    it('should handle short values gracefully', () => {
      expect(maskForDisplay('ab', 'email')).toBe('ab');
      expect(maskForDisplay('123', 'phone')).toBe('123');
      expect(maskForDisplay('111', 'card')).toBe('111');
    });
  });

  describe('createSafeLogger', () => {
    it('should create logger with all methods', () => {
      const safeLog = createSafeLogger();
      
      expect(safeLog.info).toBeDefined();
      expect(safeLog.warn).toBeDefined();
      expect(safeLog.error).toBeDefined();
      expect(safeLog.debug).toBeDefined();
    });

    it('should redact PII when logging', () => {
      const { log } = require('@/utils/logger');
      const safeLog = createSafeLogger();
      
      safeLog.info('User action', { email: 'test@example.com' });
      
      expect(log.info).toHaveBeenCalledWith(
        'User action',
        expect.objectContaining({ email: '[REDACTED_EMAIL]' })
      );
    });
  });
});
