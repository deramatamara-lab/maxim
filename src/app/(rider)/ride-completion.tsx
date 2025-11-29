/**
 * Ride Completion Screen
 * Production-ready ride completion with rating system, receipt generation, and driver feedback
 * Better than Uber's basic completion process with enhanced UX and error handling
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ds } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { RatingService } from '@/services/RatingService';
import { ReceiptGenerator } from '../../api/ReceiptGenerator';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { useFadeAnimation } from '../../hooks/useAnimations';
import { useTheme } from '../../providers/ThemeLocaleProvider';
import { log } from '../../utils/logger';
import { useEnhancedRideState } from '../../store/useEnhancedAppStore';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import type { Receipt } from '../../api/payment';

export default function RideCompletionScreen() {
  const { trigger } = useHaptics();
  const { play } = useSound();
  const router = useRouter();
  const { currentRide, isLoadingRide } = useEnhancedRideState();
  const { colors, isDark } = useTheme();
  const { selectedPaymentMethod } = usePaymentMethods();

  const [rating, setRating] = useState({
    overall: 0,
    safety: 0,
    cleanliness: 0,
    navigation: 0,
    communication: 0,
  });
  const [feedback, setFeedback] = useState('');
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const { animatedStyle: cardAnimatedStyle, animateIn: animateCardIn } = useFadeAnimation('modalEnter');

  const handleShareReceipt = useCallback(async () => {
    if (!receipt) return;
    trigger('tap');
    play('tapSoft');
    Alert.alert('Receipt URL', `Receipt available at: ${receipt.url}`);
  }, [receipt, trigger, play]);

  const handleRatingPress = useCallback((starRating: number) => {
    trigger('tap');
    play('tapSoft');
    setRating(prev => ({ ...prev, overall: starRating }));
  }, [trigger, play]);

  const handleCustomTipChange = useCallback((value: string) => {
    trigger('tap');
    play('tapSoft');
    setCustomTip(value);
    setSelectedTip(parseInt(value, 10) || null);
  }, [trigger, play]);

  const handleTipSelect = useCallback((amount: number) => {
    trigger('tap');
    play('tapSoft');
    setSelectedTip(amount);
  }, [trigger, play]);

  const handleSubmitRating = useCallback(async () => {
    if (!currentRide || rating.overall === 0) {
      trigger('error');
      play('warning');
      return;
    }

    setIsSubmitting(true);
    trigger('confirm');
    play('success');

    try {
      const ratingResult = await RatingService.submitRating(currentRide.id, {
        rating: {
          overall: rating.overall,
          safety: rating.safety || rating.overall,
          cleanliness: rating.cleanliness || rating.overall,
          navigation: rating.navigation || rating.overall,
          communication: rating.communication || rating.overall,
        },
        feedback: feedback.trim(),
        tipAmount: selectedTip || 0,
      });

      if (!ratingResult.success) {
        throw new Error(ratingResult.error || 'Failed to submit rating');
      }

      setIsGeneratingReceipt(true);
      let retryCount = 0;
      const maxRetries = 3;
      let generatedReceipt: Receipt | null = null;

      while (retryCount < maxRetries && !generatedReceipt) {
        try {
          // Log when payment method data is unavailable for production monitoring
          if (!selectedPaymentMethod) {
            log.warn('Receipt generation using fallback payment method', { event: 'receipt_fallback_payment_used', component: 'rideCompletion' });
          }

          generatedReceipt = await ReceiptGenerator.generateReceipt({
            rideId: currentRide.id,
            fare: currentRide.fare,
            tip: selectedTip || 0,
            rating: rating.overall,
            feedback: feedback.trim(),
            paymentMethod: selectedPaymentMethod ? {
              type: selectedPaymentMethod.type,
              last4: 'last4' in selectedPaymentMethod ? selectedPaymentMethod.last4 : '0000',
              brand: 'brand' in selectedPaymentMethod ? selectedPaymentMethod.brand : 'unknown',
            } : undefined,
          });
        } catch (receiptError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            log.error('Failed to generate receipt after retries', { event: 'generate_receipt_retries_failed', component: 'rideCompletion', retryCount, maxRetries }, receiptError);
            Alert.alert(
              'Receipt Warning',
              'Your rating was submitted, but we couldn\'t generate a receipt immediately. It will be available in your ride history.',
              [{ text: 'OK' }]
            );
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (generatedReceipt) {
        setReceipt(generatedReceipt);
        setShowReceipt(true);
      }

      const successMessage = generatedReceipt
        ? 'Your rating and feedback have been submitted. Receipt generated successfully.'
        : 'Your rating and feedback have been submitted. Receipt will be available in your ride history.';

      const buttons = showReceipt
        ? [
            { text: 'Share Receipt', onPress: () => handleShareReceipt() },
            { text: 'Done', onPress: () => router.back(), style: 'cancel' as const },
          ]
        : [
            { text: 'View Ride History', onPress: () => router.back() },
            { text: 'Done', onPress: () => router.back(), style: 'cancel' as const },
          ];

      Alert.alert('Success', successMessage, buttons);
    } catch (error) {
      trigger('error');
      play('warning');
      log.error('Failed to submit rating', { event: 'submit_rating_failed', component: 'rideCompletion' }, error);
      const userMessage = error instanceof Error ? error.message : 'An unexpected error occurred while submitting your rating.';
      const buttons = isSubmitting
        ? [
            { text: 'Retry', onPress: () => handleSubmitRating() },
            { text: 'Skip for Now', onPress: () => router.back(), style: 'cancel' as const },
          ]
        : [
            { text: 'OK', onPress: () => router.back() },
          ];

      Alert.alert('Submission Issue', userMessage, buttons);
    } finally {
      setIsSubmitting(false);
      setIsGeneratingReceipt(false);
    }
  }, [currentRide, rating, feedback, selectedTip, selectedPaymentMethod, trigger, play, router, showReceipt, handleShareReceipt, isSubmitting]);

  useEffect(() => {
    if (currentRide) {
      animateCardIn();
    }
  }, [currentRide, animateCardIn]);

  if (isLoadingRide || !currentRide) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <LinearGradient
          colors={[colors.backgroundDeep, colors.background]}
          style={styles.background}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={[colors.backgroundDeep, colors.background]}
        style={styles.background}
      />
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: ds.spacing.xxxl }}>
        <Animated.View style={cardAnimatedStyle}>
          <GlassCard elevated intensity={30} tint="dark" style={styles.mainCard}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Trip Complete</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Rate your experience</Text>
            </View>

            <View style={styles.driverSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Driver</Text>
              <Text style={[styles.driverName, { color: colors.textPrimary }]}>
                {currentRide.driver?.name || 'Driver'}
              </Text>
              <Text style={[styles.vehicleInfo, { color: colors.textSecondary }]}>
                {currentRide.driver?.vehicle?.make} {currentRide.driver?.vehicle?.model}
              </Text>
            </View>

            <View style={styles.ratingSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overall Rating</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    style={styles.starContainer}
                    onPress={() => handleRatingPress(star)}
                  >
                    <Text style={{ fontSize: 32, color: star <= rating.overall ? colors.primary : colors.border }}>
                      {star <= rating.overall ? '★' : '☆'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.feedbackSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Additional Feedback</Text>
              <TextInput
                style={[styles.feedbackInput, { color: colors.textPrimary, borderColor: colors.border }]}
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Share your experience..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.tipSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Add Tip</Text>
              <View style={styles.tipOptions}>
                {[15, 20, 25].map((percent) => {
                  const tipAmount = currentRide.fare.total * (percent / 100);
                  return (
                    <PremiumButton
                      key={percent}
                      variant={selectedTip === tipAmount ? 'primary' : 'secondary'}
                      size="sm"
                      onPress={() => handleTipSelect(tipAmount)}
                      style={styles.tipButton}
                    >
                      {percent}%
                    </PremiumButton>
                  );
                })}
                <View style={[styles.tipCustomContainer, selectedTip === (customTip ? parseInt(customTip, 10) : null) && styles.tipCustomSelected]}>
                  <TextInput
                    style={styles.tipCustomInput}
                    value={customTip}
                    onChangeText={handleCustomTipChange}
                    placeholder="Custom"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <PremiumButton
              onPress={handleSubmitRating}
              variant="primary"
              size="lg"
              loading={isSubmitting || isGeneratingReceipt}
              disabled={isSubmitting || isGeneratingReceipt}
              style={styles.submitButton}
            >
              {isGeneratingReceipt ? 'Generating Receipt...' : isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </PremiumButton>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: ds.spacing.xl,
    paddingBottom: ds.spacing.lg,
  },
  title: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.xs,
  },
  subtitle: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
  },
  content: {
    flex: 1,
    paddingHorizontal: ds.spacing.xl,
  },
  mainCard: {
    marginBottom: ds.spacing.xl,
  },
  driverSection: {
    marginBottom: ds.spacing.lg,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.md,
  },
  driverName: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.medium,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.xs,
  },
  vehicleInfo: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: ds.spacing.sm,
  },
  starContainer: {
    padding: ds.spacing.sm,
  },
  ratingSection: {
    marginBottom: ds.spacing.xl,
  },
  feedbackSection: {
    marginBottom: ds.spacing.xl,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    minHeight: ds.spacing.xxxl,
    textAlignVertical: 'top',
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
  },
  tipCustomContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: ds.radius.sm,
    justifyContent: 'center',
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
  },
  tipCustomSelected: {
    borderColor: ds.colors.primary,
  },
  tipCustomInput: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    textAlign: 'center',
  },
  submitButton: {
    marginBottom: ds.spacing.xl,
  },
});
