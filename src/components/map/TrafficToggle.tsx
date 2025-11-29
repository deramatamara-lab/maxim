/**
 * Traffic Toggle Component
 * Floating button to toggle traffic layer on/off
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ds } from '../../constants/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { CustomIcon } from '../ui/CustomIcon';

interface TrafficToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  /** Show loading state while traffic data loads */
  loading?: boolean;
}

export const TrafficToggle: React.FC<TrafficToggleProps> = ({
  enabled,
  onToggle,
  loading = false,
}) => {
  const haptics = useHaptics();
  const sound = useSound();
  const scale = useSharedValue(1);

  const handlePress = () => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onToggle(!enabled);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(300).duration(200)} style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            enabled && styles.buttonActive,
            pressed && styles.buttonPressed,
          ]}
        >
          {loading ? (
            <View style={styles.loadingDot} />
          ) : (
            <CustomIcon
              name="activity"
              size={18}
              color={enabled ? ds.colors.primary : ds.colors.textSecondary}
            />
          )}
          <Text style={[styles.label, enabled && styles.labelActive]}>
            Traffic
          </Text>
          {enabled && (
            <View style={styles.indicator}>
              <View style={[styles.indicatorDot, { backgroundColor: '#4ADE80' }]} />
              <View style={[styles.indicatorDot, { backgroundColor: '#FACC15' }]} />
              <View style={[styles.indicatorDot, { backgroundColor: '#EF4444' }]} />
            </View>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: ds.spacing.md,
    right: ds.spacing.md,
    zIndex: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonActive: {
    backgroundColor: ds.colors.primary + '15',
    borderColor: ds.colors.primary + '50',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
  },
  labelActive: {
    color: ds.colors.primary,
  },
  indicator: {
    flexDirection: 'row',
    gap: 2,
    marginLeft: ds.spacing.xs,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loadingDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ds.colors.textSecondary + '40',
  },
});

export default TrafficToggle;
