/**
 * Receipt Generator Service
 * Handles receipt generation and management for completed rides
 * Simple API-based service for production reliability
 */

import { apiClient, ApiResponse } from '@/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/utils/logger';

export interface ReceiptRequest {
  rideId: string;
  format?: 'pdf' | 'html';
  includeTip?: boolean;
  includeDetailedBreakdown?: boolean;
}

export interface ReceiptData {
  id: string;
  rideId: string;
  url: string;
  format: 'pdf' | 'html';
  generatedAt: string;
  expiresAt: string;
  fileUrl?: string;
}

export interface ReceiptHistory {
  receipts: Array<{
    id: string;
    rideId: string;
    amount: number;
    currency: string;
    generatedAt: string;
    url: string;
  }>;
  total: number;
}

class ReceiptGenerator {
  private readonly RECEIPT_CACHE_KEY = 'receiptCache';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate receipt for a completed ride
   */
  async generateReceipt(
    rideId: string,
    options: {
      format?: 'pdf' | 'html';
      includeTip?: boolean;
      includeDetailedBreakdown?: boolean;
      forceRegenerate?: boolean;
    } = {}
  ): Promise<ApiResponse<ReceiptData>> {
    try {
      // Check cache first
      const cachedReceipt = await this.getCachedReceipt(rideId);
      if (cachedReceipt && !options.forceRegenerate) {
        return {
          success: true,
          data: cachedReceipt,
          message: 'Receipt retrieved from cache',
        };
      }

      // Generate new receipt
      const request: ReceiptRequest = {
        rideId,
        format: options.format || 'pdf',
        includeTip: options.includeTip !== false,
        includeDetailedBreakdown: options.includeDetailedBreakdown !== false,
      };

      const response = await apiClient.post<ReceiptData, ReceiptRequest>('/receipts/generate', request);

      if (response.success && response.data) {
        // Cache the receipt
        await this.cacheReceipt(rideId, response.data);
      }

      return response;
    } catch (error) {
      log.error('Failed to generate receipt', { event: 'generate_receipt_failed', component: 'receiptGenerator' }, error);
      return {
        success: false,
        error: 'Failed to generate receipt',
        message: 'Please try again or contact support',
      };
    }
  }

  /**
   * Get receipt by ID
   */
  async getReceipt(receiptId: string): Promise<ApiResponse<ReceiptData>> {
    try {
      // Check cache first
      const cachedReceipt = await this.getCachedReceiptById(receiptId);
      if (cachedReceipt) {
        return {
          success: true,
          data: cachedReceipt,
          message: 'Receipt retrieved from cache',
        };
      }

      // Fetch from API
      const response = await apiClient.get<ReceiptData>(`/receipts/${receiptId}`);

      if (response.success && response.data) {
        // Update cache
        await this.cacheReceipt(response.data.rideId, response.data);
      }

      return response;
    } catch (error) {
      log.error('Failed to get receipt', { event: 'get_receipt_failed', component: 'receiptGenerator' }, error);
      return {
        success: false,
        error: 'Failed to get receipt',
        message: 'Please try again later',
      };
    }
  }

  /**
   * Get receipt history for the user
   */
  async getReceiptHistory(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<ReceiptHistory>> {
    try {
      const response = await apiClient.get<ReceiptHistory>('/receipts/history', {
        page,
        limit,
      });

      return response;
    } catch (error) {
      log.error('Failed to get receipt history', { event: 'get_receipt_history_failed', component: 'receiptGenerator' }, error);
      return {
        success: false,
        error: 'Failed to get receipt history',
        message: 'Please try again later',
      };
    }
  }

  /**
   * Download receipt file
   */
  async downloadReceipt(
    receiptId: string,
    format: 'pdf' | 'html' = 'pdf'
  ): Promise<ApiResponse<{
    url: string;
    filename: string;
    expiresAt: string;
  }>> {
    try {
      const response = await apiClient.get<{
        url: string;
        filename: string;
        expiresAt: string;
      }>(`/receipts/${receiptId}/download`, { format });

      return response;
    } catch (error) {
      log.error('Failed to download receipt', { event: 'download_receipt_failed', component: 'receiptGenerator' }, error);
      return {
        success: false,
        error: 'Failed to download receipt',
        message: 'Please try again later',
      };
    }
  }

  /**
   * Email receipt to user
   */
  async emailReceipt(
    receiptId: string,
    email?: string
  ): Promise<ApiResponse<{
    sent: boolean;
    email: string;
    sentAt: string;
  }>> {
    try {
      const response = await apiClient.post<{
        sent: boolean;
        email: string;
        sentAt: string;
      }>(`/receipts/${receiptId}/email`, { email });

      return response;
    } catch (error) {
      log.error('Failed to email receipt', { event: 'email_receipt_failed', component: 'receiptGenerator' }, error);
      return {
        success: false,
        error: 'Failed to email receipt',
        message: 'Please try again later',
      };
    }
  }

  /**
   * Cache receipt locally
   */
  private async cacheReceipt(rideId: string, receiptData: ReceiptData): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.RECEIPT_CACHE_KEY);
      const cache: Record<string, ReceiptData> = stored ? JSON.parse(stored) : {};
      
      cache[rideId] = receiptData;
      cache[receiptData.id] = receiptData; // Also cache by receipt ID
      
      await AsyncStorage.setItem(this.RECEIPT_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      log.error('Failed to cache receipt', { event: 'cache_receipt_failed', component: 'receiptGenerator' }, error);
    }
  }

  /**
   * Get cached receipt by ride ID
   */
  private async getCachedReceipt(rideId: string): Promise<ReceiptData | null> {
    try {
      const stored = await AsyncStorage.getItem(this.RECEIPT_CACHE_KEY);
      if (!stored) return null;

      const cache: Record<string, ReceiptData> = JSON.parse(stored);
      const receipt = cache[rideId];

      if (!receipt) return null;

      // Check if receipt has expired
      const expiresAt = new Date(receipt.expiresAt).getTime();
      if (Date.now() > expiresAt) {
        // Remove expired receipt from cache
        delete cache[rideId];
        delete cache[receipt.id];
        await AsyncStorage.setItem(this.RECEIPT_CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return receipt;
    } catch (error) {
      log.error('Failed to get cached receipt', { event: 'get_cached_receipt_failed', component: 'receiptGenerator' }, error);
      return null;
    }
  }

  /**
   * Get cached receipt by receipt ID
   */
  private async getCachedReceiptById(receiptId: string): Promise<ReceiptData | null> {
    try {
      const stored = await AsyncStorage.getItem(this.RECEIPT_CACHE_KEY);
      if (!stored) return null;

      const cache: Record<string, ReceiptData> = JSON.parse(stored);
      const receipt = cache[receiptId];

      if (!receipt) return null;

      // Check if receipt has expired
      const expiresAt = new Date(receipt.expiresAt).getTime();
      if (Date.now() > expiresAt) {
        // Remove expired receipt from cache
        delete cache[receipt.rideId];
        delete cache[receiptId];
        await AsyncStorage.setItem(this.RECEIPT_CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return receipt;
    } catch (error) {
      log.error('Failed to get cached receipt by ID', { event: 'get_cached_receipt_by_id_failed', component: 'receiptGenerator' }, error);
      return null;
    }
  }

  /**
   * Clear receipt cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.RECEIPT_CACHE_KEY);
    } catch (error) {
      log.error('Failed to clear receipt cache', { event: 'clear_receipt_cache_failed', component: 'receiptGenerator' }, error);
    }
  }

  /**
   * Clean expired receipts from cache
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.RECEIPT_CACHE_KEY);
      if (!stored) return;

      const cache: Record<string, ReceiptData> = JSON.parse(stored);
      const now = Date.now();
      let hasChanges = false;

      Object.entries(cache).forEach(([key, receipt]) => {
        const expiresAt = new Date(receipt.expiresAt).getTime();
        if (now > expiresAt) {
          delete cache[key];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        await AsyncStorage.setItem(this.RECEIPT_CACHE_KEY, JSON.stringify(cache));
      }
    } catch (error) {
      log.error('Failed to clean expired cache', { event: 'clean_expired_cache_failed', component: 'receiptGenerator' }, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalReceipts: number;
    expiredCount: number;
    cacheSize: number;
  }> {
    try {
      const stored = await AsyncStorage.getItem(this.RECEIPT_CACHE_KEY);
      if (!stored) {
        return { totalReceipts: 0, expiredCount: 0, cacheSize: 0 };
      }

      const cache: Record<string, ReceiptData> = JSON.parse(stored);
      const now = Date.now();
      let expiredCount = 0;

      Object.values(cache).forEach((receipt) => {
        const expiresAt = new Date(receipt.expiresAt).getTime();
        if (now > expiresAt) {
          expiredCount++;
        }
      });

      return {
        totalReceipts: Object.keys(cache).length / 2, // Divided by 2 since we store by both rideId and receiptId
        expiredCount,
        cacheSize: stored.length,
      };
    } catch (error) {
      log.error('Failed to get cache stats', { event: 'get_cache_stats_failed', component: 'receiptGenerator' }, error);
      return { totalReceipts: 0, expiredCount: 0, cacheSize: 0 };
    }
  }
}

export { ReceiptGenerator };
