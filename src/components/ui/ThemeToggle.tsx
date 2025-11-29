import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useFadeAnimation } from '@/hooks/useAnimations';
import { useTheme } from '@/providers/ThemeLocaleProvider';
import { useLocale } from '@/providers/ThemeLocaleProvider';
import { ds } from '@/constants/theme';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  style,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const { animatedStyle } = useFadeAnimation('modalEnter');

  const sizeConfig = {
    sm: {
      container: { width: 48, height: 24, borderRadius: 12 },
      thumb: { width: 20, height: 20, borderRadius: 10 },
    },
    md: {
      container: { width: 56, height: 28, borderRadius: 14 },
      thumb: { width: 24, height: 24, borderRadius: 12 },
    },
    lg: {
      container: { width: 64, height: 32, borderRadius: 16 },
      thumb: { width: 28, height: 28, borderRadius: 14 },
    },
  };

  const config = sizeConfig[size];

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isDark ? ds.colors.primary : ds.colors.border,
    opacity: animatedStyle.opacity,
  }));

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: isDark
          ? config.container.width - config.thumb.width - 4
          : 4
      }
    ]
  }));

  return (
    <Animated.View
      style={[styles.container, config.container, containerAnimatedStyle, style]}
    >
      <TouchableOpacity onPress={toggleTheme} style={styles.touchable}>
        <Animated.View style={[styles.thumb, config.thumb, thumbAnimatedStyle]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

interface LocaleToggleProps {
  style?: ViewStyle;
}

export const LocaleToggle: React.FC<LocaleToggleProps> = ({
  style,
}) => {
  const { locale, toggleLocale } = useLocale();
  const { animatedStyle } = useFadeAnimation('modalEnter');

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: animatedStyle.opacity,
  }));

  return (
    <Animated.View style={[styles.localeContainer, containerAnimatedStyle, style]}>
      <TouchableOpacity onPress={toggleLocale} style={styles.localeTouchable}>
        <View style={styles.localeButtons}>
          <View style={[
            styles.localeButton,
            locale === 'en' && styles.localeButtonActive
          ]}>
            <Text style={[
              styles.localeText,
              locale === 'en' && styles.localeTextActive
            ]}>EN</Text>
          </View>
          <View style={[
            styles.localeButton,
            locale === 'bg' && styles.localeButtonActive
          ]}>
            <Text style={[
              styles.localeText,
              locale === 'bg' && styles.localeTextActive
            ]}>BG</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ds.colors.border,
    position: 'absolute' as const,
  },
  touchable: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  thumb: {
    backgroundColor: '#FFFFFF',
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  localeContainer: {
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.sm,
    borderWidth: 1,
    borderColor: ds.colors.border,
  },
  localeTouchable: {
    paddingVertical: ds.spacing.xs,
    paddingHorizontal: ds.spacing.sm,
  },
  localeButtons: {
    flexDirection: 'row' as const,
    gap: 4,
  },
  localeButton: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.xs,
    backgroundColor: 'transparent',
  },
  localeButtonActive: {
    backgroundColor: ds.colors.primary,
  },
  localeText: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
  },
  localeTextActive: {
    color: '#FFFFFF',
  },
});
