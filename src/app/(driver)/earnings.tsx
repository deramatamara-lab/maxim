/**
 * Driver Earnings Dashboard
 * Comprehensive earnings overview with performance metrics and payout history
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Icon } from '@/components/ui/Icon';
import { useTranslation } from '@/providers/LanguageProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { useTheme } from '@/providers/ThemeLocaleProvider';
import { ds } from '@/constants/theme';
import { log } from '@/utils/logger';
import { earningsService } from '@/api/earnings';
import { EarningsData, EarningsPeriod } from '@/types/earnings';
import { useEarnings } from '@/hooks/useEarnings';

// Component props interface
interface EarningsDashboardProps {
  onBack?: () => void;
  driverId?: string;
}

/**
 * Driver Earnings Dashboard Component
 */
export default function EarningsDashboard({ onBack, driverId = 'driver_123' }: EarningsDashboardProps) {
  const { t } = useTranslation();
  const { trigger } = useHaptics();
  const { play } = useSound();
  const { colors } = useTheme();
  
  // Use earnings hook
  const {
    data: earningsData,
    loading,
    error,
    refreshing,
    selectedPeriod,
    setSelectedPeriod,
    refresh,
  } = useEarnings({ driverId, autoRefresh: true, refreshInterval: 30000 }); // 30 seconds auto-refresh
  
  // Animation values
  const scaleValue = useSharedValue(1);

  // Animated style for period buttons
  const getAnimatedStyle = (isSelected: boolean) => useAnimatedStyle(() => ({
    transform: [{ 
      scale: withSpring(isSelected ? 1.05 : 1, { damping: 15, stiffness: 300 }) 
    }],
  }));

  // Handle refresh
  const handleRefresh = useCallback(() => {
    trigger('tap');
    play('tapSoft');
    
    refresh().finally(() => {
      trigger('confirm');
      play('success');
    });
  }, [trigger, play, refresh]);

  // Handle period selection
  const handlePeriodSelect = (period: EarningsPeriod) => {
    trigger('selection');
    play('tapSoft');
    setSelectedPeriod(period);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return ds.colors.success;
      case 'processing': return ds.colors.warning;
      case 'pending': return ds.colors.textSecondary;
      case 'failed': return ds.colors.danger;
      default: return ds.colors.textSecondary;
    }
  };

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer} testID="loading-indicator">
      <ActivityIndicator size="large" color={ds.colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        Loading earnings data...
      </Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <GlassCard elevated style={styles.errorCard}>
      <Icon name="warning" size={48} color={ds.colors.danger} />
      <Text style={[styles.errorTitle, { color: colors.text }]}>
        Error Loading Data
      </Text>
      <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
        {error || 'Failed to load earnings data. Please try again.'}
      </Text>
      <PremiumButton
        variant="primary"
        size="md"
        onPress={handleRefresh}
        style={styles.retryButton}
      >
        Retry
      </PremiumButton>
    </GlassCard>
  );

  // Render period selector
  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['daily', 'weekly', 'monthly'] as EarningsPeriod[]).map((period) => (
        <Animated.View key={period} style={getAnimatedStyle(selectedPeriod === period)}>
          <PremiumButton
            variant={selectedPeriod === period ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => handlePeriodSelect(period)}
            style={styles.periodButton}
            accessibilityLabel={`View ${period} earnings`}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedPeriod === period }}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </PremiumButton>
        </Animated.View>
      ))}
    </View>
  );

  // Render earnings summary card
  const renderEarningsSummary = () => {
    if (!earningsData) return null;
    
    const data = earningsData;
    
    return (
      <Animated.View entering={FadeInDown.delay(100).duration(600)}>
        <GlassCard elevated style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Earnings
            </Text>
            <Text style={styles.summaryPeriod}>
              {selectedPeriod === 'daily' && data.daily.date}
              {selectedPeriod === 'weekly' && `${data.weekly.startDate} - ${data.weekly.endDate}`}
              {selectedPeriod === 'monthly' && `${data.monthly.month} ${data.monthly.year}`}
            </Text>
          </View>
          
          <View style={styles.summaryAmount}>
            <Text style={styles.amountValue}>
              {formatCurrency(
                selectedPeriod === 'daily' ? data.daily.amount :
                selectedPeriod === 'weekly' ? data.weekly.totalEarnings :
                data.monthly.totalEarnings
              )}
            </Text>
            <Text style={styles.amountLabel}>Total Earnings</Text>
          </View>
          
          <View style={styles.summaryMetrics}>
            <View style={styles.metricItem}>
              <Icon name="activity" size={20} color={ds.colors.primary} />
              <Text style={styles.metricValue}>
                {selectedPeriod === 'daily' ? data.daily.trips :
                 selectedPeriod === 'weekly' ? data.weekly.totalTrips :
                 data.monthly.totalTrips}
              </Text>
              <Text style={styles.metricLabel}>Trips</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Icon name="location" size={20} color={ds.colors.secondary} />
              <Text style={styles.metricValue}>
                {selectedPeriod === 'daily' ? data.daily.hours.toFixed(1) :
                 selectedPeriod === 'weekly' ? data.weekly.totalHours.toFixed(1) :
                 data.monthly.totalHours.toFixed(1)}h
              </Text>
              <Text style={styles.metricLabel}>Hours</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Icon name="star" size={20} color={ds.colors.warning} />
              <Text style={styles.metricValue}>
                {selectedPeriod === 'daily' ? data.daily.rating.toFixed(1) :
                 selectedPeriod === 'weekly' ? data.weekly.averageRating.toFixed(1) :
                 data.monthly.averageRating.toFixed(1)}
              </Text>
              <Text style={styles.metricLabel}>Rating</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  // Render performance metrics
  const renderPerformanceMetrics = () => {
    if (!earningsData) return null;
    
    return (
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <GlassCard elevated style={styles.performanceCard}>
          <Text style={styles.cardTitle}>Performance Metrics</Text>
          
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Acceptance Rate</Text>
              <Text style={styles.performanceValue}>{earningsData.performance.acceptanceRate.toFixed(1)}%</Text>
              <View style={[styles.progressBar, { width: `${earningsData.performance.acceptanceRate}%` }]} />
            </View>
            
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Completion Rate</Text>
              <Text style={styles.performanceValue}>{earningsData.performance.completionRate.toFixed(1)}%</Text>
              <View style={[styles.progressBar, { width: `${earningsData.performance.completionRate}%`, backgroundColor: ds.colors.secondary }]} />
            </View>
            
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>On-Time Rate</Text>
              <Text style={styles.performanceValue}>{earningsData.performance.onTimePercentage.toFixed(1)}%</Text>
              <View style={[styles.progressBar, { width: `${earningsData.performance.onTimePercentage}%`, backgroundColor: ds.colors.warning }]} />
            </View>
            
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Average Rating</Text>
              <Text style={styles.performanceValue}>{earningsData.performance.averageRating.toFixed(1)}</Text>
              <View style={styles.ratingStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Icon
                    key={i}
                    name={i < Math.floor(earningsData.performance.averageRating) ? 'star' : 'eye'}
                    size={16}
                    color={i < Math.floor(earningsData.performance.averageRating) ? ds.colors.warning : ds.colors.textSecondary}
                  />
                ))}
              </View>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  // Render payout history
  const renderPayoutHistory = () => {
    if (!earningsData) return null;
    
    return (
      <Animated.View entering={FadeInDown.delay(300).duration(600)}>
        <GlassCard elevated style={styles.payoutsCard}>
          <Text style={styles.cardTitle}>Payout History</Text>
          
          {earningsData.payouts.map((payout, index) => (
            <View key={payout.id} style={[styles.payoutItem, index > 0 && styles.payoutItemBorder]}>
              <View style={styles.payoutLeft}>
                <Text style={styles.payoutDate}>{payout.date}</Text>
                <Text style={styles.payoutMethod}>{payout.method}</Text>
              </View>
              
              <View style={styles.payoutRight}>
                <Text style={styles.payoutAmount}>{formatCurrency(payout.amount)}</Text>
                <View style={[styles.payoutStatus, { backgroundColor: getStatusColor(payout.status) + '20' }]}>
                  <Text style={[styles.payoutStatusText, { color: getStatusColor(payout.status) }]}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          
          <PremiumButton
            variant="secondary"
            size="sm"
            onPress={() => {
              trigger('tap');
              play('tapSoft');
              log.info('View payout details', { event: 'view_payout_details', component: 'EarningsDashboard' });
            }}
            style={styles.viewAllButton}
          >
            View All Payouts
          </PremiumButton>
        </GlassCard>
      </Animated.View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="chevronRight" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings Dashboard</Text>
          <View style={styles.placeholder} />
        </View>
        {renderLoadingState()}
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="chevronRight" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings Dashboard</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Icon name="profile" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderErrorState()}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevronRight" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings Dashboard</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton} testID="refresh-button">
          <Icon name="profile" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderPeriodSelector()}
        {renderEarningsSummary()}
        {renderPerformanceMetrics()}
        {renderPayoutHistory()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.lg,
    paddingBottom: ds.spacing.md,
  },
  backButton: {
    padding: ds.spacing.xs,
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    fontFamily: ds.typography.family,
  },
  refreshButton: {
    padding: ds.spacing.xs,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ds.spacing.lg,
  },
  loadingText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    textAlign: 'center',
  },
  errorCard: {
    padding: ds.spacing.xl,
    alignItems: 'center',
    gap: ds.spacing.lg,
    marginHorizontal: ds.spacing.lg,
    marginTop: ds.spacing.xl,
  },
  errorTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    fontFamily: ds.typography.family,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    textAlign: 'center',
    lineHeight: ds.typography.size.body * 1.5,
  },
  retryButton: {
    marginTop: ds.spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: ds.spacing.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.lg,
  },
  periodButton: {
    flex: 1,
  },
  summaryCard: {
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
  },
  summaryHeader: {
    marginBottom: ds.spacing.lg,
  },
  summaryTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  summaryPeriod: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  summaryAmount: {
    alignItems: 'center',
    marginBottom: ds.spacing.lg,
  },
  amountValue: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  amountLabel: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  metricValue: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  metricLabel: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  performanceCard: {
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
  },
  cardTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.lg,
  },
  performanceGrid: {
    gap: ds.spacing.lg,
  },
  performanceItem: {
    gap: ds.spacing.sm,
  },
  performanceLabel: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  performanceValue: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  progressBar: {
    height: 4,
    backgroundColor: ds.colors.primary,
    borderRadius: 2,
    marginTop: ds.spacing.xs,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: ds.spacing.xs,
    marginTop: ds.spacing.xs,
  },
  payoutsCard: {
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.xl,
  },
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.md,
  },
  payoutItemBorder: {
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  payoutLeft: {
    flex: 1,
  },
  payoutDate: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  payoutMethod: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  payoutRight: {
    alignItems: 'flex-end',
    gap: ds.spacing.xs,
  },
  payoutAmount: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  payoutStatus: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.sm,
  },
  payoutStatusText: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    fontFamily: ds.typography.family,
  },
  viewAllButton: {
    marginTop: ds.spacing.lg,
    alignSelf: 'center',
  },
});
