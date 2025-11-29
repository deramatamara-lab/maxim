import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { useInteractionState } from '@/hooks/useInteractionState';

interface PremiumButtonProps extends PressableProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  disabledReason?: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
  // Enhanced micro-interaction props
  enableMicroInteractions?: boolean;
  interactionConfig?: {
    scale?: number;
    glowIntensity?: number;
    hapticPattern?: 'tap' | 'confirm' | 'error';
    soundEffect?: 'tapSoft' | 'success' | 'warning';
  };
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  disabledReason,
  loading = false,
  style,
  enableMicroInteractions = true,
  interactionConfig = {},
  testID,
  ...pressableProps
}) => {
  const {
    scale = 0.95,
    glowIntensity = 0.4,
    hapticPattern = 'tap',
    soundEffect = 'tapSoft',
  } = interactionConfig;

  // Always call the hook unconditionally to satisfy React hooks rules
  const interactionState = useInteractionState({
    scale,
    glowIntensity,
    hapticPattern,
    soundEffect,
    disabled: !enableMicroInteractions || disabled,
    loading,
    successHaptic: 'confirm',
    successSound: 'success',
  });

  // Legacy fallback for non-enhanced mode
  const legacyScale = useSharedValue(1);
  const legacyOpacity = useSharedValue(1);
  const { trigger: legacyTrigger } = useHaptics();
  const { play: legacyPlay } = useSound();

  const handleLegacyPressIn = () => {
    if (disabled || loading || enableMicroInteractions) return;
    
    legacyTrigger('tap');
    legacyPlay('tapSoft');
    
    legacyScale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handleLegacyPressOut = () => {
    if (disabled || loading || enableMicroInteractions) return;
    
    legacyScale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handleLegacyPress = () => {
    if (disabled || loading || enableMicroInteractions) return;
    
    legacyTrigger('confirm');
    legacyPlay('success');
    onPress();
  };

  // Legacy animated style for non-enhanced mode
  const legacyAnimatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(
      legacyScale.value,
      [0.98, 1],
      [0.98, 1],
      Extrapolate.CLAMP
    );

    const opacityValue = disabled ? 0.5 : loading ? 0.7 : legacyOpacity.value;

    return {
      transform: [{ scale: scaleValue }],
      opacity: opacityValue,
    };
  });

  // Use the correct animated style based on mode
  const animatedStyle = enableMicroInteractions ? interactionState.pressStyle : legacyAnimatedStyle;

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: ds.colors.primary,
          text: '#000000',
          border: 'transparent',
        };
      case 'secondary':
        return {
          background: ds.colors.secondary,
          text: '#000000',
          border: 'transparent',
        };
      case 'ghost':
        return {
          background: 'transparent',
          text: ds.colors.textPrimary,
          border: ds.colors.border,
        };
      default:
        return {
          background: ds.colors.primary,
          text: '#000000',
          border: 'transparent',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: ds.spacing.lg,
          paddingVertical: ds.spacing.sm,
          minHeight: 40,
        };
      case 'md':
        return {
          paddingHorizontal: ds.spacing.xl,
          paddingVertical: ds.spacing.md,
          minHeight: 56,
        };
      case 'lg':
        return {
          paddingHorizontal: ds.spacing.xxl,
          paddingVertical: ds.spacing.lg,
          minHeight: 64,
        };
      default:
        return {
          paddingHorizontal: ds.spacing.xl,
          paddingVertical: ds.spacing.md,
          minHeight: 56,
        };
    }
  };

  const colors = getButtonColors();
  const sizeStyles = getSizeStyles();

  if (enableMicroInteractions) {
    return (
      <Animated.View style={style}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <Animated.View style={[styles.glowOverlay, interactionState.glowStyle]} />
          <Pressable
            testID={testID}
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled || loading }}
            accessibilityLabel={disabledReason ? `${String(children)} - ${disabledReason}` : pressableProps.accessibilityLabel}
            accessibilityHint={disabledReason || pressableProps.accessibilityHint}
            style={({ pressed }) => [
              styles.button,
              sizeStyles,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderWidth: variant === 'ghost' ? 1 : 0,
                opacity: (disabled || loading) ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            {...pressableProps}
          >
            <View style={styles.buttonContent}>
              <Text
                style={[
                  styles.text,
                  {
                    color: colors.text,
                    fontSize: size === 'sm' ? ds.typography.size.body : ds.typography.size.bodyLg,
                  },
                ]}
              >
                {loading ? 'Loading...' : children}
              </Text>
              {disabledReason && (
                <Text style={[styles.disabledReason, { color: ds.colors.textSecondary }]}>
                  {disabledReason}
                </Text>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    );
  }

  // Legacy fallback
  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        style={({ pressed }) => [
          styles.button,
          sizeStyles,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: variant === 'ghost' ? 1 : 0,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPressIn={handleLegacyPressIn}
        onPressOut={handleLegacyPressOut}
        onPress={handleLegacyPress}
        disabled={disabled || loading}
        {...pressableProps}
      >
        <Text
          style={[
            styles.text,
            {
              color: colors.text,
              fontSize: size === 'sm' ? ds.typography.size.body : ds.typography.size.bodyLg,
            },
          ]}
        >
          {loading ? 'Loading...' : children}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  button: {
    borderRadius: 15, // Reference style
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: ds.colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledReason: {
    fontSize: ds.typography.size.caption,
    marginTop: ds.spacing.xs,
    textAlign: 'center',
  },
  glowOverlay: {
    position: 'absolute',
    top: -ds.spacing.sm,
    left: -ds.spacing.sm,
    right: -ds.spacing.sm,
    bottom: -ds.spacing.sm,
    borderRadius: 15,
    backgroundColor: ds.colors.primary,
    opacity: 0,
  },
  text: {
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    textAlign: 'center',
  },
});
