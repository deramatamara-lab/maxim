/**
 * Operations Dashboard Component
 * Real-time fleet monitoring, stats grid, and recent transactions
 * Designed for operations team to monitor live activity
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

// Mock data types
interface AdminStat {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface Transaction {
  id: string;
  user: string;
  amount: string;
  type: string;
  status: 'completed' | 'cancelled' | 'pending';
  time: string;
}

interface NavItem {
  icon: 'activity' | 'location' | 'profile' | 'home';
  label: string;
  active: boolean;
}

// Mock data
const MOCK_STATS: AdminStat[] = [
  { label: 'Active Rides', value: '247', change: '+12%', isPositive: true },
  { label: 'Online Drivers', value: '89', change: '+5%', isPositive: true },
  { label: 'Revenue Today', value: '€12,450', change: '+8%', isPositive: true },
  { label: 'Avg Wait Time', value: '3.2m', change: '-15%', isPositive: true },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', user: 'Sarah M.', amount: '€24.50', type: 'Aura X', status: 'completed', time: '2m ago' },
  { id: '2', user: 'James K.', amount: '€18.00', type: 'Aura Go', status: 'completed', time: '5m ago' },
  { id: '3', user: 'Emma L.', amount: '€45.00', type: 'Aura Black', status: 'completed', time: '8m ago' },
  { id: '4', user: 'Michael R.', amount: '€12.50', type: 'Aura Go', status: 'cancelled', time: '12m ago' },
  { id: '5', user: 'Lisa T.', amount: '€32.00', type: 'Hyper', status: 'completed', time: '15m ago' },
  { id: '6', user: 'David W.', amount: '€28.00', type: 'Aura X', status: 'completed', time: '18m ago' },
];

const NAV_ITEMS: NavItem[] = [
  { icon: 'activity', label: 'Dashboard', active: true },
  { icon: 'location', label: 'Live Fleet', active: false },
  { icon: 'profile', label: 'Drivers', active: false },
  { icon: 'home', label: 'Financials', active: false },
];

// Live indicator component
const LiveIndicator: React.FC = () => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.2, { duration: 1000 }),
      -1,
      true
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  return (
    <View style={styles.liveIndicator}>
      <Animated.View style={[styles.livePulse, pulseStyle]} />
      <View style={styles.liveDot} />
    </View>
  );
};

// Stat Card Component
const StatCard: React.FC<{ stat: AdminStat; index: number }> = ({ stat, index }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      style={styles.statCardWrapper}
    >
      <GlassCard style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <View style={[
            styles.statBadge,
            stat.isPositive ? styles.statBadgePositive : styles.statBadgeNegative,
          ]}>
            <Text style={[
              styles.statChange,
              stat.isPositive ? styles.statChangePositive : styles.statChangeNegative,
            ]}>
              {stat.change}
            </Text>
          </View>
        </View>
        <Text style={styles.statValue}>{stat.value}</Text>
      </GlassCard>
    </Animated.View>
  );
};

// Transaction Item Component
const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const getTypeEmoji = (type: string) => {
    if (type === 'Aura X') return '⚡';
    if (type === 'Hyper') return '🚀';
    return '★';
  };

  const isCancelled = transaction.status === 'cancelled';

  return (
    <Pressable style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          isCancelled && styles.transactionIconCancelled,
        ]}>
          <Text style={styles.transactionEmoji}>{getTypeEmoji(transaction.type)}</Text>
        </View>
        <View>
          <Text style={styles.transactionUser}>{transaction.user}</Text>
          <Text style={styles.transactionMeta}>
            {transaction.time} • {transaction.type}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          isCancelled && styles.transactionAmountCancelled,
        ]}>
          {transaction.amount}
        </Text>
        <Text style={[
          styles.transactionStatus,
          transaction.status === 'completed' && styles.statusCompleted,
          transaction.status === 'cancelled' && styles.statusCancelled,
          transaction.status === 'pending' && styles.statusPending,
        ]}>
          {transaction.status.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
};

// Sidebar Navigation Component
const Sidebar: React.FC<{ 
  items: NavItem[]; 
  onSelect: (label: string) => void;
  collapsed?: boolean;
}> = ({ items, onSelect, collapsed = false }) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handlePress = useCallback((label: string) => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onSelect(label);
  }, [haptics, sound, onSelect]);

  return (
    <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
      {/* Logo */}
      <View style={styles.sidebarHeader}>
        <Text style={styles.logoText}>AURA</Text>
        {!collapsed && <Text style={styles.logoSubtext}>ADMIN</Text>}
      </View>

      {/* Nav Items */}
      <View style={styles.navItems}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            style={[
              styles.navItem,
              item.active && styles.navItemActive,
            ]}
            onPress={() => handlePress(item.label)}
          >
            <CustomIcon
              name={item.icon}
              size={20}
              color={item.active ? ds.colors.primary : ds.colors.textSecondary}
              active={item.active}
            />
            {!collapsed && (
              <Text style={[
                styles.navLabel,
                item.active && styles.navLabelActive,
              ]}>
                {item.label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* User Profile */}
      <View style={styles.sidebarFooter}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitials}>JS</Text>
        </View>
        {!collapsed && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>John Smith</Text>
            <Text style={styles.userRole}>Super Admin</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Main Component
export const OperationsDashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const haptics = useHaptics();
  const sound = useSound();

  const handleRefresh = useCallback(async () => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    setIsRefreshing(true);

    log.info('Operations dashboard refresh', {
      event: 'ops_dashboard_refresh',
      component: 'OperationsDashboard',
    });

    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));

    haptics.trigger('confirm');
    sound.play('success');
    setIsRefreshing(false);
  }, [haptics, sound]);

  const handleNavSelect = useCallback((label: string) => {
    setActiveNav(label);
    log.info('Operations nav change', {
      event: 'ops_nav_change',
      component: 'OperationsDashboard',
      section: label,
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <Sidebar
        items={NAV_ITEMS.map(item => ({
          ...item,
          active: item.label === activeNav,
        }))}
        onSelect={handleNavSelect}
        collapsed={!IS_TABLET}
      />

      {/* Main Content */}
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.mainContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={ds.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Text style={styles.headerTitle}>Overview</Text>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {MOCK_STATS.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </View>

        {/* Dashboard Widgets */}
        <View style={styles.widgetsRow}>
          {/* Live Fleet Map Placeholder */}
          <View style={styles.mapWidget}>
            <GlassCard elevated style={styles.mapCard}>
              <View style={styles.mapHeader}>
                <GlassCard style={styles.liveTag}>
                  <LiveIndicator />
                  <Text style={styles.liveText}>LIVE FLEET</Text>
                </GlassCard>
              </View>
              <View style={styles.mapPlaceholder}>
                <CustomIcon name="location" size={48} color={ds.colors.textSecondary} />
                <Text style={styles.mapPlaceholderText}>
                  Map integration available
                </Text>
              </View>
            </GlassCard>
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsWidget}>
            <GlassCard elevated style={styles.transactionsCard}>
              <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Recent Rides</Text>
              </View>
              <ScrollView
                style={styles.transactionsList}
                showsVerticalScrollIndicator={false}
              >
                {MOCK_TRANSACTIONS.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </ScrollView>
              <Pressable style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </Pressable>
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: ds.colors.backgroundDeep,
  },

  // Sidebar
  sidebar: {
    width: IS_TABLET ? 256 : 80,
    backgroundColor: ds.colors.surface,
    borderRightWidth: 1,
    borderRightColor: ds.colors.glassBorder,
    padding: ds.spacing.lg,
    justifyContent: 'space-between',
  },
  sidebarCollapsed: {
    width: 80,
    alignItems: 'center',
  },
  sidebarHeader: {
    marginBottom: ds.spacing.xl,
  },
  logoText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: ds.typography.tracking.tight,
  },
  logoSubtext: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.ultraWide,
    marginTop: ds.spacing.xxs,
  },
  navItems: {
    flex: 1,
    gap: ds.spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.md,
    borderRadius: ds.radius.md,
  },
  navItemActive: {
    backgroundColor: ds.colors.primary + '15',
    borderWidth: 1,
    borderColor: ds.colors.primary + '30',
  },
  navLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
  },
  navLabelActive: {
    color: ds.colors.primary,
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    padding: ds.spacing.md,
    backgroundColor: ds.colors.backgroundAlt,
    borderRadius: ds.radius.md,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.secondary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.secondary + '50',
  },
  userInitials: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  userRole: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
  },

  // Main Content
  mainContent: {
    flex: 1,
  },
  mainContentContainer: {
    padding: ds.spacing.xl,
  },
  header: {
    marginBottom: ds.spacing.lg,
  },
  headerTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.lg,
    marginBottom: ds.spacing.xl,
  },
  statCardWrapper: {
    flex: 1,
    minWidth: IS_TABLET ? 200 : '45%',
  },
  statCard: {
    padding: ds.spacing.lg,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
  },
  statLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  statBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xxs,
    borderRadius: ds.radius.sm,
  },
  statBadgePositive: {
    backgroundColor: ds.colors.success + '20',
  },
  statBadgeNegative: {
    backgroundColor: ds.colors.danger + '20',
  },
  statChange: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
  },
  statChangePositive: {
    color: ds.colors.success,
  },
  statChangeNegative: {
    color: ds.colors.danger,
  },
  statValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },

  // Widgets Row
  widgetsRow: {
    flexDirection: IS_TABLET ? 'row' : 'column',
    gap: ds.spacing.lg,
  },
  mapWidget: {
    flex: IS_TABLET ? 2 : 1,
    minHeight: 300,
  },
  mapCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
  },
  mapHeader: {
    position: 'absolute',
    top: ds.spacing.md,
    left: ds.spacing.md,
    zIndex: 10,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.xs,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulse: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.success,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.success,
  },
  liveText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.backgroundAlt,
  },
  mapPlaceholderText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.md,
  },

  // Transactions
  transactionsWidget: {
    flex: 1,
    minHeight: 300,
  },
  transactionsCard: {
    flex: 1,
    padding: 0,
  },
  transactionsHeader: {
    padding: ds.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.glassBorder,
  },
  transactionsTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  transactionsList: {
    flex: 1,
    padding: ds.spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    marginBottom: ds.spacing.xs,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconCancelled: {
    backgroundColor: ds.colors.surface,
  },
  transactionEmoji: {
    fontSize: 18,
  },
  transactionUser: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  transactionMeta: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  transactionAmountCancelled: {
    color: ds.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  transactionStatus: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.medium,
    letterSpacing: ds.typography.tracking.wide,
    marginTop: ds.spacing.xxs,
  },
  statusCompleted: {
    color: ds.colors.success,
  },
  statusCancelled: {
    color: ds.colors.danger,
  },
  statusPending: {
    color: ds.colors.warning,
  },
  viewAllButton: {
    padding: ds.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ds.colors.glassBorder,
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: ds.typography.tracking.ultraWide,
  },
});

export default OperationsDashboard;
