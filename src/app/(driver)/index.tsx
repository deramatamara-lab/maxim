/**
 * Driver Home Screen - Professional Driver Interface
 * Real-time ride requests and earnings dashboard
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ds } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { CustomIcon } from '../../components/ui/CustomIcon';
import { useSound } from '../../hooks/useSound';
import { useHaptics } from '../../hooks/useHaptics';
import { useEnhancedAppStore } from '@/store/useEnhancedAppStore';

const DRIVER_STATS = {
  todayEarnings: '$245.50',
  todayRides: 12,
  onlineHours: '6h 45m',
  rating: '4.9',
};

const RECENT_RIDES = [
  { id: '1', from: 'Downtown', to: 'Airport', price: '$45.00', time: '25 min', status: 'completed' },
  { id: '2', from: 'Train Station', to: 'Hotel District', price: '$28.50', time: '15 min', status: 'completed' },
  { id: '3', from: 'Shopping Mall', to: 'University', price: '$22.00', time: '18 min', status: 'completed' },
];

export default function DriverHomeScreen() {
  const { play } = useSound();
  const { trigger } = useHaptics();
  const { user } = useEnhancedAppStore();
  const [isOnline, setIsOnline] = useState(true);
  
  const fadeAnim = useSharedValue(0);
  
  useEffect(() => {
    fadeAnim.value = withTiming(1, {
      duration: 1000,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [fadeAnim]);

  const handleToggleOnline = () => {
    trigger('tap');
    play('tapSoft');
    setIsOnline(!isOnline);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ds.colors.backgroundDeep, ds.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[animatedStyle, styles.content]}>
          
          {/* Header with Online Status */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Good evening,</Text>
                <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
              </View>
              <Pressable
                style={[styles.onlineToggle, isOnline && styles.onlineToggleActive]}
                onPress={handleToggleOnline}
              >
                <View style={[styles.statusDot, isOnline && styles.statusDotActive]} />
                <Text style={[styles.statusText, isOnline && styles.statusTextActive]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Today&apos;s Stats */}
          <GlassCard style={styles.statsCard}>
            <Text style={styles.statsTitle}>Today&apos;s Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{DRIVER_STATS.todayEarnings}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{DRIVER_STATS.todayRides}</Text>
                <Text style={styles.statLabel}>Rides</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{DRIVER_STATS.onlineHours}</Text>
                <Text style={styles.statLabel}>Online</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{DRIVER_STATS.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </GlassCard>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <PremiumButton
                variant="secondary"
                size="md"
                onPress={() => {}}
                style={styles.actionButton}
              >
                <CustomIcon name="search" size={20} color={ds.colors.primary} />
                <Text style={styles.actionText}>Find Rides</Text>
              </PremiumButton>
              <PremiumButton
                variant="secondary"
                size="md"
                onPress={() => {}}
                style={styles.actionButton}
              >
                <CustomIcon name="activity" size={20} color={ds.colors.primary} />
                <Text style={styles.actionText}>Earnings</Text>
              </PremiumButton>
            </View>
          </View>

          {/* Recent Rides */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Rides</Text>
            <View style={styles.ridesList}>
              {RECENT_RIDES.map((ride) => (
                <GlassCard key={ride.id} style={styles.rideCard}>
                  <View style={styles.rideHeader}>
                    <View style={styles.rideRoute}>
                      <Text style={styles.rideFrom}>{ride.from}</Text>
                      <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
                      <Text style={styles.rideTo}>{ride.to}</Text>
                    </View>
                    <Text style={styles.ridePrice}>{ride.price}</Text>
                  </View>
                  <View style={styles.rideMeta}>
                    <Text style={styles.rideTime}>{ride.time}</Text>
                    <View style={[styles.statusBadge, styles.statusCompleted]}>
                      <Text style={styles.statusText}>Completed</Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ds.spacing.xl,
    paddingBottom: ds.spacing.xxxl,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: ds.spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: ds.typography.size.bodyLg,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  driverName: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  onlineToggleActive: {
    borderColor: ds.colors.secondary,
    backgroundColor: 'rgba(0, 255, 163, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.textSecondary,
    marginRight: ds.spacing.sm,
  },
  statusDotActive: {
    backgroundColor: ds.colors.secondary,
  },
  statusText: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  statusTextActive: {
    color: ds.colors.secondary,
  },
  statsCard: {
    marginBottom: ds.spacing.xl,
    padding: ds.spacing.lg,
  },
  statsTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  statLabel: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  section: {
    marginBottom: ds.spacing.xl,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.lg,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.sm,
  },
  actionText: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
  },
  ridesList: {
    gap: ds.spacing.md,
  },
  rideCard: {
    padding: ds.spacing.md,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing.sm,
  },
  rideRoute: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  rideFrom: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
  },
  rideTo: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
  },
  ridePrice: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  rideMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideTime: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  statusBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.sm,
  },
  statusCompleted: {
    backgroundColor: 'rgba(0, 255, 163, 0.2)',
  },
});