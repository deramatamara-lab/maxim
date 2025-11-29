/**
 * Ride Rating Component
 * Star rating system with feedback tags for ride receipts
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';

interface RideRatingProps {
  onRatingChange: (rating: number, tags: string[]) => void;
  initialRating?: number;
  initialTags?: string[];
}

const FEEDBACK_TAGS = [
  { id: 'professional', label: 'Professional', icon: 'activity' },
  { id: 'clean_car', label: 'Clean Car', icon: 'activity' },
  { id: 'safe_driver', label: 'Safe Driver', icon: 'activity' },
  { id: 'great_route', label: 'Great Route', icon: 'location' },
  { id: 'friendly', label: 'Friendly', icon: 'activity' },
  { id: 'on_time', label: 'On Time', icon: 'activity' },
  { id: 'good_music', label: 'Good Music', icon: 'activity' },
  { id: 'smooth_ride', label: 'Smooth Ride', icon: 'activity' },
  { id: 'helpful', label: 'Helpful', icon: 'activity' },
  { id: 'fast', label: 'Fast', icon: 'activity' },
];

const NEGATIVE_TAGS = [
  { id: 'rude', label: 'Rude', icon: 'activity' },
  { id: 'messy_car', label: 'Messy Car', icon: 'activity' },
  { id: 'reckless', label: 'Reckless', icon: 'activity' },
  { id: 'late', label: 'Late', icon: 'activity' },
  { id: 'wrong_route', label: 'Wrong Route', icon: 'location' },
  { id: 'bad_music', label: 'Bad Music', icon: 'activity' },
  { id: 'unhelpful', label: 'Unhelpful', icon: 'activity' },
  { id: 'slow', label: 'Slow', icon: 'activity' },
];

export const RideRating: React.FC<RideRatingProps> = ({
  onRatingChange,
  initialRating = 0,
  initialTags = [],
}) => {
  const [rating, setRating] = useState(initialRating);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const haptics = useHaptics();
  const sound = useSound();

  // Individual shared values for star animations (hooks must be called at top level)
  const star1Scale = useSharedValue(1);
  const star2Scale = useSharedValue(1);
  const star3Scale = useSharedValue(1);
  const star4Scale = useSharedValue(1);
  const star5Scale = useSharedValue(1);
  const starScales = useMemo(() => [star1Scale, star2Scale, star3Scale, star4Scale, star5Scale], [star1Scale, star2Scale, star3Scale, star4Scale, star5Scale]);

  const handleStarPress = useCallback((starRating: number) => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    
    setRating(starRating);
    
    // Animate the pressed star
    starScales[starRating - 1].value = withSpring(1.3, { damping: 15 });
    setTimeout(() => {
      starScales[starRating - 1].value = withSpring(1, { damping: 15 });
    }, 200);

    // Clear tags when rating changes significantly
    if (Math.abs(starRating - initialRating) > 1) {
      setSelectedTags([]);
    }

    onRatingChange(starRating, selectedTags);
  }, [haptics, sound, initialRating, selectedTags, onRatingChange, starScales]);

  const handleTagPress = useCallback((tagId: string) => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    
    setSelectedTags(prev => {
      const newTags = prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId];
      
      onRatingChange(rating, newTags);
      return newTags;
    });
  }, [haptics, sound, rating, onRatingChange]);

  const getRatingText = () => {
    if (rating === 0) return 'Rate your ride';
    if (rating === 1) return 'Poor';
    if (rating === 2) return 'Fair';
    if (rating === 3) return 'Good';
    if (rating === 4) return 'Great';
    if (rating === 5) return 'Excellent';
    return 'Rate your ride';
  };

  const getRatingColor = () => {
    if (rating <= 2) return ds.colors.danger;
    if (rating === 3) return ds.colors.warning;
    return ds.colors.success;
  };

  const availableTags = rating <= 2 ? NEGATIVE_TAGS : FEEDBACK_TAGS;

  // Create animated styles for each star at the component level
  const star1Style = useAnimatedStyle(() => ({ transform: [{ scale: starScales[0].value }] }));
  const star2Style = useAnimatedStyle(() => ({ transform: [{ scale: starScales[1].value }] }));
  const star3Style = useAnimatedStyle(() => ({ transform: [{ scale: starScales[2].value }] }));
  const star4Style = useAnimatedStyle(() => ({ transform: [{ scale: starScales[3].value }] }));
  const star5Style = useAnimatedStyle(() => ({ transform: [{ scale: starScales[4].value }] }));
  const starStyles = [star1Style, star2Style, star3Style, star4Style, star5Style];

  return (
    <View style={styles.container}>
      {/* Rating Section */}
      <GlassCard elevated style={styles.ratingCard}>
        <Text style={styles.sectionTitle}>How was your ride?</Text>
        
        {/* Stars */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => handleStarPress(star)}
                style={styles.starButton}
                accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
                accessibilityRole="button"
              >
                <Animated.View style={starStyles[star - 1]}>
                  <Icon
                    name="star"
                    size={40}
                    color={star <= rating ? getRatingColor() : ds.colors.border}
                  />
                </Animated.View>
              </Pressable>
            ))}
        </View>

        <Text style={[styles.ratingText, { color: getRatingColor() }]}>
          {getRatingText()}
        </Text>
      </GlassCard>

      {/* Feedback Tags */}
      {rating > 0 && (
        <GlassCard elevated style={styles.tagsCard}>
          <Text style={styles.sectionTitle}>
            {rating <= 2 ? 'What went wrong?' : 'What went well?'}
          </Text>
          
          <View style={styles.tagsContainer}>
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              
              return (
                <Pressable
                  key={tag.id}
                  onPress={() => handleTagPress(tag.id)}
                  style={[
                    styles.tagButton,
                    isSelected && styles.tagButtonSelected,
                    isSelected && rating <= 2 && styles.tagButtonNegative,
                  ]}
                  accessibilityLabel={tag.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.tagContent}>
                    <Icon
                      name="activity"
                      size={16}
                      color={isSelected 
                        ? (rating <= 2 ? ds.colors.danger : ds.colors.success)
                        : ds.colors.textSecondary
                      }
                    />
                    <Text style={[
                      styles.tagLabel,
                      isSelected && styles.tagLabelSelected,
                      isSelected && rating <= 2 && styles.tagLabelNegative,
                    ]}>
                      {tag.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedTags.length > 0 && (
            <Text style={styles.selectedCount}>
              {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
            </Text>
          )}
        </GlassCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: ds.spacing.lg,
  },
  ratingCard: {
    padding: ds.spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.lg,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  starButton: {
    padding: ds.spacing.xs,
  },
  ratingText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
  },
  tagsCard: {
    padding: ds.spacing.lg,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  tagButton: {
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.surface,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
  },
  tagButtonSelected: {
    backgroundColor: `${ds.colors.success}15`,
    borderColor: ds.colors.success,
  },
  tagButtonNegative: {
    backgroundColor: `${ds.colors.danger}15`,
    borderColor: ds.colors.danger,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  tagLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  tagLabelSelected: {
    color: ds.colors.success,
    fontWeight: ds.typography.weight.semibold,
  },
  tagLabelNegative: {
    color: ds.colors.danger,
    fontWeight: ds.typography.weight.semibold,
  },
  selectedCount: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RideRating;
