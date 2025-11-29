/**
 * Admin Dashboard Main Screen
 * Comprehensive admin interface with user management, KYC approvals, and analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ds } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { CustomIcon } from '../ui/CustomIcon';
import { useEnhancedAppStore } from '../../store/useEnhancedAppStore';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { UserManagementSection } from './sections/UserManagementSection';
import { KYCApprovalsSection } from './sections/KYCApprovalsSection';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { SystemStatusSection } from './sections/SystemStatusSection';
import { KYCConfigurationSection } from './sections/KYCConfigurationSection';

type AdminTab = 'users' | 'kyc' | 'analytics' | 'system' | 'configuration';

type AdminDashboardProps = Record<string, never>;

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useEnhancedAppStore();
  const haptics = useHaptics();
  const sound = useSound();
  
  // Animation values
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(10);
  const refreshScale = useSharedValue(1);

  // Verify admin role
  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this area.',
        [{ text: 'OK' }]
      );
    }
  }, [user]);

  // Content animation when tab changes
  useEffect(() => {
    contentOpacity.value = withSpring(0, { damping: 15, stiffness: 300 });
    contentTranslateY.value = withSpring(10, { damping: 15, stiffness: 300 });
    
    setTimeout(() => {
      contentOpacity.value = withSpring(1, { damping: 15, stiffness: 300 });
      contentTranslateY.value = withSpring(0, { damping: 15, stiffness: 300 });
    }, 100);
  }, [activeTab, contentOpacity, contentTranslateY]);

  const handleRefresh = useCallback(async () => {
    haptics.trigger('selection');
    sound.play('tapSoft');
    refreshScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    refreshScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    haptics.trigger('confirm');
    sound.play('success');
    setIsRefreshing(false);
  }, [haptics, sound, refreshScale]);

  const handleTabChange = useCallback((tab: AdminTab) => {
    haptics.trigger('selection');
    sound.play('tapSoft');
    setActiveTab(tab);
  }, [haptics, sound]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const refreshAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: refreshScale.value }],
  }));

  const renderTabButton = (tab: AdminTab, label: string, icon: 'home' | 'activity' | 'location' | 'profile' | 'search' | 'menu' | 'chevronRight' | 'settings' | 'eye' | 'eye-off' | 'lock' | 'phone' | 'check' | 'alert' | 'user') => (
    <PremiumButton
      variant={activeTab === tab ? 'primary' : 'ghost'}
      size="sm"
      onPress={() => handleTabChange(tab)}
      style={styles.tabButton}
    >
      <CustomIcon name={icon} size={16} />
      <Text style={styles.tabButtonText}>{label}</Text>
    </PremiumButton>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagementSection />;
      case 'kyc':
        return <KYCApprovalsSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'system':
        return <SystemStatusSection />;
      case 'configuration':
        return <KYCConfigurationSection />;
      default:
        return <UserManagementSection />;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.accessDenied}>
        <GlassCard intensity={20} style={styles.accessDeniedCard}>
          <CustomIcon name="settings" size={48} color={ds.colors.error} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You do not have permission to access the admin dashboard.
          </Text>
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <GlassCard intensity={20} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <CustomIcon name="settings" size={32} color={ds.colors.primary} />
            <View>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Manage users, KYC, and system analytics
              </Text>
            </View>
          </View>
          <Animated.View style={refreshAnimatedStyle}>
            <PremiumButton
              variant="secondary"
              size="sm"
              onPress={handleRefresh}
              loading={isRefreshing}
            >
              <CustomIcon name="activity" size={16} />
            </PremiumButton>
          </Animated.View>
        </View>
      </GlassCard>

      {/* Tab Navigation */}
      <GlassCard intensity={15} style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {renderTabButton('users', 'Users', 'profile')}
          {renderTabButton('kyc', 'KYC', 'settings')}
          {renderTabButton('analytics', 'Analytics', 'activity')}
          {renderTabButton('system', 'System', 'location')}
          {renderTabButton('configuration', 'Config', 'activity')}
        </ScrollView>
      </GlassCard>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={ds.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentAnimatedStyle}>
          {renderActiveTab()}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing.lg,
  },
  accessDeniedCard: {
    padding: ds.spacing.xl,
    alignItems: 'center',
    maxWidth: 400,
  },
  accessDeniedTitle: {
    fontSize: ds.typography.size.display,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    textAlign: 'center',
    marginTop: ds.spacing.lg,
    marginBottom: ds.spacing.sm,
  },
  accessDeniedText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    lineHeight: ds.typography.lineHeight.body,
  },
  header: {
    margin: ds.spacing.md,
    padding: ds.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xs,
  },
  tabContainer: {
    marginHorizontal: ds.spacing.md,
    marginBottom: ds.spacing.sm,
    padding: ds.spacing.sm,
  },
  tabScrollContent: {
    gap: ds.spacing.sm,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    paddingHorizontal: ds.spacing.md,
  },
  tabButtonText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: ds.spacing.md,
    gap: ds.spacing.md,
  },
});
