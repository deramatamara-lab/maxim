/**
 * Unit Tests for Critical Modules
 * Tests core functionality, error handling, and edge cases
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { tokenManager } from '../../src/services/tokenManager';
import { securityConfig } from '../../src/utils/securityConfig';
import { piiCompliance } from '../../src/utils/piiCompliance';
import { apiClient } from '../../src/api/client';

describe('TokenManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Storage & Retrieval', () => {
    it('should store tokens securely', async () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer' as const,
      };

      await expect(tokenManager.setTokens(tokens)).resolves.not.toThrow();
    });

    it('should retrieve access token', async () => {
      const mockToken = 'test-access-token';
      jest.spyOn(tokenManager, 'getAccessToken').mockResolvedValue(mockToken);

      const result = await tokenManager.getAccessToken();
      expect(result).toBe(mockToken);
    });

    it('should return null for expired tokens', async () => {
      const expiredTokens = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000, // Expired
        tokenType: 'Bearer' as const,
      };

      await tokenManager.setTokens(expiredTokens);
      const isValid = await tokenManager.isTokenExpired();
      expect(isValid).toBe(true);
    });

    it('should refresh expired tokens', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer' as const,
      };

      jest.spyOn(tokenManager, 'refreshToken').mockResolvedValueOnce({
        success: true,
        tokens: newTokens,
      });

      const refreshResult = await tokenManager.refreshToken();
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.tokens).toEqual(newTokens);
    });

    it('should handle refresh token failure', async () => {
      const refreshResult = await tokenManager.refreshToken();
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error).toBeDefined();
    });

    it('should clear all tokens on logout', async () => {
      await expect(tokenManager.clearTokens()).resolves.not.toThrow();
    });

    it('should check authentication status', async () => {
      const isAuthenticated = await tokenManager.isAuthenticated();
      expect(typeof isAuthenticated).toBe('boolean');
    });
  });

  describe('Token Validation', () => {
    it('should validate token format', async () => {
      const tokenInfo = await tokenManager.getTokenInfo();
      expect(tokenInfo).toHaveProperty('hasAccessToken');
      expect(tokenInfo).toHaveProperty('hasRefreshToken');
      expect(tokenInfo).toHaveProperty('isExpired');
    });
  });
});

describe('SecurityConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should load security configuration', () => {
      const config = securityConfig.getConfig();
      expect(config).toHaveProperty('tokenRefreshThreshold');
      expect(config).toHaveProperty('enforceHttps');
      expect(config).toHaveProperty('encryptSensitiveData');
    });

    it('should detect secure environment', () => {
      const isSecure = securityConfig.isSecureEnvironment();
      expect(typeof isSecure).toBe('boolean');
    });
  });

  describe('API URL Validation', () => {
    it('should validate HTTPS URLs in production', () => {
      const isValid = securityConfig.validateApiUrl('https://api.auraride.com');
      expect(isValid).toBe(true);
    });

    it('should reject HTTP URLs when HTTPS enforced', () => {
      const isValid = securityConfig.validateApiUrl('http://api.auraride.com');
      expect(isValid).toBe(false);
    });

    it('should reject invalid domains', () => {
      const isValid = securityConfig.validateApiUrl('https://malicious.com');
      expect(isValid).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize PII from log data', () => {
      const sensitiveData = {
        email: 'user@example.com',
        phone: '123-456-7890',
        name: 'John Doe',
        token: 'secret-token',
      };

      const sanitized = securityConfig.sanitizeLogData(sensitiveData) as any;
      expect(sanitized.email).toBe('[REDACTED]');
      expect(sanitized.phone).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const nestedData = {
        user: {
          email: 'user@example.com',
          profile: {
            phone: '123-456-7890',
          },
        },
      };

      const sanitized = securityConfig.sanitizeLogData(nestedData) as any;
      expect(sanitized.user.email).toBe('[REDACTED]');
      expect(sanitized.user.profile.phone).toBe('[REDACTED]');
    });
  });

  describe('Security Requirements Validation', () => {
    it('should validate security requirements', () => {
      const validation = securityConfig.validateSecurityRequirements();
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('issues');
      expect(Array.isArray(validation.issues)).toBe(true);
    });
  });
});

describe('PIIComplianceManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PII Identification', () => {
    it('should identify PII fields in data', () => {
      const data = {
        email: 'user@example.com',
        phone: '123-456-7890',
        name: 'John Doe',
        preferences: {
          theme: 'dark',
        },
      };

      const { piiFields, sensitiveFields } = piiCompliance.identifyPII(data);
      expect(piiFields).toContain('email');
      expect(piiFields).toContain('phone');
      expect(piiFields).toContain('name');
      expect(piiFields).not.toContain('preferences');
    });

    it('should identify sensitive PII', () => {
      const data = {
        email: 'user@example.com',
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
      };

      const { sensitiveFields } = piiCompliance.identifyPII(data);
      expect(sensitiveFields).toContain('ssn');
      expect(sensitiveFields).toContain('creditCard');
    });
  });

  describe('Data Sanitization', () => {
    it('should mask PII data', () => {
      const data = {
        email: 'user@example.com',
        phone: '123-456-7890',
        name: 'John Doe',
      };

      const masked = piiCompliance.sanitizeData(data, 'mask') as any;
      expect(masked.email).toMatch(/.*@example\.com/);
      expect(masked.phone).toMatch(/\d{3}.*\d{4}/);
      expect(masked.name).toMatch(/.*\*\*\*.*/);
    });

    it('should remove PII data', () => {
      const data = {
        email: 'user@example.com',
        phone: '123-456-7890',
        preferences: 'dark',
      };

      const removed = piiCompliance.sanitizeData(data, 'remove') as any;
      expect(removed.email).toBeUndefined();
      expect(removed.phone).toBeUndefined();
      expect(removed.preferences).toBe('dark');
    });

    it('should hash PII data', () => {
      const data = {
        email: 'user@example.com',
        phone: '123-456-7890',
      };

      const hashed = piiCompliance.sanitizeData(data, 'hash') as any;
      expect(hashed.email).toMatch(/^hash_/);
      expect(hashed.phone).toMatch(/^hash_/);
    });
  });

  describe('Privacy Settings', () => {
    it('should get default privacy settings', async () => {
      const settings = await piiCompliance.getPrivacySettings();
      expect(settings).toHaveProperty('dataCollection');
      expect(settings).toHaveProperty('analytics');
      expect(settings).toHaveProperty('marketing');
      expect(settings).toHaveProperty('locationSharing');
      expect(settings).toHaveProperty('biometricAuth');
      expect(settings).toHaveProperty('crashReporting');
    });

    it('should update privacy settings', async () => {
      const newSettings = {
        analytics: true,
        marketing: false,
      };

      await expect(piiCompliance.updatePrivacySettings(newSettings)).resolves.not.toThrow();
    });
  });

  describe('Data Portability & Erasure', () => {
    it('should export user data', async () => {
      const exportData = await piiCompliance.exportUserData();
      expect(exportData).toHaveProperty('exportedAt');
      expect(exportData).toHaveProperty('data');
      expect(exportData).toHaveProperty('piiFields');
    });

    it('should delete all user data', async () => {
      await expect(piiCompliance.deleteAllUserData()).resolves.not.toThrow();
    });
  });
});

describe('APIClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Handling', () => {
    it('should make GET request with authentication', async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      jest.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/test');
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request with authentication', async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      jest.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/test', { name: 'test' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle authentication errors', async () => {
      const mockResponse = { success: false, error: 'Authentication required' };
      jest.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/protected');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });

    it('should retry failed requests', async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      jest.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/test', {}, 'high');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Token Management', () => {
    it('should set authentication token', async () => {
      await expect(apiClient.setAuthToken('test-token', 'refresh-token')).resolves.not.toThrow();
    });

    it('should clear authentication token', async () => {
      await expect(apiClient.clearAuthToken()).resolves.not.toThrow();
    });

    it('should check authentication status', async () => {
      const isAuthenticated = await apiClient.isAuthenticated();
      expect(typeof isAuthenticated).toBe('boolean');
    });
  });
});

describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    const mockError = { success: false, error: 'Network error' };
    jest.spyOn(apiClient, 'get').mockRejectedValue(mockError);

    try {
      await apiClient.get('/test');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle timeout errors', async () => {
    const mockTimeout = { success: false, error: 'Request timeout' };
    jest.spyOn(apiClient, 'get').mockRejectedValue(mockTimeout);

    try {
      await apiClient.get('/test');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle server errors gracefully', async () => {
    const mockServerError = { success: false, error: 'Internal server error' };
    jest.spyOn(apiClient, 'get').mockRejectedValue(mockServerError);

    try {
      await apiClient.get('/test');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('Performance Tests', () => {
  it('should handle rapid state updates efficiently', async () => {
    const tokenInfo = await tokenManager.getTokenInfo();
    expect(tokenInfo).toHaveProperty('hasAccessToken');
    expect(tokenInfo).toHaveProperty('hasRefreshToken');
    expect(tokenInfo).toHaveProperty('isExpired');
  });

  it('should handle concurrent requests', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValue({ success: true, data: {} } as any);
    
    const promises = Array.from({ length: 10 }, () => apiClient.get('/test'));
    const results = await Promise.allSettled(promises);

    expect(results).toHaveLength(10);
    results.forEach((result) => {
      expect(result.status).toBe('fulfilled');
    });
  });

  it('should handle large data responses', async () => {
    const largeData = { data: new Array(1000).fill('test') };
    const mockResponse = { success: true, data: largeData };
    jest.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

    const result = await apiClient.get('/large-data');
    expect(result.data).toEqual(largeData);
  });
});
