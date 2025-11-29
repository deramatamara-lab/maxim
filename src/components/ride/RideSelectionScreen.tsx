/**
 * Ride Selection Screen Component
 * Vehicle selection with premium card design, specs, and customization
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

export interface RideOption {
  id: string;
  name: string;
  icon: string;
  price: number;
  time: string;
  description?: string;
}

export interface RidePreferences {
  temperature: number;
  lighting: string;
  music: 'lofi' | 'jazz' | 'techno' | 'classical' | 'none';
  conversation: 'quiet' | 'normal' | 'chatty';
  luggageAssist: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  brand?: string;
  last4?: string;
  label?: string;
}

interface RideSelectionScreenProps {
  rideOptions: RideOption[];
  selectedPayment: PaymentMethod;
  onConfirm: (ride: RideOption, payment: PaymentMethod, prefs: RidePreferences) => void;
  onBack: () => void;
  onChangePayment: () => void;
  onCustomize: () => void;
}

const DEFAULT_PREFS: RidePreferences = {
  temperature: 70,
  lighting: '#00F5FF',
  music: 'lofi',
  conversation: 'normal',
  luggageAssist: false,
};

// Vehicle stats helper
const getVehicleStats = (id: string) => {
  switch (id) {
    case 'aura-x':
      return { seats: 4, bags: 2 };
    case 'aura-black':
      return { seats: 3, bags: 3 };
    case 'aura-hyper':
      return { seats: 2, bags: 1 };
    default:
      return { seats: 4, bags: 2 };
  }
};

// Ride Option Card Component
const RideOptionCard: React.FC<{
  ride: RideOption;
  isSelected: boolean;
  index: number;
  onSelect: () => void;
  onCustomize: () => void;
}> = ({ ride, isSelected, index, onSelect, onCustomize }) => {
  const haptics = useHaptics();
  const sound = useSound();
  const scale = useSharedValue(1);
  const stats = getVehicleStats(ride.id);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.02 : 1, { damping: 15, stiffness: 400 });
  };

  const handlePress = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onSelect();
  }, [haptics, sound, onSelect]);

  const handleCustomize = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    haptics.trigger('tap');
    sound.play('tapSoft');
    onCustomize();
  }, [haptics, sound, onCustomize]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(isSelected ? 1 : 0, { duration: 300 }),
  }));

  const specsHeight = useAnimatedStyle(() => ({
    maxHeight: withTiming(isSelected ? 60 : 0, { duration: 300 }),
    opacity: withTiming(isSelected ? 1 : 0, { duration: 300 }),
    marginTop: withTiming(isSelected ? ds.spacing.sm : 0, { duration: 300 }),
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(300)}
      style={cardStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.cardContainer}>
          {/* Selection Glow */}
          <Animated.View style={[styles.selectionGlow, glowOpacity]}>
            <LinearGradient
              colors={[ds.colors.primary, ds.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.glowGradient}
            />
          </Animated.View>

          {/* Blur Glow */}
          {isSelected && <View style={styles.blurGlow} />}

          {/* Card Content */}
          <View style={[
            styles.cardContent,
            isSelected ? styles.cardContentSelected : styles.cardContentDefault,
          ]}>
            {/* Holographic Scan Effect */}
            {isSelected && (
              <Animated.View style={styles.scanEffect}>
                <LinearGradient
                  colors={['transparent', ds.colors.primary + '15', 'transparent']}
                  style={styles.scanGradient}
                />
              </Animated.View>
            )}

            {/* Top Row */}
            <View style={styles.topRow}>
              <View style={styles.leftSection}>
                {/* Vehicle Avatar */}
                <View style={[
                  styles.vehicleAvatar,
                  isSelected && styles.vehicleAvatarSelected,
                ]}>
                  <Text style={styles.vehicleIcon}>{ride.icon}</Text>
                </View>

                {/* Name & Time */}
                <View style={styles.vehicleInfo}>
                  <Text style={[
                    styles.vehicleName,
                    isSelected && styles.vehicleNameSelected,
                  ]}>
                    {ride.name}
                  </Text>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{ride.time} away</Text>
                    {isSelected && <View style={styles.pulseDot} />}
                  </View>
                </View>
              </View>

              {/* Price */}
              <Text style={[
                styles.price,
                isSelected && styles.priceSelected,
              ]}>
                ${ride.price}
              </Text>
            </View>

            {/* Specs Row (visible when selected) */}
            <Animated.View style={[styles.specsRow, specsHeight]}>
              <View style={styles.specsLeft}>
                <View style={styles.specItem}>
                  <CustomIcon name="profile" size={14} color={ds.colors.textSecondary} />
                  <Text style={styles.specText}>{stats.seats}</Text>
                </View>
                <View style={styles.specItem}>
                  <CustomIcon name="home" size={14} color={ds.colors.textSecondary} />
                  <Text style={styles.specText}>{stats.bags}</Text>
                </View>
              </View>

              {/* Customize Button */}
              <Pressable
                style={styles.customizeButton}
                onPress={handleCustomize}
              >
                <CustomIcon name="settings" size={10} color={ds.colors.primary} />
                <Text style={styles.customizeText}>CUSTOMIZE</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Payment Dock Component
const PaymentDock: React.FC<{
  payment: PaymentMethod;
  onPress: () => void;
}> = ({ payment, onPress }) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handlePress = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onPress();
  }, [haptics, sound, onPress]);

  const getPaymentIcon = () => {
    if (payment.type === 'wallet') return '💳';
    if (payment.brand === 'visa') return 'VISA';
    if (payment.brand === 'mastercard') return 'MC';
    return '💳';
  };

  const getPaymentLabel = () => {
    if (payment.label) return payment.label;
    if (payment.last4) return `•••• ${payment.last4}`;
    return 'Select Payment';
  };

  return (
    <Pressable style={styles.paymentDock} onPress={handlePress}>
      <View style={styles.paymentLeft}>
        <View style={styles.paymentIcon}>
          <Text style={styles.paymentIconText}>{getPaymentIcon()}</Text>
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentLabel}>PAYMENT</Text>
          <View style={styles.paymentValueRow}>
            <Text style={styles.paymentValue}>{getPaymentLabel()}</Text>
            <CustomIcon name="chevronRight" size={10} color={ds.colors.textSecondary} />
          </View>
        </View>
      </View>
      <View style={styles.changeButton}>
        <Text style={styles.changeText}>CHANGE</Text>
      </View>
    </Pressable>
  );
};

export const RideSelectionScreen: React.FC<RideSelectionScreenProps> = ({
  rideOptions,
  selectedPayment,
  onConfirm,
  onBack,
  onChangePayment,
  onCustomize,
}) => {
  const [selectedId, setSelectedId] = useState<string>(rideOptions[0]?.id || '');
  const [prefs] = useState<RidePreferences>(DEFAULT_PREFS);
  const haptics = useHaptics();
  const sound = useSound();

  const handleConfirm = useCallback(() => {
    const selectedRide = rideOptions.find(r => r.id === selectedId);
    if (!selectedRide) return;

    haptics.trigger('confirm');
    sound.play('success');

    log.info('Ride confirmed', {
      event: 'ride_confirmed',
      component: 'RideSelectionScreen',
      rideId: selectedId,
      rideName: selectedRide.name,
      price: selectedRide.price,
    });

    onConfirm(selectedRide, selectedPayment, prefs);
  }, [selectedId, rideOptions, selectedPayment, prefs, haptics, sound, onConfirm]);

  const handleBack = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onBack();
  }, [haptics, sound, onBack]);

  const selectedRide = rideOptions.find(r => r.id === selectedId);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <GlassCard elevated style={styles.mainCard}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <CustomIcon name="chevronRight" size={20} color={ds.colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>FLEET</Text>
            <Text style={styles.headerTitle}>SELECT VEHICLE</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Ride Options List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {rideOptions.map((ride, index) => (
            <RideOptionCard
              key={ride.id}
              ride={ride}
              isSelected={selectedId === ride.id}
              index={index}
              onSelect={() => setSelectedId(ride.id)}
              onCustomize={onCustomize}
            />
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <PaymentDock
            payment={selectedPayment}
            onPress={onChangePayment}
          />

          <PremiumButton
            variant="primary"
            size="lg"
            onPress={handleConfirm}
            style={styles.confirmButton}
          >
            REQUEST {selectedRide?.name.toUpperCase()}
          </PremiumButton>
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    transform: [{ rotate: '180deg' }],
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: ds.typography.tracking.ultraWide,
  },
  headerTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.wide,
    marginTop: ds.spacing.xxs,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ds.spacing.lg,
    gap: ds.spacing.lg,
  },
  cardContainer: {
    position: 'relative',
  },
  selectionGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 24, // Reference: 24px outer rounded
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
  },
  blurGlow: {
    position: 'absolute',
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
    borderRadius: 32, // Reference: 32px blur glow
    backgroundColor: ds.colors.primary + '20', // Reference: aura-primary/20
  },
  cardContent: {
    borderRadius: 23, // Reference: 23px inner, 24px outer
    padding: 16, // Reference: 16px padding
    overflow: 'hidden',
  },
  cardContentSelected: {
    backgroundColor: '#0A0A0A', // Reference: bg-[#0A0A0A]
  },
  cardContentDefault: {
    backgroundColor: '#121212', // Reference: bg-[#121212]
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  scanEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  scanGradient: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  vehicleAvatar: {
    width: 56,
    height: 56,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleAvatarSelected: {
    backgroundColor: ds.colors.primary + '20',
    borderWidth: 1,
    borderColor: ds.colors.primary + '50',
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  vehicleIcon: {
    fontSize: 24,
  },
  vehicleInfo: {},
  vehicleName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.tight,
  },
  vehicleNameSelected: {
    color: ds.colors.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginTop: ds.spacing.xxs,
  },
  timeText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  pulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ds.colors.primary,
  },
  price: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.tight,
  },
  priceSelected: {
    color: ds.colors.primary,
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
    paddingTop: ds.spacing.sm,
    overflow: 'hidden',
  },
  specsLeft: {
    flexDirection: 'row',
    gap: ds.spacing.lg,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  specText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xxs,
    borderRadius: ds.radius.xs,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  customizeText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: ds.typography.tracking.wide,
  },
  footer: {
    padding: ds.spacing.lg,
    paddingTop: ds.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
    gap: ds.spacing.lg,
  },
  paymentDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  paymentIcon: {
    width: 48,
    height: 32,
    borderRadius: ds.radius.xs,
    backgroundColor: ds.colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  paymentIconText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  paymentInfo: {},
  paymentLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.ultraWide,
  },
  paymentValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginTop: ds.spacing.xxs,
  },
  paymentValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.wide,
  },
  changeButton: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.xs,
    backgroundColor: ds.colors.primary + '15',
    borderWidth: 1,
    borderColor: ds.colors.primary + '30',
  },
  changeText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: ds.typography.tracking.ultraWide,
  },
  confirmButton: {
    height: 64,
  },
});

export default RideSelectionScreen;
