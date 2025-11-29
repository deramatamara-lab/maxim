/**
 * Profile Screen Component
 * User profile with stats, saved places, preferences, and role switching
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

type UserRole = 'rider' | 'driver' | 'admin';

interface ProfileScreenProps {
  onSwitchRole?: (role: UserRole) => void;
  onLogout?: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToLocations?: () => void;
}

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  icon: string;
}

// Mock data
const MOCK_SAVED_PLACES: SavedPlace[] = [
  { id: '1', name: 'Home', address: '123 Wilshire Blvd', icon: '🏠' },
  { id: '2', name: 'Work', address: '456 Sunset Blvd', icon: '💼' },
];

// Skeleton Component
const Skeleton: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}> = ({ width = '100%', height = 20, borderRadius = ds.radius.sm, style }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withSpring(opacity.value === 0.3 ? 0.6 : 0.3, {
        damping: 15,
        stiffness: 100,
      });
    }, 800);
    return () => clearInterval(interval);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: ds.colors.surface,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

// Stat Card Component
const StatCard: React.FC<{
  value: string;
  label: string;
  index: number;
  isLoading: boolean;
}> = ({ value, label, index, isLoading }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(1.05, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isLoading) {
    return (
      <GlassCard style={styles.statCard}>
        <View style={styles.statCardContent}>
          <Skeleton width={40} height={32} />
          <Skeleton width={60} height={12} style={{ marginTop: ds.spacing.sm }} />
        </View>
      </GlassCard>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).duration(300)}
      style={animatedStyle}
    >
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <GlassCard style={styles.statCard}>
          <View style={styles.statCardContent}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

// Saved Place Item Component
const SavedPlaceItem: React.FC<{
  place: SavedPlace;
  onPress: () => void;
}> = ({ place, onPress }) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handlePress = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onPress();
  }, [haptics, sound, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <GlassCard style={styles.placeCard}>
        <View style={styles.placeContent}>
          <View style={styles.placeIcon}>
            <Text style={styles.placeEmoji}>{place.icon}</Text>
          </View>
          <View style={styles.placeDetails}>
            <Text style={styles.placeName}>{place.name}</Text>
            <Text style={styles.placeAddress}>{place.address}</Text>
          </View>
          <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
        </View>
      </GlassCard>
    </Pressable>
  );
};

// Role Switcher Card Component
const RoleSwitcherCard: React.FC<{
  role: UserRole;
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}> = ({ emoji, title, subtitle, onPress }) => {
  const haptics = useHaptics();
  const sound = useSound();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onPress();
  }, [haptics, sound, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.roleSwitcherCard, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.roleSwitcherPressable}
      >
        <Text style={styles.roleSwitcherEmoji}>{emoji}</Text>
        <Text style={styles.roleSwitcherTitle}>{title}</Text>
        <Text style={styles.roleSwitcherSubtitle}>{subtitle}</Text>
      </Pressable>
    </Animated.View>
  );
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onSwitchRole,
  onLogout,
  onNavigateToPayment,
  onNavigateToLocations,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [quietMode, setQuietMode] = useState(false);
  const haptics = useHaptics();
  const sound = useSound();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleQuietMode = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    setQuietMode(prev => !prev);
    
    log.info('Quiet mode toggled', {
      event: 'quiet_mode_toggle',
      component: 'ProfileScreen',
      enabled: !quietMode,
    });
  }, [haptics, sound, quietMode]);

  const handleLogout = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            log.info('User logout', { event: 'user_logout', component: 'ProfileScreen' });
            onLogout?.();
          },
        },
      ]
    );
  }, [haptics, sound, onLogout]);

  const handleSwitchRole = useCallback((role: UserRole) => {
    log.info('Role switch', {
      event: 'role_switch',
      component: 'ProfileScreen',
      newRole: role,
    });
    onSwitchRole?.(role);
  }, [onSwitchRole]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
      <Animated.View entering={FadeIn.duration(300)}>
        <GlassCard elevated style={styles.headerCard}>
          {/* Background Decoration */}
          <View style={styles.headerDecoration} />

          <View style={styles.headerContent}>
            {/* Avatar */}
            {isLoading ? (
              <Skeleton width={80} height={80} borderRadius={40} />
            ) : (
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#374151', '#111827']}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarEmoji}>👨‍💻</Text>
                  <View style={styles.avatarShine} />
                </LinearGradient>
              </View>
            )}

            {/* User Info */}
            <View style={styles.userInfo}>
              {isLoading ? (
                <>
                  <Skeleton width={120} height={24} />
                  <Skeleton width={100} height={20} style={{ marginTop: ds.spacing.sm }} />
                </>
              ) : (
                <>
                  <Text style={styles.userName}>Alex V.</Text>
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>AURA BLACK MEMBER</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard value="4.95" label="RATING" index={0} isLoading={isLoading} />
        <StatCard value="142" label="RIDES" index={1} isLoading={isLoading} />
      </View>

      {/* Role Switcher (Dev Mode) */}
      {onSwitchRole && !isLoading && (
        <Animated.View
          entering={FadeInDown.delay(400).duration(300)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitlePrimary}>PROTOTYPE CONTROLS</Text>
          </View>
          <View style={styles.roleSwitcherGrid}>
            <RoleSwitcherCard
              role="driver"
              emoji="🚖"
              title="Driver App"
              subtitle="Simulate trip"
              onPress={() => handleSwitchRole('driver')}
            />
            <RoleSwitcherCard
              role="admin"
              emoji="📊"
              title="Admin"
              subtitle="Analytics"
              onPress={() => handleSwitchRole('admin')}
            />
          </View>
        </Animated.View>
      )}

      {/* Saved Places */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(300)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>SAVED PLACES</Text>
        {isLoading ? (
          <>
            <Skeleton height={64} borderRadius={ds.radius.md} style={{ marginBottom: ds.spacing.sm }} />
            <Skeleton height={64} borderRadius={ds.radius.md} />
          </>
        ) : (
          MOCK_SAVED_PLACES.map(place => (
            <SavedPlaceItem
              key={place.id}
              place={place}
              onPress={() => onNavigateToLocations?.()}
            />
          ))
        )}
      </Animated.View>

      {/* Payment History Section */}
      <Animated.View
        entering={FadeInDown.delay(550).duration(300)}
        style={styles.section}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PAYMENT HISTORY</Text>
          <Pressable
            onPress={() => {
              haptics.trigger('tap');
              sound.play('tapSoft');
              log.info('View all payments', { event: 'view_all_payments', component: 'ProfileScreen' });
            }}
          >
            <Text style={styles.sectionLink}>View All</Text>
          </Pressable>
        </View>
        <GlassCard style={styles.paymentHistoryCard}>
          {/* Recent Transaction 1 */}
          <View style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={[styles.transactionIcon, { backgroundColor: ds.colors.success + '20' }]}>
                <CustomIcon name="check" size={16} color={ds.colors.success} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>Ride to LAX Airport</Text>
                <Text style={styles.transactionDate}>Nov 24, 2:30 PM</Text>
              </View>
            </View>
            <Text style={styles.transactionAmount}>-$45.50</Text>
          </View>

          <View style={styles.transactionDivider} />

          {/* Recent Transaction 2 */}
          <View style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={[styles.transactionIcon, { backgroundColor: ds.colors.success + '20' }]}>
                <CustomIcon name="check" size={16} color={ds.colors.success} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>Ride to Santa Monica</Text>
                <Text style={styles.transactionDate}>Nov 23, 7:15 PM</Text>
              </View>
            </View>
            <Text style={styles.transactionAmount}>-$28.00</Text>
          </View>

          <View style={styles.transactionDivider} />

          {/* Recent Transaction 3 - Refund */}
          <View style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={[styles.transactionIcon, { backgroundColor: ds.colors.primary + '20' }]}>
                <CustomIcon name="activity" size={16} color={ds.colors.primary} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>Refund - Cancelled Ride</Text>
                <Text style={styles.transactionDate}>Nov 22, 12:00 PM</Text>
              </View>
            </View>
            <Text style={[styles.transactionAmount, styles.transactionRefund]}>+$18.50</Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Support Tickets Section */}
      <Animated.View
        entering={FadeInDown.delay(580).duration(300)}
        style={styles.section}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
        </View>
        <GlassCard style={styles.supportCard}>
          <Pressable
            style={styles.supportItem}
            onPress={() => {
              haptics.trigger('tap');
              sound.play('tapSoft');
              log.info('Open support tickets', { event: 'open_support', component: 'ProfileScreen' });
            }}
          >
            <View style={styles.supportLeft}>
              <View style={styles.supportIcon}>
                <Text style={styles.supportEmoji}>🎫</Text>
              </View>
              <View style={styles.supportInfo}>
                <Text style={styles.supportTitle}>My Tickets</Text>
                <Text style={styles.supportSubtitle}>View open and resolved tickets</Text>
              </View>
            </View>
            <View style={styles.supportBadge}>
              <Text style={styles.supportBadgeText}>2</Text>
            </View>
          </Pressable>

          <View style={styles.supportDivider} />

          <Pressable
            style={styles.supportItem}
            onPress={() => {
              haptics.trigger('tap');
              sound.play('tapSoft');
              log.info('Open help center', { event: 'open_help', component: 'ProfileScreen' });
            }}
          >
            <View style={styles.supportLeft}>
              <View style={styles.supportIcon}>
                <Text style={styles.supportEmoji}>❓</Text>
              </View>
              <View style={styles.supportInfo}>
                <Text style={styles.supportTitle}>Help Center</Text>
                <Text style={styles.supportSubtitle}>FAQs and contact support</Text>
              </View>
            </View>
            <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
          </Pressable>
        </GlassCard>
      </Animated.View>

      {/* Preferences */}
      <Animated.View
        entering={FadeInDown.delay(600).duration(300)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <GlassCard style={styles.preferencesCard}>
          {/* Quiet Mode */}
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <View style={styles.preferenceIcon}>
                <Text style={styles.preferenceEmoji}>🔇</Text>
              </View>
              <Text style={styles.preferenceLabel}>Quiet Mode</Text>
            </View>
            <Switch
              value={quietMode}
              onValueChange={handleToggleQuietMode}
              trackColor={{ false: ds.colors.surface, true: ds.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.preferenceDivider} />

          {/* Payment Methods */}
          <Pressable
            style={styles.preferenceItem}
            onPress={() => {
              haptics.trigger('tap');
              sound.play('tapSoft');
              onNavigateToPayment?.();
            }}
          >
            <View style={styles.preferenceLeft}>
              <View style={styles.preferenceIcon}>
                <Text style={styles.preferenceEmoji}>💳</Text>
              </View>
              <Text style={styles.preferenceLabel}>Payment Methods</Text>
            </View>
            <Text style={styles.preferenceValue}>Visa •••• 4242</Text>
          </Pressable>
        </GlassCard>
      </Animated.View>

      {/* Logout Button */}
      <Animated.View
        entering={FadeInDown.delay(700).duration(300)}
        style={styles.logoutSection}
      >
        <PremiumButton
          variant="ghost"
          size="lg"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </PremiumButton>
      </Animated.View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  contentContainer: {
    padding: ds.spacing.lg,
  },
  headerCard: {
    padding: ds.spacing.lg,
    overflow: 'hidden',
    marginBottom: ds.spacing.lg,
  },
  headerDecoration: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: ds.colors.primary,
    opacity: 0.1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: ds.colors.primary + '50',
    padding: 4,
  },
  avatarGradient: {
    flex: 1,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ rotate: '45deg' }, { translateX: -50 }],
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    marginTop: ds.spacing.xs,
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.xl,
    backgroundColor: ds.colors.primary + '15',
    borderWidth: 1,
    borderColor: ds.colors.primary + '30',
  },
  memberBadgeText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: ds.typography.tracking.ultraWide,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: ds.spacing.md,
    marginBottom: ds.spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: ds.spacing.lg,
  },
  statCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  statLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.ultraWide,
    marginTop: ds.spacing.xs,
  },
  section: {
    marginBottom: ds.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ds.colors.primary,
  },
  sectionTitlePrimary: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: ds.typography.tracking.ultraWide,
  },
  sectionTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.ultraWide,
    marginBottom: ds.spacing.md,
    paddingLeft: ds.spacing.xs,
  },
  roleSwitcherGrid: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  roleSwitcherCard: {
    flex: 1,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    overflow: 'hidden',
  },
  roleSwitcherPressable: {
    padding: ds.spacing.lg,
  },
  roleSwitcherEmoji: {
    fontSize: 24,
    marginBottom: ds.spacing.sm,
  },
  roleSwitcherTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  roleSwitcherSubtitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xxs,
  },
  placeCard: {
    marginBottom: ds.spacing.sm,
    padding: ds.spacing.md,
  },
  placeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  placeEmoji: {
    fontSize: 18,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  placeAddress: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xxs,
  },
  preferencesCard: {
    padding: 0,
    overflow: 'hidden',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ds.spacing.md,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  preferenceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceEmoji: {
    fontSize: 14,
  },
  preferenceLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  preferenceValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: ds.colors.borderSubtle,
  },
  logoutSection: {
    marginTop: ds.spacing.md,
  },
  logoutButton: {
    borderColor: ds.colors.danger + '50',
  },
  logoutText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.danger,
  },
  bottomSpacer: {
    height: ds.spacing.xxxl * 2,
  },
  // Section Link
  sectionLink: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.primary,
  },
  // Payment History Styles
  paymentHistoryCard: {
    padding: 0,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ds.spacing.md,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    flex: 1,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  transactionDate: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xxs,
  },
  transactionAmount: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  transactionRefund: {
    color: ds.colors.success,
  },
  transactionDivider: {
    height: 1,
    backgroundColor: ds.colors.borderSubtle,
    marginHorizontal: ds.spacing.md,
  },
  // Support Styles
  supportCard: {
    padding: 0,
    overflow: 'hidden',
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ds.spacing.md,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    flex: 1,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  supportEmoji: {
    fontSize: 18,
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  supportSubtitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xxs,
  },
  supportBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ds.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ds.spacing.sm,
  },
  supportBadgeText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: '#FFFFFF',
  },
  supportDivider: {
    height: 1,
    backgroundColor: ds.colors.borderSubtle,
    marginHorizontal: ds.spacing.md,
  },
});

export default ProfileScreen;
