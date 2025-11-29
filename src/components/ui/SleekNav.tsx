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
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  navBar: {
    backgroundColor: ds.colors.surface,
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ds.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 20,
    width: '100%',
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  navIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    backgroundColor: ds.colors.primary,
    borderRadius: 3,
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
});
