import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { useEnhancedRideState } from '@/store/useEnhancedAppStore';
import { RideHistory } from '@/api/rides';
import { log } from '@/utils/logger';

interface RideHistoryScreenProps {
  onBack: () => void;
}

export default function RideHistoryScreen({ onBack }: RideHistoryScreenProps) {
  const { rideHistory } = useEnhancedRideState();
  const [selectedRide, setSelectedRide] = useState<RideHistory | null>(null);
  const fadeValue = useSharedValue(0);

  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 600 });
  }, [fadeValue]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getVehicleColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      'black': '#000000',
      'white': '#FFFFFF',
      'silver': '#C0C0C0',
      'gray': '#808080',
      'grey': '#808080',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#00FF00',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'brown': '#964B00',
    };
    return colorMap[color.toLowerCase()] || ds.colors.textSecondary;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRidePress = (ride: RideHistory) => {
    setSelectedRide(ride);
  };

  const handleReceiptPress = (ride: RideHistory) => {
    Alert.alert(
      'Ride Receipt',
      `Receipt for ride on ${formatDate(ride.createdAt)}\n\nTotal: ${formatCurrency(ride.price)}\n\nWould you like to email this receipt?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email Receipt', onPress: () => log.warn('Email receipt for ride', { event: 'email_receipt_requested', component: 'rideHistory', rideId: ride.id }) },
      ]
    );
  };

  const handleRebookPress = (ride: RideHistory) => {
    Alert.alert(
      'Rebook Ride',
      'Would you like to book the same route again?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rebook', onPress: () => log.warn('Ride selected for rebook', { event: 'ride_rebook_requested', component: 'rideHistory', rideId: ride.id }) },
      ]
    );
  };

  const renderRideItem = ({ item, index }: { item: RideHistory; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <GlassCard
        elevated
        interactive
        style={styles.rideCard}
        onPress={() => handleRidePress(item)}
      >
        <View style={styles.rideHeader}>
          <View style={styles.rideInfo}>
            <Text style={styles.rideDate}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.rideTime}>{formatTime(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, item.status === 'completed' ? styles.completedBadge : styles.cancelledBadge]}>
            <Text style={styles.statusText}>{item.status === 'completed' ? 'Completed' : 'Cancelled'}</Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.locationRow}>
            <Icon name="location" size={16} color={ds.colors.secondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickup.address}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Icon name="location" size={16} color={ds.colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.destination.address}
            </Text>
          </View>
          
          {/* Driver Details - only show for completed rides */}
          {item.status === 'completed' && item.driver && (
            <View style={styles.driverSection}>
              <View style={styles.driverInfo}>
                {/* Driver Avatar */}
                <View style={styles.driverAvatar}>
                  {item.driver.photo ? (
                    <Image 
                      source={{ uri: item.driver.photo }} 
                      style={styles.driverPhoto}
                      onError={() => {
                        // Fallback to icon if image fails to load
                        log.warn('Driver photo failed to load, using fallback icon', {
                          event: 'driver_photo_load_failed',
                          component: 'rideHistory',
                        });
                      }}
                    />
                  ) : (
                    <Icon name="profile" size={20} color={ds.colors.textSecondary} />
                  )}
                </View>
                
                {/* Driver Name and Vehicle */}
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>{item.driver.name}</Text>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleText}>
                      {item.driver.vehicle.make} {item.driver.vehicle.model}
                    </Text>
                    <View style={[styles.colorDot, { backgroundColor: getVehicleColor(item.driver.vehicle.color) }]} />
                  </View>
                </View>
                
                {/* Driver Rating */}
                <View style={styles.ratingInfo}>
                  <Icon name="star" size={16} color={ds.colors.secondary} />
                  <Text style={styles.ratingText}>{item.driver.rating}</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Legacy Driver Rating - fallback for rides without driver details */}
          {item.status === 'completed' && !item.driver && item.driverRating && (
            <View style={styles.ratingSection}>
              <View style={styles.ratingInfo}>
                <Icon name="star" size={16} color={ds.colors.secondary} />
                <Text style={styles.ratingText}>Driver Rating: {item.driverRating}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.rideStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatCurrency(item.price)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.duration} min</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.distance} mi</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
        </View>

        <View style={styles.rideActions}>
          <Pressable style={styles.actionButton} onPress={() => handleReceiptPress(item)}>
            <Icon name="profile" size={16} color={ds.colors.primary} />
            <Text style={styles.actionText}>Receipt</Text>
          </Pressable>
          {item.status === 'completed' && (
            <Pressable style={styles.actionButton} onPress={() => handleRebookPress(item)}>
              <Icon name="search" size={16} color={ds.colors.primary} />
              <Text style={styles.actionText}>Rebook</Text>
            </Pressable>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View style={[styles.content, fadeStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Icon name="chevronRight" size={24} color={ds.colors.text} />
            </Pressable>
            <Text style={styles.title}>Ride History</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Stats Summary */}
          <GlassCard elevated style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{rideHistory.length}</Text>
                <Text style={styles.statLabel}>Total Rides</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency(rideHistory.reduce((sum, ride) => sum + ride.price, 0))}
                </Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.round(rideHistory.reduce((sum, ride) => sum + ride.distance, 0))}
                </Text>
                <Text style={styles.statLabel}>Total Miles</Text>
              </View>
            </View>
          </GlassCard>

          {/* Ride List */}
          <FlatList
            data={rideHistory}
            renderItem={renderRideItem}
            keyExtractor={(item) => item.id}
            style={styles.rideList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.rideListContent}
          />
        </Animated.View>

        {/* Selected Ride Details Modal */}
        {selectedRide && (
          <GlassCard elevated style={styles.selectedRideModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ride Details</Text>
              <Pressable onPress={() => { setSelectedRide(null); log.warn('Ride details closed', { event: 'ride_details_closed', component: 'rideHistory' }); }}>
                <Icon name="menu" size={24} color={ds.colors.text} />
              </Pressable>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Date: {formatDate(selectedRide.createdAt)}</Text>
              <Text style={styles.modalText}>Time: {formatTime(selectedRide.createdAt)}</Text>
              <Text style={styles.modalText}>Price: {formatCurrency(selectedRide.price)}</Text>
              <Text style={styles.modalText}>Duration: {selectedRide.duration} minutes</Text>
              <Text style={styles.modalText}>Distance: {selectedRide.distance} miles</Text>
              <Text style={styles.modalText}>Status: {selectedRide.status}</Text>
            </View>
          </GlassCard>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: ds.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ds.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  placeholder: {
    width: 40,
  },
  statsCard: {
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  statLabel: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  rideList: {
    flex: 1,
  },
  rideListContent: {
    gap: ds.spacing.md,
  },
  rideCard: {
    padding: ds.spacing.lg,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  rideInfo: {
    flex: 1,
  },
  rideDate: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  rideTime: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.sm,
  },
  completedBadge: {
    backgroundColor: ds.colors.secondary + '20',
  },
  cancelledBadge: {
    backgroundColor: ds.colors.error + '20',
  },
  statusText: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    fontFamily: ds.typography.family,
  },
  rideDetails: {
    marginBottom: ds.spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
    gap: ds.spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  driverSection: {
    marginTop: ds.spacing.sm,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  driverAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  driverPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    marginTop: 2,
  },
  vehicleText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ratingSection: {
    marginTop: ds.spacing.sm,
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  ratingText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  rideStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: ds.spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  rideActions: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
  },
  actionText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.primary,
    fontWeight: ds.typography.weight.medium,
    fontFamily: ds.typography.family,
  },
  selectedRideModal: {
    position: 'absolute',
    bottom: ds.spacing.lg,
    left: ds.spacing.lg,
    right: ds.spacing.lg,
    padding: ds.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  modalTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  modalContent: {
    gap: ds.spacing.sm,
  },
  modalText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
});
