/**
 * Auth Store Slice
 * Handles authentication, user profile, and token management
 */

import { StateCreator } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '../../utils/logger';
import { authService, type User } from '../../api/auth';
import { secureStorage, StorageKey } from '../../utils/secureStorage';
import { apiClient } from '../../api/client';
import { tokenManager, TokenEvent } from '../../services/tokenManager';

// PRODUCTION: NO MOCKS - All API calls are real

export interface AuthSlice {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  sessionExpiredReason: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  initializeAuth: () => Promise<boolean>;
  clearAuthError: () => void;
  handleSessionExpired: (reason: string) => void;
  setupTokenEventListeners: () => () => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set, get) => ({
  // Initial State
  user: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  sessionExpiredReason: null,

  clearAuthError: () => set({ authError: null, sessionExpiredReason: null }),

  // Handle session expiration gracefully
  handleSessionExpired: (reason: string) => {
    log.warn('Session expired', { event: 'session_expired', component: 'authSlice', reason });
    set({ 
      user: null, 
      isAuthenticated: false, 
      sessionExpiredReason: reason,
      authError: null,
    });
  },

  // Setup token event listeners for automatic session management
  setupTokenEventListeners: () => {
    const handleForceLogout = (event: TokenEvent) => {
      get().handleSessionExpired(event.reason || 'Session expired');
    };

    const handleSessionEnded = (event: TokenEvent) => {
      get().handleSessionExpired(event.reason || 'Session ended by server');
    };

    const handleTokenRefreshFailed = (event: TokenEvent) => {
      log.warn('Token refresh failed', { 
        event: 'token_refresh_failed_warning', 
        component: 'authSlice',
        reason: event.reason,
        failureCount: event.data?.failureCount 
      });
      // Don't logout yet - tokenManager will handle max failures
    };

    // Subscribe to token events
    const unsubForceLogout = tokenManager.on('force_logout', handleForceLogout);
    const unsubSessionEnded = tokenManager.on('session_ended', handleSessionEnded);
    const unsubRefreshFailed = tokenManager.on('token_refresh_failed', handleTokenRefreshFailed);

    // Return cleanup function
    return () => {
      unsubForceLogout();
      unsubSessionEnded();
      unsubRefreshFailed();
    };
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, authError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await authService.login({ email, password });
      
      if (response.success && response.data) {
        set({ user: response.data.user, isAuthenticated: true, isLoading: false, authError: null });
        return true;
      } else {
        let errorMessage = response.error || 'Login failed';
        
        if (response.error?.includes('invalid credentials') || response.error?.includes('password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (response.error?.includes('account not verified')) {
          errorMessage = 'Please verify your email address before logging in.';
        } else if (response.error?.includes('account locked') || response.error?.includes('suspended')) {
          errorMessage = 'Your account has been temporarily locked. Please contact support.';
        } else if (response.error?.includes('network') || response.error?.includes('connection')) {
          errorMessage = 'Network connection issue. Please check your connection and try again.';
        }
        
        set({ user: null, isAuthenticated: false, isLoading: false, authError: errorMessage });
        return false;
      }
    } catch (error) {
      log.error('Login error', { event: 'login_failed', component: 'authSlice' }, error);
      set({ authError: 'An unexpected error occurred', isLoading: false });
      return false;
    }
  },

  register: async (name: string, email: string, password: string, phone?: string) => {
    set({ isLoading: true, authError: null });
    
    try {
      // PRODUCTION: Always use real API - no mocks
      const response = await authService.register({ name, email, password, phone });
      
      if (response.success && response.data) {
        set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        return true;
      } else {
        set({ authError: response.error || 'Registration failed', isLoading: false });
        return false;
      }
    } catch (error) {
      log.error('Registration error', { event: 'register_failed', component: 'authSlice' }, error);
      set({ authError: 'An unexpected error occurred', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      // PRODUCTION: Always call real logout API
      await authService.logout();
      await apiClient.clearAuthToken();
      await secureStorage.remove(StorageKey.USER_DATA);
      
      set({ user: null, isAuthenticated: false, authError: null });
    } catch (error) {
      log.error('Logout error', { event: 'logout_failed', component: 'authSlice' }, error);
      set({ user: null, isAuthenticated: false });
    }
  },

  refreshToken: async () => {
    try {
      // PRODUCTION: Always use real token refresh
      // Get refresh token from storage
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        return false;
      }
      
      const response = await authService.refreshToken(storedRefreshToken);
      return response.success;
    } catch (error) {
      log.error('Token refresh error', { event: 'refresh_token_failed', component: 'authSlice' }, error);
      return false;
    }
  },

  updateProfile: async (userData: Partial<User>) => {
    try {
      // PRODUCTION: Always use real API
      const response = await authService.updateProfile(userData);
      
      if (response.success && response.data) {
        set({ user: response.data });
        return true;
      }
      return false;
    } catch (error) {
      log.error('Profile update error', { event: 'profile_update_failed', component: 'authSlice' }, error);
      return false;
    }
  },

  initializeAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true, isLoading: false });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      log.error('Auth initialization error', { event: 'auth_init_failed', component: 'authSlice' }, error);
      set({ isLoading: false });
      return false;
    }
  },
});

export type { User };
