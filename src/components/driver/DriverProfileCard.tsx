/**
 * Driver Profile Card Component
 * Displays driver info during active ride
 * Ultra-premium design with verification badges and contact options
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Image,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassView } from '@/components/ui/GlassView';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';

export interface DriverInfo {
  id: string;
  name: string;
  photo?: string;
  rating: number;
  totalRides: number;
  phone: string;
  vehicle: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
    year?: number;
  };
  isVerified: boolean;
  languages?: string[];
  memberSince?: string;
}

export interface DriverProfileCardProps {
  driver: DriverInfo;
  onCall?: () => void;
  onMessage?: () => void;
  onViewProfile?: () => void;
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionButtonProps {
  icon: 'home' | 'activity' | 'location' | 'profile';
  label: string;
  onPress: () => void;
  color?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, color = ds.colors.primary }) => {
  const scale = useSharedValue(1);
  const haptics = useHaptics();

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    haptics.trigger('tap');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.actionButton, animatedStyle]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={[styles.actionIconContainer, { backgroundColor: `${color}20` }]}>
        <CustomIcon name={icon} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </AnimatedPressable>
  );
};

export const DriverProfileCard: React.FC<DriverProfileCardProps> = ({
  driver,
  onCall,
  onMessage,
  onViewProfile,
  compact = false,
}) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handleCall = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    
    if (onCall) {
      onCall();
    } else {
      Linking.openURL(`tel:${driver.phone}`);
    }
  }, [driver.phone, haptics, sound, onCall]);

  const handleMessage = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    
    if (onMessage) {
      onMessage();
    } else {
      Linking.openURL(`sms:${driver.phone}`);
    }
  }, [driver.phone, haptics, sound, onMessage]);

  const handleViewProfile = useCallback(() => {
    haptics.trigger('tap');
    onViewProfile?.();
  }, [haptics, onViewProfile]);

  const formatRating = (rating: number) => rating.toFixed(1);
  const formatRides = (rides: number) => {
    if (rides >= 10000) return `${Math.floor(rides / 1000)}k+`;
    if (rides >= 1000) return `${(rides / 1000).toFixed(1)}k`;
    return rides.toString();
  };

  if (compact) {
    return (
      <Animated.View entering={FadeIn.delay(100)}>
        <GlassView intensity="medium" tint="dark" style={styles.compactCard}>
          <View style={styles.compactContent}>
            {/* Avatar */}
            <View style={styles.compactAvatar}>
              {driver.photo ? (
                <Image source={{ uri: driver.photo }} style={styles.avatarImage} />
              ) : (
                <CustomIcon name="profile" size={24} color={ds.colors.textSecondary} />
              )}
            </View>
            
            {/* Info */}
            <View style={styles.compactInfo}>
              <View style={styles.compactNameRow}>
                <Text style={styles.compactName}>{driver.name}</Text>
                {driver.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <CustomIcon name="activity" size={12} color={ds.colors.success} />
                  </View>
                )}
              </View>
              <Text style={styles.compactVehicle}>
                {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
              </Text>
            </View>
            
            {/* Rating & Plate */}
            <View style={styles.compactRight}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingIcon}>★</Text>
                <Text style={styles.ratingValue}>{formatRating(driver.rating)}</Text>
              </View>
              <Text style={styles.licensePlate}>{driver.vehicle.licensePlate}</Text>
            </View>
          </View>
          
          {/* Quick Actions */}
          <View style={styles.compactActions}>
            <Pressable onPress={handleCall} style={styles.compactActionBtn}>
              <CustomIcon name="home" size={18} color={ds.colors.primary} />
              <Text style={styles.compactActionText}>Call</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable onPress={handleMessage} style={styles.compactActionBtn}>
              <CustomIcon name="activity" size={18} color={ds.colors.primary} />
              <Text style={styles.compactActionText}>Message</Text>
            </Pressable>
          </View>
        </GlassView>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.delay(100)}>
      <GlassView elevated={true} intensity="medium" tint="dark" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          {/* Avatar */}
          <Pressable onPress={handleViewProfile} style={styles.avatarContainer}>
            {driver.photo ? (
              <Image source={{ uri: driver.photo }} style={styles.avatarImageLarge} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <CustomIcon name="profile" size={32} color={ds.colors.textSecondary} />
              </View>
            )}
            {driver.isVerified && (
              <View style={styles.verifiedBadgeLarge}>
                <CustomIcon name="activity" size={14} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
          
          {/* Driver Info */}
          <View style={styles.driverInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>{driver.name}</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>★</Text>
                <Text style={styles.statValue}>{formatRating(driver.rating)}</Text>
              </View>
              <View style={styles.statDot} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatRides(driver.totalRides)}</Text>
                <Text style={styles.statLabel}> rides</Text>
              </View>
            </View>
            
            {driver.memberSince && (
              <Text style={styles.memberSince}>Member since {driver.memberSince}</Text>
            )}
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleSection}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleTitle}>
              {driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model}
            </Text>
            <Text style={styles.vehicleColor}>{driver.vehicle.color}</Text>
          </View>
          <View style={styles.licensePlateContainer}>
            <Text style={styles.licensePlateLabel}>License Plate</Text>
            <Text style={styles.licensePlateValue}>{driver.vehicle.licensePlate}</Text>
          </View>
        </View>

        {/* Languages */}
        {driver.languages && driver.languages.length > 0 && (
          <View style={styles.languagesSection}>
            <Text style={styles.languagesLabel}>Languages:</Text>
            <Text style={styles.languagesValue}>{driver.languages.join(', ')}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <ActionButton icon="home" label="Call" onPress={handleCall} />
          <ActionButton icon="activity" label="Message" onPress={handleMessage} />
          {onViewProfile && (
            <ActionButton icon="profile" label="Profile" onPress={handleViewProfile} />
          )}
        </View>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: ds.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    marginBottom: ds.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: ds.spacing.md,
  },
  avatarImageLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: ds.colors.primary,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ds.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: ds.colors.primary,
  },
  verifiedBadgeLarge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ds.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ds.colors.backgroundDeep,
  },
  driverInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.xs,
  },
  driverName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 14,
    color: '#FFD700',
    marginRight: 2,
  },
  statValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  statLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ds.colors.textSecondary,
    marginHorizontal: ds.spacing.sm,
  },
  memberSince: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  vehicleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
    marginBottom: ds.spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  vehicleColor: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  licensePlateContainer: {
    alignItems: 'flex-end',
  },
  licensePlateLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
    marginBottom: 2,
  },
  licensePlateValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: 1,
  },
  languagesSection: {
    flexDirection: 'row',
    marginBottom: ds.spacing.md,
  },
  languagesLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginRight: ds.spacing.xs,
  },
  languagesValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
    paddingTop: ds.spacing.md,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ds.spacing.xs,
  },
  actionLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  // Compact Styles
  compactCard: {
    padding: 0,
    overflow: 'hidden',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.spacing.md,
  },
  compactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: ds.spacing.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  compactInfo: {
    flex: 1,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  compactName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  verifiedBadge: {
    marginLeft: ds.spacing.xs,
  },
  compactVehicle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  compactRight: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ds.colors.primary}20`,
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xxs,
    borderRadius: ds.radius.sm,
    marginBottom: ds.spacing.xxs,
  },
  ratingIcon: {
    fontSize: 12,
    color: '#FFD700',
    marginRight: 2,
  },
  ratingValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  licensePlate: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: 0.5,
  },
  compactActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  compactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing.md,
    gap: ds.spacing.xs,
  },
  compactActionText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.primary,
  },
  actionDivider: {
    width: 1,
    backgroundColor: ds.colors.border,
  },
});

export default DriverProfileCard;
