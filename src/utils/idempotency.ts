/**
 * Idempotency Key Generator and Tracker
 * Prevents duplicate payment processing and provides key management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from './logger';

const IDEMPOTENCY_STORAGE_KEY = 'payment_idempotency_keys';
const KEY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface IdempotencyRecord {
  key: string;
  rideId: string;
  amount: number;
  createdAt: number;
  status: 'pending' | 'completed' | 'failed';
  paymentId?: string;
}

/**
 * Generate a unique idempotency key for a payment request
 */
export function generateIdempotencyKey(rideId: string, amount: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `pay_${rideId}_${amount}_${timestamp}_${random}`;
}

/**
 * Generate idempotency key for tip
 */
export function generateTipIdempotencyKey(rideId: string, amount: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `tip_${rideId}_${amount}_${timestamp}_${random}`;
}

/**
 * Generate idempotency key for refund
 */
export function generateRefundIdempotencyKey(paymentId: string, amount: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `refund_${paymentId}_${amount}_${timestamp}_${random}`;
}

class IdempotencyTracker {
  private cache: Map<string, IdempotencyRecord> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
      if (stored) {
        const records: IdempotencyRecord[] = JSON.parse(stored);
        const now = Date.now();
        records
          .filter(r => now - r.createdAt < KEY_EXPIRY_MS)
          .forEach(r => this.cache.set(r.key, r));
      }
      this.initialized = true;
    } catch (error) {
      log.error('Idempotency init failed', { event: 'idempotency_init_failed', component: 'idempotency' }, error);
      this.initialized = true;
    }
  }

  async isKeyUsed(key: string): Promise<boolean> {
    await this.initialize();
    return this.cache.has(key);
  }

  async getRecord(key: string): Promise<IdempotencyRecord | null> {
    await this.initialize();
    return this.cache.get(key) || null;
  }

  async registerKey(key: string, rideId: string, amount: number): Promise<boolean> {
    await this.initialize();
    if (this.cache.has(key)) {
      log.warn('Duplicate idempotency key', { event: 'duplicate_key', component: 'idempotency', key });
      return false;
    }

    const record: IdempotencyRecord = {
      key,
      rideId,
      amount,
      createdAt: Date.now(),
      status: 'pending',
    };

    this.cache.set(key, record);
    await this.persist();
    return true;
  }

  async markCompleted(key: string, paymentId: string): Promise<void> {
    await this.initialize();
    const record = this.cache.get(key);
    if (record) {
      record.status = 'completed';
      record.paymentId = paymentId;
      await this.persist();
    }
  }

  async markFailed(key: string): Promise<void> {
    await this.initialize();
    const record = this.cache.get(key);
    if (record) {
      record.status = 'failed';
      await this.persist();
    }
  }

  async cleanup(): Promise<void> {
    await this.initialize();
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    this.cache.forEach((record, key) => {
      if (now - record.createdAt >= KEY_EXPIRY_MS) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => this.cache.delete(key));
    await this.persist();
  }

  private async persist(): Promise<void> {
    try {
      const records = Array.from(this.cache.values());
      await AsyncStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      log.error('Idempotency persist failed', { event: 'idempotency_persist_failed', component: 'idempotency' }, error);
    }
  }
}

export const idempotencyTracker = new IdempotencyTracker();
