/**
 * Ride Preferences Modal Component
 * Cabin control: temperature, lighting, music, conversation level
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

export interface RidePreferences {
  temperature: number; // 0-100
  lighting: string; // hex color
  music: 'lofi' | 'jazz' | 'techno' | 'classical' | 'none';
  conversation: 'quiet' | 'normal' | 'chatty';
  luggageAssist: boolean;
}

interface RidePreferencesModalProps {
  visible: boolean;
  initialPrefs: RidePreferences;
  onSave: (prefs: RidePreferences) => void;
  onClose: () => void;
}

const LIGHTING_COLORS = [
  '#00F5FF', // Cyan
  '#FF00FF', // Magenta
  '#00FFB3', // Green
  '#FF3366', // Red
  '#FFFFFF', // White
  '#FFAA00', // Orange
];

const MUSIC_OPTIONS: Array<{ value: RidePreferences['music']; label: string }> = [
  { value: 'lofi', label: 'Lo-Fi' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'techno', label: 'Techno' },
  { value: 'classical', label: 'Classical' },
  { value: 'none', label: 'None' },
];

const CONVERSATION_OPTIONS: Array<{ value: RidePreferences['conversation']; label: string }> = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'normal', label: 'Normal' },
  { value: 'chatty', label: 'Chatty' },
];

// Temperature Slider Component
const TemperatureSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const haptics = useHaptics();

  const getTemperatureLabel = () => {
    if (value < 30) return 'COOL';
    if (value > 70) return 'WARM';
    return 'BALANCED';
  };

  const getTemperatureDisplay = () => {
    return Math.round(65 + (value / 100) * 15);
  };

  const handlePress = useCallback((newValue: number) => {
    haptics.trigger('tap');
    onChange(newValue);
  }, [haptics, onChange]);

  return (
    <View style={styles.sliderSection}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderTitle}>TEMPERATURE</Text>
        <Text style={styles.sliderLabel}>{getTemperatureLabel()}</Text>
      </View>

      <View style={styles.sliderContainer}>
        <LinearGradient
          colors={['#3B82F6', 'rgba(255,255,255,0.2)', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sliderTrack}
        />

        {/* Slider Thumb */}
        <Pressable
          style={[
            styles.sliderThumb,
            { left: `${value}%`, marginLeft: -16 },
          ]}
          onPress={() => {}}
        >
          <Text style={styles.sliderThumbText}>{getTemperatureDisplay()}°</Text>
        </Pressable>

        {/* Touch Areas */}
        <View style={styles.sliderTouchArea}>
          {[0, 25, 50, 75, 100].map((v) => (
            <Pressable
              key={v}
              style={styles.sliderTouchPoint}
              onPress={() => handlePress(v)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// Color Picker Component
const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
}> = ({ value, onChange }) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handleSelect = useCallback((color: string) => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onChange(color);
  }, [haptics, sound, onChange]);

  return (
    <View style={styles.colorSection}>
      <Text style={styles.sectionTitle}>MOOD LIGHTING</Text>
      <View style={styles.colorGrid}>
        {LIGHTING_COLORS.map((color) => (
          <Pressable
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              value === color && styles.colorButtonSelected,
            ]}
            onPress={() => handleSelect(color)}
          />
        ))}
      </View>
    </View>
  );
};

// Option Grid Component
const OptionGrid: React.FC<{
  title: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}> = ({ title, options, value, onChange, columns = 3 }) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handleSelect = useCallback((optionValue: string) => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onChange(optionValue);
  }, [haptics, sound, onChange]);

  return (
    <View style={styles.optionSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={[styles.optionGrid, { flexWrap: 'wrap' }]}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.optionButton,
              { width: `${100 / columns - 2}%` },
              value === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => handleSelect(option.value)}
          >
            <Text style={[
              styles.optionText,
              value === option.value && styles.optionTextSelected,
            ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

// Segmented Control Component
const SegmentedControl: React.FC<{
  title: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}> = ({ title, options, value, onChange }) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handleSelect = useCallback((optionValue: string) => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onChange(optionValue);
  }, [haptics, sound, onChange]);

  return (
    <View style={styles.segmentSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.segmentContainer}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.segmentButton,
              value === option.value && styles.segmentButtonSelected,
            ]}
            onPress={() => handleSelect(option.value)}
          >
            <Text style={[
              styles.segmentText,
              value === option.value && styles.segmentTextSelected,
            ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

// Toggle Item Component
const ToggleItem: React.FC<{
  emoji: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ emoji, label, value, onChange }) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handleToggle = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onChange(!value);
  }, [haptics, sound, value, onChange]);

  return (
    <Pressable style={styles.toggleItem} onPress={handleToggle}>
      <View style={styles.toggleLeft}>
        <Text style={styles.toggleEmoji}>{emoji}</Text>
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <View style={[
        styles.toggleSwitch,
        value && styles.toggleSwitchActive,
      ]}>
        <View style={[
          styles.toggleThumb,
          value && styles.toggleThumbActive,
        ]} />
      </View>
    </Pressable>
  );
};

export const RidePreferencesModal: React.FC<RidePreferencesModalProps> = ({
  visible,
  initialPrefs,
  onSave,
  onClose,
}) => {
  const [prefs, setPrefs] = useState<RidePreferences>(initialPrefs);
  const haptics = useHaptics();
  const sound = useSound();

  const handleSave = useCallback(() => {
    haptics.trigger('confirm');
    sound.play('success');
    
    log.info('Ride preferences saved', {
      event: 'ride_preferences_saved',
      component: 'RidePreferencesModal',
      preferences: prefs,
    });

    onSave(prefs);
    onClose();
  }, [haptics, sound, prefs, onSave, onClose]);

  const handleClose = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onClose();
  }, [haptics, sound, onClose]);

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
          <GlassCard elevated style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Cabin Control</Text>
                <Text style={styles.headerSubtitle}>CUSTOMIZE YOUR EXPERIENCE</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <CustomIcon name="menu" size={16} color={ds.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <TemperatureSlider
                value={prefs.temperature}
                onChange={(temp) => setPrefs({ ...prefs, temperature: temp })}
              />

              <ColorPicker
                value={prefs.lighting}
                onChange={(color) => setPrefs({ ...prefs, lighting: color })}
              />

              <OptionGrid
                title="AUDIO VIBE"
                options={MUSIC_OPTIONS}
                value={prefs.music}
                onChange={(music) => setPrefs({ ...prefs, music: music as RidePreferences['music'] })}
              />

              <SegmentedControl
                title="CONVERSATION"
                options={CONVERSATION_OPTIONS}
                value={prefs.conversation}
                onChange={(conv) => setPrefs({ ...prefs, conversation: conv as RidePreferences['conversation'] })}
              />

              <View style={styles.toggleSection}>
                <ToggleItem
                  emoji="🧳"
                  label="Luggage Assistance"
                  value={prefs.luggageAssist}
                  onChange={(value) => setPrefs({ ...prefs, luggageAssist: value })}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <PremiumButton
                variant="primary"
                size="lg"
                onPress={handleSave}
                style={styles.saveButton}
              >
                Apply Preferences
              </PremiumButton>
            </View>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContainer: {
    maxHeight: '85%',
  },
  modalCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: ds.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  headerTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.tight,
  },
  headerSubtitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.ultraWide,
    marginTop: ds.spacing.xxs,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: ds.spacing.lg,
    gap: ds.spacing.xl,
  },
  sectionTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.wide,
    marginBottom: ds.spacing.md,
  },
  // Temperature Slider
  sliderSection: {},
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  sliderTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.wide,
  },
  sliderLabel: {
    fontFamily: 'monospace',
    fontSize: ds.typography.size.caption,
    color: ds.colors.primary,
  },
  sliderContainer: {
    height: 48,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 48,
    borderRadius: ds.radius.xl,
    opacity: 0.3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderThumbText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: '#000000',
  },
  sliderTouchArea: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  sliderTouchPoint: {
    flex: 1,
    height: '100%',
  },
  // Color Picker
  colorSection: {},
  colorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ds.spacing.sm,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.6,
  },
  colorButtonSelected: {
    borderColor: '#FFFFFF',
    opacity: 1,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    transform: [{ scale: 1.1 }],
  },
  // Option Grid
  optionSection: {},
  optionGrid: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  optionButton: {
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.sm,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: ds.colors.primary,
    borderColor: ds.colors.primary,
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  optionText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textSecondary,
    textTransform: 'uppercase',
  },
  optionTextSelected: {
    color: ds.colors.backgroundDeep,
  },
  // Segmented Control
  segmentSection: {},
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    padding: ds.spacing.xxs,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.sm,
    alignItems: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: ds.colors.backgroundAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  segmentText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textSecondary,
    textTransform: 'uppercase',
  },
  segmentTextSelected: {
    color: ds.colors.textPrimary,
  },
  // Toggle
  toggleSection: {
    gap: ds.spacing.sm,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  toggleEmoji: {
    fontSize: 18,
  },
  toggleLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  toggleSwitch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: ds.colors.backgroundAlt,
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: ds.colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 16 }],
  },
  // Footer
  footer: {
    padding: ds.spacing.lg,
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  saveButton: {
    width: '100%',
  },
});

export default RidePreferencesModal;
