/**
 * RideSelectionSheet - Bottom sheet for selecting ride options
 * Matches reference prototype's ride selection UI
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from 'react-i18next';
import type { RideOption } from '@/api/rides';

interface RideSelectionSheetProps {
  /** Available ride options */
  estimates: RideOption[];
  /** Currently selected ride ID */
  selectedRideId: string | null;
  /** Ride selection handler */
  onSelectRide: (id: string) => void;
  /** Confirm ride handler */
  onConfirm: () => void;
  /** Back/cancel handler */
  onBack?: () => void;
  /** Payment method click handler */
  onPaymentClick?: () => void;
  /** Whether estimates are loading */
  isEstimating?: boolean;
  /** Whether ride request is in progress */
  isRequesting?: boolean;
  /** Selected payment method display */
  paymentMethodDisplay?: string;
}

export const RideSelectionSheet: React.FC<RideSelectionSheetProps> = ({
  estimates,
  selectedRideId,
  onSelectRide,
  onConfirm,
  onBack,
  onPaymentClick,
  isEstimating = false,
  isRequesting = false,
  paymentMethodDisplay = '•••• 4242',
}) => {
  const { play } = useSound();
  const { trigger } = useHaptics();
  const { t } = useTranslation();

  const handleRideSelect = (id: string) => {
    trigger('tap');
    play('tapSoft');
    onSelectRide(id);
  };

  const handleConfirm = () => {
    trigger('confirm');
    play('success');
    onConfirm();
  };

  const selectedRide = estimates.find(r => r.id === selectedRideId);

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
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backButton}>
              <View style={{ transform: [{ rotate: '180deg' }] }}>
              <CustomIcon name="chevronRight" size={20} color={ds.colors.textSecondary} />
            </View>
            </Pressable>
          )}
          <Text style={styles.title}>{t('ride.select_ride', 'Select Your Ride')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Ride Options */}
        {isEstimating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ds.colors.primary} />
            <Text style={styles.loadingText}>{t('ride.calculating', 'Calculating prices...')}</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.optionsContent}
          >
            {estimates.map((ride, index) => (
              <MotiView
                key={ride.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'timing',
                  duration: 300,
                  delay: index * 100,
                }}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.rideOption,
                    selectedRideId === ride.id && styles.rideOptionSelected,
                    pressed && styles.rideOptionPressed,
                  ]}
                  onPress={() => handleRideSelect(ride.id)}
                >
                  {/* Ride Icon */}
                  <View style={[
                    styles.rideIcon,
                    selectedRideId === ride.id && styles.rideIconSelected,
                  ]}>
                    <CustomIcon 
                      name="location" 
                      size={24} 
                      color={selectedRideId === ride.id ? ds.colors.backgroundDeep : ds.colors.primary} 
                    />
                  </View>

                  {/* Ride Info */}
                  <View style={styles.rideInfo}>
                    <Text style={styles.rideName}>{ride.name}</Text>
                    <Text style={styles.rideDesc}>{ride.description}</Text>
                    <View style={styles.rideMeta}>
                      <Text style={styles.rideTime}>{ride.estimatedTime}</Text>
                      <Text style={styles.rideSeats}>• {ride.capacity} seats</Text>
                    </View>
                  </View>

                  {/* Price */}
                  <View style={styles.priceContainer}>
                    <Text style={[
                      styles.ridePrice,
                      selectedRideId === ride.id && styles.ridePriceSelected,
                    ]}>
                      ${ride.basePrice.toFixed(2)}
                    </Text>
                  </View>

                  {/* Selection Indicator */}
                  {selectedRideId === ride.id && (
                    <View style={styles.selectedIndicator}>
                      <CustomIcon name="activity" size={16} color={ds.colors.primary} />
                    </View>
                  )}
                </Pressable>
              </MotiView>
            ))}
          </ScrollView>
        )}

        {/* Payment Method */}
        <Pressable 
          style={styles.paymentRow}
          onPress={onPaymentClick}
        >
          <CustomIcon name="profile" size={20} color={ds.colors.textSecondary} />
          <Text style={styles.paymentText}>{paymentMethodDisplay}</Text>
          <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
        </Pressable>

        {/* Confirm Button */}
        <View style={styles.confirmContainer}>
          <PremiumButton
            variant="primary"
            size="lg"
            onPress={handleConfirm}
            disabled={!selectedRideId || isRequesting}
            style={styles.confirmButton}
          >
            {isRequesting 
              ? t('ride.requesting', 'Requesting...') 
              : selectedRide 
                ? `${t('ride.confirm', 'Confirm')} ${selectedRide.name} • $${selectedRide.basePrice.toFixed(2)}`
                : t('ride.select_option', 'Select an option')
            }
          </PremiumButton>
        </View>
      </GlassCard>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: '70%',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  loadingContainer: {
    padding: ds.spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.md,
  },
  optionsList: {
    maxHeight: 280,
  },
  optionsContent: {
    padding: ds.spacing.lg,
    gap: ds.spacing.md,
  },
  rideOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.spacing.lg,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.glass,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  rideOptionSelected: {
    borderColor: ds.colors.primary,
    backgroundColor: ds.colors.primary + '15',
  },
  rideOptionPressed: {
    opacity: 0.8,
  },
  rideIcon: {
    width: 48,
    height: 48,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ds.spacing.md,
  },
  rideIconSelected: {
    backgroundColor: ds.colors.primary,
  },
  rideInfo: {
    flex: 1,
  },
  rideName: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
  },
  rideDesc: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xxs,
  },
  rideMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ds.spacing.xs,
    gap: ds.spacing.sm,
  },
  rideTime: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.primary,
  },
  rideSeats: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: ds.spacing.md,
  },
  ridePrice: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
  },
  ridePriceSelected: {
    color: ds.colors.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: ds.spacing.sm,
    right: ds.spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.xl,
    paddingVertical: ds.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ds.colors.glassBorder,
    gap: ds.spacing.md,
  },
  paymentText: {
    flex: 1,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    color: ds.colors.textPrimary,
  },
  confirmContainer: {
    padding: ds.spacing.lg,
    paddingBottom: ds.spacing.xl,
  },
  confirmButton: {
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
});

export default RideSelectionSheet;
