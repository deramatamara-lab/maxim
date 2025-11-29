/**
 * Secure Storage Utility
 * Provides encrypted storage for sensitive data like auth tokens, user data, and payment information
 * Uses React Native's built-in encryption capabilities with proper key management
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { log } from './logger';

// Storage keys for different data types
export enum StorageKey {
  AUTH_TOKEN = 'auth_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_DATA = 'user_data',
  PAYMENT_METHODS = 'payment_methods',
  KYC_DOCUMENTS = 'kyc_documents',
  APP_SETTINGS = 'app_settings',
}

// Storage item with metadata
interface StorageItem<T = unknown> {
  data: T;
  encrypted: boolean;
  timestamp: number;
  expiresAt?: number;
}

// Configuration for secure storage
interface SecureStorageConfig {
  enableEncryption: boolean;
  defaultTTL?: number; // Time to live in milliseconds
  keyPrefix: string;
}

class SecureStorage {
  private config: SecureStorageConfig;

  constructor(config: Partial<SecureStorageConfig> = {}) {
    this.config = {
      enableEncryption: true,
      keyPrefix: 'aura_secure_',
      ...config,
    };
  }

  /**
   * Store data securely using expo-secure-store
   */
  async set<T>(
    key: StorageKey,
    data: T,
    options: {
      encrypt?: boolean;
      ttl?: number; // Time to live in milliseconds
    } = {}
  ): Promise<void> {
    const { encrypt = this.config.enableEncryption, ttl } = options;
    
    try {
      const storageKey = `${this.config.keyPrefix}${key}`;
      
      const storageItem: StorageItem<T> = {
        data,
        encrypted: encrypt,
        timestamp: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : undefined,
      };

      // Serialize data
      const serialized = JSON.stringify(storageItem);

      if (encrypt && Platform.OS !== 'web') {
        // Use expo-secure-store for native platforms
        await SecureStore.setItemAsync(storageKey, serialized, {
          requireAuthentication: false, // Set to true for biometric/face ID
        });
      } else {
        // Fallback to AsyncStorage for web or when encryption is disabled
        await AsyncStorage.setItem(storageKey, serialized);
      }
    } catch (error) {
      log.error('Failed to store secure data', { event: 'store_secure_data_failed', component: 'secureStorage', key }, error);
      throw new Error(`Failed to store secure data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve data securely with expiration check
   */
  async get<T>(key: StorageKey): Promise<T | null> {
    try {
      const storageKey = `${this.config.keyPrefix}${key}`;
      let storedData: string | null;

      // Try secure store first, then fallback to AsyncStorage
      if (Platform.OS !== 'web') {
        try {
          storedData = await SecureStore.getItemAsync(storageKey);
        } catch {
          // Fallback to AsyncStorage if secure store fails
          storedData = await AsyncStorage.getItem(storageKey);
        }
      } else {
        storedData = await AsyncStorage.getItem(storageKey);
      }

      if (!storedData) {
        return null;
      }

      const storageItem: StorageItem<T> = JSON.parse(storedData);

      // Check expiration
      if (storageItem.expiresAt && Date.now() > storageItem.expiresAt) {
        await this.remove(key);
        return null;
      }

      return storageItem.data;
    } catch (error) {
      log.error('Failed to retrieve secure data', { event: 'retrieve_secure_data_failed', component: 'secureStorage', key }, error);
      // If data is corrupted, remove it
      await this.remove(key);
      return null;
    }
  }

  /**
   * Remove stored data
   */
  async remove(key: StorageKey): Promise<void> {
    try {
      const storageKey = `${this.config.keyPrefix}${key}`;
      
      // Try to remove from both storage types
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.deleteItemAsync(storageKey);
        } catch {
          // Ignore if not found in secure store
        }
      }
      
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      log.error('Failed to remove secure data', { event: 'remove_secure_data_failed', component: 'secureStorage', key }, error);
      throw new Error(`Failed to remove secure data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all secure storage data
   */
  async clear(): Promise<void> {
    try {
      // Clear AsyncStorage (we can't enumerate secure store keys easily)
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith(this.config.keyPrefix));
      
      if (secureKeys.length > 0) {
        await AsyncStorage.multiRemove(secureKeys);
      }

      // Note: expo-secure-store doesn't provide getAllKeysAsync in all versions
      // Individual keys are cleared during remove() calls
    } catch (error) {
      log.error('Failed to clear secure storage', { event: 'clear_secure_storage_failed', component: 'secureStorage' }, error);
      throw new Error(`Failed to clear secure storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage size and usage statistics
   */
  async getStorageInfo(): Promise<{
    totalKeys: number;
    totalSize: number;
    keys: Array<{ key: string; size: number; encrypted: boolean; expiresAt?: number }>;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith(this.config.keyPrefix));
      
      const keyInfo = [];
      let totalSize = 0;

      for (const fullKey of secureKeys) {
        const data = await AsyncStorage.getItem(fullKey);
        if (data) {
          const key = fullKey.replace(this.config.keyPrefix, '') as StorageKey;
          const size = new Blob([data]).size;
          
          // Try to parse expiration info
          let expiresAt: number | undefined;
          try {
            const storageItem: StorageItem = JSON.parse(data);
            expiresAt = storageItem.expiresAt;
          } catch {
            // Ignore parsing errors for info gathering
          }

          keyInfo.push({ key, size, encrypted: true, expiresAt });
          totalSize += size;
        }
      }

      return {
        totalKeys: secureKeys.length,
        totalSize,
        keys: keyInfo,
      };
    } catch (error) {
      log.error('Failed to get storage info', { event: 'get_storage_info_failed', component: 'secureStorage' }, error);
      return { totalKeys: 0, totalSize: 0, keys: [] };
    }
  }

  /**
   * Clean up expired items
   */
  async cleanupExpired(): Promise<number> {
    try {
      const info = await this.getStorageInfo();
      const now = Date.now();
      const expiredKeys = info.keys
        .filter(item => item.expiresAt && item.expiresAt < now)
        .map(item => item.key as StorageKey);

      for (const key of expiredKeys) {
        await this.remove(key);
      }

      return expiredKeys.length;
    } catch (error) {
      log.error('Failed to cleanup expired items', { event: 'cleanup_expired_items_failed', component: 'secureStorage' }, error);
      return 0;
    }
  }
}

// Create and export default instance
export const secureStorage = new SecureStorage({
  enableEncryption: true,
  keyPrefix: 'aura_secure_',
});

// Export class for testing or custom instances
export { SecureStorage };
