/**
 * Ride History Screen Component
 * Displays past rides with map thumbnails and receipt details
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Svg, Path } from 'react-native-svg';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';

interface RideHistoryItem {
  id: string;
  destination: string;
  origin: string;
  price: number;
  date: string;
  time: string;
  carType: string;
  status: 'completed' | 'cancelled';
  rating?: number;
  driver?: {
    name: string;
    rating: number;
  };
}

interface RideHistoryScreenProps {
  onSelectRide?: (ride: RideHistoryItem) => void;
}

// Mock data
const MOCK_RIDE_HISTORY: RideHistoryItem[] = [
  {
    id: '1',
    destination: 'LAX Airport',
    origin: 'Downtown LA',
    price: 45.50,
    date: 'Nov 24',
    time: '2:30 PM',
    carType: 'Aura Black',
    status: 'completed',
    rating: 5,
    driver: { name: 'Michael S.', rating: 4.95 },
  },
  {
    id: '2',
    destination: 'Santa Monica Pier',
    origin: 'Beverly Hills',
    price: 28.00,
    date: 'Nov 23',
    time: '7:15 PM',
    carType: 'Aura X',
    status: 'completed',
    rating: 5,
    driver: { name: 'Sarah L.', rating: 4.92 },
  },
  {
    id: '3',
    destination: 'The Grove',
    origin: 'Hollywood',
    price: 18.50,
    date: 'Nov 22',
    time: '12:00 PM',
    carType: 'Aura Go',
    status: 'cancelled',
  },
  {
    id: '4',
    destination: 'Nobu Malibu',
    origin: 'West Hollywood',
    price: 62.00,
    date: 'Nov 20',
    time: '8:00 PM',
    carType: 'Aura Black',
    status: 'completed',
    rating: 5,
    driver: { name: 'James K.', rating: 4.98 },
  },
];

// Skeleton Component
const Skeleton: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}> = ({ width = '100%', height = 20, borderRadius = ds.radius.sm, style }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withSpring(opacity.value === 0.3 ? 0.6 : 0.3, {
        damping: 15,
        stiffness: 100,
      });
    }, 800);
    return () => clearInterval(interval);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: ds.colors.surface,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

// Map Thumbnail Component
const MapThumbnail: React.FC = () => (
  <View style={styles.mapThumbnail}>
    {/* Grid Pattern */}
    <View style={styles.mapGrid} />
    {/* Route Line */}
    <Svg style={styles.mapRoute} viewBox="0 0 24 24">
      <Path
        d="M4 20 Q 12 18 20 4"
        stroke={ds.colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  </View>
);

// History Card Component
const HistoryCard: React.FC<{
  ride: RideHistoryItem;
  index: number;
  onPress: () => void;
}> = ({ ride, index, onPress }) => {
  const haptics = useHaptics();
  const sound = useSound();
  const scale = useSharedValue(1);

  const isCompleted = ride.status === 'completed';

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

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
      entering={FadeInDown.delay(index * 100).duration(300)}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <GlassCard style={styles.historyCard}>
          <View style={styles.cardContent}>
            {/* Map Thumbnail */}
            <MapThumbnail />

            {/* Ride Details */}
            <View style={styles.rideDetails}>
              {/* Header Row */}
              <View style={styles.headerRow}>
                <Text style={styles.destination} numberOfLines={1}>
                  {ride.destination}
                </Text>
                <Text style={styles.price}>${ride.price.toFixed(2)}</Text>
              </View>

              {/* Date/Time */}
              <Text style={styles.dateTime}>
                {ride.date} • {ride.time}
              </Text>

              {/* Footer Row */}
              <View style={styles.footerRow}>
                <View style={styles.footerLeft}>
                  {/* Car Type Badge */}
                  <View style={styles.carTypeBadge}>
                    <Text style={styles.carTypeText}>{ride.carType}</Text>
                  </View>

                  {/* Driver Name */}
                  {ride.driver && (
                    <>
                      <View style={styles.divider} />
                      <Text style={styles.driverName}>{ride.driver.name}</Text>
                    </>
                  )}
                </View>

                {/* Status */}
                <Text style={[
                  styles.status,
                  isCompleted ? styles.statusCompleted : styles.statusCancelled,
                ]}>
                  {ride.status.toUpperCase()}
                  {ride.rating && ` • ★ ${ride.rating}.0`}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

// Filter and Sort Types
type FilterStatus = 'all' | 'completed' | 'cancelled';
type SortOption = 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc';
type DateRange = 'all' | 'week' | 'month' | '3months';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  all: 'All Time',
  week: 'This Week',
  month: 'This Month',
  '3months': 'Last 3 Months',
};

const SORT_LABELS: Record<SortOption, string> = {
  date_desc: 'Newest First',
  date_asc: 'Oldest First',
  price_desc: 'Highest Price',
  price_asc: 'Lowest Price',
};

// Filter Bar Component
const FilterBar: React.FC<{
  statusFilter: FilterStatus;
  sortOption: SortOption;
  dateRange: DateRange;
  onStatusChange: (status: FilterStatus) => void;
  onSortChange: (sort: SortOption) => void;
  onDateRangeChange: (range: DateRange) => void;
}> = ({ statusFilter, sortOption, dateRange, onStatusChange, onSortChange, onDateRangeChange }) => {
  const haptics = useHaptics();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);

  const handleStatusPress = useCallback((status: FilterStatus) => {
    haptics.trigger('tap');
    onStatusChange(status);
  }, [haptics, onStatusChange]);

  return (
    <Animated.View entering={FadeIn.delay(100).duration(200)} style={styles.filterBar}>
      {/* Status Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
        {(['all', 'completed', 'cancelled'] as FilterStatus[]).map((status) => (
          <Pressable
            key={status}
            style={[styles.filterPill, statusFilter === status && styles.filterPillActive]}
            onPress={() => handleStatusPress(status)}
          >
            <Text style={[styles.filterPillText, statusFilter === status && styles.filterPillTextActive]}>
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort & Date Range Buttons */}
      <View style={styles.filterActions}>
        {/* Date Range */}
        <Pressable
          style={styles.filterButton}
          onPress={() => {
            haptics.trigger('tap');
            setShowDateMenu(!showDateMenu);
            setShowSortMenu(false);
          }}
        >
          <CustomIcon name="activity" size={14} color={ds.colors.textSecondary} />
          <Text style={styles.filterButtonText}>{DATE_RANGE_LABELS[dateRange]}</Text>
        </Pressable>

        {/* Sort */}
        <Pressable
          style={styles.filterButton}
          onPress={() => {
            haptics.trigger('tap');
            setShowSortMenu(!showSortMenu);
            setShowDateMenu(false);
          }}
        >
          <CustomIcon name="menu" size={14} color={ds.colors.textSecondary} />
          <Text style={styles.filterButtonText}>Sort</Text>
        </Pressable>
      </View>

      {/* Sort Dropdown */}
      {showSortMenu && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.dropdown}>
          {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
            <Pressable
              key={option}
              style={[styles.dropdownItem, sortOption === option && styles.dropdownItemActive]}
              onPress={() => {
                haptics.trigger('tap');
                onSortChange(option);
                setShowSortMenu(false);
              }}
            >
              <Text style={[styles.dropdownText, sortOption === option && styles.dropdownTextActive]}>
                {SORT_LABELS[option]}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Date Range Dropdown */}
      {showDateMenu && (
        <Animated.View entering={FadeIn.duration(150)} style={[styles.dropdown, styles.dropdownLeft]}>
          {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
            <Pressable
              key={range}
              style={[styles.dropdownItem, dateRange === range && styles.dropdownItemActive]}
              onPress={() => {
                haptics.trigger('tap');
                onDateRangeChange(range);
                setShowDateMenu(false);
              }}
            >
              <Text style={[styles.dropdownText, dateRange === range && styles.dropdownTextActive]}>
                {DATE_RANGE_LABELS[range]}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
};

export const RideHistoryScreen: React.FC<RideHistoryScreenProps> = ({
  onSelectRide,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<RideHistoryItem | null>(null);
  
  // Filter & Sort State
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort rides
  const filteredRides = useMemo(() => {
    let rides = [...MOCK_RIDE_HISTORY];

    // Apply status filter
    if (statusFilter !== 'all') {
      rides = rides.filter(r => r.status === statusFilter);
    }

    // Apply date range filter (simplified - in production would use actual dates)
    // For demo, we just limit the count
    if (dateRange === 'week') {
      rides = rides.slice(0, 2);
    } else if (dateRange === 'month') {
      rides = rides.slice(0, 3);
    } else if (dateRange === '3months') {
      rides = rides.slice(0, 4);
    }

    // Apply sorting
    rides.sort((a, b) => {
      switch (sortOption) {
        case 'date_asc':
          return a.id.localeCompare(b.id); // Simplified
        case 'price_desc':
          return b.price - a.price;
        case 'price_asc':
          return a.price - b.price;
        case 'date_desc':
        default:
          return b.id.localeCompare(a.id);
      }
    });

    return rides;
  }, [statusFilter, sortOption, dateRange]);

  const handleSelectRide = useCallback((ride: RideHistoryItem) => {
    setSelectedRide(ride);
    onSelectRide?.(ride);
  }, [onSelectRide]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>
          {filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''}
        </Text>
      </Animated.View>

      {/* Filter Bar */}
      <FilterBar
        statusFilter={statusFilter}
        sortOption={sortOption}
        dateRange={dateRange}
        onStatusChange={setStatusFilter}
        onSortChange={setSortOption}
        onDateRangeChange={setDateRange}
      />

      {/* Ride List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          // Skeleton Loading
          Array.from({ length: 3 }).map((_, i) => (
            <GlassCard key={i} style={styles.skeletonCard}>
              <View style={styles.cardContent}>
                <Skeleton width={64} height={64} borderRadius={ds.radius.md} />
                <View style={styles.skeletonDetails}>
                  <Skeleton width="60%" height={18} />
                  <Skeleton width="40%" height={12} style={{ marginTop: ds.spacing.sm }} />
                  <View style={styles.skeletonFooter}>
                    <Skeleton width={60} height={20} borderRadius={ds.radius.xl} />
                    <Skeleton width={40} height={14} />
                  </View>
                </View>
              </View>
            </GlassCard>
          ))
        ) : filteredRides.length === 0 ? (
          // Empty State
          <View style={styles.emptyState}>
            <CustomIcon name="activity" size={48} color={ds.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : (
          // Actual Data
          filteredRides.map((ride, index) => (
            <HistoryCard
              key={ride.id}
              ride={ride}
              index={index}
              onPress={() => handleSelectRide(ride)}
            />
          ))
        )}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Receipt Modal */}
      <Modal
        visible={selectedRide !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRide(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedRide(null)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedRide && (
              <GlassCard elevated style={styles.receiptCard}>
                {/* Receipt Header */}
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptIcon}>
                    <CustomIcon name="check" size={32} color={ds.colors.success} />
                  </View>
                  <Text style={styles.receiptTitle}>Receipt</Text>
                </View>

                {/* Receipt Details */}
                <View style={styles.receiptDetails}>
                  <Text style={styles.receiptDate}>
                    {selectedRide.date} • {selectedRide.time}
                  </Text>

                  <View style={styles.receiptDestination}>
                    <Text style={styles.receiptLabel}>DESTINATION</Text>
                    <Text style={styles.receiptValue}>{selectedRide.destination}</Text>
                  </View>

                  {/* Fare Breakdown */}
                  <View style={styles.fareBreakdown}>
                    <View style={styles.fareRow}>
                      <Text style={styles.fareLabel}>{selectedRide.carType} Base Fare</Text>
                      <Text style={styles.fareAmount}>
                        ${(selectedRide.price * 0.8).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.fareRow}>
                      <Text style={styles.fareLabel}>Service Fee</Text>
                      <Text style={styles.fareAmount}>
                        ${(selectedRide.price * 0.15).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.fareRow}>
                      <Text style={styles.fareLabel}>Tax</Text>
                      <Text style={styles.fareAmount}>
                        ${(selectedRide.price * 0.05).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.fareDivider} />

                    <View style={styles.fareRow}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalAmount}>
                        ${selectedRide.price.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Driver Info */}
                  {selectedRide.driver && (
                    <View style={styles.driverInfo}>
                      <View style={styles.driverAvatar}>
                        <Text style={styles.driverEmoji}>👨‍✈️</Text>
                      </View>
                      <View style={styles.driverDetails}>
                        <Text style={styles.driverNameReceipt}>
                          {selectedRide.driver.name}
                        </Text>
                        <Text style={styles.driverRating}>
                          ★ {selectedRide.driver.rating}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Close Button */}
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setSelectedRide(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </GlassCard>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  header: {
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.lg,
    paddingBottom: ds.spacing.md,
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
    gap: ds.spacing.md,
  },
  historyCard: {
    padding: ds.spacing.md,
  },
  skeletonCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  mapThumbnail: {
    width: 64,
    height: 64,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    overflow: 'hidden',
  },
  mapGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  mapRoute: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    padding: ds.spacing.sm,
  },
  rideDetails: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  destination: {
    flex: 1,
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginRight: ds.spacing.sm,
  },
  price: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  dateTime: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ds.spacing.md,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carTypeBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xxs,
    borderRadius: ds.radius.xs,
    backgroundColor: ds.colors.primary + '15',
    borderWidth: 1,
    borderColor: ds.colors.primary + '30',
  },
  carTypeText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    letterSpacing: ds.typography.tracking.wide,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: ds.colors.borderSubtle,
    marginHorizontal: ds.spacing.sm,
  },
  driverName: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
  },
  status: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    letterSpacing: ds.typography.tracking.wide,
  },
  statusCompleted: {
    color: ds.colors.success,
  },
  statusCancelled: {
    color: ds.colors.textSecondary,
  },
  skeletonDetails: {
    flex: 1,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ds.spacing.md,
  },
  bottomSpacer: {
    height: ds.spacing.xxxl * 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  receiptCard: {
    padding: 0,
    overflow: 'hidden',
  },
  receiptHeader: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xl,
    backgroundColor: ds.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  receiptIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ds.colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.sm,
    borderWidth: 1,
    borderColor: ds.colors.success + '30',
  },
  receiptTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  receiptDetails: {
    padding: ds.spacing.lg,
  },
  receiptDate: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    marginBottom: ds.spacing.lg,
  },
  receiptDestination: {
    marginBottom: ds.spacing.lg,
    paddingBottom: ds.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  receiptLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textSecondary,
    letterSpacing: ds.typography.tracking.ultraWide,
    marginBottom: ds.spacing.xs,
  },
  receiptValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  fareBreakdown: {
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ds.spacing.xs,
  },
  fareLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  fareAmount: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textPrimary,
  },
  fareDivider: {
    height: 1,
    backgroundColor: ds.colors.borderSubtle,
    marginVertical: ds.spacing.sm,
  },
  totalLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
  },
  totalAmount: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  driverEmoji: {
    fontSize: 20,
  },
  driverDetails: {
    flex: 1,
  },
  driverNameReceipt: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  driverRating: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.primary,
    marginTop: ds.spacing.xxs,
  },
  closeButton: {
    padding: ds.spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  closeButtonText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
  },
  // Filter Bar Styles
  filterBar: {
    paddingHorizontal: ds.spacing.lg,
    paddingBottom: ds.spacing.md,
    position: 'relative',
  },
  filterPills: {
    flexDirection: 'row',
    marginBottom: ds.spacing.sm,
  },
  filterPill: {
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.surface,
    marginRight: ds.spacing.sm,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  filterPillActive: {
    backgroundColor: ds.colors.primary + '20',
    borderColor: ds.colors.primary,
  },
  filterPillText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  filterPillTextActive: {
    color: ds.colors.primary,
    fontWeight: ds.typography.weight.medium,
  },
  filterActions: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  filterButtonText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: ds.spacing.lg,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    padding: ds.spacing.xs,
    zIndex: 100,
    minWidth: 150,
  },
  dropdownLeft: {
    right: undefined,
    left: ds.spacing.lg,
  },
  dropdownItem: {
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.sm,
  },
  dropdownItemActive: {
    backgroundColor: ds.colors.primary + '15',
  },
  dropdownText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  dropdownTextActive: {
    color: ds.colors.primary,
    fontWeight: ds.typography.weight.medium,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xxxl,
  },
  emptyTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginTop: ds.spacing.lg,
  },
  emptyText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xs,
  },
});

export default RideHistoryScreen;
