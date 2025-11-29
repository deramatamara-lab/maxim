/**
 * ActiveRideTracker Component
 * Real-time ride progress visualization with status tracking, driver info, and actions
 * Integrates with useActiveRideWebSocket for live updates
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { Svg, Path } from 'react-native-svg';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { Driver, PaymentMethod, Location } from '@/types';

// Ride status type aligned with existing types
export type RideStatus = 
  | 'pending'
  | 'accepted'
  | 'searching' 
  | 'confirmed' 
  | 'arriving'
  | 'arrived'
  | 'in_progress' 
  | 'completed'
  | 'cancelled';

export interface RideOption {
  id: string;
  name: string;
  price: string;
  eta: string;
}

interface ActiveRideTrackerProps {
  ride: RideOption;
  status: RideStatus;
  eta: number | null;
  driver: Driver | null;
  paymentMethod: PaymentMethod;
  onCancel: () => void;
  onChat: () => void;
  onComplete: () => void;
  onDriverLocationUpdate?: (location: Location) => void;
}

// Status configuration for theming
interface StatusConfig {
  text: string;
  color: string;
  glowColor: string;
}

const getStatusConfig = (status: RideStatus): StatusConfig => {
  switch (status) {
    case 'pending':
    case 'accepted':
    case 'searching':
      return {
        text: 'CONNECTING TO FLEET',
        color: ds.colors.primary,
        glowColor: ds.colors.glowCyan,
      };
    case 'confirmed':
      return {
        text: 'DRIVER CONFIRMED',
        color: ds.colors.success,
        glowColor: ds.colors.success + '40',
      };
    case 'arriving':
      return {
        text: 'DRIVER EN ROUTE',
        color: ds.colors.primary,
        glowColor: ds.colors.glowCyan,
      };
    case 'arrived':
      return {
        text: 'DRIVER ARRIVED',
        color: ds.colors.secondary,
        glowColor: ds.colors.secondary + '40',
      };
    case 'in_progress':
      return {
        text: 'EN ROUTE TO DESTINATION',
        color: ds.colors.secondary,
        glowColor: ds.colors.secondary + '40',
      };
    case 'completed':
      return {
        text: 'ARRIVED',
        color: ds.colors.success,
        glowColor: ds.colors.success + '40',
      };
    case 'cancelled':
      return {
        text: 'CANCELLED',
        color: ds.colors.danger,
        glowColor: ds.colors.danger + '40',
      };
    default:
      return {
        text: 'ACTIVE',
        color: ds.colors.textPrimary,
        glowColor: ds.colors.textPrimary + '40',
      };
  }
};

// Progress calculation based on status
const getProgressFromStatus = (status: RideStatus): number => {
  switch (status) {
    case 'pending': return 2;
    case 'accepted': return 4;
    case 'searching': return 5;
    case 'confirmed': return 8;
    case 'arriving': return 12;
    case 'arrived': return 14;
    case 'in_progress': return 16;
    case 'completed': return 20;
    case 'cancelled': return 0;
    default: return 0;
  }
};

// Helper to check if status shows pulsing animation
const isSearchingStatus = (status: RideStatus): boolean => {
  return status === 'pending' || status === 'accepted';
};

// Helper to check if cancel is allowed
const isCancellable = (status: RideStatus): boolean => {
  return status === 'pending' || status === 'accepted' || 
         status === 'confirmed' || status === 'arrived';
};

// Helper to check if chat is available
const canChatWithDriver = (status: RideStatus): boolean => {
  return status === 'confirmed' || status === 'arrived' || status === 'in_progress';
};

const PROGRESS_SEGMENTS = 20;

// Animated Progress Bar Component
const ProgressBar: React.FC<{ 
  progress: number; 
  statusColor: string;
  glowColor: string;
}> = ({ progress, statusColor, glowColor }) => {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => {
        const isActive = i < progress;
        return (
          <View
            key={i}
            style={[
              styles.progressSegment,
              {
                backgroundColor: isActive ? statusColor : ds.colors.outlineSubtle,
                opacity: isActive ? 1 : 0.3,
                shadowColor: isActive ? glowColor : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isActive ? 0.7 : 0,
                shadowRadius: isActive ? 4 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Pulse Animation for Searching State
const SearchingPulse: React.FC = () => {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.2);

  useEffect(() => {
    scale1.value = withRepeat(
      withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity1.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    // Delayed second pulse
    const timeout = setTimeout(() => {
      scale2.value = withRepeat(
        withTiming(1.3, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      opacity2.value = withRepeat(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    }, 500);

    return () => clearTimeout(timeout);
  }, [scale1, scale2, opacity1, opacity2]);

  const pulseStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const pulseStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseRing, pulseStyle1]} />
      <Animated.View style={[styles.pulseRingInner, pulseStyle2]} />
    </View>
  );
};

// Driver Avatar Component
const DriverAvatar: React.FC<{ driver: Driver }> = ({ driver }) => {
  return (
    <View style={styles.avatarContainer}>
      <View style={styles.avatar}>
        <CustomIcon name="profile" size={28} color={ds.colors.textSecondary} />
      </View>
      <View style={styles.ratingBadge}>
        <Text style={styles.ratingIcon}>★</Text>
        <Text style={styles.ratingText}>{driver.rating.toFixed(2)}</Text>
      </View>
    </View>
  );
};

// Chat Icon SVG
const ChatIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Cancel Icon SVG
const CancelIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      stroke={color}
      strokeWidth={2}
    />
    <Path
      d="M15 9l-6 6M9 9l6 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const ActiveRideTracker: React.FC<ActiveRideTrackerProps> = ({
  ride,
  status,
  eta,
  driver,
  paymentMethod,
  onCancel,
  onChat,
  onComplete,
}) => {
  const haptics = useHaptics();
  const statusConfig = useMemo(() => getStatusConfig(status), [status]);
  const progress = useMemo(() => getProgressFromStatus(status), [status]);

  // Animated values for status indicator
  const indicatorOpacity = useSharedValue(1);

  useEffect(() => {
    // Pulse animation for status indicator
    indicatorOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, [indicatorOpacity]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  // Haptic feedback on status change
  useEffect(() => {
    if (status === 'confirmed') {
      haptics.trigger('confirm');
    } else if (status === 'completed') {
      haptics.trigger('confirm');
    }
  }, [status, haptics]);

  const handleChat = useCallback(() => {
    haptics.trigger('tap');
    onChat();
  }, [haptics, onChat]);

  const handleCancel = useCallback(() => {
    haptics.trigger('tap');
    onCancel();
  }, [haptics, onCancel]);

  const canCancel = isCancellable(status);
  const canChat = canChatWithDriver(status);
  const showPulsingCircles = isSearchingStatus(status);

  // Show completion screen
  if (status === 'completed') {
    return (
      <Animated.View 
        entering={FadeIn.duration(ds.motion.duration.entrance)}
        style={styles.container}
      >
        <GlassCard elevated style={styles.card}>
          <View style={styles.completedContent}>
            <View style={styles.completedIcon}>
              <CustomIcon name="check" size={32} color={ds.colors.success} active />
            </View>
            <Text style={styles.completedTitle}>Ride Complete</Text>
            <Text style={styles.completedSubtitle}>{ride.name}</Text>
            <Text style={styles.completedPrice}>{ride.price}</Text>
            
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Paid with</Text>
              <Text style={styles.paymentValue}>
                {paymentMethod.brand} •••• {paymentMethod.last4}
              </Text>
            </View>

            <PremiumButton
              variant="primary"
              size="lg"
              onPress={onComplete}
              style={styles.completeButton}
            >
              Done
            </PremiumButton>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      entering={SlideInUp.duration(ds.motion.duration.entrance)}
      style={styles.container}
    >
      {/* Searching/Connecting Pulse Overlay */}
      {showPulsingCircles && <SearchingPulse />}

      <GlassCard elevated style={styles.card}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Status Pill */}
            <View style={[styles.statusPill, { borderColor: statusConfig.color + '50' }]}>
              <Animated.View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: statusConfig.color },
                  indicatorStyle
                ]} 
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>

            {/* Ride Name */}
            <Text style={styles.rideName}>
              {showPulsingCircles ? 'Finding Ride...' : ride.name}
            </Text>

            {/* Driver Info - shown when not searching */}
            {driver && !showPulsingCircles && (
              <View style={styles.driverInfo}>
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>
                    {driver.vehicle?.licensePlate || 'N/A'}
                  </Text>
                </View>
                <Text style={styles.carModel}>
                  {driver.vehicle ? `${driver.vehicle.make} ${driver.vehicle.model}` : driver.name}
                </Text>
              </View>
            )}
          </View>

          {/* Driver Avatar / ETA */}
          <View style={styles.headerRight}>
            {eta !== null && (
              <View style={styles.etaContainer}>
                <Text style={styles.etaValue}>{eta}</Text>
                <Text style={styles.etaUnit}>min</Text>
              </View>
            )}
            {driver && !showPulsingCircles && (
              <DriverAvatar driver={driver} />
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <ProgressBar 
          progress={progress} 
          statusColor={statusConfig.color}
          glowColor={statusConfig.glowColor}
        />

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleChat}
            disabled={!canChat}
            style={({ pressed }) => [
              styles.actionButton,
              !canChat && styles.actionButtonDisabled,
              pressed && canChat && styles.actionButtonPressed,
            ]}
          >
            <ChatIcon color={canChat ? ds.colors.textPrimary : ds.colors.textSecondary} />
            <Text style={[
              styles.actionText,
              !canChat && styles.actionTextDisabled,
            ]}>
              Message
            </Text>
          </Pressable>

          <View style={styles.actionDivider} />

          <Pressable
            onPress={handleCancel}
            disabled={!canCancel}
            style={({ pressed }) => [
              styles.actionButton,
              !canCancel && styles.actionButtonDisabled,
              pressed && canCancel && styles.actionButtonPressed,
            ]}
          >
            <CancelIcon color={canCancel ? ds.colors.danger : ds.colors.textSecondary} />
            <Text style={[
              styles.actionText,
              canCancel && styles.cancelText,
              !canCancel && styles.actionTextDisabled,
            ]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: ds.spacing.lg,
    width: '100%',
    maxWidth: ds.layout.maxContentWidth,
    alignSelf: 'center',
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: ds.spacing.lg,
    paddingBottom: ds.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.xl,
    borderWidth: 1,
    backgroundColor: ds.colors.surface,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    letterSpacing: ds.typography.tracking.ultraWide,
  },
  rideName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.tight,
    marginBottom: ds.spacing.sm,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    marginTop: ds.spacing.sm,
  },
  plateBadge: {
    backgroundColor: ds.colors.surface,
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.xs,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  plateText: {
    fontFamily: 'monospace',
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  carModel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  etaContainer: {
    alignItems: 'flex-end',
    marginBottom: ds.spacing.sm,
  },
  etaValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.hero,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.tight,
  },
  etaUnit: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -ds.spacing.sm,
    right: -ds.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.backgroundDeep,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    borderRadius: ds.radius.xs,
    paddingHorizontal: ds.spacing.xs,
    paddingVertical: ds.spacing.xxs,
    gap: 2,
  },
  ratingIcon: {
    fontSize: ds.typography.size.micro,
    color: ds.colors.primary,
  },
  ratingText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: ds.spacing.xxs,
    paddingHorizontal: ds.spacing.lg,
    paddingBottom: ds.spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: ds.radius.xs,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
    backgroundColor: ds.colors.surface,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing.lg,
    gap: ds.spacing.sm,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonPressed: {
    backgroundColor: ds.colors.outlineSubtle,
  },
  actionDivider: {
    width: 1,
    backgroundColor: ds.colors.borderSubtle,
  },
  actionText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  actionTextDisabled: {
    color: ds.colors.textSecondary,
  },
  cancelText: {
    color: ds.colors.danger,
  },
  pulseContainer: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -128,
    zIndex: -1,
  },
  pulseRing: {
    width: 256,
    height: 256,
    borderRadius: 128,
    borderWidth: 1,
    borderColor: ds.colors.primary,
  },
  pulseRingInner: {
    position: 'absolute',
    top: 32,
    left: 32,
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 1,
    borderColor: ds.colors.primary,
  },
  completedContent: {
    padding: ds.spacing.xl,
    alignItems: 'center',
  },
  completedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ds.colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.lg,
  },
  completedTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  completedSubtitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.sm,
  },
  completedPrice: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    marginBottom: ds.spacing.lg,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.xl,
  },
  paymentLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  paymentValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  completeButton: {
    width: '100%',
  },
});

export default ActiveRideTracker;
