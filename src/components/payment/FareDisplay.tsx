/**
 * Fare Display Component
 * Shows detailed fare breakdown with surge pricing and calculations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Icon } from '@/components/ui/Icon';
import { payment } from '@/services/paymentService';
import type { FareCalculation } from '@/api/payment';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';

interface FareBreakdownItem {
  description: string;
  amount: number;
  type?: 'base' | 'distance' | 'time' | 'surge' | 'toll' | 'tip' | 'fee';
}

interface FareDisplayProps {
  distance: number; // in km
  duration: number; // in minutes
  baseFare?: number;
  surge?: number;
  tolls?: number;
  tip?: number;
  currency?: string;
  showTipInput?: boolean;
  onTipChange?: (tip: number) => void;
  onTipCustomChange?: (tip: string) => void;
  customTip?: string;
  selectedTipIndex?: number;
  onTipSelect?: (index: number, tip: number) => void;
  rideOptionId: string;
  surgeMultiplier?: number;
  compact?: boolean;
  showBreakdown?: boolean;
}

const FareDisplay: React.FC<FareDisplayProps> = ({
  distance,
  duration,
  baseFare = 2.50,
  surge = 0,
  tolls = 0,
  tip = 0,
  currency = '$',
  showTipInput = false,
  onTipChange,
  onTipCustomChange,
  customTip,
  selectedTipIndex,
  onTipSelect,
  rideOptionId,
  surgeMultiplier = 1.0,
  compact = false,
  showBreakdown = true,
}) => {
  const haptics = useHaptics();
  const sound = useSound();
  const [fareCalculation, setFareCalculation] = useState<FareCalculation | null>(null);
  const [expanded, setExpanded] = useState(!compact);
  const [customTipValue, setCustomTipValue] = useState('');
  const fadeValue = useSharedValue(0);
  const expandValue = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 300 });
  }, [fadeValue]);

  useEffect(() => {
    const calculatedFare = payment.calculateFare({
      distance,
      duration,
      rideOptionId,
      surgeMultiplier,
      tolls,
      tip,
    });
    setFareCalculation(calculatedFare);
  }, [distance, duration, rideOptionId, surgeMultiplier, tolls, tip]);

  useEffect(() => {
    expandValue.value = withTiming(expanded ? 1 : 0, { duration: 300 });
  }, [expanded]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  const expandStyle = useAnimatedStyle(() => ({
    height: interpolate(expandValue.value, [0, 1], [compact ? 60 : 80, 200]),
  }));

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  const handleTipSelect = (index: number, tipAmount: number) => {
    haptics.tap();
    sound.play('tapSoft');
    onTipSelect?.(index, tipAmount);
  };

  const handleCustomTipChange = (value: string) => {
    haptics.tap();
    sound.play('tapSoft');
    setCustomTipValue(value);
    onTipCustomChange?.(value);
    const tipAmount = parseFloat(value) || 0;
    onTipChange?.(tipAmount);
  };

  const getSurgeColor = (multiplier: number) => {
    if (multiplier <= 1.0) return ds.colors.text;
    if (multiplier <= 1.5) return ds.colors.warning;
    return ds.colors.error;
  };

  const getSurgeText = (multiplier: number) => {
    if (multiplier <= 1.0) return 'Normal Pricing';
    if (multiplier <= 1.5) return 'Moderate Surge';
    return 'High Surge';
  };

  if (!fareCalculation) return null;

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <GlassCard elevated style={[styles.fareCard, compact && styles.fareCardCompact]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Fare Estimate</Text>
            {!compact && (
              <Text style={styles.subtitle}>
                {distance.toFixed(1)} km • {duration} min
              </Text>
            )}
          </View>
          {showBreakdown && (
            <Pressable
              style={styles.expandButton}
              onPress={() => setExpanded(!expanded)}
            >
              <Icon 
                name="chevronRight" 
                size={20} 
                color={ds.colors.textSecondary}
                style={[
                  styles.expandIcon,
                  expanded && styles.expandIconRotated,
                ]}
              />
            </Pressable>
          )}
        </View>

        {/* Total Amount */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(fareCalculation.total)}</Text>
        </View>

        {/* Surge Indicator */}
        {surgeMultiplier > 1.0 && (
          <View style={styles.surgeSection}>
            <Icon name="location" size={16} color={getSurgeColor(surgeMultiplier)} />
            <Text style={[styles.surgeText, { color: getSurgeColor(surgeMultiplier) }]}>
              {getSurgeText(surgeMultiplier)} • {surgeMultiplier.toFixed(1)}x
            </Text>
          </View>
        )}

        {/* Fare Breakdown */}
        {showBreakdown && (
          <Animated.View style={[styles.breakdownContainer, expandStyle]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.breakdown}>
                <Text style={styles.breakdownTitle}>Fare Breakdown</Text>
                
                {fareCalculation.breakdown.map((item: FareBreakdownItem, index: number) => (
                  <View key={index} style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>{item.description}</Text>
                    <Text style={styles.breakdownAmount}>
                      {item.amount >= 0 ? '+' : '-'}{currency}{Math.abs(item.amount).toFixed(2)}
                    </Text>
                  </View>
                ))}

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownTotalLabel}>Total</Text>
                  <Text style={styles.breakdownTotalAmount}>
                    {formatCurrency(fareCalculation.total)}
                  </Text>
                </View>
              </View>

              {/* Tip Options */}
              {showTipInput && (
                <View style={styles.tipSection}>
                  <Text style={styles.sectionTitle}>Add Tip</Text>
                  <View style={styles.tipOptions}>
                    {[15, 20, 25].map((percent, index) => {
                      const tipAmount = fareCalculation.total * (percent / 100);
                      return (
                        <PremiumButton
                          key={percent}
                          variant={selectedTipIndex === index ? 'primary' : 'secondary'}
                          size="sm"
                          onPress={() => handleTipSelect(index, tipAmount)}
                          style={styles.tipButton}
                        >
                          {percent}%
                        </PremiumButton>
                      );
                    })}
                    <View style={[styles.tipCustomContainer, selectedTipIndex === 3 && styles.tipCustomSelected]}>
                      <TextInput
                        style={styles.tipCustomInput}
                        value={customTip || customTipValue}
                        onChangeText={handleCustomTipChange}
                        placeholder="Custom"
                        placeholderTextColor={ds.colors.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: ds.spacing.lg,
  },
  fareCard: {
    padding: ds.spacing.lg,
  },
  fareCardCompact: {
    padding: ds.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  subtitle: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
  },
  totalLabel: {
    fontSize: ds.typography.size.bodyLg,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  totalAmount: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  surgeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    marginBottom: ds.spacing.md,
  },
  surgeText: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    fontFamily: ds.typography.family,
  },
  breakdownContainer: {
    overflow: 'hidden',
  },
  breakdown: {
    paddingTop: ds.spacing.md,
  },
  breakdownTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.xs,
  },
  breakdownLabel: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  breakdownAmount: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: ds.colors.glassBorder,
    marginVertical: ds.spacing.sm,
  },
  breakdownTotalLabel: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  breakdownTotalAmount: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  sectionTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.md,
  },
  tipSection: {
    marginTop: ds.spacing.lg,
  },
  tipOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  tipButton: {
    flex: 1,
    minWidth: 70,
  },
  tipCustomContainer: {
    flex: 1,
    minWidth: 70,
    height: 36,
    borderRadius: ds.radius.sm,
    borderWidth: 1,
    borderColor: ds.colors.border,
    justifyContent: 'center',
    backgroundColor: ds.colors.backgroundAlt,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
  },
  tipCustomSelected: {
    borderColor: ds.colors.primary,
    backgroundColor: ds.colors.primary + '10',
  },
  tipCustomInput: {
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    textAlign: 'center',
  },
  currencySymbol: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginRight: ds.spacing.xs,
  },
  customTipTextInput: {
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    minWidth: 60,
  },
});

export { FareDisplay };
export default FareDisplay;
