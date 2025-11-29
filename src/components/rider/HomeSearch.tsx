/**
 * HomeSearch - Destination search card with saved locations
 * Matches reference prototype's home search UI
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { DestinationInput, type DestinationInputHandle } from '@/components/ui/DestinationInput';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from 'react-i18next';

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  icon?: 'home' | 'location';
  lat?: number;
  lon?: number;
}

interface HomeSearchProps {
  /** Current location name display */
  locationName: string;
  /** Destination input value */
  destination: string;
  /** Destination change handler */
  onDestinationChange: (text: string) => void;
  /** Search/submit handler */
  onSearch: () => void;
  /** Locate me button handler */
  onLocateMe?: () => void;
  /** Saved locations list */
  savedLocations?: SavedLocation[];
  /** Whether geolocation has an error */
  isGeoError?: boolean;
  /** Reference to destination input */
  inputRef?: React.RefObject<DestinationInputHandle>;
}

export const HomeSearch: React.FC<HomeSearchProps> = ({
  locationName,
  destination,
  onDestinationChange,
  onSearch,
  onLocateMe,
  savedLocations = [],
  isGeoError = false,
  inputRef,
}) => {
  const { play } = useSound();
  const { trigger } = useHaptics();
  const { t } = useTranslation();

  const handleLocationSelect = (location: SavedLocation) => {
    trigger('tap');
    play('tapSoft');
    onDestinationChange(location.name);
  };

  const handleLocateMe = () => {
    trigger('tap');
    play('tapSoft');
    onLocateMe?.();
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: 30 }}
      transition={{
        type: 'timing',
        duration: ds.motion.duration.entrance,
      }}
      style={styles.container}
    >
      {/* Current Location Display */}
      <View style={styles.currentLocation}>
        <View style={styles.locationDot} />
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>{t('home.current_location', 'Current Location')}</Text>
          <Text style={styles.locationName}>{locationName}</Text>
        </View>
        {onLocateMe && (
          <Pressable onPress={handleLocateMe} style={styles.locateButton}>
            <CustomIcon 
              name="location" 
              size={20} 
              color={isGeoError ? ds.colors.error : ds.colors.primary} 
            />
          </Pressable>
        )}
      </View>

      {/* Destination Input Card */}
      <GlassCard style={styles.searchCard} elevated>
        <Text style={styles.whereToLabel}>{t('home.where_to', 'Where to?')}</Text>
        <DestinationInput
          ref={inputRef}
          label=""
          placeholder={t('home.enter_destination', 'Enter destination')}
          value={destination}
          onChangeText={onDestinationChange}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
      </GlassCard>

      {/* Saved Locations */}
      {savedLocations.length > 0 && (
        <View style={styles.savedSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.savedScrollContent}
          >
            {savedLocations.map((loc) => (
              <Pressable
                key={loc.id}
                style={({ pressed }) => [
                  styles.savedChip,
                  pressed && styles.savedChipPressed,
                ]}
                onPress={() => handleLocationSelect(loc)}
              >
                <CustomIcon 
                  name={loc.icon === 'home' ? 'home' : 'location'} 
                  size={16} 
                  color={ds.colors.textSecondary} 
                />
                <Text style={styles.savedChipText}>{loc.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Button */}
      <View style={styles.buttonContainer}>
        <PremiumButton
          variant="primary"
          size="lg"
          onPress={onSearch}
          disabled={!destination}
          style={styles.searchButton}
        >
          {t('home.request_ride', 'Request Ride')}
        </PremiumButton>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: ds.spacing.lg,
    paddingBottom: ds.spacing.xxxl,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.lg,
    paddingHorizontal: ds.spacing.sm,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ds.colors.primary,
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  locationInfo: {
    flex: 1,
    marginLeft: ds.spacing.md,
  },
  locationLabel: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationName: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium as '500',
    color: ds.colors.textPrimary,
    marginTop: ds.spacing.xxs,
  },
  locateButton: {
    width: 40,
    height: 40,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.glass,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCard: {
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.md,
  },
  whereToLabel: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: ds.spacing.sm,
  },
  savedSection: {
    marginBottom: ds.spacing.lg,
  },
  savedScrollContent: {
    paddingHorizontal: ds.spacing.xs,
    gap: ds.spacing.sm,
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.md,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    gap: ds.spacing.sm,
  },
  savedChipPressed: {
    borderColor: ds.colors.primary + '80',
    backgroundColor: ds.colors.primary + '10',
  },
  savedChipText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    color: ds.colors.textPrimary,
  },
  buttonContainer: {
    marginTop: ds.spacing.md,
  },
  searchButton: {
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
});

export default HomeSearch;
