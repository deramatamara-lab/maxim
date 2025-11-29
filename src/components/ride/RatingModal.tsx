/**
 * Rating Modal Component
 * Post-ride rating interface for riders to rate drivers
 * Ultra-premium design with star animation and tip options
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface RatingModalProps {
  visible: boolean;
  driverName: string;
  driverPhoto?: string;
  rideId: string;
  onSubmit: (rating: number, tip: number, feedback: string) => void;
  onClose: () => void;
}

const TIP_OPTIONS = [
  { label: 'No Tip', value: 0 },
  { label: '$2', value: 2 },
  { label: '$5', value: 5 },
  { label: '$10', value: 10 },
  { label: 'Custom', value: -1 },
];

const FEEDBACK_TAGS = [
  'Great conversation',
  'Smooth driving',
  'Clean car',
  'Professional',
  'Safe driver',
  'Quick pickup',
];

interface StarProps {
  index: number;
  rating: number;
  onRate: (rating: number) => void;
}

const Star: React.FC<StarProps> = ({ index, rating, onRate }) => {
  const scale = useSharedValue(1);
  const haptics = useHaptics();
  const isFilled = index < rating;

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    haptics.trigger('selection');
    onRate(index + 1);
  }, [index, onRate, scale, haptics]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.starButton, animatedStyle]}
      accessibilityLabel={`Rate ${index + 1} stars`}
      accessibilityRole="button"
    >
      <Text style={[styles.star, isFilled && styles.starFilled]}>
        {isFilled ? '★' : '☆'}
      </Text>
    </AnimatedPressable>
  );
};

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  driverName,
  driverPhoto,
  rideId: _rideId,
  onSubmit,
  onClose,
}) => {
  const [rating, setRating] = useState(0);
  const [selectedTip, setSelectedTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const haptics = useHaptics();
  const sound = useSound();

  const handleTipSelect = useCallback((value: number) => {
    haptics.trigger('selection');
    if (value === -1) {
      setShowCustomTip(true);
      setSelectedTip(0);
    } else {
      setShowCustomTip(false);
      setSelectedTip(value);
      setCustomTip('');
    }
  }, [haptics]);

  const handleTagToggle = useCallback((tag: string) => {
    haptics.trigger('tap');
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, [haptics]);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      haptics.trigger('error');
      return;
    }

    setIsSubmitting(true);
    haptics.trigger('confirm');
    sound.play('success');

    const finalTip = showCustomTip ? parseFloat(customTip) || 0 : selectedTip;
    const combinedFeedback = [
      ...selectedTags,
      feedback.trim(),
    ].filter(Boolean).join('. ');

    // Small delay for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onSubmit(rating, finalTip, combinedFeedback);
    setIsSubmitting(false);
  }, [rating, selectedTip, customTip, showCustomTip, selectedTags, feedback, haptics, sound, onSubmit]);

  const handleClose = useCallback(() => {
    haptics.trigger('tap');
    onClose();
  }, [haptics, onClose]);

  const getRatingText = (r: number) => {
    switch (r) {
      case 5: return 'Excellent! 🌟';
      case 4: return 'Great ride!';
      case 3: return 'It was okay';
      case 2: return 'Could be better';
      case 1: return 'Poor experience';
      default: return 'How was your ride?';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          exiting={FadeOut.duration(200)}
          style={styles.modalContent}
        >
          <GlassCard elevated style={styles.card}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <Pressable
                  onPress={handleClose}
                  style={styles.closeButton}
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                >
                  <CustomIcon name="menu" size={20} color={ds.colors.textSecondary} />
                </Pressable>
                <Text style={styles.title}>Rate Your Ride</Text>
              </View>

              {/* Driver Info */}
              <View style={styles.driverSection}>
                <View style={styles.driverAvatar}>
                  {driverPhoto ? (
                    <Animated.Image
                      entering={FadeIn.delay(200)}
                      source={{ uri: driverPhoto }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <CustomIcon name="profile" size={32} color={ds.colors.textSecondary} />
                  )}
                </View>
                <Text style={styles.driverName}>{driverName}</Text>
              </View>

              {/* Star Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>{getRatingText(rating)}</Text>
                <View style={styles.starsContainer}>
                  {[0, 1, 2, 3, 4].map(index => (
                    <Star
                      key={index}
                      index={index}
                      rating={rating}
                      onRate={setRating}
                    />
                  ))}
                </View>
              </View>

              {/* Feedback Tags */}
              {rating > 0 && (
                <Animated.View
                  entering={FadeIn.delay(100)}
                  style={styles.tagsSection}
                >
                  <Text style={styles.sectionLabel}>What went well?</Text>
                  <View style={styles.tagsContainer}>
                    {FEEDBACK_TAGS.map(tag => (
                      <Pressable
                        key={tag}
                        onPress={() => handleTagToggle(tag)}
                        style={[
                          styles.tag,
                          selectedTags.includes(tag) && styles.tagSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            selectedTags.includes(tag) && styles.tagTextSelected,
                          ]}
                        >
                          {tag}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Tip Section */}
              {rating > 0 && (
                <Animated.View
                  entering={FadeIn.delay(200)}
                  style={styles.tipSection}
                >
                  <Text style={styles.sectionLabel}>Add a tip?</Text>
                  <View style={styles.tipOptions}>
                    {TIP_OPTIONS.map(option => (
                      <Pressable
                        key={option.value}
                        onPress={() => handleTipSelect(option.value)}
                        style={[
                          styles.tipButton,
                          (option.value === selectedTip || (option.value === -1 && showCustomTip)) &&
                            styles.tipButtonSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tipButtonText,
                            (option.value === selectedTip || (option.value === -1 && showCustomTip)) &&
                              styles.tipButtonTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  
                  {showCustomTip && (
                    <Animated.View entering={FadeIn} style={styles.customTipContainer}>
                      <Text style={styles.customTipLabel}>$</Text>
                      <TextInput
                        style={styles.customTipInput}
                        value={customTip}
                        onChangeText={setCustomTip}
                        placeholder="0.00"
                        placeholderTextColor={ds.colors.textSecondary}
                        keyboardType="decimal-pad"
                        maxLength={6}
                      />
                    </Animated.View>
                  )}
                </Animated.View>
              )}

              {/* Additional Feedback */}
              {rating > 0 && (
                <Animated.View
                  entering={FadeIn.delay(300)}
                  style={styles.feedbackSection}
                >
                  <Text style={styles.sectionLabel}>Additional comments (optional)</Text>
                  <TextInput
                    style={styles.feedbackInput}
                    value={feedback}
                    onChangeText={setFeedback}
                    placeholder="Tell us more about your experience..."
                    placeholderTextColor={ds.colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                  />
                </Animated.View>
              )}

              {/* Submit Button */}
              <View style={styles.footer}>
                <PremiumButton
                  variant="primary"
                  size="lg"
                  onPress={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  style={styles.submitButton}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </PremiumButton>
                
                <Pressable onPress={handleClose} style={styles.skipButton}>
                  <Text style={styles.skipText}>Skip for now</Text>
                </Pressable>
              </View>
            </ScrollView>
          </GlassCard>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    maxHeight: '90%',
  },
  card: {
    borderTopLeftRadius: ds.radius.xl,
    borderTopRightRadius: ds.radius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: ds.spacing.xxxl,
  },
  scrollContent: {
    padding: ds.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.xl,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    padding: ds.spacing.sm,
  },
  title: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  driverSection: {
    alignItems: 'center',
    marginBottom: ds.spacing.xl,
  },
  driverAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.surface,
    borderWidth: 3,
    borderColor: ds.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: ds.spacing.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  driverName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: ds.spacing.xl,
  },
  ratingLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  starButton: {
    padding: ds.spacing.xs,
  },
  star: {
    fontSize: 40,
    color: ds.colors.textSecondary,
  },
  starFilled: {
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagsSection: {
    marginBottom: ds.spacing.xl,
  },
  sectionLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
  },
  tag: {
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
  },
  tagSelected: {
    backgroundColor: ds.colors.primary,
    borderColor: ds.colors.primary,
  },
  tagText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  tagTextSelected: {
    color: ds.colors.backgroundDeep,
    fontWeight: ds.typography.weight.medium,
  },
  tipSection: {
    marginBottom: ds.spacing.xl,
  },
  tipOptions: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  tipButton: {
    flex: 1,
    paddingVertical: ds.spacing.md,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    alignItems: 'center',
  },
  tipButtonSelected: {
    backgroundColor: ds.colors.secondary,
    borderColor: ds.colors.secondary,
  },
  tipButtonText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
  },
  tipButtonTextSelected: {
    color: ds.colors.backgroundDeep,
  },
  customTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    paddingHorizontal: ds.spacing.md,
    borderWidth: 1,
    borderColor: ds.colors.primary,
  },
  customTipLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
  },
  customTipInput: {
    flex: 1,
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    paddingVertical: ds.spacing.md,
    marginLeft: ds.spacing.xs,
  },
  feedbackSection: {
    marginBottom: ds.spacing.xl,
  },
  feedbackInput: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    borderWidth: 1,
    borderColor: ds.colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    gap: ds.spacing.md,
  },
  submitButton: {
    width: '100%',
  },
  skipButton: {
    alignItems: 'center',
    padding: ds.spacing.md,
  },
  skipText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
});

export default RatingModal;
