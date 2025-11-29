/**
 * Price Confirmation Component
 * Displays ride pricing details with surge information and fare breakdown
 * Positioned between ride option selection and payment selection in rider journey
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { ds } from '@/constants/theme';
import { GlassCard } from './GlassCard';
import { PremiumButton } from './PremiumButton';
import { Icon } from './Icon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { type RiderJourneyError } from '@/types/riderJourney';

export interface PriceConfirmationProps {
  // Pricing Data
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  surgeMultiplier: number;
  totalPrice: number;
  currency: string;
  
  // Ride Details
  rideOptionName: string;
  estimatedDuration: string;
  estimatedDistance: string;
  
  // Actions
  onConfirm: () => void;
  onCancel: () => void;
  onBack?: () => void;
  
  // State
  isLoading?: boolean;
  error?: RiderJourneyError | null;
  
  // Surge Info
  surgeInfo?: {
    isActive: boolean;
    reason: string;
    estimatedWaitTime: string;
  };
}

export const PriceConfirmation: React.FC<PriceConfirmationProps> = ({
  basePrice,
  distancePrice,
  timePrice,
  surgeMultiplier,
  totalPrice,
  currency,
  rideOptionName,
  estimatedDuration,
  estimatedDistance,
  onConfirm,
  onCancel,
  onBack,
  isLoading = false,
  error = null,
  surgeInfo,
}) => {
  const { trigger: haptics } = useHaptics();
  const { play } = useSound();
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ds.motion.duration.entrance,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleConfirm = () => {
    haptics('confirm');
    play('success');
    onConfirm();
  };

  const handleCancel = () => {
    haptics('tap');
    play('tapSoft');
    onCancel();
  };

  const handleBack = () => {
    haptics('tap');
    play('tapSoft');
    onBack?.();
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  const getSurgeColor = () => {
    if (surgeMultiplier <= 1.2) return ds.colors.secondary;
    if (surgeMultiplier <= 1.5) return ds.colors.warning;
    return ds.colors.error;
  };

  const getSurgeMessage = () => {
    if (!surgeInfo?.isActive) return 'Normal pricing';
    if (surgeMultiplier <= 1.2) return 'Light demand';
    if (surgeMultiplier <= 1.5) return 'High demand';
    return 'Very high demand';
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <GlassCard elevated interactive style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="chevronRight" size={20} color={ds.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Confirm Price</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Ride Option Summary */}
        <View style={styles.rideSummary}>
          <Text style={styles.rideOptionName}>{rideOptionName}</Text>
          <View style={styles.rideDetails}>
            <View style={styles.detailRow}>
              <Icon name="search" size={16} color={ds.colors.textSecondary} />
              <Text style={styles.detailText}>{estimatedDuration}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="location" size={16} color={ds.colors.textSecondary} />
              <Text style={styles.detailText}>{estimatedDistance}</Text>
            </View>
          </View>
        </View>

        {/* Surge Information */}
        <View style={[styles.surgeSection, { borderColor: getSurgeColor() }]}>
          <View style={[styles.surgeHeader, { borderColor: getSurgeColor() }]}>
            <Icon name="star" size={18} color={getSurgeColor()} />
            <Text style={[styles.surgeTitle, { color: getSurgeColor() }]}>
              {getSurgeMessage()}
            </Text>
            <Text style={[styles.surgeMultiplier, { color: getSurgeColor() }]}>
              {surgeMultiplier > 1 ? `${surgeMultiplier}x` : '1.0x'}
            </Text>
          </View>
          {surgeInfo?.isActive && (
            <Text style={styles.surgeReason}>{surgeInfo.reason}</Text>
          )}
          {surgeInfo?.estimatedWaitTime && (
            <Text style={styles.surgeWaitTime}>
              Wait time: {surgeInfo.estimatedWaitTime}
            </Text>
          )}
        </View>

        {/* Fare Breakdown */}
        <View style={styles.fareBreakdown}>
          <Text style={styles.breakdownTitle}>Fare Breakdown</Text>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base fare</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(basePrice)}</Text>
          </View>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Distance ({estimatedDistance})</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(distancePrice)}</Text>
          </View>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Time ({estimatedDuration})</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(timePrice)}</Text>
          </View>
          
          {surgeMultiplier > 1 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: getSurgeColor() }]}>
                Surge pricing
              </Text>
              <Text style={[styles.breakdownValue, { color: getSurgeColor() }]}>
                +{formatCurrency((basePrice + distancePrice + timePrice) * (surgeMultiplier - 1))}
              </Text>
            </View>
          )}
          
          <View style={[styles.totalRow, { borderTopColor: ds.colors.glassBorder }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorSection}>
            <View style={styles.errorContent}>
              <Icon name="settings" size={20} color={ds.colors.error} />
              <Text style={styles.errorMessage}>{error.userMessage}</Text>
            </View>
            {error.retryable && (
              <PremiumButton
                variant="secondary"
                size="sm"
                onPress={error.retryAction || (() => {})}
                loading={isLoading}
              >
                Retry
              </PremiumButton>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PremiumButton
            variant="secondary"
            size="lg"
            onPress={handleCancel}
            disabled={isLoading}
            style={styles.cancelButton}
          >
            Cancel
          </PremiumButton>
          
          <PremiumButton
            variant="primary"
            size="lg"
            onPress={handleConfirm}
            loading={isLoading}
            disabled={!!error}
            style={styles.confirmButton}
          >
            Confirm {formatCurrency(totalPrice)}
          </PremiumButton>
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: ds.spacing.lg,
  },
  card: {
    maxWidth: 400,
    alignSelf: 'center',
    padding: ds.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ds.spacing.lg,
  },
  backButton: {
    padding: ds.spacing.xs,
    borderRadius: ds.radius.sm,
    backgroundColor: ds.colors.surfaceElevated,
    transform: [{ rotate: '180deg' }],
  },
  title: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  rideSummary: {
    backgroundColor: ds.colors.surfaceElevated,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
  },
  rideOptionName: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.sm,
  },
  rideDetails: {
    flexDirection: 'row',
    gap: ds.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  detailText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  surgeSection: {
    borderWidth: 1,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    backgroundColor: ds.colors.surfaceElevated + '20',
  },
  surgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ds.spacing.xs,
  },
  surgeTitle: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    flex: 1,
    marginLeft: ds.spacing.sm,
  },
  surgeMultiplier: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
  },
  surgeReason: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  surgeWaitTime: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  fareBreakdown: {
    marginBottom: ds.spacing.lg,
  },
  breakdownTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.xs,
  },
  breakdownLabel: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  breakdownValue: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: ds.spacing.md,
    borderTopWidth: 1,
    marginTop: ds.spacing.xs,
  },
  totalLabel: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  totalValue: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
  },
  errorSection: {
    backgroundColor: ds.colors.error + '10',
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    borderWidth: 1,
    borderColor: ds.colors.error + '30',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
  },
  errorMessage: {
    fontSize: ds.typography.size.body,
    color: ds.colors.error,
    marginLeft: ds.spacing.sm,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});
