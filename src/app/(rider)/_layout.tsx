/**
 * Rider App Layout
 * Provides the shell for all rider screens with navigation
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, StatusBar, Pressable, Animated } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { FloatingTabBar, TabId } from '@/components/ui/FloatingTabBar';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { GlassCard } from '@/components/ui/GlassCard';
import { useEnhancedAppStore } from '@/store/useEnhancedAppStore';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from 'react-i18next';
import { safeNavigate } from '@/utils/navigation';

export default function RiderLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useEnhancedAppStore((state) => state.user);
  const { play } = useSound();
  const { trigger } = useHaptics();
  const { logout } = useEnhancedAppStore();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Menu animation using useState to prevent ref access during render
  const [menuSlideAnim] = useState(new Animated.Value(-300));
  
  // Animate menu when state changes
  useEffect(() => {
    Animated.timing(menuSlideAnim, {
      toValue: isMenuOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isMenuOpen, menuSlideAnim]);

  const handleMenuToggle = () => {
    trigger('tap');
    play('tapSoft');
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleMenuAction = (action: () => void) => {
    trigger('tap');
    play('tapSoft');
    action();
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    handleMenuAction(async () => {
      trigger('confirm');
      play('success');
      await logout();
      router.replace('/');
    });
  };
  
  // Determine active tab from pathname
  const getActiveTab = (): TabId => {
    if (pathname.includes('active-ride')) return 'activity';
    if (pathname.includes('ride-history')) return 'activity';
    if (pathname.includes('profile')) return 'profile';
    if (pathname.includes('location')) return 'location';
    if (pathname.includes('add-payment')) return 'profile';
    return 'home';
  };
  
  // Check if we're on the home screen (cinematic mode handles its own UI)
  const isHomeScreen = pathname === '/' || pathname === '/(rider)' || pathname === '/(rider)/';
  
  const handleTabChange = (tab: TabId) => {
    switch (tab) {
      case 'home':
        safeNavigate(router, '/');
        break;
      case 'activity':
        safeNavigate(router, '/(rider)/ride-history');
        break;
      case 'location':
        safeNavigate(router, '/location');
        break;
      case 'profile':
        safeNavigate(router, '/profile');
        break;
      default:
        safeNavigate(router, '/');
    }
  };

  // Home screen renders its own cinematic shell (background, header, nav)
  if (isHomeScreen) {
    // RiderHome manages globe, map, header and its own bottom navigation.
    // Layout should not wrap it with an extra container or tab bar.
    return <Slot />;
  }

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
          <Pressable onPress={handleMenuToggle} style={styles.menuButton}>
            <CustomIcon name="menu" size={24} color={ds.colors.textPrimary} />
          </Pressable>
          <Text style={styles.greeting}>Hello, {user?.name || 'Rider'}</Text>
          <Text style={styles.appName}>Aura</Text>
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

      {/* Menu Overlay */}
      {isMenuOpen && (
        <Pressable style={styles.menuOverlay} onPress={handleMenuClose}>
          <Animated.View 
            style={[
              styles.menuContainer,
              { transform: [{ translateX: menuSlideAnim }] }
            ]}
          >
            <GlassCard style={styles.menuCard}>
              <View style={styles.menuHeader}>
                <CustomIcon name="profile" size={32} color={ds.colors.primary} />
                <Text style={styles.menuUserName}>{user?.name || 'Rider'}</Text>
                <Text style={styles.menuUserEmail}>{user?.email || 'rider@example.com'}</Text>
              </View>
              
              <View style={styles.menuItems}>
                <Pressable 
                  style={styles.menuItem}
                  onPress={() => handleMenuAction(() => safeNavigate(router, '/profile'))}
                >
                  <CustomIcon name="profile" size={20} color={ds.colors.textSecondary} />
                  <Text style={styles.menuItemText}>{t('nav.profile')}</Text>
                  <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
                </Pressable>
                
                <Pressable 
                  style={styles.menuItem}
                  onPress={() => handleMenuAction(() => safeNavigate(router, '/(rider)/add-payment'))}
                >
                  <CustomIcon name="lock" size={20} color={ds.colors.textSecondary} />
                  <Text style={styles.menuItemText}>{t('profile.payment_methods')}</Text>
                  <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
                </Pressable>
                
                <View style={styles.menuDivider} />
                
                <Pressable 
                  style={styles.menuItem}
                  onPress={() => handleMenuAction(() => {})}
                >
                  <CustomIcon name="settings" size={20} color={ds.colors.textSecondary} />
                  <Text style={styles.menuItemText}>{t('profile.settings')}</Text>
                  <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
                </Pressable>
                
                <Pressable 
                  style={styles.menuItem}
                  onPress={() => handleMenuAction(() => {})}
                >
                  <CustomIcon name="phone" size={20} color={ds.colors.textSecondary} />
                  <Text style={styles.menuItemText}>{t('profile.help_support')}</Text>
                  <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
                </Pressable>
                
                <View style={styles.menuDivider} />
                
                <Pressable 
                  style={[styles.menuItem, styles.logoutItem]}
                  onPress={handleLogout}
                >
                  <CustomIcon name="alert" size={20} color={ds.colors.error} />
                  <Text style={[styles.menuItemText, styles.logoutText]}>{t('profile.sign_out')}</Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        </Pressable>
      )}
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
  menuButton: {
    padding: ds.spacing.sm,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.glass,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  greeting: {
    fontSize: ds.typography.size.bodyLg,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    flex: 1,
    marginLeft: ds.spacing.md,
  },
  appName: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  content: {
    flex: 1,
  },
  fullContent: {
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
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    height: '100%',
    zIndex: 1001,
  },
  menuCard: {
    flex: 1,
    margin: ds.spacing.md,
    padding: 0,
  },
  menuHeader: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.glassBorder,
  },
  menuUserName: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.sm,
  },
  menuUserEmail: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  menuItems: {
    flex: 1,
    paddingTop: ds.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.spacing.lg,
    paddingHorizontal: ds.spacing.lg,
    gap: ds.spacing.md,
  },
  logoutItem: {
    marginTop: 'auto',
    marginBottom: ds.spacing.xl,
  },
  menuItemText: {
    flex: 1,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
  },
  logoutText: {
    color: ds.colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: ds.colors.glassBorder,
    marginHorizontal: ds.spacing.lg,
    marginVertical: ds.spacing.sm,
  },
});
