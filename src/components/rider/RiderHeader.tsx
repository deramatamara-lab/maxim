/**
 * RiderHeader - Glass card header with user info and menu
 * Matches reference prototype's header UI
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { MotiView } from 'moti';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from 'react-i18next';

interface RiderHeaderProps {
  /** User name */
  userName?: string;
  /** User avatar URL */
  avatarUrl?: string;
  /** Menu button handler */
  onMenuClick?: () => void;
  /** AI chat button handler */
  onAiChatClick?: () => void;
  /** Whether menu is open */
  isMenuOpen?: boolean;
  /** Whether to show the header */
  visible?: boolean;
}

export const RiderHeader: React.FC<RiderHeaderProps> = ({
  userName = 'Rider',
  avatarUrl,
  onMenuClick,
  onAiChatClick,
  isMenuOpen = false,
  visible = true,
}) => {
  const { play } = useSound();
  const { trigger } = useHaptics();
  const { t } = useTranslation();

  const handleMenuClick = () => {
    trigger('tap');
    play('tapSoft');
    onMenuClick?.();
  };

  const handleAiClick = () => {
    trigger('tap');
    play('tapSoft');
    onAiChatClick?.();
  };

  if (!visible) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -20 }}
      transition={{
        type: 'timing',
        duration: ds.motion.duration.entrance,
      }}
      style={styles.container}
    >
      {/* User Info Card */}
      <GlassCard style={styles.userCard} interactive>
        <Pressable onPress={handleMenuClick} style={styles.userCardContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <CustomIcon name="profile" size={20} color={ds.colors.textSecondary} />
              </View>
            )}
          </View>
          
          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.welcomeLabel}>{t('home.welcome', 'Welcome')}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          
          {/* Menu Icon */}
          <View style={[styles.menuIcon, isMenuOpen && styles.menuIconActive]}>
            <CustomIcon 
              name="menu" 
              size={20} 
              color={isMenuOpen ? ds.colors.primary : ds.colors.textSecondary} 
            />
          </View>
        </Pressable>
      </GlassCard>

      {/* AI Chat Button */}
      {onAiChatClick && (
        <Pressable onPress={handleAiClick} style={styles.aiButton}>
          <MotiView
            from={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              type: 'timing',
              duration: 2000,
              loop: true,
            }}
            style={styles.aiButtonInner}
          >
            <CustomIcon name="activity" size={20} color={ds.colors.backgroundDeep} />
          </MotiView>
        </Pressable>
      )}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.lg,
    zIndex: 50,
  },
  userCard: {
    padding: 0,
    overflow: 'hidden',
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    gap: ds.spacing.md,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: ds.colors.glass,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: ds.typography.size.micro,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  userName: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: ds.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconActive: {
    backgroundColor: ds.colors.primary + '20',
  },
  aiButton: {
    marginLeft: ds.spacing.md,
  },
  aiButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ds.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
});

export default RiderHeader;
