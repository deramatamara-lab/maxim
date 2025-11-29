/**
 * Earnings Hook
 * Custom hook for managing driver earnings data and state
 */

import { useState, useEffect, useCallback } from 'react';
import { EarningsData, EarningsPeriod, EarningsSummary } from '@/types/earnings';
import { earningsService } from '@/api/earnings';
import { log } from '@/utils/logger';

interface UseEarningsOptions {
  driverId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseEarningsReturn {
  data: EarningsData | null;
  summary: EarningsSummary | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  selectedPeriod: EarningsPeriod;
  setSelectedPeriod: (period: EarningsPeriod) => void;
  refresh: () => Promise<void>;
  requestPayout: (amount: number, method: string) => Promise<{ success: boolean; data?: any; error?: any }>;
}

/**
 * Hook for managing earnings data
 */
export const useEarnings = ({ 
  driverId, 
  autoRefresh = false, 
  refreshInterval = 60000 // 1 minute default
}: UseEarningsOptions): UseEarningsReturn => {
  const [data, setData] = useState<EarningsData | null>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>('weekly');

  // Load earnings data
  const loadEarningsData = useCallback(async (period: EarningsPeriod = selectedPeriod) => {
    try {
      setError(null);
      
      const response = await earningsService.getEarningsData(driverId, period);
      
      if (response.success && response.data) {
        setData(response.data);
        log.info('Earnings data loaded successfully', {
          event: 'earnings_loaded',
          component: 'useEarnings',
          period,
          totalEarnings: response.data.weekly.totalEarnings,
        });
      } else {
        setError(response.error?.message || 'Failed to load earnings data');
        log.error('Failed to load earnings data', {
          event: 'earnings_load_error',
          component: 'useEarnings',
          driverId,
          period,
          error: response.error,
        });
      }
    } catch (error) {
      setError('Failed to load earnings data');
      log.error('Error loading earnings data', {
        event: 'earnings_load_error',
        component: 'useEarnings',
        driverId,
        period,
      }, error);
    }
  }, [driverId, selectedPeriod]);

  // Load summary data
  const loadSummaryData = useCallback(async () => {
    try {
      const response = await earningsService.getEarningsSummary(driverId);
      
      if (response.success && response.data) {
        setSummary(response.data);
        log.info('Earnings summary loaded successfully', {
          event: 'summary_loaded',
          component: 'useEarnings',
          currentEarnings: response.data.currentPeriodEarnings,
          growth: response.data.earningsGrowth,
        });
      }
    } catch (error) {
      log.error('Error loading earnings summary', {
        event: 'summary_load_error',
        component: 'useEarnings',
        driverId,
      }, error);
    }
  }, [driverId]);

  // Load data on mount and when period changes
  useEffect(() => {
    setLoading(true);
    
    Promise.all([
      loadEarningsData(selectedPeriod),
      loadSummaryData(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [driverId, selectedPeriod, loadEarningsData, loadSummaryData]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadEarningsData(selectedPeriod);
      loadSummaryData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedPeriod, loadEarningsData, loadSummaryData]);

  // Refresh function
  const refresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      await Promise.all([
        loadEarningsData(selectedPeriod),
        loadSummaryData(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [selectedPeriod, loadEarningsData, loadSummaryData]);

  // Request payout function
  const requestPayout = useCallback(async (amount: number, method: string) => {
    try {
      const response = await earningsService.requestPayout(driverId, amount, method);
      
      if (response.success) {
        // Refresh data after successful payout request
        await refresh();
      }
      
      return response;
    } catch (error) {
      log.error('Error requesting payout', {
        event: 'payout_request_error',
        component: 'useEarnings',
        driverId,
        amount,
        method,
      }, error);
      
      return {
        success: false,
        error: {
          code: 'PAYOUT_REQUEST_FAILED',
          message: 'Failed to request payout',
          details: error,
        },
      };
    }
  }, [driverId, refresh]);

  return {
    data,
    summary,
    loading,
    error,
    refreshing,
    selectedPeriod,
    setSelectedPeriod,
    refresh,
    requestPayout,
  };
};

/**
 * Hook for earnings analytics (extended data)
 */
export const useEarningsAnalytics = (driverId: string) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would be implemented in the earnings service
      // For now, we'll simulate some analytics data
      const mockAnalytics = {
        hourlyBreakdown: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          earnings: Math.random() * 50 + 10,
          trips: Math.floor(Math.random() * 3),
        })),
        locationBreakdown: [
          { area: 'Downtown', earnings: 450, trips: 15, averageFare: 30 },
          { area: 'Airport', earnings: 380, trips: 8, averageFare: 47.5 },
          { area: 'Suburbs', earnings: 220, trips: 12, averageFare: 18.33 },
        ],
        vehicleTypeBreakdown: [
          { vehicleType: 'Sedan', earnings: 680, trips: 25, utilization: 0.85 },
          { vehicleType: 'SUV', earnings: 420, trips: 10, utilization: 0.70 },
        ],
        customerSatisfaction: {
          ratings: Array.from({ length: 50 }, () => 4 + Math.random()),
          averageRating: 4.6,
          ratingDistribution: {
            5: 30,
            4: 15,
            3: 4,
            2: 1,
            1: 0,
          },
          positiveFeedbackPercentage: 90,
        },
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      setError('Failed to load analytics data');
      log.error('Error loading analytics', {
        event: 'analytics_load_error',
        component: 'useEarningsAnalytics',
        driverId,
      }, error);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadAnalytics();
  }, [driverId, loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: loadAnalytics,
  };
};

/**
 * Hook for payout history
 */
export const usePayoutHistory = (driverId: string) => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayoutHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await earningsService.getPayoutHistory(driverId);
      
      if (response.success && response.data) {
        setPayouts(response.data.payouts);
      } else {
        setError(response.error?.message || 'Failed to load payout history');
      }
    } catch (error) {
      setError('Failed to load payout history');
      log.error('Error loading payout history', {
        event: 'payouts_load_error',
        component: 'usePayoutHistory',
        driverId,
      }, error);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadPayoutHistory();
  }, [driverId, loadPayoutHistory]);

  return {
    payouts,
    loading,
    error,
    refresh: loadPayoutHistory,
  };
};

export default useEarnings;
