import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { ds } from '../../constants/theme';
import { GlassCard } from './GlassCard';
import { Icon, IconName } from './Icon';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { useInteractionState } from '../../hooks/useInteractionState';

export type TabId = 'home' | 'activity' | 'location' | 'profile';

interface TabDefinition {
  id: TabId;
  icon: IconName;
  labelKey: string;
}

const tabs: TabDefinition[] = [
  { id: 'home', icon: 'home', labelKey: 'home.tabHome' },
  { id: 'activity', icon: 'activity', labelKey: 'home.tabActivity' },
  { id: 'location', icon: 'location', labelKey: 'home.tabLocation' },
  { id: 'profile', icon: 'profile', labelKey: 'home.tabProfile' },
];

interface TabButtonProps {
  tab: TabDefinition;
  active: boolean;
  label: string;
  onPress: () => void;
  // Enhanced micro-interaction props
  enableMicroInteractions?: boolean;
  interactionConfig?: {
    scale?: number;
    glowIntensity?: number;
    hapticPattern?: 'tap' | 'confirm' | 'error';
    soundEffect?: 'tapSoft' | 'success' | 'warning';
  };
}

const TabButton = ({ 
  tab, 
  active, 
  label, 
  onPress,
  enableMicroInteractions = true,
  interactionConfig = {}
}: TabButtonProps) => {
  const {
    scale = 0.95,
    glowIntensity = 0.3,
    hapticPattern = 'tap',
    soundEffect = 'tapSoft',
  } = interactionConfig;

  // Always call the hook unconditionally to satisfy React hooks rules
  const interactionState = useInteractionState({
    scale,
    glowIntensity,
    hapticPattern,
    soundEffect,
    disabled: !enableMicroInteractions,
    successHaptic: 'confirm',
    successSound: 'success',
  });

  // Legacy interaction system for backward compatibility
  const press = useSharedValue(active ? 1 : 0);
  const { trigger } = useHaptics();
  const { play } = useSound();

  useEffect(() => {
    press.value = withTiming(active ? 1 : 0, {
      duration: ds.motion.duration.micro,
      easing: Easing.bezier(...ds.motion.easing.micro),
    });
  }, [active, press]);

  const handlePress = useCallback(() => {
    if (enableMicroInteractions) {
      // Use enhanced interaction system
      interactionState.triggerSuccess();
      onPress();
    } else {
      // Use legacy system
      trigger('tap');
      play('tapSoft');
      onPress();
    }
  }, [enableMicroInteractions, interactionState, trigger, play, onPress]);

  const containerStyle = useAnimatedStyle(() => {
    if (enableMicroInteractions) {
      return {
        backgroundColor: interpolateColor(
          press.value,
          [0, 1],
          [ds.colors.glass, ds.colors.surfaceElevated]
        ),
        borderColor: interpolateColor(
          press.value,
          [0, 1],
          [ds.colors.glassBorder, ds.colors.outlineSubtle]
        ),
        shadowColor: ds.colors.primary,
        shadowOpacity: press.value * (ds.shadow.card.opacity + 0.1),
        shadowRadius: ds.shadow.card.radius + press.value * 6,
        transform: [
          { translateY: -press.value * 3 },
          { scale: 1 - press.value * 0.02 },
        ],
      };
    }

    // Legacy animation style
    return {
      backgroundColor: interpolateColor(
        press.value,
        [0, 1],
        [ds.colors.glass, ds.colors.surfaceElevated]
      ),
      borderColor: interpolateColor(
        press.value,
        [0, 1],
        [ds.colors.glassBorder, ds.colors.outlineSubtle]
      ),
      shadowColor: ds.colors.primary,
      shadowOpacity: press.value * (ds.shadow.card.opacity + 0.1),
      shadowRadius: ds.shadow.card.radius + press.value * 6,
      transform: [
        { translateY: -press.value * 3 },
        { scale: 1 - press.value * 0.02 },
      ],
    };
  });

  const dotStyle = useAnimatedStyle(() => ({
    opacity: press.value,
    transform: [{ scale: 0.6 + press.value * 0.4 }],
  }));

  const gesture = useMemo(
    () =>
      enableMicroInteractions 
        ? interactionState.gesture
        : Gesture.Tap()
            .onBegin(() => {
              press.value = withTiming(1, {
                duration: ds.motion.duration.micro,
                easing: Easing.bezier(...ds.motion.easing.micro),
              });
            })
            .onFinalize(() => {
              if (!active) {
                press.value = withTiming(0, {
                  duration: ds.motion.duration.exit,
                  easing: Easing.bezier(...ds.motion.easing.exit),
                });
              }
            })
            .onEnd(() => {
              handlePress();
            }),
    [active, handlePress, press, enableMicroInteractions, interactionState]
  );

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={[styles.tab, containerStyle]}
      >
        <Icon
          name={tab.icon}
          size={20}
          color={active ? ds.colors.primary : ds.colors.textSecondary}
          active={active}
        />
        <Text style={[styles.label, active ? styles.labelActive : undefined]}>{label}</Text>
        <Animated.View pointerEvents="none" style={[styles.glowDot, dotStyle]} />
      </Animated.View>
    </GestureDetector>
  );
};

export interface FloatingTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  // Enhanced micro-interaction props
  enableMicroInteractions?: boolean;
  interactionConfig?: {
    scale?: number;
    glowIntensity?: number;
    hapticPattern?: 'tap' | 'confirm' | 'error';
    soundEffect?: 'tapSoft' | 'success' | 'warning';
  };
}

export const FloatingTabBar = ({ 
  activeTab, 
  onTabChange,
  enableMicroInteractions = true,
  interactionConfig = {}
}: FloatingTabBarProps) => {
  const { t } = useTranslation();
  const { trigger } = useHaptics();
  const { play } = useSound();

  const handlePress = useCallback(
    (id: TabId) => {
      if (id === activeTab) {
        trigger('selection');
        play('click');
        return;
      }
      trigger('selection');
      play('click');
      onTabChange(id);
    },
    [activeTab, onTabChange, play, trigger]
  );

  return (
    <GlassCard
      style={styles.container}
      elevated={true}
      intensity={30}
      tint="dark"
      accessibilityRole="tablist"
      accessibilityLabel="Primary navigation"
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          active={tab.id === activeTab}
          label={t(tab.labelKey)}
          onPress={() => handlePress(tab.id)}
          enableMicroInteractions={enableMicroInteractions}
          interactionConfig={interactionConfig}
        />
      ))}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.xl,
    paddingVertical: ds.spacing.md,
    borderRadius: ds.radius['2xl'],
    gap: ds.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.glassBorder,
  },
  tab: {
    flex: 1,
    height: 56,
    borderRadius: ds.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: ds.colors.primary,
  },
  glowDot: {
    width: 8,
    height: 8,
    borderRadius: ds.radius.sm,
    backgroundColor: ds.colors.primary,
    shadowColor: ds.colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: ds.shadow.soft.radius,
  },
});
