/**
 * Token Management Service
 * Handles secure storage, automatic refresh, and lifecycle management of authentication tokens
 * Provides centralized token operations for API client and auth service
 */

import { secureStorage, StorageKey } from '@/utils/secureStorage';
import { log } from '@/utils/logger';

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface TokenRefreshResult {
  success: boolean;
  tokens?: TokenInfo;
  error?: string;
}

// Token lifecycle events
export type TokenEventType = 
  | 'token_refreshed'
  | 'token_expired'
  | 'token_refresh_failed'
  | 'session_ended'
  | 'force_logout';

export interface TokenEvent {
  type: TokenEventType;
  timestamp: number;
  reason?: string;
  data?: Record<string, unknown>;
}

interface StoredUserData {
  tokenExpiresAt: number;
  tokenType: string;
}

type TokenEventListener = (event: TokenEvent) => void;

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<TokenRefreshResult> | null = null;
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiration
  private readonly EXPIRATION_CHECK_INTERVAL = 60 * 1000; // Check every minute
  private expirationCheckTimer: ReturnType<typeof setInterval> | null = null;
  private eventListeners: Map<TokenEventType, TokenEventListener[]> = new Map();
  private refreshFailureCount = 0;
  private readonly MAX_REFRESH_FAILURES = 3;
  private refreshFunction: TokenRefreshFunction | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Set the refresh function (dependency injection)
   */
  setRefreshFunction(refreshFunction: TokenRefreshFunction): void {
    this.refreshFunction = refreshFunction;
  }

  /**
   * Subscribe to token lifecycle events
   */
  on(eventType: TokenEventType, listener: TokenEventListener): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
    
    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  /**
   * Unsubscribe from token lifecycle events
   */
  off(eventType: TokenEventType, listener: TokenEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit token lifecycle event
   */
  private emit(type: TokenEventType, reason?: string, data?: Record<string, unknown>): void {
    const event: TokenEvent = {
      type,
      timestamp: Date.now(),
      reason,
      data,
    };
    
    log.info(`Token event: ${type}`, { 
      event: `token_event_${type}`, 
      component: 'tokenManager',
      reason,
      ...data 
    });
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          log.error('Token event listener error', { 
            event: 'token_listener_error', 
            component: 'tokenManager',
            eventType: type 
          }, error);
        }
      });
    }
  }

  /**
   * Start automatic token expiration monitoring
   */
  startExpirationMonitoring(): void {
    this.stopExpirationMonitoring(); // Clear any existing timer
    
    log.debug('Starting token expiration monitoring', { 
      event: 'expiration_monitoring_start', 
      component: 'tokenManager',
      interval: this.EXPIRATION_CHECK_INTERVAL 
    });
    
    this.expirationCheckTimer = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, this.EXPIRATION_CHECK_INTERVAL);
    
    // Also check immediately
    this.checkAndRefreshToken();
  }

  /**
   * Stop automatic token expiration monitoring
   */
  stopExpirationMonitoring(): void {
    if (this.expirationCheckTimer) {
      clearInterval(this.expirationCheckTimer);
      this.expirationCheckTimer = null;
    }
  }

  /**
   * Check token expiration and refresh if needed
   */
  private async checkAndRefreshToken(): Promise<void> {
    try {
      const isExpired = await this.isTokenExpired();
      
      if (isExpired) {
        log.info('Token expired or expiring soon, attempting refresh', { 
          event: 'token_expiring', 
          component: 'tokenManager' 
        });
        
        const result = await this.refreshToken();
        
        if (!result.success) {
          this.refreshFailureCount++;
          
          if (this.refreshFailureCount >= this.MAX_REFRESH_FAILURES) {
            log.error('Max token refresh failures reached, forcing logout', { 
              event: 'max_refresh_failures', 
              component: 'tokenManager',
              failureCount: this.refreshFailureCount 
            });
            
            this.emit('force_logout', 'Max refresh failures reached', {
              failureCount: this.refreshFailureCount,
            });
            
            await this.clearTokens();
            this.stopExpirationMonitoring();
          } else {
            this.emit('token_refresh_failed', result.error, {
              failureCount: this.refreshFailureCount,
              maxFailures: this.MAX_REFRESH_FAILURES,
            });
          }
        } else {
          this.refreshFailureCount = 0;
          this.emit('token_refreshed', 'Token refreshed successfully');
        }
      }
    } catch (error) {
      log.error('Token expiration check failed', { 
        event: 'expiration_check_failed', 
        component: 'tokenManager' 
      }, error);
    }
  }

  /**
   * Force session end (e.g., server-initiated logout)
   */
  async forceSessionEnd(reason: string): Promise<void> {
    log.warn('Forcing session end', { 
      event: 'force_session_end', 
      component: 'tokenManager',
      reason 
    });
    
    this.emit('session_ended', reason);
    await this.clearTokens();
    this.stopExpirationMonitoring();
    this.refreshFailureCount = 0;
  }

  /**
   * Store authentication tokens securely
   */
  async setTokens(tokens: TokenInfo): Promise<void> {
    try {
      await secureStorage.set(StorageKey.AUTH_TOKEN, tokens.accessToken, {
        encrypt: true,
        ttl: tokens.expiresAt - Date.now(), // Auto-expire at token expiration
      });

      await secureStorage.set(StorageKey.REFRESH_TOKEN, tokens.refreshToken, {
        encrypt: true,
        ttl: 30 * 24 * 60 * 60 * 1000, // 30 days for refresh token
      });

      // Store token metadata for refresh logic
      await secureStorage.set(StorageKey.USER_DATA, {
        tokenExpiresAt: tokens.expiresAt,
        tokenType: tokens.tokenType,
      }, { encrypt: true });

    } catch (error) {
      log.error('Failed to store tokens', { event: 'store_tokens_failed', component: 'tokenManager' }, error);
      throw new Error('Unable to store authentication tokens securely');
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await secureStorage.get<string>(StorageKey.AUTH_TOKEN);
      return token;
    } catch (error) {
      log.error('Failed to get access token', { event: 'get_access_token_failed', component: 'tokenManager' }, error);
      return null;
    }
  }

  /**
   * Get current refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await secureStorage.get<string>(StorageKey.REFRESH_TOKEN);
      return token;
    } catch (error) {
      log.error('Failed to get refresh token', { event: 'get_refresh_token_failed', component: 'tokenManager' }, error);
      return null;
    }
  }

  /**
   * Check if token is expired or will expire soon
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const userData = await secureStorage.get<StoredUserData>(StorageKey.USER_DATA);
      if (!userData?.tokenExpiresAt) {
        return true; // No expiration info, assume expired
      }

      const now = Date.now();
      const expiresAt = userData.tokenExpiresAt;
      
      // Consider expired if within refresh threshold
      return now >= (expiresAt - this.REFRESH_THRESHOLD);
    } catch (error) {
      log.error('Failed to check token expiration', { event: 'check_token_expiration_failed', component: 'tokenManager' }, error);
      return true; // Assume expired on error
    }
  }

  /**
   * Refresh authentication token with automatic retry logic
   */
  async refreshToken(): Promise<TokenRefreshResult> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<TokenRefreshResult> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        return { success: false, error: 'No refresh token available' };
      }

      // Lazy import to break circular dependency
      const { apiClient } = await import('@/api/client');
      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken }, 'medium', false);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Token refresh failed');
      }

      const tokens: TokenInfo = {
        accessToken: response.data.token, // Use 'token' instead of 'accessToken'
        refreshToken: response.data.refreshToken || refreshToken,
        expiresAt: Date.now() + (response.data.expiresIn || 3600) * 1000,
        tokenType: 'Bearer', // Default to 'Bearer' since not provided in RefreshTokenResponse
      };

      await this.setTokens(tokens);

      return { success: true, tokens };
    } catch (error) {
      log.error('Token refresh failed', { event: 'token_refresh_failed', component: 'tokenManager' }, error);
      
      // Clear invalid tokens on refresh failure
      await this.clearTokens();
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      };
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      // Check if token needs refresh
      if (await this.isTokenExpired()) {
        const refreshResult = await this.refreshToken();
        
        if (!refreshResult.success) {
          return null;
        }
      }

      return await this.getAccessToken();
    } catch (error) {
      log.error('Failed to get valid access token', { event: 'get_valid_access_token_failed', component: 'tokenManager' }, error);
      return null;
    }
  }

  /**
   * Clear all stored tokens (logout)
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        secureStorage.remove(StorageKey.AUTH_TOKEN),
        secureStorage.remove(StorageKey.REFRESH_TOKEN),
        secureStorage.remove(StorageKey.USER_DATA),
      ]);
    } catch (error) {
      log.error('Failed to clear tokens', { event: 'clear_tokens_failed', component: 'tokenManager' }, error);
      throw new Error('Unable to clear authentication tokens');
    }
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();
      
      return !!(accessToken && refreshToken);
    } catch (error) {
      log.error('Failed to check authentication status', { event: 'check_auth_status_failed', component: 'tokenManager' }, error);
      return false;
    }
  }

  /**
   * Get token information for debugging
   */
  async getTokenInfo(): Promise<{
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    isExpired: boolean;
    expiresAt?: number;
  }> {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken(),
        secureStorage.get<StoredUserData>(StorageKey.USER_DATA),
      ]);

      return {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        isExpired: await this.isTokenExpired(),
        expiresAt: userData?.tokenExpiresAt,
      };
    } catch (error) {
      log.error('Failed to get token info', { event: 'get_token_info_failed', component: 'tokenManager' }, error);
      return {
        hasAccessToken: false,
        hasRefreshToken: false,
        isExpired: true,
      };
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
