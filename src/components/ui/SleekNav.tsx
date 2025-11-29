import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CustomIcon } from './CustomIcon';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';

export type TabId = 'home' | 'activity' | 'location' | 'profile';

interface SleekNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const Icon = ({ name, active }: {
  name: TabId;
  active: boolean;
}) => {
  return (
    <CustomIcon
      name={name}
      size={active ? 26 : 24}
      active={active}
    />
  );
};

const NavButton = ({ 
  icon, 
  active, 
  onPress 
}: { 
  icon: TabId; 
  active: boolean; 
  onPress: () => void; 
}) => {
  const scale = useSharedValue(1);
  const { trigger } = useHaptics();
  const { play } = useSound();

  const handlePress = () => {
    trigger('tap');
    play('tapSoft');
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    onPress();
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }, 100);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.navButton,
          {
            backgroundColor: pressed 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'transparent',
          },
        ]}
        onPress={handlePress}
      >
        <View style={styles.navIconWrapper}>
          <Icon name={icon} active={active} />
        </View>
        {active && <View style={styles.activeIndicator} />}
      </Pressable>
    </Animated.View>
  );
};

export const SleekNav: React.FC<SleekNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.navContainer}>
      <View style={styles.navBar}>
        <NavButton
          icon="home"
          active={activeTab === 'home'}
          onPress={() => onTabChange('home')}
        />
        <NavButton
          icon="activity"
          active={activeTab === 'activity'}
          onPress={() => onTabChange('activity')}
        />
        <NavButton
          icon="location"
          active={activeTab === 'location'}
          onPress={() => onTabChange('location')}
        />
        <NavButton
          icon="profile"
          active={activeTab === 'profile'}
          onPress={() => onTabChange('profile')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  navBar: {
    backgroundColor: ds.colors.glass,
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 32,
    borderWidth: 1,
    borderColor: ds.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  navIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    backgroundColor: ds.colors.primary,
    borderRadius: 2,
    shadowColor: ds.colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },
});
