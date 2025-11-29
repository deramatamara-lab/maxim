/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */

import { apiClient } from './client';
import { ApiResponse } from './types';

// Import and re-export user types from shared domain types
import type { User } from '../types/user';
export type { User, KYCDocument, UserProfile } from '../types/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'rider' | 'driver';
}

// Type for React Native FormData file upload (workaround for incomplete type definitions)
interface _FormDataFile {
  uri: string;
  type: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  /**
   * User login
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse, LoginCredentials>('/auth/login', credentials, 'medium', false);
    
    if (response.success && response.data) {
      // Store tokens securely using token manager
      await apiClient.setAuthToken(
        response.data.token,
        response.data.refreshToken,
        response.data.expiresIn
      );
    }
    
    return response;
  }

  /**
   * User registration
   */
  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse, RegisterData>('/auth/register', userData, 'medium', false);
    
    if (response.success && response.data) {
      // Store tokens securely using token manager
      await apiClient.setAuthToken(
        response.data.token,
        response.data.refreshToken,
        response.data.expiresIn
      );
    }
    
    return response;
  }

  /**
   * Logout user (invalidate tokens on server)
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      // Call server to invalidate tokens
      const response = await apiClient.post<void>('/auth/logout');
      
      // Clear tokens from secure storage regardless of server response
      await apiClient.clearAuthToken();
      
      return response;
    } catch (error) {
      // Even if server logout fails, clear local tokens
      await apiClient.clearAuthToken();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    // Pass requiresAuth=false to avoid circular dependency
    // This method is called by tokenManager during automatic refresh
    return apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken }, 'medium', false);
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me');
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/auth/profile', userData);
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    // Password reset doesn't require authentication
    return apiClient.post<void>('/auth/forgot-password', { email }, 'medium', false);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    // Password reset doesn't require authentication
    return apiClient.post<void>('/auth/reset-password', { token, newPassword }, 'medium', false);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    // Email verification doesn't require authentication
    return apiClient.post<void>('/auth/verify-email', { token }, 'medium', false);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await apiClient.isAuthenticated();
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
    return await apiClient.getTokenInfo();
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(imageUri: string): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any); // React Native FormData requires this type assertion due to incomplete type definitions

    // For file uploads, we need to use a different approach
    const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8081/api';
    const authToken = await apiClient.getAccessToken(); // Use public method instead of private property

    if (!authToken) {
      return {
        success: false,
        error: 'Authentication required',
        message: 'Please login to upload avatar',
      };
    }

    const response = await fetch(`${baseURL}/auth/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    // Handle response manually since we're bypassing the client
    try {
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
          message: data.message,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch {
      return {
        success: false,
        error: 'Network error occurred',
        message: 'Failed to upload avatar',
      };
    }
  }
}

export const authService = new AuthService();
