/**
 * Earnings Dashboard Tests
 * Tests for the earnings dashboard component and hooks
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/ThemeLocaleProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import EarningsDashboard from '@/app/(driver)/earnings';
import { useEarnings } from '@/hooks/useEarnings';
import { earningsService } from '@/api/earnings';
import { EarningsPeriod } from '@/types/earnings';

// Mock the earnings service
jest.mock('@/api/earnings');
const mockEarningsService = earningsService as jest.Mocked<typeof earningsService>;

// Mock hooks
jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    trigger: jest.fn(),
  }),
}));

jest.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    play: jest.fn(),
  }),
}));

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LanguageProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </LanguageProvider>
);

describe('EarningsDashboard', () => {
  const mockEarningsData = {
    daily: {
      date: '12/25/2024',
      amount: 284.50,
      trips: 12,
      hours: 8.5,
      rating: 4.8,
    },
    weekly: {
      startDate: '12/19/2024',
      endDate: '12/25/2024',
      totalEarnings: 1250.75,
      totalTrips: 45,
      totalHours: 42.5,
      averageRating: 4.7,
      dailyBreakdown: [],
    },
    monthly: {
      month: 'December',
      year: 2024,
      totalEarnings: 5200.00,
      totalTrips: 180,
      totalHours: 168,
      averageRating: 4.6,
      weeklyBreakdown: [],
    },
    payouts: [
      {
        id: 'payout_1',
        date: '12/23/2024',
        amount: 1250.75,
        status: 'completed',
        method: 'Direct Deposit',
      },
    ],
    performance: {
      acceptanceRate: 87.5,
      completionRate: 94.2,
      averageRating: 4.7,
      totalRatings: 1247,
      onTimePercentage: 91.3,
      cancellationRate: 5.8,
    },
    trends: {
      earningsTrend: 'up' as const,
      ratingTrend: 'up' as const,
      tripsTrend: 'stable' as const,
    },
    goals: {
      dailyEarningsGoal: 250,
      weeklyEarningsGoal: 1500,
      monthlyEarningsGoal: 6000,
      weeklyTripsGoal: 50,
      monthlyTripsGoal: 200,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEarningsService.getEarningsData.mockResolvedValue({
      success: true,
      data: mockEarningsData,
    });
    
    mockEarningsService.getEarningsSummary.mockResolvedValue({
      success: true,
      data: {
        totalEarnings: 1250.75,
        totalTrips: 45,
        totalHours: 42.5,
        averageRating: 4.7,
        totalPayouts: 3,
        pendingPayouts: 1,
        currentPeriodEarnings: 1250.75,
        previousPeriodEarnings: 1100.00,
        earningsGrowth: 13.7,
      },
    });
  });

  test('renders loading state initially', () => {
    mockEarningsService.getEarningsData.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { getByTestId } = render(
      <TestWrapper>
        <EarningsDashboard />
      </TestWrapper>
    );
    
    // Check for loading indicator
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('renders earnings data after loading', async () => {
    const { getByText, getByTestId } = render(
      <TestWrapper>
        <EarningsDashboard />
      </TestWrapper>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(getByText('Earnings Dashboard')).toBeTruthy();
    });
    
    // Check for key elements
    expect(getByText('Weekly Earnings')).toBeTruthy();
    expect(getByText('$1,250.75')).toBeTruthy();
    expect(getByText('45')).toBeTruthy(); // trips
    expect(getByText('42.5h')).toBeTruthy(); // hours
    expect(getByText('4.7')).toBeTruthy(); // rating
  });

  test('handles period selection', async () => {
    const { getByText } = render(
      <TestWrapper>
        <EarningsDashboard />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(getByText('Weekly')).toBeTruthy();
    });
    
    // Click on Daily period
    fireEvent.press(getByText('Daily'));
    
    // Verify service was called again
    expect(mockEarningsService.getEarningsData).toHaveBeenCalledTimes(2);
  });

  test('handles refresh action', async () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <EarningsDashboard />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(getByText('Weekly Earnings')).toBeTruthy();
    });
    
    // Find and press refresh button
    const refreshButton = getByTestId('refresh-button');
    fireEvent.press(refreshButton);
    
    // Verify service was called again
    expect(mockEarningsService.getEarningsData).toHaveBeenCalledTimes(2);
  });

  test('renders error state on failure', async () => {
    mockEarningsService.getEarningsData.mockResolvedValue({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to fetch earnings data',
      },
    });
    
    const { getByText } = render(
      <TestWrapper>
        <EarningsDashboard />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(getByText('Error Loading Data')).toBeTruthy();
      expect(getByText('Failed to fetch earnings data')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  test('renders performance metrics', async () => {
    const { getByText } = render(
      <TestWrapper>
        <EarningsDashboard />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(getByText('Performance Metrics')).toBeTruthy();
    });
    
    // Check performance metrics
    expect(getByText('87.5%')).toBeTruthy(); // acceptance rate
    expect(getByText('94.2%')).toBeTruthy(); // completion rate
    expect(getByText('91.3%')).toBeTruthy(); // on-time rate
  });

  test('renders payout history', async () => {
    const { getByText } = render(
      <TestWrapper>
        <EarningsDashboard />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(getByText('Payout History')).toBeTruthy();
    });
    
    // Check payout data
    expect(getByText('$1,250.75')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
    expect(getByText('Direct Deposit')).toBeTruthy();
  });
});

describe('useEarnings hook', () => {
  const mockEarningsData = {
    daily: {
      date: '12/25/2024',
      amount: 284.50,
      trips: 12,
      hours: 8.5,
      rating: 4.8,
    },
    weekly: {
      startDate: '12/19/2024',
      endDate: '12/25/2024',
      totalEarnings: 1250.75,
      totalTrips: 45,
      totalHours: 42.5,
      averageRating: 4.7,
      dailyBreakdown: [],
    },
    monthly: {
      month: 'December',
      year: 2024,
      totalEarnings: 5200.00,
      totalTrips: 180,
      totalHours: 168,
      averageRating: 4.6,
      weeklyBreakdown: [],
    },
    payouts: [],
    performance: {
      acceptanceRate: 87.5,
      completionRate: 94.2,
      averageRating: 4.7,
      totalRatings: 1247,
      onTimePercentage: 91.3,
      cancellationRate: 5.8,
    },
    trends: {
      earningsTrend: 'up' as const,
      ratingTrend: 'up' as const,
      tripsTrend: 'stable' as const,
    },
    goals: {
      dailyEarningsGoal: 250,
      weeklyEarningsGoal: 1500,
      monthlyEarningsGoal: 6000,
      weeklyTripsGoal: 50,
      monthlyTripsGoal: 200,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEarningsService.getEarningsData.mockResolvedValue({
      success: true,
      data: mockEarningsData,
    });
    
    mockEarningsService.getEarningsSummary.mockResolvedValue({
      success: true,
      data: {
        totalEarnings: 1250.75,
        totalTrips: 45,
        totalHours: 42.5,
        averageRating: 4.7,
        totalPayouts: 3,
        pendingPayouts: 1,
        currentPeriodEarnings: 1250.75,
        previousPeriodEarnings: 1100.00,
        earningsGrowth: 13.7,
      },
    });
  });

  test('loads earnings data on mount', async () => {
    let hookResult: any;
    
    const TestComponent = () => {
      hookResult = useEarnings({ driverId: 'test_driver' });
      return null;
    };
    
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    // Initially loading
    expect(hookResult.loading).toBe(true);
    expect(hookResult.data).toBe(null);
    
    // Wait for data to load
    await waitFor(() => {
      expect(hookResult.loading).toBe(false);
      expect(hookResult.data).toEqual(mockEarningsData);
    });
    
    // Verify service was called
    expect(mockEarningsService.getEarningsData).toHaveBeenCalledWith('test_driver', 'weekly');
    expect(mockEarningsService.getEarningsSummary).toHaveBeenCalledWith('test_driver');
  });

  test('handles period change', async () => {
    let hookResult: any;
    
    const TestComponent = () => {
      hookResult = useEarnings({ driverId: 'test_driver' });
      return null;
    };
    
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(hookResult.loading).toBe(false);
    });
    
    // Change period
    hookResult.setSelectedPeriod('daily' as EarningsPeriod);
    
    // Verify service was called with new period
    await waitFor(() => {
      expect(mockEarningsService.getEarningsData).toHaveBeenCalledWith('test_driver', 'daily');
    });
  });

  test('handles refresh', async () => {
    let hookResult: any;
    
    const TestComponent = () => {
      hookResult = useEarnings({ driverId: 'test_driver' });
      return null;
    };
    
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(hookResult.loading).toBe(false);
    });
    
    // Clear previous calls
    mockEarningsService.getEarningsData.mockClear();
    
    // Refresh data
    await hookResult.refresh();
    
    // Verify service was called again
    expect(mockEarningsService.getEarningsData).toHaveBeenCalledWith('test_driver', 'weekly');
  });
});

console.log('✅ Earnings dashboard tests completed successfully');
