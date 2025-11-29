/**
 * Cancellation Dialog Component
 * Shows countdown timer before allowing ride cancellation
 * Displays cancellation consequences (fees, etc.)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Icon } from '@/components/ui/Icon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { useCancellationLogic, CancellableRideStatus } from '@/hooks/useCancellationLogic';

interface CancellationDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  rideStatus?: CancellableRideStatus;
  cancellationFee?: number;
  ridePrice?: number; // Total ride price for fee calculation
  driverEnRouteTime?: number; // How long driver has been en route (seconds)
}

const COUNTDOWN_DURATION = 5; // seconds

export const CancellationDialog: React.FC<CancellationDialogProps> = ({
  visible,
  onDismiss,
  onConfirm,
  rideStatus = 'searching',
  cancellationFee = 0,
  ridePrice = 0,
  driverEnRouteTime = 0,
}) => {
  const haptics = useHaptics();
  const sound = useSound();

  // Use cancellation logic hook
  const cancellationLogic = useCancellationLogic({
    rideStatus,
    ridePrice,
    driverEnRouteTime,
    customFee: cancellationFee,
  });

  const progress = useSharedValue(visible ? 0 : 1);
  const scale = useSharedValue(visible ? 1 : 0.9);

  // Derive countdown and canCancel from a single timer state
  const [timeRemaining, setTimeRemaining] = useState(visible ? COUNTDOWN_DURATION : 0);
  const canCancel = timeRemaining === 0 && visible;
  const countdown = timeRemaining;

  // Animation effect
  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15 });
      progress.value = withTiming(1, { duration: COUNTDOWN_DURATION * 1000 });
    } else {
      scale.value = 0.9;
      progress.value = 0;
    }
  }, [visible, progress, scale]);

  // Countdown timer - runs when visible becomes true
  useEffect(() => {
    if (!visible) {
      setTimeRemaining(COUNTDOWN_DURATION);
      return;
    }

    // Reset timer when becoming visible
    setTimeRemaining(COUNTDOWN_DURATION);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          haptics.trigger('confirm');
          return 0;
        }
        haptics.trigger('tap');
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // Intentionally only depend on visible to restart timer on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleConfirm = useCallback(() => {
    if (!canCancel) return;
    haptics.trigger('heavy');
    sound.play('warning');
    onConfirm();
  }, [canCancel, haptics, sound, onConfirm]);

  const handleDismiss = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onDismiss();
  }, [haptics, sound, onDismiss]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Use hook results instead of manual calculations
  const calculatedFee = cancellationLogic.fee;

  // Use hook results for consequences
  const consequenceItems = cancellationLogic.consequences;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Animated.View 
          style={[styles.dialogContainer, containerStyle]}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassCard elevated style={styles.dialog}>
              {/* Warning Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.warningIcon}>
                  <Icon name="activity" size={32} color={ds.colors.warning} />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>Cancel Ride?</Text>

              {/* Countdown Timer */}
              <View style={styles.countdownContainer}>
                <View style={styles.countdownRing}>
                  <Text style={styles.countdownText}>
                    {canCancel ? '✓' : countdown}
                  </Text>
                </View>
                <Text style={styles.countdownLabel}>
                  {canCancel ? 'You can now cancel' : 'Please wait...'}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
              </View>

              {/* Consequences */}
              <View style={styles.consequencesContainer}>
                <Text style={styles.consequencesTitle}>Please note:</Text>
                {consequenceItems.map((item, index) => (
                  <View key={index} style={styles.consequenceItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.consequenceText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Cancellation Fee Display */}
              {calculatedFee > 0 && rideStatus !== 'searching' && (
                <View style={styles.feeContainer}>
                  <Text style={styles.feeLabel}>Cancellation Fee</Text>
                  <Text style={styles.feeAmount}>${calculatedFee.toFixed(2)}</Text>
                  {rideStatus === 'in_progress' && (
                    <Text style={styles.feeNote}>Full ride price</Text>
                  )}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <PremiumButton
                  onPress={handleDismiss}
                  variant="ghost"
                  size="md"
                  style={styles.keepButton}
                >
                  Keep Ride
                </PremiumButton>

                <PremiumButton
                  onPress={handleConfirm}
                  variant="primary"
                  size="md"
                  disabled={!canCancel}
                  style={[
                    styles.cancelButton,
                    !canCancel && styles.cancelButtonDisabled,
                  ]}
                >
                  {canCancel ? 'Cancel Ride' : `Wait ${countdown}s`}
                </PremiumButton>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing.lg,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 380,
  },
  dialog: {
    padding: ds.spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing.lg,
  },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${ds.colors.warning}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    textAlign: 'center',
    marginBottom: ds.spacing.lg,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing.lg,
  },
  countdownRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.sm,
  },
  countdownText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
  },
  countdownLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: `${ds.colors.primary}30`,
    borderRadius: 2,
    marginBottom: ds.spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ds.colors.primary,
    borderRadius: 2,
  },
  consequencesContainer: {
    backgroundColor: `${ds.colors.warning}10`,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
  },
  consequencesTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.warning,
    marginBottom: ds.spacing.sm,
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ds.spacing.xs,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ds.colors.warning,
    marginTop: 6,
    marginRight: ds.spacing.sm,
  },
  consequenceText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${ds.colors.danger}15`,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
  },
  feeLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.danger,
  },
  feeAmount: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.danger,
  },
  feeNote: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  keepButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: ds.colors.danger,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
});

export default CancellationDialog;
