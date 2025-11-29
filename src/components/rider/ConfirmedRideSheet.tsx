/**
 * ConfirmedRideSheet - Active ride tracking sheet
 * Matches reference prototype's confirmed ride UI with ETA, cancel, share, SOS
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Share } from 'react-native';
import { MotiView } from 'moti';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from 'react-i18next';

interface ConfirmedRideSheetProps {
  /** ETA in minutes */
  eta: number;
  /** Driver name */
  driverName?: string;
  /** Driver rating */
  driverRating?: number;
  /** Vehicle info */
  vehicleInfo?: string;
  /** License plate */
  licensePlate?: string;
  /** Cancel ride handler */
  onCancel: () => void;
  /** Share ride handler */
  onShare?: () => void;
  /** SOS/Emergency handler */
  onSos?: () => void;
  /** Contact driver handler */
  onContactDriver?: () => void;
}

export const ConfirmedRideSheet: React.FC<ConfirmedRideSheetProps> = ({
  eta,
  driverName = 'Driver',
  driverRating = 4.9,
  vehicleInfo = 'Tesla Model 3',
  licensePlate = 'ABC 123',
  onCancel,
  onShare,
  onSos,
  onContactDriver,
}) => {
  const { play } = useSound();
  const { trigger } = useHaptics();
  const { t } = useTranslation();

  const handleShare = async () => {
    trigger('tap');
    play('tapSoft');
    
    if (onShare) {
      onShare();
      return;
    }

    // Default share behavior
    try {
      await Share.share({
        title: t('ride.share_title', 'Track My Ride'),
        message: t('ride.share_message', 'Track my ride with Aura! ETA: {{eta}} minutes', { eta }),
        url: 'https://aura.app/track/123',
      });
    } catch {
      // Share cancelled or failed
    }
  };

  const handleSos = () => {
    trigger('error');
    play('warning');
    onSos?.();
  };

  const handleCancel = () => {
    trigger('tap');
    play('tapSoft');
    onCancel();
  };

  const handleContact = () => {
    trigger('tap');
    play('tapSoft');
    onContactDriver?.();
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 100 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: 100 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 200,
      }}
      style={styles.container}
    >
      <GlassCard style={styles.sheet} elevated>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* ETA Display */}
        <View style={styles.etaContainer}>
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <Text style={styles.etaNumber}>{eta}</Text>
          </MotiView>
          <Text style={styles.etaLabel}>
            {eta === 0 
              ? t('ride.driver_arrived', 'Driver Arrived!') 
              : t('ride.minutes_away', 'min away')
            }
          </Text>
          {eta > 0 && (
            <MotiView
              from={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 1000,
                loop: true,
                repeatReverse: true,
              }}
              style={styles.etaPulse}
            />
          )}
        </View>

        {/* Driver Info */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <CustomIcon name="profile" size={32} color={ds.colors.primary} />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driverName}</Text>
            <View style={styles.driverMeta}>
              <CustomIcon name="activity" size={12} color={ds.colors.warning} />
              <Text style={styles.driverRating}>{driverRating.toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>{vehicleInfo}</Text>
            <Text style={styles.licensePlate}>{licensePlate}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {/* Contact Driver */}
          <Pressable 
            style={styles.actionButton}
            onPress={handleContact}
          >
            <View style={styles.actionIcon}>
              <CustomIcon name="phone" size={20} color={ds.colors.textPrimary} />
            </View>
            <Text style={styles.actionLabel}>{t('ride.contact', 'Contact')}</Text>
          </Pressable>

          {/* Share Trip */}
          <Pressable 
            style={styles.actionButton}
            onPress={handleShare}
          >
            <View style={styles.actionIcon}>
              <CustomIcon name="activity" size={20} color={ds.colors.textPrimary} />
            </View>
            <Text style={styles.actionLabel}>{t('ride.share', 'Share')}</Text>
          </Pressable>

          {/* SOS */}
          <Pressable 
            style={[styles.actionButton, styles.sosButton]}
            onPress={handleSos}
          >
            <View style={[styles.actionIcon, styles.sosIcon]}>
              <CustomIcon name="alert" size={20} color={ds.colors.error} />
            </View>
            <Text style={[styles.actionLabel, styles.sosLabel]}>SOS</Text>
          </Pressable>
        </View>

        {/* Cancel Button */}
        <View style={styles.cancelContainer}>
          <PremiumButton
            variant="secondary"
            size="md"
            onPress={handleCancel}
          >
            {t('ride.cancel_ride', 'Cancel Ride')}
          </PremiumButton>
        </View>
      </GlassCard>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    // Bottom sheet positioning
  },
  sheet: {
    padding: 0,
    borderTopLeftRadius: ds.radius['2xl'],
    borderTopRightRadius: ds.radius['2xl'],
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: ds.spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ds.colors.glassBorder,
  },
  etaContainer: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xl,
    position: 'relative',
  },
  etaNumber: {
    fontSize: 72,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.primary,
    lineHeight: 80,
  },
  etaLabel: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xs,
  },
  etaPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: ds.colors.primary + '30',
    top: '50%',
    left: '50%',
    marginLeft: -60,
    marginTop: -40,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.xl,
    paddingVertical: ds.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ds.colors.glassBorder,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.glassBorder,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ds.colors.glass,
    borderWidth: 2,
    borderColor: ds.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
    marginLeft: ds.spacing.md,
  },
  driverName: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    marginTop: ds.spacing.xxs,
  },
  driverRating: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.warning,
    fontWeight: ds.typography.weight.medium as '500',
  },
  vehicleInfo: {
    alignItems: 'flex-end',
  },
  vehicleName: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium as '500',
    color: ds.colors.textPrimary,
  },
  licensePlate: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.primary,
    fontWeight: ds.typography.weight.bold as '700',
    marginTop: ds.spacing.xxs,
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: ds.spacing.xl,
    paddingHorizontal: ds.spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.glass,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
  },
  sosButton: {},
  sosIcon: {
    borderColor: ds.colors.error + '50',
    backgroundColor: ds.colors.error + '15',
  },
  sosLabel: {
    color: ds.colors.error,
    fontWeight: ds.typography.weight.bold as '700',
  },
  cancelContainer: {
    padding: ds.spacing.lg,
    paddingBottom: ds.spacing.xl,
  },
});

export default ConfirmedRideSheet;
