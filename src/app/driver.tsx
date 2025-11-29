import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ds } from '../constants/theme';
import { GlassCard } from '../components/ui/GlassCard';
import { PremiumButton } from '../components/ui/PremiumButton';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../context/Store';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';

const MOBILE_FRAME_WIDTH = 375;
const MOBILE_FRAME_HEIGHT = 812;

export default function DriverHome() {
  const isOnline = useStore((state) => state.isOnline);
  const earnings = useStore((state) => state.earnings);
  const setOnline = useStore((state) => state.setOnline);

  const { trigger } = useHaptics();
  const { play } = useSound();

  const handleToggleOnline = () => {
    const next = !isOnline;
    setOnline(next);
    if (next) {
      trigger('heavy');
      play('power');
    } else {
      trigger('selection');
      play('click');
    }
  };

  return (
    <View style={styles.appContainer}>
      <LinearGradient colors={[ds.colors.background, ds.colors.surface]} style={StyleSheet.absoluteFill} />

      <View style={styles.mobileFrame}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Driver</Text>
            <Text style={styles.title}>Aura Console</Text>
          </View>
          <View style={styles.statusPill}>
            <View
              style={[styles.statusDot, { backgroundColor: isOnline ? ds.colors.primary : ds.colors.textSecondary }]}
            />
            <Text style={styles.statusLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          <GlassCard style={styles.primaryCard} elevated={true} intensity={30} tint="dark">
            <View style={styles.primaryContent}>
              <Text style={styles.blockTitle}>Shift Control</Text>
              <Text style={styles.blockBody}>
                Toggle your availability. Going online plays the full power-up haptic and sound cue.
              </Text>

              <PremiumButton
                onPress={handleToggleOnline}
                variant={isOnline ? 'secondary' : 'primary'}
                size="md"
                style={styles.toggleButton}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </PremiumButton>
            </View>
          </GlassCard>

          <GlassCard style={styles.secondaryCard} elevated={true} intensity={30} tint="dark">
            <View style={styles.secondaryContent}>
              <View style={styles.secondaryHeader}>
                <Text style={styles.secondaryTitle}>Earnings</Text>
                <Icon name="activity" size={18} active />
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>${earnings.today}</Text>
                  <Text style={styles.metricLabel}>Today</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>${earnings.week}</Text>
                  <Text style={styles.metricLabel}>Week</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>${earnings.month}</Text>
                  <Text style={styles.metricLabel}>Total</Text>
                </View>
              </View>

              <Text style={styles.helperText}>
                Earnings are simulated for now. Wire this panel to live telemetry when the backend is ready.
              </Text>
            </View>
          </GlassCard>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: ds.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing.xl,
  },
  mobileFrame: {
    width: MOBILE_FRAME_WIDTH,
    height: MOBILE_FRAME_HEIGHT,
    backgroundColor: ds.colors.background,
    borderRadius: 40,
    overflow: 'hidden',
    // Match rider shell outer frame ring + glow
    borderWidth: 10,
    borderColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOpacity: 0.9,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    paddingTop: ds.spacing.xxl,
    paddingHorizontal: ds.spacing.xl,
    paddingBottom: ds.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: ds.colors.textSecondary,
  },
  title: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.outlineSubtle,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: ds.spacing.sm,
  },
  statusLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: ds.spacing.xl,
    paddingBottom: ds.spacing.xxl,
    justifyContent: 'space-between',
  },
  primaryCard: {
    marginBottom: ds.spacing.xl,
  },
  primaryContent: {
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.lg,
    gap: ds.spacing.lg,
  },
  blockTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  blockBody: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  toggleButton: {
    marginTop: ds.spacing.lg,
    alignSelf: 'flex-start',
  },
  secondaryCard: {
    padding: 0,
  },
  secondaryContent: {
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.lg,
  },
  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ds.spacing.md,
  },
  secondaryTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ds.spacing.sm,
  },
  metricCard: {
    flex: 1,
    paddingVertical: ds.spacing.sm,
  },
  metricLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  metricValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
  },
  helperText: {
    marginTop: ds.spacing.lg,
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
});
