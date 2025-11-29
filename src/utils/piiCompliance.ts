/**
 * PII & GDPR Compliance Manager
 * Identifies, protects, and manages personally identifiable information
 * Ensures compliance with GDPR and privacy regulations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage, StorageKey } from './secureStorage';
import { securityConfig } from './securityConfig';
import { log } from './logger';

export interface PIIField {
  name: string;
  type: 'direct' | 'indirect' | 'sensitive';
  category: 'personal' | 'contact' | 'location' | 'financial' | 'health' | 'biometric';
  retentionDays: number;
  encrypted: boolean;
  consentRequired: boolean;
}

export interface DataSubject {
  id: string;
  personalData: Record<string, unknown>;
  consentRecords: {
    purpose: string;
    grantedAt: string;
    expiresAt?: string;
    withdrawnAt?: string;
  }[];
  dataRetention: {
    [category: string]: string; // expiration dates
  };
}

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  marketing: boolean;
  locationSharing: boolean;
  biometricAuth: boolean;
  crashReporting: boolean;
}

export interface StoredUserData {
  privacySettings?: PrivacySettings;
  updatedAt?: string;
}

export interface StoredPIIData {
  _piiMetadata: {
    piiFields: string[];
    sensitiveFields: string[];
    category: string;
    storedAt: string;
    retentionDays: number;
  };
  [key: string]: unknown;
}

export class PIIComplianceManager {
  private static instance: PIIComplianceManager;
  private piiFields: Map<string, PIIField> = new Map();

  static getInstance(): PIIComplianceManager {
    if (!PIIComplianceManager.instance) {
      PIIComplianceManager.instance = new PIIComplianceManager();
    }
    return PIIComplianceManager.instance;
  }

  private constructor() {
    this.initializePIIFields();
  }

  private initializePIIFields(): void {
    // Define all PII fields in the system
    const piiDefinitions: PIIField[] = [
      // Direct Identifiers
      { name: 'email', type: 'direct', category: 'contact', retentionDays: 365, encrypted: true, consentRequired: true },
      { name: 'phone', type: 'direct', category: 'contact', retentionDays: 365, encrypted: true, consentRequired: true },
      { name: 'name', type: 'direct', category: 'personal', retentionDays: 365, encrypted: true, consentRequired: true },
      { name: 'ssn', type: 'sensitive', category: 'personal', retentionDays: 0, encrypted: true, consentRequired: true },
      
      // Location Data
      { name: 'latitude', type: 'indirect', category: 'location', retentionDays: 30, encrypted: true, consentRequired: true },
      { name: 'longitude', type: 'indirect', category: 'location', retentionDays: 30, encrypted: true, consentRequired: true },
      { name: 'address', type: 'direct', category: 'location', retentionDays: 365, encrypted: true, consentRequired: true },
      
      // Financial Data
      { name: 'creditCard', type: 'sensitive', category: 'financial', retentionDays: 0, encrypted: true, consentRequired: true },
      { name: 'bankAccount', type: 'sensitive', category: 'financial', retentionDays: 0, encrypted: true, consentRequired: true },
      { name: 'paymentMethod', type: 'indirect', category: 'financial', retentionDays: 365, encrypted: true, consentRequired: true },
      
      // Biometric Data
      { name: 'faceId', type: 'sensitive', category: 'biometric', retentionDays: 0, encrypted: true, consentRequired: true },
      { name: 'fingerprint', type: 'sensitive', category: 'biometric', retentionDays: 0, encrypted: true, consentRequired: true },
      
      // Health Data (if applicable)
      { name: 'medicalInfo', type: 'sensitive', category: 'health', retentionDays: 0, encrypted: true, consentRequired: true },
    ];

    piiDefinitions.forEach(field => {
	  // Store keys in lowercase so identifyPII can use key.toLowerCase() reliably
	  this.piiFields.set(field.name.toLowerCase(), field);
	});
  }

  /**
   * Identify PII in data object
   */
  identifyPII(data: unknown): { piiFields: string[]; sensitiveFields: string[] } {
    const piiFields: string[] = [];
    const sensitiveFields: string[] = [];

    const scanObject = (obj: unknown, path: string = ''): void => {
      if (!obj || typeof obj !== 'object') return;

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if this field is PII
        const piiField = this.piiFields.get(key.toLowerCase());
        if (piiField) {
          piiFields.push(currentPath);
          if (piiField.type === 'sensitive') {
            sensitiveFields.push(currentPath);
          }
        }

        // Recursively scan nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          scanObject(value, currentPath);
        }
      }
    };

    scanObject(data);
    return { piiFields, sensitiveFields };
  }

  /**
   * Sanitize data by removing or masking PII
   */
  sanitizeData(data: unknown, level: 'mask' | 'remove' | 'hash' = 'mask'): unknown {
    const { piiFields, sensitiveFields: _sensitiveFields } = this.identifyPII(data);

    if (!data || typeof data !== 'object') {
      return data;
    }

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
        
        if (piiFields.includes(currentPath)) {
          const piiField = this.piiFields.get(key.toLowerCase());
          
          switch (level) {
            case 'remove':
              // Skip this field entirely
              break;
            
            case 'mask':
              // Mask the value
              if (typeof value === 'string') {
                if (piiField?.type === 'sensitive') {
                  result[key] = '[SENSITIVE]';
                } else if (key.toLowerCase().includes('email')) {
                  result[key] = value.replace(/(.{2}).*(@.*)/, '$1***$2');
                } else if (key.toLowerCase().includes('phone')) {
                  result[key] = value.replace(/(.{3}).*(.{4})/, '$1****$2');
                } else {
                  result[key] = value.length > 4 ? `${value.substring(0, 2)}***${value.substring(value.length - 2)}` : '***';
                }
              } else {
                result[key] = '[MASKED]';
              }
              break;
            
            case 'hash':
              // Hash the value (for logging/analytics)
              result[key] = this.hashValue(value);
              break;
          }
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeRecursive(value, currentPath);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeRecursive(data);
  }

  /**
   * Hash sensitive values for analytics
   */
  private hashValue(value: unknown): string {
    // Simple hash implementation - in production, use proper cryptographic hash
    const str = String(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash)}`;
  }

  /**
   * Store PII with proper encryption and retention
   */
  async storePII(key: string, data: unknown, category: string): Promise<void> {
    const { piiFields, sensitiveFields } = this.identifyPII(data);
    
    if (piiFields.length === 0) {
      // No PII, store normally with AsyncStorage for dynamic keys
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return;
    }

    // Encrypt PII data
    const encryptedData: StoredPIIData = {
      ...(data as Record<string, unknown>),
      _piiMetadata: {
        piiFields,
        sensitiveFields,
        category,
        storedAt: new Date().toISOString(),
        retentionDays: this.getRetentionDays(category),
      },
    };

    // Use a predefined StorageKey for PII data
    await secureStorage.set(StorageKey.USER_DATA, encryptedData, { 
      encrypt: true,
      ttl: this.getRetentionDays(category) * 24 * 60 * 60 * 1000, // Convert to milliseconds
    });
  }

  /**
   * Retrieve PII with access logging
   */
  async retrievePII(key: string): Promise<unknown> {
    try {
      // Try AsyncStorage first for dynamic keys
      const asyncData = await AsyncStorage.getItem(key);
      if (asyncData) {
        return JSON.parse(asyncData);
      }

      // Try secureStorage for PII data
      const data = await secureStorage.get<StoredPIIData>(StorageKey.USER_DATA);
      
      if (data && data._piiMetadata) {
        // Log PII access for audit trail
        this.logPIIAccess(key, data._piiMetadata);
        
        // Remove metadata before returning
        const { _piiMetadata, ...cleanData } = data;
        return cleanData;
      }
      
      return data;
    } catch (error) {
      log.error('Failed to retrieve PII', { event: 'retrieve_pii_failed', component: 'piiCompliance', key }, error);
      return null;
    }
  }

  /**
   * Delete PII data (GDPR right to erasure)
   */
  async deletePII(key: string): Promise<void> {
    try {
      // Try AsyncStorage first for dynamic keys
      await AsyncStorage.removeItem(key);
      
      // Also clear from secureStorage
      await secureStorage.remove(StorageKey.USER_DATA);
      
      this.logPIIDeletion(key);
    } catch (error) {
      log.error('Failed to delete PII', { event: 'delete_pii_failed', component: 'piiCompliance', key }, error);
    }
  }

  /**
   * Get retention days for category
   */
  private getRetentionDays(category: string): number {
    const retentionMap: Record<string, number> = {
      'personal': 365,
      'contact': 365,
      'location': 30,
      'financial': 365,
      'health': 0, // Don't store health data
      'biometric': 0, // Don't store biometric data
    };
    
    return retentionMap[category] || 90;
  }

  /**
   * Log PII access for audit trail
   */
  private async logPIIAccess(key: string, metadata: unknown): Promise<void> {
    // Type guard for metadata
    if (!metadata || typeof metadata !== 'object') return;
    
    const meta = metadata as { category?: string; piiFields?: string[]; sensitiveFields?: string[] };
    
    const accessLog = {
      key,
      category: meta.category || 'unknown',
      piiFieldCount: meta.piiFields?.length || 0,
      sensitiveFieldCount: meta.sensitiveFields?.length || 0,
      accessedAt: new Date().toISOString(),
      purpose: 'app_functionality',
    };

    // Store access log with AsyncStorage for dynamic keys
    try {
      await AsyncStorage.setItem(
        `pii_access_${Date.now()}`, 
        JSON.stringify(accessLog)
      );
    } catch (error) {
      log.warn('Failed to log PII access', { event: 'log_pii_access_failed', component: 'piiCompliance' }, error);
    }
  }

  /**
   * Log PII deletion for audit trail
   */
  private async logPIIDeletion(key: string): Promise<void> {
    const deletionLog = {
      key,
      deletedAt: new Date().toISOString(),
      reason: 'gdpr_request',
    };

    // Store deletion log with AsyncStorage for dynamic keys
    try {
      await AsyncStorage.setItem(
        `pii_deletion_${Date.now()}`, 
        JSON.stringify(deletionLog)
      );
    } catch (error) {
      log.warn('Failed to log PII deletion', { event: 'log_pii_deletion_failed', component: 'piiCompliance' }, error);
    }
  }

  /**
   * Get user's privacy settings
   */
  async getPrivacySettings(): Promise<PrivacySettings> {
    const defaultSettings: PrivacySettings = {
      dataCollection: true,
      analytics: false,
      marketing: false,
      locationSharing: true,
      biometricAuth: securityConfig.getConfig().requireBiometricForSensitiveOps,
      crashReporting: true,
    };

    try {
      const stored = await secureStorage.get<StoredUserData>(StorageKey.USER_DATA);
      return { ...defaultSettings, ...stored?.privacySettings };
    } catch {
      return defaultSettings;
    }
  }

  /**
   * Update user's privacy settings
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    const currentSettings = await this.getPrivacySettings();
    const newSettings = { ...currentSettings, ...settings };

    await secureStorage.set(StorageKey.USER_DATA, {
      privacySettings: newSettings,
      updatedAt: new Date().toISOString(),
    }, { encrypt: true });
  }

  /**
   * Export user data (GDPR right to data portability)
   */
  async exportUserData(): Promise<Record<string, unknown>> {
    const userData: Record<string, unknown> = {};

    try {
      // Collect all user-related data
      const userKeys = [
        StorageKey.USER_DATA,
        StorageKey.AUTH_TOKEN,
        StorageKey.REFRESH_TOKEN,
      ];

      for (const key of userKeys) {
        const data = await secureStorage.get(key);
        if (data) {
          userData[key] = this.sanitizeData(data, 'mask');
        }
      }

      return {
        exportedAt: new Date().toISOString(),
        data: userData,
        piiFields: this.identifyPII(userData),
      };
    } catch (error) {
      log.error('Failed to export user data', { event: 'export_user_data_failed', component: 'piiCompliance' }, error);
      throw new Error('Unable to export user data');
    }
  }

  /**
   * Delete all user data (GDPR right to erasure)
   */
  async deleteAllUserData(): Promise<void> {
    try {
      // Delete all user-related data
      const userKeys = [
        StorageKey.USER_DATA,
        StorageKey.AUTH_TOKEN,
        StorageKey.REFRESH_TOKEN,
      ];

      for (const key of userKeys) {
        await this.deletePII(key);
      }

      // Clear any additional PII
      await secureStorage.clear();
    } catch (error) {
      log.error('Failed to delete user data', { event: 'delete_user_data_failed', component: 'piiCompliance' }, error);
      // Do not rethrow here; callers can inspect logs/secondary signals for partial failures
    }
  }
}

// Export singleton instance
export const piiCompliance = PIIComplianceManager.getInstance();
