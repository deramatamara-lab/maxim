/**
 * Payment Card Visual Component
 * Premium credit card visualization with chip, shine effects, and brand styling
 * Used for displaying payment methods in a visually rich format
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'wallet' | 'unknown';

export interface PaymentCardVisualProps {
  brand: CardBrand;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isSelected?: boolean;
  isDefault?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

// Card brand configurations
const CARD_CONFIGS: Record<CardBrand, {
  gradient: [string, string, ...string[]];
  borderColor: string;
  textColor: string;
}> = {
  visa: {
    gradient: ['#1a1f71', '#0057b8'],
    borderColor: '#1a1f71',
    textColor: '#FFFFFF',
  },
  mastercard: {
    gradient: ['#222222', '#333333', '#222222'],
    borderColor: '#FF5F00',
    textColor: '#FFFFFF',
  },
  amex: {
    gradient: ['#006FCF', '#00A1E4'],
    borderColor: '#006FCF',
    textColor: '#FFFFFF',
  },
  discover: {
    gradient: ['#FF6600', '#FF8C00'],
    borderColor: '#FF6600',
    textColor: '#FFFFFF',
  },
  wallet: {
    gradient: ['#1a1a1a', '#000000'],
    borderColor: '#333333',
    textColor: '#FFFFFF',
  },
  unknown: {
    gradient: ['#2a2a2a', '#1a1a1a'],
    borderColor: '#444444',
    textColor: '#FFFFFF',
  },
};

// Card Chip Component
const CardChip: React.FC = () => (
  <View style={styles.chip}>
    <View style={styles.chipHorizontalLine} />
    <View style={styles.chipVerticalLine} />
    <View style={styles.chipInner} />
  </View>
);

// Card Brand Logo Component
const CardBrandLogo: React.FC<{ brand: CardBrand }> = ({ brand }) => {
  switch (brand) {
    case 'visa':
      return (
        <Text style={styles.visaLogo}>VISA</Text>
      );
    case 'mastercard':
      return (
        <View style={styles.mastercardLogo}>
          <View style={[styles.mastercardCircle, styles.mastercardRed]} />
          <View style={[styles.mastercardCircle, styles.mastercardYellow]} />
        </View>
      );
    case 'amex':
      return (
        <Text style={styles.amexLogo}>AMEX</Text>
      );
    case 'wallet':
      return (
        <CustomIcon name="home" size={24} color={ds.colors.textPrimary} />
      );
    default:
      return (
        <CustomIcon name="search" size={24} color={ds.colors.textSecondary} />
      );
  }
};

export const PaymentCardVisual: React.FC<PaymentCardVisualProps> = ({
  brand,
  last4,
  expiryMonth,
  expiryYear,
  isSelected = false,
  isDefault = false,
  onPress,
  disabled = false,
}) => {
  const haptics = useHaptics();
  const sound = useSound();
  const scale = useSharedValue(1);
  const shine = useSharedValue(0);

  const config = useMemo(() => CARD_CONFIGS[brand] || CARD_CONFIGS.unknown, [brand]);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    shine.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(isSelected ? 1.02 : 1, { damping: 15, stiffness: 400 });
    shine.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled) return;
    haptics.trigger('tap');
    sound.play('tapSoft');
    onPress?.();
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shine.value, [0, 1], [0, 0.15]),
  }));

  const formattedExpiry = useMemo(() => {
    if (!expiryMonth || !expiryYear) return null;
    const month = expiryMonth.toString().padStart(2, '0');
    const year = expiryYear.toString().slice(-2);
    return `${month}/${year}`;
  }, [expiryMonth, expiryYear]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[styles.container, cardAnimatedStyle]}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            isSelected && styles.cardSelected,
            { borderColor: isSelected ? ds.colors.primary : config.borderColor },
          ]}
        >
          {/* Shine Effect Overlay */}
          <Animated.View style={[styles.shineOverlay, shineAnimatedStyle]} />

          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Top Row: Chip + Brand */}
            <View style={styles.topRow}>
              <CardChip />
              <CardBrandLogo brand={brand} />
            </View>

            {/* Bottom Row: Number + Expiry */}
            <View style={styles.bottomRow}>
              <View style={styles.numberSection}>
                <Text style={styles.numberLabel}>CARD NUMBER</Text>
                <Text style={[styles.cardNumber, { color: config.textColor }]}>
                  •••• •••• •••• {last4 || '****'}
                </Text>
              </View>

              {formattedExpiry && (
                <View style={styles.expirySection}>
                  <Text style={styles.expiryLabel}>EXPIRES</Text>
                  <Text style={[styles.expiryValue, { color: config.textColor }]}>
                    {formattedExpiry}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <CustomIcon name="check" size={14} color={ds.colors.backgroundDeep} />
            </View>
          )}

          {/* Default Badge */}
          {isDefault && !isSelected && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ds.spacing.md,
  },
  card: {
    height: 180,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardSelected: {
    borderWidth: 2,
    shadowColor: ds.colors.primary,
    shadowOpacity: 0.5,
  },
  shineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
    padding: ds.spacing.lg,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chip: {
    width: 36,
    height: 28,
    borderRadius: ds.radius.xs,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipHorizontalLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
  },
  chipVerticalLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
  },
  chipInner: {
    width: 16,
    height: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.6)',
    borderRadius: 2,
  },
  visaLogo: {
    fontFamily: ds.typography.family,
    fontSize: 20,
    fontWeight: ds.typography.weight.bold,
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  mastercardLogo: {
    flexDirection: 'row',
    marginLeft: -8,
  },
  mastercardCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  mastercardRed: {
    backgroundColor: 'rgba(235, 0, 27, 0.8)',
  },
  mastercardYellow: {
    backgroundColor: 'rgba(247, 158, 27, 0.8)',
    marginLeft: -8,
  },
  amexLogo: {
    fontFamily: ds.typography.family,
    fontSize: 14,
    fontWeight: ds.typography.weight.bold,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  numberSection: {
    flex: 1,
  },
  numberLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: ds.typography.tracking.wide,
    marginBottom: ds.spacing.xxs,
  },
  cardNumber: {
    fontFamily: 'monospace',
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    letterSpacing: ds.typography.tracking.wide,
  },
  expirySection: {
    alignItems: 'flex-end',
  },
  expiryLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: ds.typography.tracking.wide,
    marginBottom: ds.spacing.xxs,
  },
  expiryValue: {
    fontFamily: 'monospace',
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: ds.spacing.md,
    right: ds.spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  defaultBadge: {
    position: 'absolute',
    top: ds.spacing.md,
    right: ds.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xxs,
    borderRadius: ds.radius.xs,
  },
  defaultBadgeText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: '#FFFFFF',
    letterSpacing: ds.typography.tracking.wide,
  },
});

export default PaymentCardVisual;
