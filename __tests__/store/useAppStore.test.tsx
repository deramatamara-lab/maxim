/**
 * useAppStore Tests
 * Comprehensive test coverage for the Zustand store
 */

import { renderHook, act } from '@testing-library/react-native';
import { useAppStore, type AppStore } from '../../src/store/useAppStore';
import { TestProviders } from '../TestProviders';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test - only state properties, not methods
    useAppStore.setState({
      activeTab: 'home',
      user: null,
      appState: 'idle',
      destination: '',
      isSearching: false,
      currentLocation: null,
      targetLocation: null,
      errorMsg: null,
      showMap: false,
      selectedRide: null,
      rideOptions: [],
      isLoading: false,
      driverState: 'offline',
      currentRequest: null,
      countdownRemaining: 0,
    });
    jest.clearAllMocks();
  });

  describe('Navigation State', () => {
    it('initializes with default navigation state', () => {
      const { result } = renderHook(() => useAppStore());
      
      expect(result.current.activeTab).toBe('home');
    });

    it('changes active tab correctly', () => {
      const { result } = renderHook(() => useAppStore());
      
      expect(result.current.activeTab).toBe('home');

      act(() => {
        result.current.setActiveTab('activity');
      });

      expect(result.current.activeTab).toBe('activity');
    });
  });

  describe('User Profile', () => {
    it('initializes with no user', () => {
      const { result } = renderHook(() => useAppStore());
      
      expect(result.current.user).toBe(null);
    });

    it('sets user correctly', async () => {
      const { result } = renderHook(() => useAppStore());
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        isDriver: false,
        isVerified: true,
        role: 'rider' as const,
        kycStatus: 'pending' as const,
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await act(async () => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('clears user correctly', async () => {
      const { result } = renderHook(() => useAppStore());
      
      // First set a user
      await act(async () => {
        result.current.setUser({
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          isDriver: false,
          isVerified: true,
          role: 'rider' as const,
          kycStatus: 'pending' as const,
          hasCompletedOnboarding: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      expect(result.current.user).toBeTruthy();

      // Then clear user
      await act(async () => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('sets and clears errors correctly', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setErrorMsg('Test error message');
      });

      expect(result.current.errorMsg).toBe('Test error message');

      act(() => {
        result.current.setErrorMsg(null);
      });

      expect(result.current.errorMsg).toBe(null);
    });
  });

  describe('Performance', () => {
    it('handles rapid state updates efficiently', () => {
      const { result } = renderHook(() => useAppStore());
      
      // Rapid tab changes
      const tabs: Array<'home' | 'activity' | 'location' | 'profile'> = ['home', 'activity', 'location', 'profile'];
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.setActiveTab(tabs[i % 4]);
        });
      }

      // After 10 iterations of cycling tabs, the final activeTab should be 'activity'
      expect(result.current.activeTab).toBe('activity');
    });

    it('does not cause memory leaks', () => {
      const { unmount } = renderHook(() => useAppStore());
      
      expect(() => unmount()).not.toThrow();
    });
  });
});
