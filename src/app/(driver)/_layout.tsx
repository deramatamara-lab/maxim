/**
 * Driver App Layout
 * Professional driver dashboard with earnings and ride management
 */

import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, StatusBar } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { FloatingTabBar, TabId } from '@/components/ui/FloatingTabBar';
import { useEnhancedAppStore } from '@/store/useEnhancedAppStore';

export default function DriverLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useEnhancedAppStore((state) => state.user);
  
  // Determine active tab from pathname
  const getActiveTab = (): TabId => {
    if (pathname.includes('earnings')) return 'activity';
    if (pathname.includes('profile')) return 'profile';
    return 'home';
  };
  
  const handleTabChange = (tab: TabId) => {
    switch (tab) {
      case 'home':
        router.push('/(driver)');
        break;
      case 'activity':
        router.push('/(driver)/earnings');
        break;
      case 'location':
        router.push('/(driver)'); // Map view
        break;
      case 'profile':
        router.push('/(driver)'); // Driver profile
        break;
      default:
        router.push('/(driver)');
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
            <Text style={styles.greeting}>Good evening</Text>
            <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Online</Text>
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
  driverName: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  statusBadge: {
    backgroundColor: ds.colors.secondary,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.md,
  },
  statusText: {
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
