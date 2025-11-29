/**
 * Saved Locations Screen
 * Manage saved places (Home, Work, etc.) and view recent destinations
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  type: 'home' | 'work' | 'favorite' | 'recent';
  coordinates?: {
    lat: number;
    lng: number;
  };
  lastUsed?: string;
}

interface SavedLocationsScreenProps {
  onSelectLocation?: (location: SavedLocation) => void;
  onAddLocation?: () => void;
  onBack?: () => void;
}

// Mock data
const MOCK_SAVED_LOCATIONS: SavedLocation[] = [
  {
    id: '1',
    name: 'Home',
    address: '1001 Wilshire Blvd, Los Angeles',
    type: 'home',
    coordinates: { lat: 34.0522, lng: -118.2437 },
  },
  {
    id: '2',
    name: 'Work',
    address: '100 Universal City Plaza, Universal City',
    type: 'work',
    coordinates: { lat: 34.1381, lng: -118.3534 },
  },
  {
    id: '3',
    name: 'Gym',
    address: '8560 Sunset Blvd, West Hollywood',
    type: 'favorite',
    coordinates: { lat: 34.0928, lng: -118.3695 },
  },
];

const MOCK_RECENT_LOCATIONS: SavedLocation[] = [
  {
    id: 'r1',
    name: 'Nobu Malibu',
    address: '22706 Pacific Coast Hwy, Malibu',
    type: 'recent',
    lastUsed: 'Yesterday',
  },
  {
    id: 'r2',
    name: 'LAX Airport',
    address: '1 World Way, Los Angeles',
    type: 'recent',
    lastUsed: '2 days ago',
  },
  {
    id: 'r3',
    name: 'The Grove',
    address: '189 The Grove Dr, Los Angeles',
    type: 'recent',
    lastUsed: '3 days ago',
  },
];

// Location type icon mapping
const getLocationIcon = (type: SavedLocation['type']): string => {
  switch (type) {
    case 'home': return '🏠';
    case 'work': return '💼';
    case 'favorite': return '⭐';
    case 'recent': return '🕐';
    default: return '📍';
  }
};

// Saved Location Card Component
const LocationCard: React.FC<{
  location: SavedLocation;
  index: number;
  onPress: () => void;
  onOptions: () => void;
}> = ({ location, index, onPress, onOptions }) => {
  const scale = useSharedValue(1);
  const haptics = useHaptics();
  const sound = useSound();

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onPress();
  }, [haptics, sound, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(300)}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <GlassCard style={styles.locationCard}>
          <View style={styles.locationContent}>
            {/* Icon */}
            <View style={styles.locationIconContainer}>
              <View style={styles.locationIconPattern} />
              <Text style={styles.locationEmoji}>{getLocationIcon(location.type)}</Text>
            </View>

            {/* Details */}
            <View style={styles.locationDetails}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {location.address}
              </Text>
            </View>

            {/* Options Button */}
            <Pressable
              style={styles.optionsButton}
              onPress={(e) => {
                e.stopPropagation();
                haptics.trigger('tap');
                onOptions();
              }}
            >
              <CustomIcon name="menu" size={20} color={ds.colors.textSecondary} />
            </Pressable>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

// Recent Location Item Component
const RecentLocationItem: React.FC<{
  location: SavedLocation;
  index: number;
  onPress: () => void;
}> = ({ location, index, onPress }) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handlePress = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onPress();
  }, [haptics, sound, onPress]);

  return (
    <Animated.View entering={FadeInDown.delay(300 + index * 60).duration(250)}>
      <Pressable
        style={({ pressed }) => [
          styles.recentItem,
          pressed && styles.recentItemPressed,
        ]}
        onPress={handlePress}
      >
        <View style={styles.recentIcon}>
          <CustomIcon name="activity" size={16} color={ds.colors.textSecondary} />
        </View>
        <View style={styles.recentDetails}>
          <Text style={styles.recentName}>{location.name}</Text>
          <Text style={styles.recentTime}>{location.lastUsed}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const SavedLocationsScreen: React.FC<SavedLocationsScreenProps> = ({
  onSelectLocation,
  onAddLocation,
  onBack,
}) => {
  const [savedLocations] = useState<SavedLocation[]>(MOCK_SAVED_LOCATIONS);
  const [recentLocations] = useState<SavedLocation[]>(MOCK_RECENT_LOCATIONS);
  const haptics = useHaptics();
  const sound = useSound();

  const handleAddPlace = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    
    if (onAddLocation) {
      onAddLocation();
    } else {
      Alert.alert('Add Place', 'Address input not implemented in demo');
    }
  }, [haptics, sound, onAddLocation]);

  const handleSelectLocation = useCallback((location: SavedLocation) => {
    log.info('Location selected', {
      event: 'location_selected',
      component: 'SavedLocationsScreen',
      locationId: location.id,
      locationType: location.type,
    });
    onSelectLocation?.(location);
  }, [onSelectLocation]);

  const handleLocationOptions = useCallback((location: SavedLocation) => {
    Alert.alert(
      location.name,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => log.info('Edit location', { event: 'edit_location', component: 'SavedLocationsScreen', locationId: location.id }) },
        { text: 'Delete', style: 'destructive', onPress: () => log.info('Delete location', { event: 'delete_location', component: 'SavedLocationsScreen', locationId: location.id }) },
      ]
    );
  }, []);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <CustomIcon name="chevronRight" size={24} color={ds.colors.textPrimary} />
          </Pressable>
        )}
        <View style={styles.headerText}>
          <Text style={styles.title}>Locations</Text>
          <Text style={styles.subtitle}>Manage your world</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add New Place Button */}
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={handleAddPlace}
        >
          <View style={styles.addButtonIcon}>
            <CustomIcon name="location" size={20} color={ds.colors.primary} />
          </View>
          <Text style={styles.addButtonText}>Add New Place</Text>
        </Pressable>

        {/* Saved Places Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SAVED PLACES</Text>
          {savedLocations.map((location, index) => (
            <LocationCard
              key={location.id}
              location={location}
              index={index}
              onPress={() => handleSelectLocation(location)}
              onOptions={() => handleLocationOptions(location)}
            />
          ))}
        </View>

        {/* Recent Destinations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT</Text>
          {recentLocations.map((location, index) => (
            <RecentLocationItem
              key={location.id}
              location={location}
              index={index}
              onPress={() => handleSelectLocation(location)}
            />
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.lg,
    paddingBottom: ds.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing.md,
    transform: [{ rotate: '180deg' }],
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.tight,
  },
  subtitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xxs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ds.spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing.lg,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: ds.colors.glassBorder,
    marginBottom: ds.spacing.lg,
    gap: ds.spacing.sm,
  },
  addButtonPressed: {
    borderColor: ds.colors.primary,
    backgroundColor: ds.colors.primary + '10',
  },
  addButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
  },
  section: {
    marginBottom: ds.spacing.xl,
  },
  sectionTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.ultraWide,
    marginBottom: ds.spacing.md,
    paddingLeft: ds.spacing.xs,
  },
  locationCard: {
    marginBottom: ds.spacing.sm,
    padding: 0,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.spacing.md,
    gap: ds.spacing.md,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  locationIconPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  locationEmoji: {
    fontSize: 20,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xxs,
  },
  locationAddress: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  optionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    gap: ds.spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: ds.spacing.xs,
  },
  recentItemPressed: {
    backgroundColor: ds.colors.surface,
    borderColor: ds.colors.borderSubtle,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentDetails: {
    flex: 1,
  },
  recentName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  recentTime: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xxs,
  },
  bottomSpacer: {
    height: ds.spacing.xxxl * 2,
  },
});

export default SavedLocationsScreen;
