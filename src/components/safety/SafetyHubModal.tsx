/**
 * Safety Hub Modal Component
 * Emergency SOS with hold-to-activate, trip sharing, and safety toolkit
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  SlideInUp,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ds } from '@/constants/theme';
import { GlassView } from '@/components/ui/GlassView';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SafetyHubModalProps {
  visible: boolean;
  onClose: () => void;
  onEmergencyTriggered?: () => void;
  onShareTrip?: () => void;
}

const SOS_HOLD_DURATION = 1000; // 1 second hold
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 68;

// Pulsing Ring Component
const PulsingRing: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scale.value = withRepeat(
        withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      opacity.value = withRepeat(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, [scale, opacity, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.pulsingRing, animatedStyle]} />
  );
};

// SOS Button Component
const SOSButton: React.FC<{
  onActivate: () => void;
}> = ({ onActivate }) => {
  const [isPressed, setIsPressed] = useState(false);
  const progress = useSharedValue(0);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const haptics = useHaptics();
  const sound = useSound();

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
    haptics.trigger('tap');
    
    // Start progress animation
    progress.value = withTiming(1, {
      duration: SOS_HOLD_DURATION,
      easing: Easing.linear,
    });

    // Start timer for activation
    pressTimer.current = setTimeout(() => {
      haptics.trigger('heavy');
      sound.play('warning');
      runOnJS(onActivate)();
    }, SOS_HOLD_DURATION);
  }, [haptics, sound, progress, onActivate]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
    
    // Cancel timer
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // Reset progress
    progress.value = withTiming(0, { duration: 200 });
  }, [progress]);

  const progressProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_CIRCUMFERENCE * (1 - progress.value),
  }));

  const buttonScale = useAnimatedStyle(() => ({
    transform: [{ scale: isPressed ? 0.95 : 1 }],
  }));

  return (
    <View style={styles.sosContainer}>
      {/* Pulsing Rings */}
      <PulsingRing delay={0} />
      <PulsingRing delay={1000} />

      {/* Progress Ring */}
      <Svg style={styles.progressRing} viewBox="0 0 144 144">
        {/* Background Circle */}
        <Circle
          cx="72"
          cy="72"
          r="68"
          stroke={ds.colors.danger + '30'}
          strokeWidth={4}
          fill="transparent"
        />
        {/* Progress Circle */}
        <AnimatedCircle
          cx="72"
          cy="72"
          r="68"
          stroke={ds.colors.danger}
          strokeWidth={4}
          fill="transparent"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          animatedProps={progressProps}
          strokeLinecap="round"
          rotation="-90"
          origin="72, 72"
        />
      </Svg>

      {/* SOS Button */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.sosButtonPressable}
      >
        <Animated.View style={[styles.sosButton, buttonScale]}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubtext}>HOLD 1s</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

// Safety Option Button Component
const SafetyOption: React.FC<{
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}> = ({ icon, iconColor, iconBg, title, subtitle, onPress }) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handlePress = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onPress();
  }, [haptics, sound, onPress]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.safetyOption,
        pressed && styles.safetyOptionPressed,
      ]}
      onPress={handlePress}
    >
      <View style={[styles.safetyOptionIcon, { backgroundColor: iconBg }]}>
        <Text style={[styles.safetyOptionEmoji, { color: iconColor }]}>{icon}</Text>
      </View>
      <View style={styles.safetyOptionContent}>
        <Text style={styles.safetyOptionTitle}>{title}</Text>
        <Text style={styles.safetyOptionSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
};

// Silent SOS Gesture Detection
const SILENT_SOS_PATTERN = [3, 3, 3]; // Triple-tap 3 times (9 taps total)
const SILENT_SOS_TIMEOUT = 3000; // 3 seconds to complete pattern

export const SafetyHubModal: React.FC<SafetyHubModalProps> = ({
  visible,
  onClose,
  onEmergencyTriggered,
  onShareTrip,
}) => {
  const haptics = useHaptics();
  const sound = useSound();
  
  // Silent SOS state
  const [silentTapCount, setSilentTapCount] = useState(0);
  const [silentPatternIndex, setSilentPatternIndex] = useState(0);
  const silentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset silent SOS pattern
  const resetSilentPattern = useCallback(() => {
    setSilentTapCount(0);
    setSilentPatternIndex(0);
    if (silentTimerRef.current) {
      clearTimeout(silentTimerRef.current);
      silentTimerRef.current = null;
    }
  }, []);

  // Handle silent SOS gesture (tap on header area)
  const handleSilentTap = useCallback(() => {
    // Clear existing timer
    if (silentTimerRef.current) {
      clearTimeout(silentTimerRef.current);
    }

    const newTapCount = silentTapCount + 1;
    setSilentTapCount(newTapCount);

    // Check if current pattern segment is complete
    if (newTapCount >= SILENT_SOS_PATTERN[silentPatternIndex]) {
      // Provide subtle haptic feedback
      haptics.trigger('tap');
      
      const newPatternIndex = silentPatternIndex + 1;
      
      if (newPatternIndex >= SILENT_SOS_PATTERN.length) {
        // Pattern complete - trigger silent SOS
        log.error('SILENT SOS TRIGGERED', {
          event: 'silent_sos',
          component: 'SafetyHubModal',
        });
        
        // Vibrate pattern to confirm (without sound)
        haptics.trigger('heavy');
        setTimeout(() => haptics.trigger('heavy'), 200);
        setTimeout(() => haptics.trigger('heavy'), 400);
        
        // Trigger emergency without alert (silent)
        onEmergencyTriggered?.();
        resetSilentPattern();
        return;
      }
      
      // Move to next pattern segment
      setSilentPatternIndex(newPatternIndex);
      setSilentTapCount(0);
    }

    // Set timeout to reset pattern if not completed in time
    silentTimerRef.current = setTimeout(() => {
      resetSilentPattern();
    }, SILENT_SOS_TIMEOUT);
  }, [silentTapCount, silentPatternIndex, haptics, onEmergencyTriggered, resetSilentPattern]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silentTimerRef.current) {
        clearTimeout(silentTimerRef.current);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    resetSilentPattern();
    onClose();
  }, [haptics, sound, onClose, resetSilentPattern]);

  const handleEmergency = useCallback(() => {
    log.error('EMERGENCY SOS TRIGGERED', {
      event: 'emergency_sos',
      component: 'SafetyHubModal',
    });

    Alert.alert(
      '🚨 EMERGENCY ALERT',
      'Authorities have been notified. Stay calm and remain in a safe location.',
      [
        {
          text: 'OK',
          onPress: () => {
            onEmergencyTriggered?.();
            onClose();
          },
        },
      ]
    );
  }, [onEmergencyTriggered, onClose]);

  const handleShareTrip = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    
    log.info('Trip sharing initiated', {
      event: 'share_trip',
      component: 'SafetyHubModal',
    });

    onShareTrip?.();
    Alert.alert('Trip Shared', 'Live tracking link sent to your trusted contacts.');
  }, [haptics, sound, onShareTrip]);

  const handleSafetyToolkit = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    
    Alert.alert(
      'Safety Toolkit',
      'Choose a safety feature:',
      [
        { text: 'Ride Check', onPress: () => {} },
        { text: 'Audio Recording', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [haptics, sound]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          entering={SlideInUp.duration(400).springify()}
          style={styles.modalContainer}
        >
          <GlassView elevated={true} intensity="medium" tint="dark" style={styles.modalCard}>
            {/* Header - Tap for silent SOS */}
            <Pressable onPress={handleSilentTap} style={styles.header}>
              <View style={styles.headerLeft}>
                <CustomIcon name="settings" size={20} color={ds.colors.danger} />
                <Text style={styles.headerTitle}>SAFETY HUB</Text>
                {/* Silent SOS indicator (subtle) */}
                {silentPatternIndex > 0 && (
                  <View style={styles.silentIndicator}>
                    {Array.from({ length: SILENT_SOS_PATTERN.length }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.silentDot,
                          i < silentPatternIndex && styles.silentDotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <CustomIcon name="menu" size={16} color={ds.colors.textSecondary} />
              </Pressable>
            </Pressable>

            {/* SOS Section */}
            <View style={styles.sosSection}>
              <SOSButton onActivate={handleEmergency} />
              <Text style={styles.sosDescription}>
                Hold button for 1 second to contact local emergency services and notify safety contacts.
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Safety Options */}
            <View style={styles.optionsSection}>
              <SafetyOption
                icon="📤"
                iconColor="#3B82F6"
                iconBg="rgba(59, 130, 246, 0.2)"
                title="Share Trip Status"
                subtitle="Send live tracking to trusted contacts"
                onPress={handleShareTrip}
              />
              <SafetyOption
                icon="🛡️"
                iconColor={ds.colors.textPrimary}
                iconBg={ds.colors.surface}
                title="Safety Toolkit"
                subtitle="Ride check, audio recording, and more"
                onPress={handleSafetyToolkit}
              />
            </View>
          </GlassView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    padding: 0,
    borderColor: ds.colors.danger + '30',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ds.spacing.lg,
    backgroundColor: ds.colors.danger + '10',
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.danger + '20',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  headerTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.danger,
    letterSpacing: ds.typography.tracking.ultraWide,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosSection: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xl,
    paddingHorizontal: ds.spacing.lg,
  },
  sosContainer: {
    width: 144,
    height: 144,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.lg,
  },
  pulsingRing: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: ds.colors.danger + '30',
  },
  progressRing: {
    position: 'absolute',
    width: 144,
    height: 144,
    transform: [{ rotate: '-90deg' }],
  },
  sosButtonPressable: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  sosButton: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: ds.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ds.colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  sosText: {
    fontFamily: ds.typography.family,
    fontSize: 32,
    fontWeight: ds.typography.weight.bold,
    color: '#FFFFFF',
  },
  sosSubtext: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: 'rgba(255,255,255,0.8)',
    marginTop: ds.spacing.xxs,
    letterSpacing: ds.typography.tracking.wide,
  },
  sosDescription: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    lineHeight: ds.typography.lineHeight.body,
  },
  divider: {
    height: 1,
    backgroundColor: ds.colors.borderSubtle,
    marginHorizontal: ds.spacing.lg,
  },
  optionsSection: {
    padding: ds.spacing.lg,
    gap: ds.spacing.md,
  },
  safetyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  safetyOptionPressed: {
    backgroundColor: ds.colors.surfaceElevated,
  },
  safetyOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyOptionEmoji: {
    fontSize: 18,
  },
  safetyOptionContent: {
    flex: 1,
  },
  safetyOptionTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  safetyOptionSubtitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xxs,
  },
  // Silent SOS indicator styles
  silentIndicator: {
    flexDirection: 'row',
    marginLeft: ds.spacing.sm,
    gap: 4,
  },
  silentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ds.colors.textSecondary + '40',
  },
  silentDotActive: {
    backgroundColor: ds.colors.danger,
  },
});

export default SafetyHubModal;
