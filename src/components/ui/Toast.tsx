/**
 * Toast Notification Component
 * Animated toast notifications with success/error/info variants
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from './GlassCard';
import { CustomIcon } from './CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
  visible?: boolean;
}

const TOAST_CONFIGS: Record<ToastType, {
  icon: 'check' | 'menu' | 'activity' | 'settings';
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  success: {
    icon: 'check',
    color: ds.colors.success,
    bgColor: ds.colors.success + '20',
    borderColor: ds.colors.success + '50',
  },
  error: {
    icon: 'menu',
    color: ds.colors.danger,
    bgColor: ds.colors.danger + '20',
    borderColor: ds.colors.danger + '50',
  },
  info: {
    icon: 'activity',
    color: ds.colors.primary,
    bgColor: ds.colors.primary + '20',
    borderColor: ds.colors.primary + '50',
  },
  warning: {
    icon: 'settings',
    color: ds.colors.warning,
    bgColor: ds.colors.warning + '20',
    borderColor: ds.colors.warning + '50',
  },
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 3000,
  onClose,
  visible = true,
}) => {
  const haptics = useHaptics();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const config = TOAST_CONFIGS[type];

  const triggerClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      // Entrance animation
      haptics.trigger(type === 'error' ? 'error' : 'tap');
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });

      // Auto-dismiss timer
      const timer = setTimeout(() => {
        // Exit animation
        translateY.value = withTiming(-100, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        });
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.9, { duration: 200 });

        // Callback after animation
        setTimeout(() => {
          runOnJS(triggerClose)();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, duration, haptics, type, translateY, opacity, scale, triggerClose]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const handleDismiss = useCallback(() => {
    haptics.trigger('tap');
    translateY.value = withTiming(-100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 150 });
    setTimeout(triggerClose, 200);
  }, [haptics, translateY, opacity, triggerClose]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable onPress={handleDismiss}>
        <GlassCard elevated style={styles.toast}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
            <CustomIcon name={config.icon} size={14} color={config.color} />
          </View>

          {/* Message */}
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: ds.spacing.xl,
    left: ds.spacing.lg,
    right: ds.spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.md,
    borderRadius: ds.radius['2xl'],
    gap: ds.spacing.md,
    minWidth: 280,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  message: {
    flex: 1,
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.normal,
  },
});

export default Toast;
