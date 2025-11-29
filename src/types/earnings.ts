/**
 * Earnings Types
 * Type definitions for driver earnings and performance metrics
 */

export interface DailyEarnings {
  date: string;
  amount: number;
  trips: number;
  hours: number;
  rating: number;
  bonus?: number;
  tips?: number;
}

export interface WeeklyEarnings {
  startDate: string;
  endDate: string;
  totalEarnings: number;
  totalTrips: number;
  totalHours: number;
  averageRating: number;
  dailyBreakdown: DailyEarnings[];
  weeklyBonus?: number;
  peakHoursBonus?: number;
}

export interface MonthlyEarnings {
  month: string;
  year: number;
  totalEarnings: number;
  totalTrips: number;
  totalHours: number;
  averageRating: number;
  weeklyBreakdown: Array<{
    week: string;
    earnings: number;
    trips: number;
    startDate: string;
    endDate: string;
  }>;
  monthlyBonus?: number;
  streakBonus?: number;
}

export interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  method: string;
  transactionId?: string;
  processedDate?: string;
  failureReason?: string;
}

export interface PerformanceMetrics {
  acceptanceRate: number;
  completionRate: number;
  averageRating: number;
  totalRatings: number;
  onTimePercentage: number;
  cancellationRate: number;
  averageWaitTime: number; // in minutes
  averageTripDistance: number; // in miles
  peakHoursPerformance: number; // percentage of trips during peak hours
  weeklyGoalProgress: number; // percentage
  monthlyGoalProgress: number; // percentage
}

export interface EarningsData {
  daily: DailyEarnings;
  weekly: WeeklyEarnings;
  monthly: MonthlyEarnings;
  payouts: PayoutRecord[];
  performance: PerformanceMetrics;
  trends: {
    earningsTrend: 'up' | 'down' | 'stable';
    ratingTrend: 'up' | 'down' | 'stable';
    tripsTrend: 'up' | 'down' | 'stable';
  };
  goals: {
    dailyEarningsGoal: number;
    weeklyEarningsGoal: number;
    monthlyEarningsGoal: number;
    weeklyTripsGoal: number;
    monthlyTripsGoal: number;
  };
}

export interface EarningsFilters {
  startDate?: string;
  endDate?: string;
  status?: PayoutRecord['status'];
  payoutMethod?: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  totalTrips: number;
  totalHours: number;
  averageRating: number;
  totalPayouts: number;
  pendingPayouts: number;
  currentPeriodEarnings: number;
  previousPeriodEarnings: number;
  earningsGrowth: number; // percentage
}

export interface EarningsAnalytics {
  hourlyBreakdown: Array<{
    hour: number;
    earnings: number;
    trips: number;
  }>;
  locationBreakdown: Array<{
    area: string;
    earnings: number;
    trips: number;
    averageFare: number;
  }>;
  vehicleTypeBreakdown: Array<{
    vehicleType: string;
    earnings: number;
    trips: number;
    utilization: number;
  }>;
  customerSatisfaction: {
    ratings: number[];
    averageRating: number;
    ratingDistribution: Record<number, number>;
    positiveFeedbackPercentage: number;
  };
}

// API Response Types
export interface EarningsResponse {
  success: boolean;
  data?: EarningsData;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PayoutHistoryResponse {
  success: boolean;
  data?: {
    payouts: PayoutRecord[];
    summary: {
      totalPaid: number;
      pendingAmount: number;
      nextPayoutDate?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface PerformanceResponse {
  success: boolean;
  data?: PerformanceMetrics;
  error?: {
    code: string;
    message: string;
  };
}

// Utility Types
export type EarningsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PayoutStatus = PayoutRecord['status'];
export type TrendDirection = 'up' | 'down' | 'stable';

// Validation Helpers
export const isValidEarningsData = (data: any): data is EarningsData => {
  return (
    data &&
    typeof data === 'object' &&
    data.daily &&
    data.weekly &&
    data.monthly &&
    Array.isArray(data.payouts) &&
    data.performance &&
    data.trends &&
    data.goals
  );
};

export const isValidPayoutRecord = (record: any): record is PayoutRecord => {
  return (
    record &&
    typeof record === 'object' &&
    typeof record.id === 'string' &&
    typeof record.date === 'string' &&
    typeof record.amount === 'number' &&
    ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(record.status) &&
    typeof record.method === 'string'
  );
};

export const isValidPerformanceMetrics = (metrics: any): metrics is PerformanceMetrics => {
  return (
    metrics &&
    typeof metrics === 'object' &&
    typeof metrics.acceptanceRate === 'number' &&
    typeof metrics.completionRate === 'number' &&
    typeof metrics.averageRating === 'number' &&
    typeof metrics.totalRatings === 'number' &&
    typeof metrics.onTimePercentage === 'number' &&
    typeof metrics.cancellationRate === 'number'
  );
};
