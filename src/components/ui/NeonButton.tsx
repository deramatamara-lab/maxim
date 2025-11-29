/**
 * NeonButton Component
 * Premium cyber-styled button with holographic sweep and scanline overlays
 * Adapted from web prototype to React Native with animations
 */

import React, { useState } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export interface NeonButtonProps {
  label: string;
  variant?: 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleValue = useSharedValue(1);

  // Get button dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { height: 44, paddingHorizontal: ds.spacing.lg };
      case 'lg':
        return { height: 64, paddingHorizontal: ds.spacing.xxl };
      default:
        return { height: 56, paddingHorizontal: ds.spacing.xl };
    }
  };

  // Get gradient colors based on variant
  const getGradientColors = (): readonly [string, string] => {
    switch (variant) {
      case 'primary':
        return [ds.colors.primary, ds.colors.primaryAccent] as const;
      case 'danger':
        return [ds.colors.danger, ds.colors.danger] as const;
      case 'ghost':
        return ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.1)'] as const;
      default:
        return [ds.colors.primary, ds.colors.primaryAccent];
    }
  };

  // Get text color based on variant
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#000000';
      case 'danger':
        return ds.colors.danger;
      case 'ghost':
        return ds.colors.textPrimary;
      default:
        return '#000000';
    }
  };

  // Get border color based on variant
  const getBorderColor = () => {
    switch (variant) {
      case 'primary':
        return 'transparent';
      case 'danger':
        return `${ds.colors.danger}80`;
      case 'ghost':
        return `${ds.colors.textPrimary}40`;
      default:
        return 'transparent';
    }
  };

  // Get shadow style based on variant
  const getShadowStyle = (): ViewStyle => {
    if (disabled) return {};
    
    switch (variant) {
      case 'primary':
        return {
          shadowColor: ds.colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isPressed ? 0.6 : 0.35,
          shadowRadius: isPressed ? 25 : 40,
          elevation: isPressed ? 8 : 12,
        };
      case 'danger':
        return {
          shadowColor: ds.colors.danger,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isPressed ? 0.3 : 0.15,
          shadowRadius: isPressed ? 15 : 25,
          elevation: isPressed ? 6 : 8,
        };
      case 'ghost':
        return {
          shadowColor: ds.colors.textPrimary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isPressed ? 0.1 : 0.05,
          shadowRadius: isPressed ? 10 : 20,
          elevation: isPressed ? 4 : 6,
        };
      default:
        return {};
    }
  };

  // Handle press animations
  const handlePressIn = () => {
    if (disabled || loading) return;
    setIsPressed(true);
    scaleValue.value = withSpring(0.95, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    setIsPressed(false);
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const dimensions = getDimensions();
  const gradientColors = getGradientColors();
  const textColor = getTextColor();
  const borderColor = getBorderColor();
  const shadowStyle = getShadowStyle();

  return (
    <Animated.View style={[animatedStyle, styles.container, style]}>
      <Pressable
        style={[
          styles.button,
          {
            height: dimensions.height,
            paddingHorizontal: dimensions.paddingHorizontal,
            borderRadius: ds.radius.lg,
            borderColor,
            borderWidth: variant !== 'primary' ? 1 : 0,
            backgroundColor: variant === 'ghost' ? 'rgba(255, 255, 255, 0.05)' : undefined,
            ...shadowStyle,
          },
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        {/* Background Gradient for primary variant */}
        {variant === 'primary' && (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFillObject,
              styles.gradient,
              disabled && styles.disabledGradient,
            ]}
          />
        )}

        {/* Holographic Sweep Effect */}
        {!disabled && !loading && (
          <Animated.View
            style={[
              styles.sweepEffect,
              {
                opacity: isPressed ? 0.3 : 0.8,
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.8)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sweepGradient}
            />
          </Animated.View>
        )}

        {/* Tech Scanline Overlay for Primary */}
        {variant === 'primary' && !disabled && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              styles.scanlineOverlay,
              {
                opacity: isPressed ? 0.1 : 0.2,
              },
            ]}
          />
        )}

        {/* Edge Highlights for Primary */}
        {variant === 'primary' && !disabled && (
          <>
            <View
              style={[
                styles.edgeHighlight,
                {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
              ]}
            />
            <View
              style={[
                styles.cornerHighlightTopLeft,
                {
                  borderTopColor: 'rgba(255, 255, 255, 0.8)',
                  borderLeftColor: 'rgba(255, 255, 255, 0.8)',
                },
              ]}
            />
            <View
              style={[
                styles.cornerHighlightBottomRight,
                {
                  borderBottomColor: 'rgba(255, 255, 255, 0.8)',
                  borderRightColor: 'rgba(255, 255, 255, 0.8)',
                },
              ]}
            />
          </>
        )}

        {/* Inner Glow Border */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.innerGlow,
            {
              opacity: isPressed ? 0.2 : 0.3,
            },
          ]}
        />

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <Text
              style={[
                styles.text,
                styles.loadingText,
                {
                  color: textColor,
                  fontSize: size === 'sm' ? ds.typography.size.body : ds.typography.size.bodyLg,
                },
                textStyle,
              ]}
            >
              Loading...
            </Text>
          ) : (
            <>
              <Text
                style={[
                  styles.text,
                  {
                    color: textColor,
                    fontSize: size === 'sm' ? ds.typography.size.body : ds.typography.size.bodyLg,
                    opacity: disabled ? 0.5 : 1,
                  },
                  textStyle,
                ]}
              >
                {label}
              </Text>
              {icon && <View style={styles.icon}>{icon}</View>}
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    borderRadius: ds.radius.lg,
  },
  disabledGradient: {
    opacity: 0.5,
  },
  sweepEffect: {
    position: 'absolute',
    left: '-150%',
    top: 0,
    bottom: 0,
    width: '150%',
    transform: [{ skewX: '-12deg' }],
  },
  sweepGradient: {
    flex: 1,
  },
  scanlineOverlay: {
    backgroundColor: 'transparent',
    borderRadius: ds.radius.lg,
  },
  edgeHighlight: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: ds.radius.lg,
    backgroundColor: 'transparent',
  },
  cornerHighlightTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: ds.radius.sm,
    backgroundColor: 'transparent',
  },
  cornerHighlightBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: ds.radius.sm,
    backgroundColor: 'transparent',
  },
  innerGlow: {
    borderWidth: 1,
    borderRadius: ds.radius.lg,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.sm,
    position: 'relative',
    zIndex: 10,
  },
  text: {
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  loadingText: {
    opacity: 0.7,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NeonButton;
