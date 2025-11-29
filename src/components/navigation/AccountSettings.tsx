import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import Animated, { runOnUI } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ds } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { CustomIcon } from '../ui/CustomIcon';
import { useAppStore } from '../../store/useAppStore';
import { 
  useScaleAnimation, 
  useSlideAnimation, 
  useFadeAnimation
} from '../../hooks/useAnimations';
import { useAnimationContext } from '../../providers/AnimationProvider';

const { width: screenWidth } = Dimensions.get('window');
const MENU_WIDTH = screenWidth * 0.85;

interface AccountSettingsProps {
  onClose: () => void;
}

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  onPress,
  showArrow = true,
}) => {
  const { triggerHaptic, playSound } = useAnimationContext();
  const { animatedStyle, press, release } = useScaleAnimation('cardPress');

  const handlePress = useCallback(() => {
    triggerHaptic('tap');
    playSound('tapSoft');
    
    press();
    
    // Auto release after animation
    setTimeout(() => {
      runOnUI(() => {
        release();
      })();
    }, 150);
    
    onPress?.();
  }, [press, release, onPress, triggerHaptic, playSound]);

  const handleToggle = useCallback((newValue: boolean) => {
    triggerHaptic('selection');
    playSound('tapSoft');
    onToggle?.(newValue);
  }, [onToggle, triggerHaptic, playSound]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[styles.settingItem, animatedStyle]}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <CustomIcon name={icon as 'home' | 'activity' | 'location' | 'profile' | 'search' | 'menu' | 'chevronRight' | 'settings'} size={20} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        <View style={styles.settingRight}>
          {onToggle !== undefined ? (
            <Switch
              value={value}
              onValueChange={handleToggle}
              trackColor={{ false: ds.colors.surfaceElevated, true: ds.colors.primary }}
              thumbColor={value ? ds.colors.background : ds.colors.textSecondary}
              ios_backgroundColor={ds.colors.surfaceElevated}
            />
          ) : (
            showArrow && <CustomIcon name="chevronRight" size={16} />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { triggerHaptic, playSound, orchestrateModalAnimation } = useAnimationContext();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  const { user, setActiveTab } = useAppStore();

  // Use new modular animation hooks
  const { animatedStyle: menuAnimatedStyle, slideIn, slideOut } = useSlideAnimation('right', 'drawerEnter');
  const { animatedStyle: backdropAnimatedStyle, animateIn: fadeIn, animateOut: fadeOut } = useFadeAnimation('modalEnter');

  const openMenu = useCallback(() => {
    triggerHaptic('tap');
    playSound('tapSoft');
    orchestrateModalAnimation(true, 'accountSettings');
    
    runOnUI(() => {
      fadeIn();
      slideIn();
    })();
  }, [triggerHaptic, playSound, orchestrateModalAnimation, fadeIn, slideIn]);

  const closeMenu = useCallback(() => {
    triggerHaptic('tap');
    playSound('tapSoft');
    orchestrateModalAnimation(false, 'accountSettings');
    
    runOnUI(() => {
      fadeOut();
      slideOut();
    })();
    
    setTimeout(onClose, 300);
  }, [triggerHaptic, playSound, orchestrateModalAnimation, fadeOut, slideOut, onClose]);

  const handleLogout = useCallback(() => {
    triggerHaptic('confirm');
    playSound('success');
    // Implement logout logic
    closeMenu();
  }, [triggerHaptic, playSound, closeMenu]);

  const handleProfilePress = useCallback(() => {
    setActiveTab('profile');
    closeMenu();
  }, [setActiveTab, closeMenu]);

  // Open menu on mount
  React.useEffect(() => {
    openMenu();
  }, [openMenu]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        // Manual pan update would be handled here
        // For now, we'll keep the existing logic
      }
    })
    .onEnd((event) => {
      if (event.translationX > MENU_WIDTH * 0.3) {
        closeMenu();
      } else {
        slideIn();
      }
    });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <TouchableOpacity style={styles.backdropTouchable} onPress={closeMenu} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.menuContainer, menuAnimatedStyle]}>
          <LinearGradient
            colors={[ds.colors.backgroundDeep, ds.colors.background]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={[styles.menuContent, { paddingTop: insets.top + 20 }]}>
            {/* Header */}
            <View style={styles.menuHeader}>
              <GlassCard elevated style={styles.profileCard}>
                <View style={styles.profileContent}>
                  <View style={styles.avatar}>
                    <CustomIcon name="profile" size={32} />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{user?.name || 'Tony Stark'}</Text>
                    <Text style={styles.profileEmail}>{user?.email || 'tony@starkindustries.com'}</Text>
                    <View style={styles.profileStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>142</Text>
                        <Text style={styles.statLabel}>Rides</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>4.9</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </GlassCard>

              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <CustomIcon name="menu" size={24} />
              </TouchableOpacity>
            </View>

            {/* Settings List */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.settingsList}>
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Account</Text>
                
                <SettingItem
                  icon="profile"
                  title="Profile Settings"
                  subtitle="Name, photo, personal info"
                  onPress={handleProfilePress}
                />
                
                <SettingItem
                  icon="location"
                  title="Home & Work"
                  subtitle="Saved locations"
                  onPress={() => {}}
                />
                
                <SettingItem
                  icon="activity"
                  title="Ride History"
                  subtitle="View past trips"
                  onPress={() => {}}
                />
              </View>

              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                
                <SettingItem
                  icon="search"
                  title="Notifications"
                  subtitle="Push notifications & alerts"
                  value={notifications}
                  onToggle={setNotifications}
                />
                
                <SettingItem
                  icon="menu"
                  title="Dark Mode"
                  subtitle="Always use dark theme"
                  value={darkMode}
                  onToggle={setDarkMode}
                />
                
                <SettingItem
                  icon="settings"
                  title="Sound Effects"
                  subtitle="App sounds and haptics"
                  value={soundEffects}
                  onToggle={setSoundEffects}
                />
                
                <SettingItem
                  icon="activity"
                  title="Haptic Feedback"
                  subtitle="Vibration on interactions"
                  value={hapticFeedback}
                  onToggle={setHapticFeedback}
                />
              </View>

              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Privacy & Safety</Text>
                
                <SettingItem
                  icon="location"
                  title="Share Location"
                  subtitle="Allow location sharing"
                  value={shareLocation}
                  onToggle={setShareLocation}
                />
                
                <SettingItem
                  icon="search"
                  title="Auto-Accept Rides"
                  subtitle="Automatically accept nearby rides"
                  value={autoAccept}
                  onToggle={setAutoAccept}
                />
              </View>

              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Support</Text>
                
                <SettingItem
                  icon="search"
                  title="Help Center"
                  subtitle="FAQs and support"
                  onPress={() => {}}
                />
                
                <SettingItem
                  icon="activity"
                  title="Contact Support"
                  subtitle="Get help from our team"
                  onPress={() => {}}
                />
              </View>

              <View style={styles.settingsSection}>
                <PremiumButton
                  onPress={handleLogout}
                  variant="ghost"
                  size="md"
                  style={styles.logoutButton}
                >
                  Sign Out
                </PremiumButton>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: ds.colors.backgroundDeep,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: ds.spacing.lg,
  },
  menuHeader: {
    marginBottom: ds.spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profileCard: {
    flex: 1,
    marginRight: ds.spacing.md,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ds.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    marginBottom: ds.spacing.xs,
  },
  profileEmail: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.sm,
  },
  profileStats: {
    flexDirection: 'row',
    gap: ds.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
  },
  statLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ds.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsList: {
    flex: 1,
  },
  settingsSection: {
    marginBottom: ds.spacing.xl,
  },
  sectionTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    marginBottom: ds.spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.text,
    marginBottom: ds.spacing.xs,
  },
  settingSubtitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  settingRight: {
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: ds.spacing.md,
  },
});
