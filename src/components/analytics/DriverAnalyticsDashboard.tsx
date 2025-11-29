/**
 * Driver Analytics Dashboard Component
 * Comprehensive performance metrics, earnings trends, and real-time statistics
 * Integrates with earnings data and location tracking metrics
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions, Pressable, type ViewStyle, type TextStyle } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { CustomIcon } from '../ui/CustomIcon';
import { ds } from '../../constants/theme';
import { DriverAnalytics } from '../../api/rides';

const { width: screenWidth } = Dimensions.get('window');

interface DriverAnalyticsDashboardProps {
  analytics: DriverAnalytics;
  onPeriodChange: (period: 'today' | 'week' | 'month') => void;
  currentPeriod: 'today' | 'week' | 'month';
  _isLoading?: boolean;
}

export function DriverAnalyticsDashboard({
  analytics,
  onPeriodChange,
  currentPeriod,
  _isLoading = false,
}: DriverAnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<'earnings' | 'performance' | 'trends'>('earnings');

  // Format currency display
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  // Format percentage display
  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  // Get efficiency color based on score
  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return ds.colors.success;
    if (score >= 60) return ds.colors.primary;
    if (score >= 40) return ds.colors.secondary;
    return ds.colors.danger;
  };

  // Render earnings overview section
  const renderEarningsOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Earnings Overview</Text>
      
      <View style={styles.metricsGrid as ViewStyle}>
        <GlassCard style={styles.metricCard as ViewStyle}>
          <Text style={styles.metricValue as TextStyle}>{formatCurrency(analytics.earnings.totalEarnings)}</Text>
          <Text style={styles.metricLabel as TextStyle}>Total Earnings</Text>
          <Text style={styles.metricPeriod as TextStyle}>{currentPeriod}</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard as ViewStyle}>
          <Text style={styles.metricValue as TextStyle}>{analytics.earnings.totalRides}</Text>
          <Text style={styles.metricLabel as TextStyle}>Total Rides</Text>
          <Text style={styles.metricPeriod as TextStyle}>{currentPeriod}</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard as ViewStyle}>
          <Text style={styles.metricValue as TextStyle}>{formatCurrency(analytics.earnings.averageEarningsPerRide)}</Text>
          <Text style={styles.metricLabel as TextStyle}>Avg per Ride</Text>
          <Text style={styles.metricPeriod as TextStyle}>{currentPeriod}</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard as ViewStyle}>
          <Text style={[styles.metricValue as TextStyle, { color: getEfficiencyColor(analytics.earnings.efficiencyScore) }]}>
            {analytics.earnings.efficiencyScore}
          </Text>
          <Text style={styles.metricLabel as TextStyle}>Efficiency Score</Text>
          <Text style={styles.metricPeriod as TextStyle}>0-100 scale</Text>
        </GlassCard>
      </View>

      <View style={styles.earningsBreakdown as ViewStyle}>
        <Text style={styles.breakdownTitle as TextStyle}>Earnings Breakdown</Text>
        <View style={styles.breakdownRow as ViewStyle}>
          <View style={styles.breakdownItem as ViewStyle}>
            <CustomIcon name="home" size={16} color={ds.colors.primary} />
            <Text style={styles.breakdownLabel as TextStyle}>Base</Text>
            <Text style={styles.breakdownValue as TextStyle}>{formatCurrency(analytics.earnings.baseEarnings)}</Text>
          </View>
          <View style={styles.breakdownItem as ViewStyle}>
            <CustomIcon name="activity" size={16} color={ds.colors.secondary} />
            <Text style={styles.breakdownLabel as TextStyle}>Surge</Text>
            <Text style={styles.breakdownValue as TextStyle}>{formatCurrency(analytics.earnings.surgeEarnings)}</Text>
          </View>
          <View style={styles.breakdownItem as ViewStyle}>
            <CustomIcon name="settings" size={16} color={ds.colors.success} />
            <Text style={styles.breakdownLabel as TextStyle}>Tips</Text>
            <Text style={styles.breakdownValue as TextStyle}>{formatCurrency(analytics.earnings.tips)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Render performance metrics section
  const renderPerformanceMetrics = () => (
    <View style={styles.section as ViewStyle}>
      <Text style={styles.sectionTitle as TextStyle}>Performance Metrics</Text>
      
      <View style={styles.performanceGrid as ViewStyle}>
        <GlassCard style={styles.performanceCard as ViewStyle}>
          <View style={styles.performanceHeader as ViewStyle}>
            <CustomIcon name="location" size={20} color={ds.colors.primary} />
            <Text style={styles.performanceTitle as TextStyle}>Distance & Speed</Text>
          </View>
          <View style={styles.performanceStats as ViewStyle}>
            <View style={styles.statRow as ViewStyle}>
              <Text style={styles.statLabel as TextStyle}>Total Distance</Text>
              <Text style={styles.statValue as TextStyle}>{analytics.earnings.totalDistance.toFixed(1)} km</Text>
            </View>
            <View style={styles.statRow as ViewStyle}>
              <Text style={styles.statLabel as TextStyle}>Average Speed</Text>
              <Text style={styles.statValue as TextStyle}>{analytics.earnings.averageSpeed.toFixed(1)} km/h</Text>
            </View>
            <View style={styles.statRow as ViewStyle}>
              <Text style={styles.statLabel as TextStyle}>Total Duration</Text>
              <Text style={styles.statValue as TextStyle}>{Math.round(analytics.earnings.totalDuration / 60)}h {analytics.earnings.totalDuration % 60}m</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.performanceCard as ViewStyle}>
          <View style={styles.performanceHeader as ViewStyle}>
            <CustomIcon name="check" size={20} color={ds.colors.success} />
            <Text style={styles.performanceTitle as TextStyle}>Completion Rates</Text>
          </View>
          <View style={styles.performanceStats as ViewStyle}>
            <View style={styles.statRow as ViewStyle}>
              <Text style={styles.statLabel as TextStyle}>Acceptance Rate</Text>
              <Text style={[styles.statValue as TextStyle, { color: analytics.earnings.acceptanceRate >= 70 ? ds.colors.success : ds.colors.danger }]}>
                {formatPercentage(analytics.earnings.acceptanceRate)}
              </Text>
            </View>
            <View style={styles.statRow as ViewStyle}>
              <Text style={styles.statLabel as TextStyle}>Completion Rate</Text>
              <Text style={[styles.statValue as TextStyle, { color: analytics.earnings.completionRate >= 90 ? ds.colors.success : ds.colors.danger }]}>
                {formatPercentage(analytics.earnings.completionRate)}
              </Text>
            </View>
            <View style={styles.statRow as ViewStyle}>
              <Text style={styles.statLabel as TextStyle}>Average Rating</Text>
              <Text style={[styles.statValue as TextStyle, { color: analytics.earnings.averageRating >= 4.5 ? ds.colors.success : ds.colors.primary }]}>
                {analytics.earnings.averageRating.toFixed(1)} ⭐
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>

      <GlassCard style={styles.peakHoursCard as ViewStyle}>
        <View style={styles.peakHoursHeader as ViewStyle}>
          <CustomIcon name="activity" size={20} color={ds.colors.secondary} />
          <Text style={styles.peakHoursTitle as TextStyle}>Peak Hours Performance</Text>
        </View>
        <Text style={styles.peakHoursEarnings as TextStyle}>
          {formatCurrency(analytics.earnings.peakHoursEarnings)} during peak hours
        </Text>
        <View style={styles.peakHoursList as ViewStyle}>
          {analytics.performance.peakHours.map((peak, index) => (
            <View key={index} style={styles.peakHourItem as ViewStyle}>
              <Text style={styles.peakHourTime as TextStyle}>{peak.start} - {peak.end}</Text>
              <Text style={styles.peakHourEarnings as TextStyle}>{formatCurrency(peak.earnings)}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );

  // Render trends section
  const renderTrends = () => (
    <View style={styles.section as ViewStyle}>
      <Text style={styles.sectionTitle as TextStyle}>Earnings Trends</Text>
      
      <GlassCard style={styles.trendsCard as ViewStyle}>
        <Text style={styles.trendsSubtitle as TextStyle}>Daily Performance (Last 7 Days)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendsScroll as ViewStyle}>
          {analytics.trends.dailyEarnings.slice(-7).map((day, index) => (
            <View key={index} style={styles.dayCard as ViewStyle}>
              <Text style={styles.dayDate as TextStyle}>{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</Text>
              <Text style={styles.dayEarnings as TextStyle}>{formatCurrency(day.earnings)}</Text>
              <Text style={styles.dayRides as TextStyle}>{day.rides} rides</Text>
            </View>
          ))}
        </ScrollView>
      </GlassCard>

      <GlassCard style={styles.insightsCard as ViewStyle}>
        <View style={styles.insightsHeader as ViewStyle}>
          <CustomIcon name="search" size={20} color={ds.colors.primary} />
          <Text style={styles.insightsTitle as TextStyle}>Performance Insights</Text>
        </View>
        <View style={styles.insightsList as ViewStyle}>
          <View style={styles.insightItem as ViewStyle}>
            <Text style={styles.insightLabel as TextStyle}>Top Earning Day</Text>
            <Text style={styles.insightValue as TextStyle}>{analytics.performance.topEarningDay}</Text>
          </View>
          <View style={styles.insightItem as ViewStyle}>
            <Text style={styles.insightLabel as TextStyle}>Average Trip Distance</Text>
            <Text style={styles.insightValue as TextStyle}>{analytics.performance.averageTripDistance.toFixed(1)} km</Text>
          </View>
          <View style={styles.insightItem as ViewStyle}>
            <Text style={styles.insightLabel as TextStyle}>Average Trip Duration</Text>
            <Text style={styles.insightValue as TextStyle}>{analytics.performance.averageTripDuration} min</Text>
          </View>
          <View style={styles.insightItem as ViewStyle}>
            <Text style={styles.insightLabel as TextStyle}>Most Profitable Area</Text>
            <Text style={styles.insightValue as TextStyle}>{analytics.performance.mostProfitableArea}</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  // Render period selector
  const renderPeriodSelector = () => (
    <View style={styles.periodSelector as ViewStyle}>
      {(['today', 'week', 'month'] as const).map((period) => (
        <PremiumButton
          key={period}
          onPress={() => onPeriodChange(period)}
          variant={currentPeriod === period ? 'primary' : 'ghost'}
          size="sm"
          style={styles.periodButton as ViewStyle}
        >
          <Text style={[
            styles.periodButtonText as TextStyle,
            currentPeriod === period && styles.periodButtonTextActive as TextStyle,
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </PremiumButton>
      ))}
    </View>
  );

  // Render selected metric section
  const renderSelectedMetric = () => {
    switch (selectedMetric) {
      case 'earnings':
        return renderEarningsOverview();
      case 'performance':
        return renderPerformanceMetrics();
      case 'trends':
        return renderTrends();
      default:
        return renderEarningsOverview();
    }
  };

  return (
    <ScrollView style={styles.container as ViewStyle} showsVerticalScrollIndicator={false}>
      <View style={styles.header as ViewStyle}>
        <Text style={styles.title as TextStyle}>Driver Analytics</Text>
        {renderPeriodSelector()}
      </View>

      {/* Metric Tabs */}
      <View style={styles.metricTabs as ViewStyle}>
        {(['earnings', 'performance', 'trends'] as const).map((metric) => (
          <Pressable
            key={metric}
            style={[
              styles.metricTab as ViewStyle,
              selectedMetric === metric && styles.metricTabActive as ViewStyle,
            ]}
            onPress={() => setSelectedMetric(metric)}
          >
            <Text style={[
              styles.metricTabText as TextStyle,
              selectedMetric === metric && styles.metricTabTextActive as TextStyle,
            ]}>
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Render selected metric section */}
      {renderSelectedMetric()}
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontFamily: ds.typography.family,
    fontSize: 24,
    fontWeight: '700' as const,
    color: ds.colors.textPrimary,
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  periodButton: {
    flex: 1,
  },
  periodButtonText: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    fontWeight: '500' as const,
    color: ds.colors.textSecondary,
  },
  periodButtonTextActive: {
    color: ds.colors.textPrimary,
  },
  metricTabs: {
    flexDirection: 'row' as const,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: ds.colors.backgroundDeep,
    borderRadius: ds.radius.sm,
    padding: 4,
  },
  metricTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: ds.radius.sm,
    alignItems: 'center' as const,
  },
  metricTabActive: {
    backgroundColor: ds.colors.primary,
  },
  metricTabText: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    fontWeight: '500' as const,
    color: ds.colors.textSecondary,
  },
  metricTabTextActive: {
    color: ds.colors.textPrimary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: ds.typography.family,
    fontSize: 18,
    fontWeight: '600' as const,
    color: ds.colors.textPrimary,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: (screenWidth - 52) / 2, // 2 columns with padding
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center' as const,
  },
  metricValue: {
    fontFamily: ds.typography.family,
    fontSize: 20,
    fontWeight: '700' as const,
    color: ds.colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: ds.typography.family,
    fontSize: 12,
    fontWeight: '500' as const,
    color: ds.colors.textSecondary,
    marginBottom: 2,
  },
  metricPeriod: {
    fontFamily: ds.typography.family,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  earningsBreakdown: {
    marginBottom: 20,
  },
  breakdownTitle: {
    fontFamily: ds.typography.family,
    fontSize: 16,
    fontWeight: '500' as const,
    color: ds.colors.textPrimary,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 12,
    backgroundColor: ds.colors.backgroundDeep,
    borderRadius: ds.radius.sm,
    gap: 4,
  },
  breakdownLabel: {
    fontFamily: ds.typography.family,
    fontSize: 12,
    fontWeight: '500' as const,
    color: ds.colors.textSecondary,
  },
  breakdownValue: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    fontWeight: '600' as const,
    color: ds.colors.textPrimary,
  },
  performanceGrid: {
    gap: 12,
    marginBottom: 20,
  },
  performanceCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  performanceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  performanceTitle: {
    fontFamily: ds.typography.family,
    fontSize: 16,
    fontWeight: '500' as const,
    color: ds.colors.textPrimary,
  },
  performanceStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  statLabel: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    color: ds.colors.textSecondary,
  },
  statValue: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    fontWeight: '600' as const,
    color: ds.colors.textPrimary,
  },
  peakHoursCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  peakHoursHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  peakHoursTitle: {
    fontFamily: ds.typography.family,
    fontSize: 16,
    fontWeight: '500' as const,
    color: ds.colors.textPrimary,
  },
  peakHoursEarnings: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    color: ds.colors.secondary,
    marginBottom: 12,
  },
  peakHoursList: {
    gap: 8,
  },
  peakHourItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: ds.colors.backgroundDeep,
    borderRadius: ds.radius.sm,
  },
  peakHourTime: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    color: ds.colors.textSecondary,
  },
  peakHourEarnings: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    fontWeight: '600' as const,
    color: ds.colors.primary,
  },
  trendsCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  trendsSubtitle: {
    fontFamily: ds.typography.family,
    fontSize: 16,
    fontWeight: '500' as const,
    color: ds.colors.textPrimary,
    marginBottom: 12,
  },
  trendsScroll: {
    marginBottom: 8,
  },
  dayCard: {
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: ds.colors.backgroundDeep,
    borderRadius: ds.radius.sm,
    marginRight: 12,
    minWidth: 80,
  },
  dayDate: {
    fontFamily: ds.typography.family,
    fontSize: 12,
    fontWeight: '500' as const,
    color: ds.colors.textSecondary,
    marginBottom: 4,
  },
  dayEarnings: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    fontWeight: '600' as const,
    color: ds.colors.primary,
    marginBottom: 2,
  },
  dayRides: {
    fontFamily: ds.typography.family,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  insightsCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  insightsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  insightsTitle: {
    fontFamily: ds.typography.family,
    fontSize: 16,
    fontWeight: '500' as const,
    color: ds.colors.textPrimary,
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  insightLabel: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    color: ds.colors.textSecondary,
  },
  insightValue: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    fontWeight: '600' as const,
    color: ds.colors.textPrimary,
  },
};
