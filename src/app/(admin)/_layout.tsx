/**
 * Admin Dashboard Layout
 * Professional admin interface with analytics and management tools
 */

import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, StatusBar } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { FloatingTabBar, TabId } from '@/components/ui/FloatingTabBar';
import { useEnhancedAppStore } from '@/store/useEnhancedAppStore';

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useEnhancedAppStore((state) => state.user);
  
  // Determine active tab from pathname
  const getActiveTab = (): TabId => {
    if (pathname.includes('dashboard')) return 'home';
    if (pathname.includes('analytics')) return 'activity';
    if (pathname.includes('users')) return 'location';
    if (pathname.includes('settings')) return 'profile';
    return 'home';
  };
  
  const handleTabChange = (tab: TabId) => {
    switch (tab) {
      case 'home':
        router.push('/(admin)/dashboard');
        break;
      case 'activity':
        router.push('/(admin)/dashboard'); // Analytics section
        break;
      case 'location':
        router.push('/(admin)/dashboard'); // User management
        break;
      case 'profile':
        router.push('/(admin)/dashboard'); // Settings
        break;
      default:
        router.push('/(admin)/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[ds.colors.backgroundDeep, ds.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <NoiseOverlay opacity={ds.effects.noiseOpacity} />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <Text style={styles.adminName}>{user?.name || 'Administrator'}</Text>
          </View>
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>ADMIN</Text>
          </View>
        </View>
      </SafeAreaView>
      
      {/* Main Content */}
      <View style={styles.content}>
        <Slot />
      </View>
      
      {/* Bottom Tab Bar */}
      <View style={styles.tabBarContainer}>
        <FloatingTabBar 
          activeTab={getActiveTab()} 
          onTabChange={handleTabChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  header: {
    paddingTop: ds.spacing.xl,
    paddingHorizontal: ds.spacing.xl,
    paddingBottom: ds.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  adminName: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  adminBadge: {
    backgroundColor: ds.colors.primary,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.md,
  },
  adminText: {
    color: '#000',
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold as '600',
    fontFamily: ds.typography.family,
  },
  content: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: ds.spacing.lg,
    paddingHorizontal: ds.spacing.xl,
  },
});
