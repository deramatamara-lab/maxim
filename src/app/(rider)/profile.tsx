/**
 * Rider Profile Screen
 * User profile, settings, and account management
 */

import React, { useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
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
import { useEnhancedAppStore } from '@/store/useEnhancedAppStore';
import { safeNavigate } from '@/utils/navigation';

export default function ProfileScreen() {
  const router = useRouter();
  const { play } = useSound();
  const { trigger } = useHaptics();
  const { user, logout } = useEnhancedAppStore();
  const { t } = useTranslation();

  const handleNavigation = useCallback((screen: string) => {
    trigger('tap');
    play('tapSoft');
    safeNavigate(router, screen);
  }, [trigger, play, router]);

  const handleLogout = useCallback(async () => {
    trigger('confirm');
    play('success');
    await logout();
    router.replace('/');
  }, [trigger, play, logout, router]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[ds.colors.backgroundDeep, ds.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <CustomIcon name="profile" size={48} color={ds.colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.name || 'Rider'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'rider@example.com'}</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
          <GlassCard style={styles.card}>
            <Pressable 
              style={styles.menuItem}
              onPress={() => handleNavigation('/(rider)/add-payment')}
            >
              <CustomIcon name="lock" size={20} color={ds.colors.primary} />
              <Text style={styles.menuText}>{t('profile.payment_methods')}</Text>
              <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
            </Pressable>
          </GlassCard>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          <GlassCard style={styles.card}>
            <Pressable style={styles.menuItem}>
              <CustomIcon name="settings" size={20} color={ds.colors.primary} />
              <Text style={styles.menuText}>{t('profile.notifications')}</Text>
              <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.menuItem}>
              <CustomIcon name="settings" size={20} color={ds.colors.primary} />
              <Text style={styles.menuText}>{t('profile.privacy')}</Text>
              <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.menuItem}>
              <CustomIcon name="settings" size={20} color={ds.colors.primary} />
              <Text style={styles.menuText}>{t('profile.help_support')}</Text>
              <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
            </Pressable>
          </GlassCard>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <PremiumButton
            variant="ghost"
            size="lg"
            onPress={handleLogout}
          >
            {t('profile.sign_out')}
          </PremiumButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ds.spacing.xl,
    paddingBottom: ds.spacing.xxxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: ds.spacing.xxl,
    paddingTop: ds.spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.glass,
    borderWidth: 2,
    borderColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.md,
  },
  userName: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.xs,
  },
  userEmail: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  section: {
    marginBottom: ds.spacing.xl,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.lg,
    paddingHorizontal: ds.spacing.sm,
  },
  card: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.spacing.lg,
    paddingHorizontal: ds.spacing.lg,
    gap: ds.spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
  },
  divider: {
    height: 1,
    backgroundColor: ds.colors.glassBorder,
    marginHorizontal: ds.spacing.lg,
  },
});
