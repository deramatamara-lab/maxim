/**
 * Earnings Service
 * Mock API service for driver earnings and performance data
 */

import { 
  EarningsData, 
  EarningsResponse, 
  PayoutHistoryResponse, 
  PerformanceResponse,
  EarningsFilters,
  EarningsSummary,
  EarningsAnalytics,
  DailyEarnings,
  WeeklyEarnings,
  MonthlyEarnings,
  PayoutRecord,
  PerformanceMetrics,
  EarningsPeriod,
  isValidEarningsData,
  isValidPayoutRecord,
  isValidPerformanceMetrics
} from '@/types/earnings';
import { log } from '@/utils/logger';

// Mock data generators
const generateDailyEarnings = (date: Date = new Date()): DailyEarnings => {
  const baseEarnings = 200;
  const tripCount = Math.floor(Math.random() * 15) + 8;
  const hoursWorked = Math.random() * 6 + 6; // 6-12 hours
  const rating = 4 + Math.random() * 0.9; // 4.0-4.9
  const tips = Math.random() * 50 + 10; // $10-60 in tips
  const bonus = Math.random() > 0.7 ? Math.random() * 30 + 10 : 0; // Occasional bonus

  return {
    date: date.toLocaleDateString(),
    amount: baseEarnings + (tripCount * 15) + tips + bonus,
    trips: tripCount,
    hours: hoursWorked,
    rating: Math.round(rating * 10) / 10,
    tips,
    bonus,
  };
};

const generateWeeklyEarnings = (startDate: Date = new Date()): WeeklyEarnings => {
  const dailyBreakdown: DailyEarnings[] = [];
  let totalEarnings = 0;
  let totalTrips = 0;
  let totalHours = 0;
  let totalRating = 0;

  // Generate 7 days of data
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() - (6 - i)); // Start from 6 days ago to today
    const daily = generateDailyEarnings(date);
    dailyBreakdown.push(daily);
    totalEarnings += daily.amount;
    totalTrips += daily.trips;
    totalHours += daily.hours;
    totalRating += daily.rating;
  }

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate());

  return {
    startDate: dailyBreakdown[0].date,
    endDate: endDate.toLocaleDateString(),
    totalEarnings,
    totalTrips,
    totalHours,
    averageRating: Math.round((totalRating / 7) * 10) / 10,
    dailyBreakdown,
    weeklyBonus: Math.random() > 0.5 ? Math.random() * 100 + 50 : 0,
    peakHoursBonus: Math.random() * 80 + 20,
  };
};

const generateMonthlyEarnings = (year: number = new Date().getFullYear(), month: number = new Date().getMonth()): MonthlyEarnings => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const weeklyBreakdown: Array<{
    week: string;
    earnings: number;
    trips: number;
    startDate: string;
    endDate: string;
  }> = [];
  
  let totalEarnings = 0;
  let totalTrips = 0;
  let totalHours = 0;
  let totalRating = 0;

  // Generate weekly breakdown (4-5 weeks)
  const weeksInMonth = Math.ceil(daysInMonth / 7);
  for (let week = 0; week < weeksInMonth; week++) {
    const weekStart = new Date(year, month, week * 7 + 1);
    const weekEnd = new Date(year, month, Math.min((week + 1) * 7, daysInMonth));
    
    let weekEarnings = 0;
    let weekTrips = 0;
    
    // Generate daily data for this week
    for (let day = weekStart.getDate(); day <= weekEnd.getDate(); day++) {
      const date = new Date(year, month, day);
      const daily = generateDailyEarnings(date);
      weekEarnings += daily.amount;
      weekTrips += daily.trips;
      totalHours += daily.hours;
      totalRating += daily.rating;
    }
    
    weeklyBreakdown.push({
      week: `Week ${week + 1}`,
      earnings: weekEarnings,
      trips: weekTrips,
      startDate: weekStart.toLocaleDateString(),
      endDate: weekEnd.toLocaleDateString(),
    });
    
    totalEarnings += weekEarnings;
    totalTrips += weekTrips;
  }

  const workingDays = totalHours > 0 ? Math.round(totalRating / (totalHours / 8)) : 0;
  const avgRating = workingDays > 0 ? Math.round((totalRating / workingDays) * 10) / 10 : 4.5;

  return {
    month: monthNames[month],
    year,
    totalEarnings,
    totalTrips,
    totalHours,
    averageRating: avgRating,
    weeklyBreakdown,
    monthlyBonus: Math.random() > 0.6 ? Math.random() * 200 + 100 : 0,
    streakBonus: Math.random() > 0.8 ? Math.random() * 150 + 50 : 0,
  };
};

const generatePayouts = (count: number = 10): PayoutRecord[] => {
  const payouts: PayoutRecord[] = [];
  const statuses: PayoutRecord['status'][] = ['completed', 'processing', 'pending', 'failed'];
  const methods = ['Direct Deposit', 'PayPal', 'Bank Transfer'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7)); // Weekly payouts
    
    const status = i < 2 ? statuses[Math.floor(Math.random() * 3)] : 'completed';
    const amount = Math.random() * 1000 + 800; // $800-1800
    
    payouts.push({
      id: `payout_${i + 1}`,
      date: date.toLocaleDateString(),
      amount: Math.round(amount * 100) / 100,
      status,
      method: methods[Math.floor(Math.random() * methods.length)],
      transactionId: status === 'completed' ? `txn_${Date.now()}_${i}` : undefined,
      processedDate: status === 'completed' ? date.toLocaleDateString() : undefined,
      failureReason: status === 'failed' ? 'Insufficient funds' : undefined,
    });
  }
  
  return payouts;
};

const generatePerformanceMetrics = (): PerformanceMetrics => {
  return {
    acceptanceRate: 85 + Math.random() * 12, // 85-97%
    completionRate: 90 + Math.random() * 8, // 90-98%
    averageRating: 4.2 + Math.random() * 0.7, // 4.2-4.9
    totalRatings: Math.floor(Math.random() * 1000) + 500, // 500-1500
    onTimePercentage: 88 + Math.random() * 10, // 88-98%
    cancellationRate: Math.random() * 8, // 0-8%
    averageWaitTime: 3 + Math.random() * 7, // 3-10 minutes
    averageTripDistance: 5 + Math.random() * 15, // 5-20 miles
    peakHoursPerformance: 60 + Math.random() * 30, // 60-90%
    weeklyGoalProgress: 70 + Math.random() * 30, // 70-100%
    monthlyGoalProgress: 65 + Math.random() * 35, // 65-100%
  };
};

// Main earnings service
class EarningsService {
  /**
   * Get comprehensive earnings data
   */
  async getEarningsData(driverId: string, period?: EarningsPeriod): Promise<EarningsResponse> {
    try {
      log.info('Fetching earnings data', { event: 'earnings_fetch_start', component: 'EarningsService', driverId, period });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const daily = generateDailyEarnings();
      const weekly = generateWeeklyEarnings();
      const monthly = generateMonthlyEarnings();
      const payouts = generatePayouts();
      const performance = generatePerformanceMetrics();
      
      const data: EarningsData = {
        daily,
        weekly,
        monthly,
        payouts,
        performance,
        trends: {
          earningsTrend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          ratingTrend: Math.random() > 0.7 ? 'up' : 'stable',
          tripsTrend: Math.random() > 0.6 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        },
        goals: {
          dailyEarningsGoal: 250,
          weeklyEarningsGoal: 1500,
          monthlyEarningsGoal: 6000,
          weeklyTripsGoal: 50,
          monthlyTripsGoal: 200,
        },
      };
      
      if (!isValidEarningsData(data)) {
        throw new Error('Invalid earnings data generated');
      }
      
      log.info('Earnings data fetched successfully', { 
        event: 'earnings_fetch_success', 
        component: 'EarningsService',
        totalEarnings: data.weekly.totalEarnings,
        totalTrips: data.weekly.totalTrips
      });
      
      return { success: true, data };
    } catch (error) {
      log.error('Failed to fetch earnings data', { 
        event: 'earnings_fetch_error', 
        component: 'EarningsService',
        driverId,
        period 
      }, error);
      
      return {
        success: false,
        error: {
          code: 'EARNINGS_FETCH_FAILED',
          message: 'Failed to fetch earnings data',
          details: error,
        },
      };
    }
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(driverId: string, filters?: EarningsFilters): Promise<PayoutHistoryResponse> {
    try {
      log.info('Fetching payout history', { event: 'payouts_fetch_start', component: 'EarningsService', driverId, filters });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let payouts = generatePayouts(20);
      
      // Apply filters
      if (filters) {
        if (filters.status) {
          payouts = payouts.filter(p => p.status === filters.status);
        }
        if (filters.payoutMethod) {
          payouts = payouts.filter(p => p.method === filters.payoutMethod);
        }
      }
      
      const totalPaid = payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pendingAmount = payouts
        .filter(p => p.status === 'pending' || p.status === 'processing')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const nextPayoutDate = new Date();
      nextPayoutDate.setDate(nextPayoutDate.getDate() + 7);
      
      log.info('Payout history fetched successfully', { 
        event: 'payouts_fetch_success', 
        component: 'EarningsService',
        totalPayouts: payouts.length,
        totalPaid
      });
      
      return {
        success: true,
        data: {
          payouts,
          summary: {
            totalPaid: Math.round(totalPaid * 100) / 100,
            pendingAmount: Math.round(pendingAmount * 100) / 100,
            nextPayoutDate: nextPayoutDate.toLocaleDateString(),
          },
        },
      };
    } catch (error) {
      log.error('Failed to fetch payout history', { 
        event: 'payouts_fetch_error', 
        component: 'EarningsService',
        driverId,
        filters 
      }, error);
      
      return {
        success: false,
        error: {
          code: 'PAYOUTS_FETCH_FAILED',
          message: `Failed to fetch payout history: ${error instanceof Error ? error.message : String(error)}`,
        },
      };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(driverId: string): Promise<PerformanceResponse> {
    try {
      log.info('Fetching performance metrics', { event: 'performance_fetch_start', component: 'EarningsService', driverId });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const performance = generatePerformanceMetrics();
      
      if (!isValidPerformanceMetrics(performance)) {
        throw new Error('Invalid performance metrics generated');
      }
      
      log.info('Performance metrics fetched successfully', { 
        event: 'performance_fetch_success', 
        component: 'EarningsService',
        averageRating: performance.averageRating,
        acceptanceRate: performance.acceptanceRate
      });
      
      return { success: true, data: performance };
    } catch (error) {
      log.error('Failed to fetch performance metrics', { 
        event: 'performance_fetch_error', 
        component: 'EarningsService',
        driverId 
      }, error);
      
      return {
        success: false,
        error: {
          code: 'PERFORMANCE_FETCH_FAILED',
          message: `Failed to fetch performance metrics: ${error instanceof Error ? error.message : String(error)}`,
        },
      };
    }
  }

  /**
   * Get earnings summary
   */
  async getEarningsSummary(driverId: string): Promise<{ success: boolean; data?: EarningsSummary; error?: any }> {
    try {
      log.info('Fetching earnings summary', { event: 'summary_fetch_start', component: 'EarningsService', driverId });
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const weekly = generateWeeklyEarnings();
      const previousWeek = generateWeeklyEarnings(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      
      const summary: EarningsSummary = {
        totalEarnings: weekly.totalEarnings,
        totalTrips: weekly.totalTrips,
        totalHours: weekly.totalHours,
        averageRating: weekly.averageRating,
        totalPayouts: generatePayouts(5).filter(p => p.status === 'completed').length,
        pendingPayouts: generatePayouts(3).filter(p => p.status === 'pending').length,
        currentPeriodEarnings: weekly.totalEarnings,
        previousPeriodEarnings: previousWeek.totalEarnings,
        earningsGrowth: ((weekly.totalEarnings - previousWeek.totalEarnings) / previousWeek.totalEarnings) * 100,
      };
      
      log.info('Earnings summary fetched successfully', { 
        event: 'summary_fetch_success', 
        component: 'EarningsService',
        currentEarnings: summary.currentPeriodEarnings,
        growth: summary.earningsGrowth
      });
      
      return { success: true, data: summary };
    } catch (error) {
      log.error('Failed to fetch earnings summary', { 
        event: 'summary_fetch_error', 
        component: 'EarningsService',
        driverId 
      }, error);
      
      return {
        success: false,
        error: {
          code: 'SUMMARY_FETCH_FAILED',
          message: 'Failed to fetch earnings summary',
          details: error,
        },
      };
    }
  }

  /**
   * Request payout
   */
  async requestPayout(driverId: string, amount: number, method: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      log.info('Requesting payout', { event: 'payout_request_start', component: 'EarningsService', driverId, amount, method });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate validation
      if (amount < 100) {
        throw new Error('Minimum payout amount is $100');
      }
      
      if (amount > 10000) {
        throw new Error('Maximum payout amount is $10,000');
      }
      
      const payout = {
        id: `payout_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        amount,
        status: 'pending',
        method,
      };
      
      log.info('Payout requested successfully', { 
        event: 'payout_request_success', 
        component: 'EarningsService',
        payoutId: payout.id,
        amount
      });
      
      return { success: true, data: payout };
    } catch (error) {
      log.error('Failed to request payout', { 
        event: 'payout_request_error', 
        component: 'EarningsService',
        driverId,
        amount,
        method 
      }, error);
      
      return {
        success: false,
        error: {
          code: 'PAYOUT_REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Failed to request payout',
          details: error,
        },
      };
    }
  }
}

// Export singleton instance
export const earningsService = new EarningsService();
export default earningsService;
