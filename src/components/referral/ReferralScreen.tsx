/**
 * ReferralScreen - User referral program
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Share, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { log } from '@/utils/logger';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  earnings: number;
  referralCode: string;
}

interface Props {
  stats?: ReferralStats;
  onClose?: () => void;
}

const mockStats: ReferralStats = {
  totalReferrals: 12,
  pendingReferrals: 3,
  earnings: 60,
  referralCode: 'AURA2024',
};

export function ReferralScreen({ stats = mockStats, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const haptics = useHaptics();

  const handleShare = useCallback(async () => {
    haptics.trigger('tap');
    try {
      await Share.share({
        message: `Join Aura and get $10 off your first ride! Use my code: ${stats.referralCode}\n\nDownload: https://aura.app/invite/${stats.referralCode}`,
        title: 'Share Aura',
      });
      log.info('Referral shared', { event: 'referral_share', component: 'ReferralScreen', code: stats.referralCode });
    } catch (err) {
      log.error('Share failed', { event: 'referral_share_failed', component: 'ReferralScreen' }, err);
    }
  }, [stats.referralCode, haptics]);

  const handleCopy = useCallback(() => {
    haptics.trigger('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    log.info('Code copied', { event: 'referral_copy', component: 'ReferralScreen', code: stats.referralCode });
  }, [stats.referralCode, haptics]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onClose && (
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <CustomIcon name="activity" size={24} color={ds.colors.text} />
        </Pressable>
      )}

      <Animated.View entering={FadeInDown.delay(100)}>
        <Text style={styles.title}>Refer & Earn</Text>
        <Text style={styles.subtitle}>Give $10, Get $10 for each friend who joins</Text>
      </Animated.View>

      {/* Stats Cards */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalReferrals}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingReferrals}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statValue, styles.earnings]}>${stats.earnings}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </GlassCard>
      </Animated.View>

      {/* Referral Code */}
      <Animated.View entering={FadeInDown.delay(300)}>
        <GlassCard style={styles.codeCard} elevated>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{stats.referralCode}</Text>
            <Pressable onPress={handleCopy} style={styles.copyBtn}>
              <Text style={styles.copyText}>{copied ? '✓ Copied' : 'Copy'}</Text>
            </Pressable>
          </View>
        </GlassCard>
      </Animated.View>

      {/* How It Works */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <GlassCard style={styles.stepsCard}>
          {[
            { icon: 'activity', text: 'Share your unique code with friends' },
            { icon: 'profile', text: 'Friend signs up and takes first ride' },
            { icon: 'activity', text: 'You both get $10 in ride credits!' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </GlassCard>
      </Animated.View>

      {/* Share Button */}
      <Animated.View entering={FadeInDown.delay(500)} style={styles.shareSection}>
        <PremiumButton onPress={handleShare} variant="primary" size="lg">
          Share Invite Link
        </PremiumButton>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ds.colors.backgroundDeep },
  content: { padding: ds.spacing.lg },
  closeBtn: { position: 'absolute', right: 0, top: 0, padding: ds.spacing.sm, zIndex: 10 },
  title: { fontFamily: ds.typography.family, fontWeight: '700', fontSize: ds.typography.size.display, color: ds.colors.text, textAlign: 'center' },
  subtitle: { fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.textSecondary, textAlign: 'center', marginTop: ds.spacing.xs, marginBottom: ds.spacing.lg },
  statsRow: { flexDirection: 'row', gap: ds.spacing.sm, marginBottom: ds.spacing.lg },
  statCard: { flex: 1, padding: ds.spacing.md, alignItems: 'center' },
  statValue: { fontFamily: ds.typography.family, fontWeight: '700', fontSize: ds.typography.size.title, color: ds.colors.text },
  statLabel: { fontFamily: ds.typography.family, fontSize: ds.typography.size.caption, color: ds.colors.textSecondary, marginTop: ds.spacing.xs },
  earnings: { color: ds.colors.success },
  codeCard: { padding: ds.spacing.lg, marginBottom: ds.spacing.lg },
  codeLabel: { fontFamily: ds.typography.family, fontSize: ds.typography.size.caption, color: ds.colors.textSecondary, textAlign: 'center', marginBottom: ds.spacing.sm },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ds.spacing.md },
  codeText: { fontFamily: ds.typography.family, fontWeight: '700', fontSize: ds.typography.size.display, color: ds.colors.primary, letterSpacing: 4 },
  copyBtn: { backgroundColor: ds.colors.surface, paddingHorizontal: ds.spacing.md, paddingVertical: ds.spacing.sm, borderRadius: ds.radius.md },
  copyText: { fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.primary },
  sectionTitle: { fontFamily: ds.typography.family, fontWeight: '600', fontSize: ds.typography.size.bodyLg, color: ds.colors.text, marginBottom: ds.spacing.sm },
  stepsCard: { padding: ds.spacing.md, marginBottom: ds.spacing.lg },
  step: { flexDirection: 'row', alignItems: 'center', paddingVertical: ds.spacing.sm, gap: ds.spacing.md },
  stepIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: ds.colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontFamily: ds.typography.family, fontWeight: '700', fontSize: ds.typography.size.body, color: ds.colors.backgroundDeep },
  stepText: { flex: 1, fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.text },
  shareSection: { marginTop: ds.spacing.md },
});

export default ReferralScreen;
