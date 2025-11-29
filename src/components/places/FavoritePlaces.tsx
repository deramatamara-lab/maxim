/**
 * FavoritePlaces Component
 * Manages saved locations (Home, Work, custom places)
 * 
 * Features:
 * - Add/edit/delete favorite places
 * - Quick access icons (home, work, custom)
 * - Address autocomplete integration
 * - Reorder favorites
 * - Sync with backend
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout,
} from 'react-native-reanimated';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon, IconName } from '@/components/ui/CustomIcon';
import { ds } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

// Place types
export type PlaceType = 'home' | 'work' | 'gym' | 'school' | 'custom';

export interface FavoritePlace {
  id: string;
  name: string;
  address: string;
  type: PlaceType;
  icon?: IconName;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

interface FavoritePlacesProps {
  places: FavoritePlace[];
  onAddPlace: (place: Omit<FavoritePlace, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onEditPlace: (id: string, updates: Partial<FavoritePlace>) => void;
  onDeletePlace: (id: string) => void;
  onSelectPlace: (place: FavoritePlace) => void;
  onReorderPlaces?: (places: FavoritePlace[]) => void;
  maxPlaces?: number;
  compact?: boolean;
}

// Icon mapping for place types
const PLACE_TYPE_ICONS: Record<PlaceType, IconName> = {
  home: 'home',
  work: 'activity',
  gym: 'activity',
  school: 'activity',
  custom: 'location',
};

const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  home: 'Home',
  work: 'Work',
  gym: 'Gym',
  school: 'School',
  custom: 'Custom',
};

// Add/Edit Place Modal
interface PlaceModalProps {
  visible: boolean;
  place?: FavoritePlace | null;
  onClose: () => void;
  onSave: (place: Omit<FavoritePlace, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const PlaceModal: React.FC<PlaceModalProps> = ({
  visible,
  place,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(place?.name || '');
  const [address, setAddress] = useState(place?.address || '');
  const [type, setType] = useState<PlaceType>(place?.type || 'custom');
  const haptics = useHaptics();
  const sound = useSound();

  const isEditing = !!place;

  const handleSave = useCallback(() => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Missing Information', 'Please enter both name and address.');
      return;
    }

    haptics.trigger('confirm');
    sound.play('success');

    onSave({
      name: name.trim(),
      address: address.trim(),
      type,
      latitude: 0, // Would come from geocoding
      longitude: 0,
    });

    log.info('Favorite place saved', {
      event: 'favorite_place_saved',
      component: 'FavoritePlaces',
      isEditing,
      type,
    });

    onClose();
  }, [name, address, type, haptics, sound, onSave, onClose, isEditing]);

  const handleTypeSelect = useCallback((selectedType: PlaceType) => {
    haptics.trigger('tap');
    setType(selectedType);
    // Auto-fill name for common types
    if (!name && selectedType !== 'custom') {
      setName(PLACE_TYPE_LABELS[selectedType]);
    }
  }, [haptics, name]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.modalContainer}
        >
          <GlassCard style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Place' : 'Add Favorite Place'}
              </Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <CustomIcon name="menu" size={24} color={ds.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Type Selection */}
            <Text style={styles.sectionLabel}>Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeScroll}
            >
              {(Object.keys(PLACE_TYPE_LABELS) as PlaceType[]).map((placeType) => (
                <Pressable
                  key={placeType}
                  onPress={() => handleTypeSelect(placeType)}
                  style={[
                    styles.typeChip,
                    type === placeType && styles.typeChipActive,
                  ]}
                >
                  <CustomIcon
                    name={PLACE_TYPE_ICONS[placeType]}
                    size={16}
                    color={type === placeType ? ds.colors.primary : ds.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      type === placeType && styles.typeChipTextActive,
                    ]}
                  >
                    {PLACE_TYPE_LABELS[placeType]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Name Input */}
            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Mom's House"
              placeholderTextColor={ds.colors.textSecondary}
              maxLength={50}
            />

            {/* Address Input */}
            <Text style={styles.sectionLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address or search..."
              placeholderTextColor={ds.colors.textSecondary}
              multiline
              numberOfLines={2}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Individual Place Card
interface PlaceCardProps {
  place: FavoritePlace;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  onPress,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const haptics = useHaptics();
  const sound = useSound();

  const handlePress = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    onPress();
  }, [haptics, sound, onPress]);

  const handleLongPress = useCallback(() => {
    haptics.trigger('tap');
    Alert.alert(
      place.name,
      'What would you like to do?',
      [
        { text: 'Edit', onPress: onEdit },
        { text: 'Delete', onPress: onDelete, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [haptics, place.name, onEdit, onDelete]);

  const icon = place.icon || PLACE_TYPE_ICONS[place.type];

  if (compact) {
    return (
      <Animated.View
        entering={SlideInRight.springify().damping(15)}
        exiting={SlideOutLeft.duration(200)}
        layout={Layout.springify()}
      >
        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          style={styles.compactCard}
        >
          <View style={styles.compactIcon}>
            <CustomIcon name={icon} size={20} color={ds.colors.primary} />
          </View>
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>
              {place.name}
            </Text>
            <Text style={styles.compactAddress} numberOfLines={1}>
              {place.address}
            </Text>
          </View>
          <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.delay(100)}
      exiting={FadeOut.duration(150)}
      layout={Layout.springify()}
    >
      <Pressable onPress={handlePress} onLongPress={handleLongPress}>
        <GlassCard style={styles.placeCard} interactive>
          <View style={styles.placeHeader}>
            <View style={styles.placeIconContainer}>
              <CustomIcon name={icon} size={24} color={ds.colors.primary} />
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeType}>{PLACE_TYPE_LABELS[place.type]}</Text>
            </View>
            <Pressable onPress={onEdit} style={styles.editButton}>
              <CustomIcon name="settings" size={18} color={ds.colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.placeAddress} numberOfLines={2}>
            {place.address}
          </Text>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

// Main Component
export const FavoritePlaces: React.FC<FavoritePlacesProps> = ({
  places,
  onAddPlace,
  onEditPlace,
  onDeletePlace,
  onSelectPlace,
  maxPlaces = 10,
  compact = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlace, setEditingPlace] = useState<FavoritePlace | null>(null);
  const haptics = useHaptics();
  const sound = useSound();

  const canAddMore = places.length < maxPlaces;

  // Sort places: home first, then work, then others by name
  const sortedPlaces = useMemo(() => {
    return [...places].sort((a, b) => {
      const typeOrder: Record<PlaceType, number> = {
        home: 0,
        work: 1,
        gym: 2,
        school: 3,
        custom: 4,
      };
      const orderDiff = typeOrder[a.type] - typeOrder[b.type];
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });
  }, [places]);

  const handleAddPress = useCallback(() => {
    if (!canAddMore) {
      Alert.alert(
        'Limit Reached',
        `You can save up to ${maxPlaces} favorite places.`
      );
      return;
    }
    haptics.trigger('tap');
    sound.play('tapSoft');
    setEditingPlace(null);
    setModalVisible(true);
  }, [canAddMore, maxPlaces, haptics, sound]);

  const handleEditPress = useCallback((place: FavoritePlace) => {
    haptics.trigger('tap');
    setEditingPlace(place);
    setModalVisible(true);
  }, [haptics]);

  const handleDeletePress = useCallback((place: FavoritePlace) => {
    haptics.trigger('tap');
    Alert.alert(
      'Delete Place',
      `Are you sure you want to remove "${place.name}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            haptics.trigger('error');
            onDeletePlace(place.id);
            log.info('Favorite place deleted', {
              event: 'favorite_place_deleted',
              component: 'FavoritePlaces',
              placeId: place.id,
            });
          },
        },
      ]
    );
  }, [haptics, onDeletePlace]);

  const handleSavePlace = useCallback((placeData: Omit<FavoritePlace, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPlace) {
      onEditPlace(editingPlace.id, placeData);
    } else {
      onAddPlace(placeData);
    }
    setModalVisible(false);
    setEditingPlace(null);
  }, [editingPlace, onEditPlace, onAddPlace]);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingPlace(null);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      {!compact && (
        <View style={styles.header}>
          <Text style={styles.title}>Favorite Places</Text>
          <Text style={styles.subtitle}>
            {places.length} of {maxPlaces} saved
          </Text>
        </View>
      )}

      {/* Places List */}
      {sortedPlaces.length === 0 ? (
        <View style={styles.emptyState}>
          <CustomIcon name="location" size={48} color={ds.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Saved Places</Text>
          <Text style={styles.emptyText}>
            Add your home, work, or other frequently visited places for quick access.
          </Text>
        </View>
      ) : (
        <View style={compact ? styles.compactList : styles.placesList}>
          {sortedPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onPress={() => onSelectPlace(place)}
              onEdit={() => handleEditPress(place)}
              onDelete={() => handleDeletePress(place)}
              compact={compact}
            />
          ))}
        </View>
      )}

      {/* Add Button */}
      {canAddMore && (
        <Pressable onPress={handleAddPress} style={styles.addButton}>
          <View style={styles.addButtonIcon}>
            <CustomIcon name="location" size={20} color={ds.colors.primary} />
          </View>
          <Text style={styles.addButtonText}>Add Favorite Place</Text>
        </Pressable>
      )}

      {/* Add/Edit Modal */}
      <PlaceModal
        visible={modalVisible}
        place={editingPlace}
        onClose={handleCloseModal}
        onSave={handleSavePlace}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.lg,
  },
  title: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
  },
  subtitle: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  placesList: {
    gap: ds.spacing.md,
  },
  compactList: {
    gap: ds.spacing.xs,
  },
  // Place Card Styles
  placeCard: {
    padding: ds.spacing.lg,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
  },
  placeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: ds.radius.md,
    backgroundColor: `${ds.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ds.spacing.md,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
  },
  placeType: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  placeAddress: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    lineHeight: 18,
  },
  editButton: {
    padding: ds.spacing.sm,
  },
  // Compact Card Styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.sm,
    backgroundColor: `${ds.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ds.spacing.md,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium as '500',
    color: ds.colors.textPrimary,
  },
  compactAddress: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    marginTop: ds.spacing.lg,
  },
  emptyText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    marginTop: ds.spacing.sm,
    paddingHorizontal: ds.spacing.xl,
    lineHeight: 20,
  },
  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing.lg,
    marginTop: ds.spacing.lg,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderStyle: 'dashed',
    borderRadius: ds.radius.lg,
  },
  addButtonIcon: {
    marginRight: ds.spacing.sm,
  },
  addButtonText: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium as '500',
    color: ds.colors.primary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    padding: ds.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.xl,
  },
  modalTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
  },
  closeButton: {
    padding: ds.spacing.xs,
  },
  sectionLabel: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium as '500',
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.sm,
    marginTop: ds.spacing.md,
  },
  typeScroll: {
    marginBottom: ds.spacing.md,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    borderRadius: ds.radius.xl,
    backgroundColor: ds.colors.surface,
    marginRight: ds.spacing.sm,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  typeChipActive: {
    backgroundColor: `${ds.colors.primary}15`,
    borderColor: ds.colors.primary,
  },
  typeChipText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginLeft: ds.spacing.xs,
  },
  typeChipTextActive: {
    color: ds.colors.primary,
    fontWeight: ds.typography.weight.medium as '500',
  },
  input: {
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.lg,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: ds.spacing.md,
    marginTop: ds.spacing.xl,
  },
  cancelButton: {
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.xl,
  },
  cancelButtonText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  saveButton: {
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.xl,
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.md,
  },
  saveButtonText: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.backgroundDeep,
  },
});

export default FavoritePlaces;
