/**
 * Network Resilience Infrastructure
 * Handles network failures, retry logic, offline mode, and API failure recovery
 * Production-ready with exponential backoff and circuit breaker patterns
 */

import { toApiPayload } from '../utils/typeHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { log } from '../utils/logger';

// Types for network resilience
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: unknown) => boolean;
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

export interface NetworkStatus {
  isConnected: boolean;
  connectionType: NetInfoStateType;
  isInternetReachable: boolean | null;
  lastChecked: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

// Default configurations
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: unknown) => {
    // Retry on network errors, 5xx, and specific 4xx
    if (!error || typeof error !== 'object' || !('response' in error)) return true; // Network error
    const errorWithResponse = error as { response: { status: number } };
    const status = errorWithResponse.response.status;
    return status >= 500 || status === 408 || status === 429;
  },
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 300000, // 5 minutes
};

// Network Resilience Manager
class NetworkResilienceManager {
  private retryConfig: RetryConfig;
  private circuitBreakerConfig: CircuitBreakerConfig;
  private circuitBreakerState: Map<string, CircuitBreakerState> = new Map();
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private networkStatus: NetworkStatus | null = null;
  private subscribers: Set<(status: NetworkStatus) => void> = new Set();
  private networkCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    retryConfig: Partial<RetryConfig> = {},
    circuitBreakerConfig: Partial<CircuitBreakerConfig> = {}
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.circuitBreakerConfig = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...circuitBreakerConfig };
    this.initializeOfflineQueue();
    this.startNetworkMonitoring();
  }

  // Initialize offline queue from storage
  private async initializeOfflineQueue() {
    try {
      const stored = await AsyncStorage.getItem('offlineRequestQueue');
      if (stored) {
        this.requestQueue = JSON.parse(stored);
        // Sort by priority and timestamp
        this.requestQueue.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
        });
      }
    } catch (error) {
      log.error('Failed to initialize offline queue', { event: 'init_offline_queue_failed', component: 'networkResilience' }, error);
    }
  }

  // Save queue to storage
  private async saveQueue() {
    try {
      await AsyncStorage.setItem('offlineRequestQueue', JSON.stringify(this.requestQueue));
    } catch (error) {
      log.error('Failed to save offline queue', { event: 'save_offline_queue_failed', component: 'networkResilience' }, error);
    }
  }

  // Network monitoring
  private startNetworkMonitoring() {
    // Check network status immediately and then every 30 seconds
    this.checkNetworkStatus();
    this.networkCheckInterval = setInterval(() => this.checkNetworkStatus(), 30000) as unknown as NodeJS.Timeout; // Check every 30 seconds
  }

  private async checkNetworkStatus() {
    try {
      // Use NetInfo for cross-platform network status
      const netInfoState: NetInfoState = await NetInfo.fetch();
      
      this.networkStatus = {
        isConnected: netInfoState.isConnected ?? false,
        connectionType: netInfoState.type,
        isInternetReachable: netInfoState.isInternetReachable ?? null,
        lastChecked: Date.now(),
      };

      this.notifySubscribers();

      // If we're back online, process queued requests
      if (this.networkStatus.isConnected && this.requestQueue.length > 0) {
        this.processQueuedRequests();
      }
    } catch (error) {
      log.error('Failed to check network status', { event: 'check_network_status_failed', component: 'networkResilience' }, error);
      // Fallback to basic connectivity check
      this.networkStatus = {
        isConnected: false,
        connectionType: 'none' as NetInfoStateType,
        isInternetReachable: false,
        lastChecked: Date.now(),
      };
      this.notifySubscribers();
    }
  }

  // Subscribe to network status changes
  public subscribe(callback: (status: NetworkStatus) => void) {
    this.subscribers.add(callback);
    if (this.networkStatus) {
      callback(this.networkStatus);
    }
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    if (this.networkStatus) {
      this.subscribers.forEach(callback => callback(this.networkStatus!));
    }
  }

  // Circuit breaker logic
  private shouldAllowRequest(url: string): boolean {
    const state = this.circuitBreakerState.get(url);
    if (!state) return true;

    const now = Date.now();
    
    // If circuit is open and reset timeout has passed, try to close it
    if (state.isOpen && now >= state.nextAttemptTime) {
      state.isOpen = false;
      state.failureCount = 0;
      this.circuitBreakerState.set(url, state);
      return true;
    }

    return !state.isOpen;
  }

  private recordSuccess(url: string) {
    const state = this.circuitBreakerState.get(url);
    if (state) {
      state.failureCount = 0;
      state.isOpen = false;
      this.circuitBreakerState.set(url, state);
    }
  }

  private recordFailure(url: string) {
    const now = Date.now();
    let state = this.circuitBreakerState.get(url);

    if (!state) {
      state = {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: now,
        nextAttemptTime: now,
      };
    }

    state.failureCount++;
    state.lastFailureTime = now;

    // Open circuit if threshold exceeded
    if (state.failureCount >= this.circuitBreakerConfig.failureThreshold) {
      state.isOpen = true;
      state.nextAttemptTime = now + this.circuitBreakerConfig.resetTimeout;
    }

    this.circuitBreakerState.set(url, state);
  }

  // Exponential backoff delay calculation
  private calculateDelay(retryCount: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, retryCount);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  // Enhanced fetch with retry logic and circuit breaker
  public async resilientFetch<T = unknown>(
    url: string,
    options: RequestInit = {},
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.retryConfig, ...customRetryConfig };

    // Check circuit breaker
    if (!this.shouldAllowRequest(url)) {
      throw new Error(`Circuit breaker is open for ${url}`);
    }

    // Check network connectivity
    if (this.networkStatus?.isConnected === false) {
      // Queue the request for offline processing
      if (options.method === 'POST' || options.method === 'PUT') {
        const bodyObject =
          options.body && typeof options.body === 'object'
            ? toApiPayload(options.body as unknown as object)
            : undefined;

        await this.queueRequest({
          id: `queued_${Date.now()}_${Math.random()}`,
          url,
          method: options.method as 'POST' | 'PUT',
          data: bodyObject,
          headers: options.headers as Record<string, string> || {},
          timestamp: Date.now(),
          retryCount: 0,
          priority: 'medium',
        });
      }
      throw new Error('No network connection - request queued for offline processing');
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          (error as unknown as { response: Response }).response = response;
          throw error;
        }

        const data = await response.json();
        this.recordSuccess(url);
        return data;

      } catch (error) {
        lastError = error;

        // Check if we should retry
        const shouldRetry = attempt < retryConfig.maxRetries && 
                          (!retryConfig.retryCondition || retryConfig.retryCondition(error));

        if (!shouldRetry) {
          this.recordFailure(url);
          throw error;
        }

        // Wait before retry
        const delay = this.calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.recordFailure(url);
    throw lastError;
  }

  /**
   * Public method for executing requests with automatic retry logic
   * Extracted from the existing retry implementation for reuse across API services
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        this.recordSuccess('api_operation');
        return result;

      } catch (error) {
        lastError = error;

        // Check if we should retry
        const shouldRetry = attempt < retryConfig.maxRetries && 
                          (!retryConfig.retryCondition || retryConfig.retryCondition(error));

        if (!shouldRetry) {
          this.recordFailure('api_operation');
          throw error;
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt),
          retryConfig.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.recordFailure('api_operation');
    throw lastError;
  }

  // Queue request for offline processing
  public async queueRequest(request: QueuedRequest): Promise<void> {
    this.requestQueue.push(request);
    await this.saveQueue();
  }

  private determinePriority(url: string): 'high' | 'medium' | 'low' {
    if (url.includes('/rides/') || url.includes('/payment/')) return 'high';
    if (url.includes('/location/') || url.includes('/dispatch/')) return 'medium';
    return 'low';
  }

  // Process queued requests when back online
  private async processQueuedRequests() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const requestsToProcess = [...this.requestQueue];
      this.requestQueue = [];
      await this.saveQueue();

      for (const request of requestsToProcess) {
        try {
          // Retry the queued request
          await this.resilientFetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.data ? JSON.stringify(request.data) : undefined,
          }, {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 5000,
            backoffFactor: 2,
          });

          log.warn('Successfully processed queued request', { event: 'queued_request_processed', component: 'networkResilience', requestId: request.id });
        } catch (error) {
          log.error('Failed to process queued request', { event: 'process_queued_request_failed', component: 'networkResilience', requestId: request.id }, error);
          
          // Re-queue high priority requests that failed
          if (request.priority === 'high' && request.retryCount < 3) {
            request.retryCount++;
            this.requestQueue.push(request);
          }
        }
      }

      await this.saveQueue();
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Public method to process queued requests - used by API client
   */
  public async processQueue(): Promise<void> {
    await this.processQueuedRequests();
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  public destroy() {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
    this.subscribers.clear();
    this.circuitBreakerState.clear();
    this.requestQueue = [];
  }

  // Get current network status
  public getNetworkStatus(): NetworkStatus | null {
    return this.networkStatus;
  }

  // Get queue status
  public getQueueStatus() {
    return {
      totalRequests: this.requestQueue.length,
      highPriority: this.requestQueue.filter(r => r.priority === 'high').length,
      mediumPriority: this.requestQueue.filter(r => r.priority === 'medium').length,
      lowPriority: this.requestQueue.filter(r => r.priority === 'low').length,
      processing: this.isProcessingQueue,
    };
  }

  // Clear queue (for testing or manual intervention)
  public async clearQueue() {
    this.requestQueue = [];
    await this.saveQueue();
  }

  /**
   * Reset circuit breaker for specific URL
   */
  public resetCircuitBreaker(url: string) {
    this.circuitBreakerState.delete(url);
  }

  }

// Export singleton instance
export const networkResilience = new NetworkResilienceManager();

// Export types and utilities
export { NetworkResilienceManager };
