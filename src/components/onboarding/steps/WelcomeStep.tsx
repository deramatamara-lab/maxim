/**
 * Welcome Step
 * First step of onboarding flow - introduces the app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon } from '../../ui/CustomIcon';

interface WelcomeStepProps {
  onComplete: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  onComplete,
  onBack: _onBack,
  canGoBack: _canGoBack,
  isLastStep: _isLastStep,
}) => {
  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <GlassCard intensity={20} style={styles.iconContainer}>
          <CustomIcon name="home" size={48} color={ds.colors.primary} />
        </GlassCard>
        
        <Text style={styles.title}>Welcome to Aura</Text>
        <Text style={styles.subtitle}>
          Premium rides with cyberpunk aesthetics
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        <View style={styles.feature}>
          <GlassCard intensity={15} style={styles.featureIcon}>
            <CustomIcon name="location" size={24} color={ds.colors.secondary} />
          </GlassCard>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Real-time Tracking</Text>
            <Text style={styles.featureDescription}>
              Track your ride with precision GPS
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <GlassCard intensity={15} style={styles.featureIcon}>
            <CustomIcon name="activity" size={24} color={ds.colors.secondary} />
          </GlassCard>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Smart Matching</Text>
            <Text style={styles.featureDescription}>
              AI-powered driver matching
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <GlassCard intensity={15} style={styles.featureIcon}>
            <CustomIcon name="profile" size={24} color={ds.colors.secondary} />
          </GlassCard>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Verified Drivers</Text>
            <Text style={styles.featureDescription}>
              Professional, background-checked drivers
            </Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionSection}>
        <PremiumButton
          variant="primary"
          size="lg"
          onPress={onComplete}
          style={styles.continueButton}
        >
          Get Started
        </PremiumButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: ds.spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: ds.spacing.xl,
    paddingBottom: ds.spacing.xxxl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.xl,
  },
  title: {
    fontSize: ds.typography.size.hero,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    textAlign: 'center',
    marginBottom: ds.spacing.sm,
  },
  subtitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    lineHeight: ds.typography.lineHeight.body,
  },
  featuresSection: {
    flex: 1,
    gap: ds.spacing.lg,
    marginBottom: ds.spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  featureDescription: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.body,
  },
  actionSection: {
    paddingTop: ds.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  continueButton: {
    marginBottom: ds.spacing.md,
  },
});
