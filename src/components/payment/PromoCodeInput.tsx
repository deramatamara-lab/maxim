/**
 * PromoCodeInput Component
 * Discount/promo code entry with validation and animation
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  interpolateColor,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

export interface PromoCode {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  description: string;
  expiresAt?: string;
  minOrderAmount?: number;
  maxDiscount?: number;
}

export interface PromoCodeInputProps {
  onApply: (code: PromoCode) => void;
  onRemove?: () => void;
  appliedCode?: PromoCode | null;
  orderAmount?: number;
  disabled?: boolean;
}

// Mock promo code validation - replace with real API
const validatePromoCode = async (code: string): Promise<PromoCode | null> => {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const mockCodes: Record<string, PromoCode> = {
    'WELCOME20': {
      code: 'WELCOME20',
      discount: 20,
      discountType: 'percentage',
      description: '20% off your first ride',
      maxDiscount: 10,
    },
    'SAVE5': {
      code: 'SAVE5',
      discount: 5,
      discountType: 'fixed',
      description: '$5 off your ride',
    },
    'PREMIUM50': {
      code: 'PREMIUM50',
      discount: 50,
      discountType: 'percentage',
      description: '50% off premium rides',
      minOrderAmount: 30,
      maxDiscount: 25,
    },
  };
  
  return mockCodes[code.toUpperCase()] || null;
};

export function PromoCodeInput({
  onApply,
  onRemove,
  appliedCode,
  orderAmount = 0,
  disabled = false,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const haptics = useHaptics();
  const sound = useSound();
  
  // Animation values
  const shakeX = useSharedValue(0);
  const successScale = useSharedValue(1);
  const borderProgress = useSharedValue(0);
  
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));
  
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderProgress.value,
      [0, 0.5, 1],
      [ds.colors.glassBorder, ds.colors.danger, ds.colors.success]
    ),
  }));
  
  const handleToggleExpand = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded, haptics, sound]);
  
  const handleApply = useCallback(async () => {
    if (!code.trim() || isValidating || disabled) return;
    
    setError(null);
    setIsValidating(true);
    haptics.trigger('tap');
    
    try {
      const promoCode = await validatePromoCode(code.trim());
      
      if (!promoCode) {
        setError('Invalid promo code');
        borderProgress.value = withSequence(
          withTiming(0.5, { duration: 200 }),
          withTiming(0, { duration: 400 })
        );
        shakeX.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        haptics.trigger('error');
        sound.play('error');
        log.info('Invalid promo code attempted', { 
          event: 'promo_code_invalid', 
          component: 'PromoCodeInput',
          code: code.trim() 
        });
        return;
      }
      
      // Check minimum order amount
      if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
        setError(`Minimum order: $${promoCode.minOrderAmount.toFixed(2)}`);
        borderProgress.value = withSequence(
          withTiming(0.5, { duration: 200 }),
          withTiming(0, { duration: 400 })
        );
        haptics.trigger('error');
        return;
      }
      
      // Success!
      borderProgress.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 800 })
      );
      successScale.value = withSequence(
        withSpring(1.1),
        withSpring(1)
      );
      haptics.trigger('success');
      sound.play('success');
      
      onApply(promoCode);
      setCode('');
      setIsExpanded(false);
      
      log.info('Promo code applied', { 
        event: 'promo_code_applied', 
        component: 'PromoCodeInput',
        code: promoCode.code,
        discount: promoCode.discount,
        discountType: promoCode.discountType,
      });
      
    } catch (err) {
      setError('Failed to validate code');
      haptics.trigger('error');
      log.error('Promo code validation failed', { 
        event: 'promo_code_error', 
        component: 'PromoCodeInput' 
      }, err);
    } finally {
      setIsValidating(false);
    }
  }, [code, isValidating, disabled, orderAmount, onApply, haptics, sound, borderProgress, shakeX, successScale]);
  
  const handleRemove = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onRemove?.();
    log.info('Promo code removed', { 
      event: 'promo_code_removed', 
      component: 'PromoCodeInput' 
    });
  }, [onRemove, haptics, sound]);
  
  const calculateDiscount = (promoCode: PromoCode): number => {
    if (promoCode.discountType === 'percentage') {
      const discount = (orderAmount * promoCode.discount) / 100;
      return promoCode.maxDiscount ? Math.min(discount, promoCode.maxDiscount) : discount;
    }
    return promoCode.discount;
  };
  
  // Applied code view
  if (appliedCode) {
    const discountAmount = calculateDiscount(appliedCode);
    
    return (
      <Animated.View entering={FadeIn.duration(300)} style={successStyle}>
        <GlassCard style={styles.appliedCard} elevated>
          <View style={styles.appliedContent}>
            <View style={styles.appliedLeft}>
              <View style={styles.checkCircle}>
                <CustomIcon name="activity" size={14} color={ds.colors.success} />
              </View>
              <View style={styles.appliedInfo}>
                <Text style={styles.appliedCode}>{appliedCode.code}</Text>
                <Text style={styles.appliedDescription}>{appliedCode.description}</Text>
              </View>
            </View>
            <View style={styles.appliedRight}>
              <Text style={styles.discountAmount}>-${discountAmount.toFixed(2)}</Text>
              {onRemove && (
                <Pressable 
                  onPress={handleRemove} 
                  style={styles.removeButton}
                  hitSlop={8}
                >
                  <CustomIcon name="activity" size={16} color={ds.colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }
  
  // Collapsed view
  if (!isExpanded) {
    return (
      <Pressable onPress={handleToggleExpand} disabled={disabled}>
        <GlassCard style={[styles.collapsedCard, disabled && styles.disabledCard]}>
          <View style={styles.collapsedContent}>
            <CustomIcon name="activity" size={18} color={ds.colors.primary} />
            <Text style={styles.collapsedText}>Add promo code</Text>
            <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
          </View>
        </GlassCard>
      </Pressable>
    );
  }
  
  // Expanded input view
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <Animated.View style={[shakeStyle, borderStyle]}>
        <GlassCard style={styles.expandedCard} elevated>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Enter promo code"
              placeholderTextColor={ds.colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isValidating && !disabled}
              onSubmitEditing={handleApply}
              returnKeyType="done"
            />
            
            <Pressable
              onPress={handleApply}
              disabled={!code.trim() || isValidating || disabled}
              style={[
                styles.applyButton,
                (!code.trim() || disabled) && styles.applyButtonDisabled,
              ]}
            >
              {isValidating ? (
                <ActivityIndicator size="small" color={ds.colors.text} />
              ) : (
                <Text style={styles.applyText}>Apply</Text>
              )}
            </Pressable>
          </View>
          
          {error && (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}
          
          <Pressable onPress={handleToggleExpand} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </GlassCard>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  collapsedCard: {
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  collapsedText: {
    flex: 1,
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.primary,
  },
  disabledCard: {
    opacity: 0.5,
  },
  expandedCard: {
    padding: ds.spacing.md,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    backgroundColor: ds.colors.surface,
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  applyButton: {
    backgroundColor: ds.colors.primary,
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.lg,
    borderRadius: ds.radius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: ds.colors.surface,
    opacity: 0.5,
  },
  applyText: {
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold as '600',
    fontSize: ds.typography.size.body,
    color: ds.colors.backgroundDeep,
  },
  errorText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.danger,
    marginTop: ds.spacing.sm,
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: ds.spacing.sm,
    padding: ds.spacing.xs,
  },
  cancelText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  appliedCard: {
    padding: ds.spacing.md,
    borderWidth: 1,
    borderColor: `${ds.colors.success}40`,
    backgroundColor: `${ds.colors.success}10`,
  },
  appliedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    flex: 1,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${ds.colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedInfo: {
    flex: 1,
  },
  appliedCode: {
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    fontSize: ds.typography.size.body,
    color: ds.colors.success,
  },
  appliedDescription: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  appliedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  discountAmount: {
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    fontSize: ds.typography.size.bodyLg,
    color: ds.colors.success,
  },
  removeButton: {
    padding: ds.spacing.xs,
  },
});

export default PromoCodeInput;
