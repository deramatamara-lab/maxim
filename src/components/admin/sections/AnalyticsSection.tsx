/**
 * Analytics Section
 * Admin interface for viewing business metrics and analytics
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon } from '../../ui/CustomIcon';

 
interface AnalyticsSectionProps {
  // Props can be added later for real-time data
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [isLoading, setIsLoading] = useState(false);

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalRides: 1247,
      activeUsers: 892,
      revenue: 15678.90,
      averageRating: 4.7,
    },
    growth: {
      ridesGrowth: 12.5,
      usersGrowth: 8.3,
      revenueGrowth: 15.2,
    },
    byCategory: [
      { category: 'Aura Lux', rides: 234, revenue: 4567.80 },
      { category: 'Aura Pulse', rides: 567, revenue: 7890.40 },
      { category: 'Aura Share', rides: 446, revenue: 3220.70 },
    ],
    topRoutes: [
      { route: 'Airport → City Center', rides: 89, avgPrice: 45.50 },
      { route: 'Downtown → University', rides: 67, avgPrice: 18.20 },
      { route: 'Train Station → Hotel District', rides: 54, avgPrice: 22.80 },
    ],
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, trend?: number) => (
    <GlassCard intensity={15} style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      {trend !== undefined && (
        <View style={styles.trendContainer}>
          <CustomIcon 
            name={trend >= 0 ? 'activity' : 'settings'} 
            size={12} 
            color={trend >= 0 ? ds.colors.success : ds.colors.error} 
          />
          <Text style={[
            styles.trendText,
            { color: trend >= 0 ? ds.colors.success : ds.colors.error }
          ]}>
            {trend >= 0 ? '+' : ''}{trend}%
          </Text>
        </View>
      )}
    </GlassCard>
  );

  const renderTimeRangeButton = (range: typeof timeRange, label: string) => (
    <PremiumButton
      variant={timeRange === range ? 'primary' : 'ghost'}
      size="sm"
      onPress={() => setTimeRange(range)}
      style={styles.timeRangeButton}
    >
      {label}
    </PremiumButton>
  );

  return (
    <View style={styles.container}>
      {/* Time Range Selector */}
      <GlassCard intensity={15} style={styles.timeRangeCard}>
        <View style={styles.timeRangeHeader}>
          <Text style={styles.sectionTitle}>Analytics Overview</Text>
          <PremiumButton
            variant="secondary"
            size="sm"
            onPress={handleRefresh}
            loading={isLoading}
          >
            <CustomIcon name="activity" size={16} />
          </PremiumButton>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeRangeButtons}
        >
          {renderTimeRangeButton('day', 'Today')}
          {renderTimeRangeButton('week', 'This Week')}
          {renderTimeRangeButton('month', 'This Month')}
          {renderTimeRangeButton('year', 'This Year')}
        </ScrollView>
      </GlassCard>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        {renderMetricCard('Total Rides', analyticsData.overview.totalRides.toLocaleString(), 'Last 24h', analyticsData.growth.ridesGrowth)}
        {renderMetricCard('Active Users', analyticsData.overview.activeUsers.toLocaleString(), 'Current', analyticsData.growth.usersGrowth)}
        {renderMetricCard('Revenue', `$${analyticsData.overview.revenue.toLocaleString()}`, 'This period', analyticsData.growth.revenueGrowth)}
        {renderMetricCard('Avg Rating', analyticsData.overview.averageRating.toFixed(1), '⭐⭐⭐⭐⭐')}
      </View>

      {/* Ride Categories */}
      <GlassCard intensity={15} style={styles.categoriesCard}>
        <Text style={styles.sectionTitle}>Rides by Category</Text>
        {analyticsData.byCategory.map((category, index) => (
          <View key={index} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.category}</Text>
              <Text style={styles.categoryRides}>{category.rides} rides</Text>
            </View>
            <Text style={styles.categoryRevenue}>
              ${category.revenue.toLocaleString()}
            </Text>
          </View>
        ))}
      </GlassCard>

      {/* Top Routes */}
      <GlassCard intensity={15} style={styles.routesCard}>
        <Text style={styles.sectionTitle}>Top Routes</Text>
        {analyticsData.topRoutes.map((route, index) => (
          <View key={index} style={styles.routeRow}>
            <View style={styles.routeInfo}>
              <CustomIcon name="location" size={16} color={ds.colors.primary} />
              <Text style={styles.routeName}>{route.route}</Text>
            </View>
            <View style={styles.routeStats}>
              <Text style={styles.routeRides}>{route.rides} rides</Text>
              <Text style={styles.routePrice}>${route.avgPrice} avg</Text>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Performance Insights */}
      <GlassCard intensity={15} style={styles.insightsCard}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        <View style={styles.insight}>
          <CustomIcon name="activity" size={16} color={ds.colors.success} />
          <Text style={styles.insightText}>
            Peak hours: 6-9 PM with 45% more rides than average
          </Text>
        </View>
        <View style={styles.insight}>
          <CustomIcon name="profile" size={16} color={ds.colors.warning} />
          <Text style={styles.insightText}>
            Driver availability drops by 20% during weekend nights
          </Text>
        </View>
        <View style={styles.insight}>
          <CustomIcon name="location" size={16} color={ds.colors.primary} />
          <Text style={styles.insightText}>
            Airport routes generate 35% of total revenue
          </Text>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeRangeCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  timeRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  timeRangeButtons: {
    gap: ds.spacing.sm,
  },
  timeRangeButton: {
    // Uses PremiumButton defaults
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: ds.spacing.md,
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  metricValue: {
    fontSize: ds.typography.size.display,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    marginBottom: ds.spacing.xs,
  },
  metricSubtitle: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textMuted,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    marginTop: ds.spacing.xs,
  },
  trendText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
  },
  categoriesCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  categoryRides: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
  },
  categoryRevenue: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
  },
  routesCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    flex: 1,
  },
  routeName: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
  },
  routeStats: {
    alignItems: 'flex-end',
  },
  routeRides: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  routePrice: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
  },
  insightsCard: {
    padding: ds.spacing.md,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  insightText: {
    flex: 1,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
    lineHeight: ds.typography.lineHeight.body,
  },
});
