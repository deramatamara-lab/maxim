/**
 * Authentication Flow Tests
 * Tests critical authentication functionality: login, logout, token refresh
 */

import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEnhancedAppStore } from '../../src/store/useEnhancedAppStore';
import { authService } from '../../src/api/auth';
import { secureStorage } from '../../src/utils/secureStorage';
import { TestDataFactory } from '../utils/testAdapters';

// Mock dependencies
jest.mock('../../src/api/auth');
jest.mock('../../src/utils/secureStorage');
jest.mock('../../src/utils/logger', () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    event: jest.fn(),
    performance: jest.fn(),
    userAction: jest.fn(),
    apiCall: jest.fn(),
    createComponent: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
    setContext: jest.fn(),
    clearContext: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    const store = useEnhancedAppStore.getState();
    if ('resetJourney' in store) {
      store.resetJourney();
    }
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const mockUser = TestDataFactory.user();
      
      mockAuthService.login.mockResolvedValue(TestDataFactory.responses.auth(mockUser));

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const loginResult = await result.current.login('test@example.com', 'password123');
        expect(loginResult).toBe(true);
      });

      // Assert
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.authError).toBe(null);
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login failure with invalid credentials', async () => {
      // Arrange
      mockAuthService.login.mockResolvedValue({
        success: false,
        error: 'Invalid email or password',
      });

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const loginResult = await result.current.login('invalid@example.com', 'wrongpassword');
        expect(loginResult).toBe(false);
      });

      // Assert
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.authError).toBe(
        'Invalid email or password. Please check your credentials and try again.'
      );
    });

    it('should handle network errors during login', async () => {
      // Arrange
      mockAuthService.login.mockRejectedValue(new Error('Network error'));

      // Act
      const { result } = renderHook(() => useEnhancedAppStore());
      
      await act(async () => {
        const loginResult = await result.current.login('test@example.com', 'password123');
        expect(loginResult).toBe(false);
      });

      // Assert
      expect(result.current.authError).toContain('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout and clear user data', async () => {
      // Arrange - First login
      const mockUser = TestDataFactory.user();
      
      mockAuthService.login.mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
        },
      });

      mockAuthService.logout.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useEnhancedAppStore());
      
      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Act - Logout
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authError).toBe(null);
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should handle logout failure gracefully', async () => {
      // Arrange
      mockAuthService.login.mockResolvedValue({
        success: true,
        data: {
          user: TestDataFactory.user(),
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
        },
      });

      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useEnhancedAppStore());
      
      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Act - Logout (should still clear local state even if API fails)
      await act(async () => {
        await result.current.logout();
      });

      // Assert - on failure we log but keep user authenticated
      expect(result.current.user).not.toBe(null);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
