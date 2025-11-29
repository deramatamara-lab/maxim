/**
 * Rider Location Screen
 * Map and location services
 */

import React, { useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ds } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { CustomIcon } from '../../components/ui/CustomIcon';
import { useTranslation } from 'react-i18next';
import { useSound } from '../../hooks/useSound';
import { useHaptics } from '../../hooks/useHaptics';

export default function LocationScreen() {
  const router = useRouter();
  const { play } = useSound();
  const { trigger } = useHaptics();
  const { t } = useTranslation();

  const handleBackToHome = useCallback(() => {
    trigger('tap');
    play('tapSoft');
    router.push('/');
  }, [trigger, play, router]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[ds.colors.backgroundDeep, ds.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        {/* Location Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('location.title')}</Text>
          <Text style={styles.subtitle}>{t('location.subtitle')}</Text>
        </View>

        {/* Map Placeholder */}
        <GlassCard style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <CustomIcon name="location" size={64} color={ds.colors.primary} />
            <Text style={styles.mapTitle}>{t('location.map_coming_soon')}</Text>
            <Text style={styles.mapDescription}>
              {t('location.map_description')}
            </Text>
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <CustomIcon name="check" size={16} color={ds.colors.secondary} />
                <Text style={styles.featureText}>{t('location.real_time_gps')}</Text>
              </View>
              <View style={styles.feature}>
                <CustomIcon name="check" size={16} color={ds.colors.secondary} />
                <Text style={styles.featureText}>{t('location.route_optimization')}</Text>
              </View>
              <View style={styles.feature}>
                <CustomIcon name="check" size={16} color={ds.colors.secondary} />
                <Text style={styles.featureText}>{t('location.traffic_updates')}</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <PremiumButton
            variant="primary"
            size="lg"
            onPress={handleBackToHome}
          >
            {t('location.back_to_home')}
          </PremiumButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  content: {
    flex: 1,
    padding: ds.spacing.xl,
  },
  header: {
    marginBottom: ds.spacing.xl,
    paddingTop: ds.spacing.lg,
  },
  title: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
  },
  subtitle: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  mapContainer: {
    flex: 1,
    padding: ds.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  mapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  mapTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.lg,
    marginBottom: ds.spacing.sm,
  },
  mapDescription: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: ds.spacing.xl,
  },
  featuresContainer: {
    gap: ds.spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  featureText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  actions: {
    paddingTop: ds.spacing.lg,
  },
});
