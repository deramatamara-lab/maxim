/**
 * Rider Home Screen - Cinematic UI matching reference prototype
 * 
 * Layout (from reference App.tsx):
 * - Layer 0: Full-screen 3D Globe (fades out when map active)
 * - Layer 1: Map HUD (fades in)
 * - Layer 2: Foreground UI
 *   - TOP: Header with GlassView (avatar + name) + AIChat button
 *   - BOTTOM: Content area (search card, location chips, CTA)
 *   - FIXED BOTTOM: FloatingTabBar
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MotiView } from 'moti';

import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon, type IconName } from '@/components/ui/CustomIcon';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { Globe, type GlobeHandle } from '@/components/3d/Globe';
import { MapContainer, type MapContainerHandle } from '@/components/map/MapContainer';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import {
  useEnhancedAppStore,
  useEnhancedSearchState,
  useEnhancedRideState,
} from '@/store/useEnhancedAppStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock locations matching reference
const MOCK_LOCATIONS = [
  { name: 'Вкъщи', lat: 42.6977, lon: 23.3219 },
  { name: 'Офис', lat: 42.7000, lon: 23.3300 },
  { name: 'Фитнес', lat: 42.6900, lon: 23.3100 },
  { name: 'Любимо кафе', lat: 42.6800, lon: 23.3000 },
];

export default function RiderHome() {
  const { play } = useSound();
  const { trigger } = useHaptics();
  
  // Store state
  const { user } = useEnhancedAppStore();
  const { destination, setDestination } = useEnhancedSearchState();
  const { rideOptions, selectedRideOptionId, setSelectedRideOption, fetchRideOptions } = useEnhancedRideState();

  // Local state matching reference
  const [phase, setPhase] = useState<'HOME' | 'TRANSITION' | 'RIDE_SELECT' | 'ACTIVE_RIDE'>('HOME');
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'location' | 'settings'>('home');
  const [activeChip, setActiveChip] = useState<string>(MOCK_LOCATIONS[0].name);

  // Refs
  const globeRef = useRef<GlobeHandle>(null);
  const mapRef = useRef<MapContainerHandle>(null);

  // Animation values for crossfade
  const globeOpacity = useSharedValue(1);
  const mapOpacity = useSharedValue(0);

  // Fetch initial data
  useEffect(() => {
    fetchRideOptions();
  }, [fetchRideOptions]);

  // Animated styles
  const globeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: globeOpacity.value,
  }));

  const mapAnimatedStyle = useAnimatedStyle(() => ({
    opacity: mapOpacity.value,
  }));

  // Handle location select - triggers the fly-to animation sequence
  const handleLocationSelect = useCallback((location: { lat: number; lon: number; name?: string }) => {
    trigger('tap');
    play('tapSoft');
    
    setTargetCoords(location);
    if (location.name) setDestination(location.name);

    // Animation Sequence: Fly to Globe -> Transition to Map -> Show Ride Select
    setTimeout(() => {
      setPhase('TRANSITION');
      globeRef.current?.zoomToLocation({ lat: location.lat, lon: location.lon });
      
      setTimeout(() => {
        // Crossfade to map
        globeOpacity.value = withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) });
        mapOpacity.value = withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) });
        setShowMap(true);
        setPhase('RIDE_SELECT');
      }, 1500);
    }, 500);
  }, [trigger, play, setDestination, globeOpacity, mapOpacity]);

  // Reset to home
  const resetToHome = useCallback(() => {
    setPhase('HOME');
    setShowMap(false);
    setTargetCoords(null);
    setDestination('');
    setSelectedRideOption(null);
    
    // Reset animations
    globeOpacity.value = withTiming(1, { duration: 500 });
    mapOpacity.value = withTiming(0, { duration: 500 });
  }, [setDestination, setSelectedRideOption, globeOpacity, mapOpacity]);

  // Handle ride confirm
  const handleRideConfirm = useCallback(() => {
    if (!selectedRideOptionId) return;
    trigger('confirm');
    play('success');
    setPhase('ACTIVE_RIDE');
  }, [selectedRideOptionId, trigger, play]);

  // Render home content (matching reference exactly)
  const travelerName = user?.name ?? 'Тони Старк';

  const renderHomeContent = () => {
    if (phase === 'TRANSITION') return null;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.homeContent}
      >
        {/* Search Card - GlassView with destination */}
        <MotiView
          from={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <GlassCard style={styles.searchCard}>
            <View style={styles.searchHeader}>
              <Text style={styles.currentLocationLabel}>ТЕКУЩА ПОЗИЦИЯ</Text>
              <View style={styles.statusPill}>
                <MotiView
                  from={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ type: 'timing', duration: 1500, loop: true }}
                  style={styles.statusDot}
                />
                <Text style={styles.statusText}>Сигурно</Text>
              </View>
            </View>

            <Text style={styles.currentLocationValue}>{destination || 'Текуща позиция'}</Text>

            <Pressable
              style={styles.destinationInput}
              onPress={() => {
                trigger('tap');
                play('tapSoft');
                handleLocationSelect({ lat: 42.6977, lon: 23.3219, name: 'Текуща позиция' });
              }}
            >
              <MotiView
                from={{ scale: 0.9 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ type: 'timing', duration: 2000, loop: true, delay: 500 }}
                style={styles.destinationInputDot}
              />
              <View>
                <Text style={styles.destinationInputLabel}>Накъде отивате?</Text>
                <Text style={styles.destinationPlaceholder}>Добавете дестинация</Text>
              </View>
            </Pressable>
          </GlassCard>
        </MotiView>

        {/* Location Chips - Horizontal scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.locationChipsContainer}
          style={styles.locationChipsScroll}
        >
          {MOCK_LOCATIONS.map((loc, index) => {
            const isActive = activeChip === loc.name;
            return (
              <MotiView
                key={loc.name}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 300, delay: 100 + index * 80 }}
              >
                <Pressable
                  style={[styles.locationChip, isActive && styles.locationChipActive]}
                  onPress={() => {
                    trigger('tap');
                    play('tapSoft');
                    setActiveChip(loc.name);
                    handleLocationSelect(loc);
                  }}
                >
                  {isActive && (
                    <LinearGradient
                      colors={['rgba(0,255,115,0.2)', 'rgba(0,255,115,0.05)']}
                      style={styles.chipGradient}
                    />
                  )}
                  <Text style={[styles.locationChipText, isActive && styles.locationChipTextActive]}>{loc.name}</Text>
                </Pressable>
              </MotiView>
            );
          })}
        </ScrollView>

        {/* Request Ride Button */}
        <MotiView
          from={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 300 }}
        >
          <Pressable
            style={styles.requestButton}
            onPress={() => {
              trigger('confirm');
              play('success');
              handleLocationSelect({ lat: 42.6977, lon: 23.3219, name: destination || 'Текуща позиция' });
            }}
          >
            <LinearGradient
              colors={['#00FF73', '#00D463']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.requestButtonGradient}
            />
            <View style={styles.requestButtonIconWrap}>
              <CustomIcon name="search" size={20} color="#00130A" />
            </View>
            <Text style={styles.requestButtonText}>Търси превоз</Text>
          </Pressable>
        </MotiView>
      </MotiView>
    );
  };

  // Render ride selection (matching reference RideSelection.tsx)
  const renderRideSelection = () => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 100 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        style={styles.rideSelectionContainer}
      >
        <GlassCard style={styles.rideSelectionCard}>
          {/* Header */}
          <View style={styles.rideSelectionHeader}>
            <Pressable onPress={resetToHome} style={styles.backButton}>
              <CustomIcon name="chevronRight" size={20} color={ds.colors.textSecondary} />
            </Pressable>
            <View style={styles.rideSelectionTitleContainer}>
              <Text style={styles.rideSelectionSubtitle}>ФЛОТ</Text>
              <Text style={styles.rideSelectionTitle}>Избери превоз</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Ride Options */}
          <ScrollView style={styles.rideOptionsList} showsVerticalScrollIndicator={false}>
            {rideOptions.map((ride, index) => {
              const isSelected = selectedRideOptionId === ride.id;
              return (
                <MotiView
                  key={ride.id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                >
                  <Pressable
                    style={[styles.rideOption, isSelected && styles.rideOptionSelected]}
                    onPress={() => {
                      trigger('tap');
                      play('tapSoft');
                      setSelectedRideOption(ride.id);
                    }}
                  >
                    {/* Selection glow */}
                    {isSelected && <View style={styles.rideOptionGlow} />}
                    
                    <View style={styles.rideOptionContent}>
                      {/* Icon */}
                      <View style={[styles.rideOptionIcon, isSelected && styles.rideOptionIconSelected]}>
                        <Text style={styles.rideOptionEmoji}>
                          {ride.name.includes('Black') ? '★' : ride.name.includes('Hyper') ? '🚀' : '⚡'}
                        </Text>
                      </View>
                      
                      {/* Info */}
                      <View style={styles.rideOptionInfo}>
                        <Text style={[styles.rideOptionName, isSelected && styles.rideOptionNameSelected]}>
                          {ride.name}
                        </Text>
                        <Text style={styles.rideOptionTime}>{ride.estimatedTime} away</Text>
                      </View>
                      
                      {/* Price */}
                      <Text style={[styles.rideOptionPrice, isSelected && styles.rideOptionPriceSelected]}>
                        ${ride.basePrice}
                      </Text>
                    </View>
                  </Pressable>
                </MotiView>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.rideSelectionFooter}>
            {/* Payment Row */}
            <Pressable style={styles.paymentRow}>
              <View style={styles.paymentIcon}>
                <Text style={styles.paymentIconText}>VISA</Text>
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Метод на плащане</Text>
                <Text style={styles.paymentValue}>•••• 4242</Text>
              </View>
              <View style={styles.paymentChange}>
                <Text style={styles.paymentChangeText}>Смени</Text>
              </View>
            </Pressable>

            {/* Confirm Button */}
            <PremiumButton
              variant="secondary"
              size="lg"
              onPress={handleRideConfirm}
              disabled={!selectedRideOptionId}
              style={styles.confirmButton}
            >
              {selectedRideOptionId 
                ? `Заяви ${rideOptions.find(r => r.id === selectedRideOptionId)?.name.toUpperCase()}`
                : 'Избери превоз'
              }
            </PremiumButton>
          </View>
        </GlassCard>
      </MotiView>
    );
  };

  const navigationItems = useMemo(
    () => (
      [
        { id: 'home' as const, label: 'Начало', icon: 'home' as IconName },
        { id: 'activity' as const, label: 'Активност', icon: 'activity' as IconName },
        { id: 'location' as const, label: 'Локации', icon: 'location' as IconName },
        { id: 'settings' as const, label: 'Настройки', icon: 'settings' as IconName },
      ]
    ),
    []
  );

  const renderNavigation = () => (
    <MotiView
      from={{ opacity: 0, translateY: 40 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 200 }}
      style={styles.navContainer}
    >
      <View style={styles.navBackground}>
        {navigationItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                trigger('tap');
                play('tapSoft');
                setActiveTab(item.id);
              }}
              style={[styles.navButton, isActive && styles.navButtonActive]}
            >
              {isActive && (
                <LinearGradient
                  colors={['rgba(0,255,115,0.25)', 'rgba(0,255,115,0.05)']}
                  style={styles.navButtonGradient}
                />
              )}
              <CustomIcon
                name={item.icon}
                size={22}
                color={isActive ? '#00FF73' : ds.colors.textSecondary}
                active={isActive}
              />
              {isActive && <View style={styles.navGlow} />}
            </Pressable>
          );
        })}
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Layer 0: 3D Globe Scene (Always Present, Fades out when Map is active) */}
      <Animated.View style={[styles.backgroundLayer, globeAnimatedStyle]}>
        <Globe
          ref={globeRef}
          height={SCREEN_HEIGHT}
          opacity={1}
        />
      </Animated.View>

      {/* Layer 1: Map HUD (Fades in) */}
      <Animated.View style={[styles.backgroundLayer, mapAnimatedStyle]}>
        {showMap && targetCoords && (
          <MapContainer
            ref={mapRef}
            coordinate={[targetCoords.lon, targetCoords.lat]}
          />
        )}
      </Animated.View>

      {/* Noise Overlay */}
      <NoiseOverlay opacity={ds.effects.noiseOpacity} />

      {/* Layer 2: Foreground UI */}
      <View style={styles.uiLayer} pointerEvents="box-none">
        
        {/* Header HUD - Always visible */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.header}
        >
          <GlassCard style={styles.headerCard}>
            <LinearGradient
              colors={['rgba(0,245,255,0.15)', 'rgba(0,245,255,0.02)']}
              style={styles.headerAvatarGlow}
            />
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{travelerName.charAt(0)}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerWelcome}>ДОБЪР ВЕЧЕР</Text>
              <Text style={styles.headerName}>{travelerName}</Text>
            </View>
          </GlassCard>
          
          {/* AI Chat Button */}
          <Pressable
            style={styles.aiButton}
            onPress={() => {
              trigger('tap');
              play('tapSoft');
            }}
          >
            <LinearGradient
              colors={['#00F5FF', '#00D4E0']}
              style={styles.aiButtonGradient}
            />
            <CustomIcon name="activity" size={20} color="#00130A" />
          </Pressable>
        </MotiView>

        {/* Dynamic Main Content Area */}
        <View style={styles.contentArea}>
          {phase === 'HOME' && renderHomeContent()}
          {phase === 'RIDE_SELECT' && renderRideSelection()}
        </View>

        {phase === 'HOME' && renderNavigation()}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050607',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  uiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.xl + 20, // Account for status bar
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    gap: ds.spacing.md,
  },
  headerAvatarGlow: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.6,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,245,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.primary,
  },
  headerInfo: {
    gap: 2,
  },
  headerWelcome: {
    fontSize: 10,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    letterSpacing: 2,
  },
  headerName: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
  },
  aiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 24px rgba(0,245,255,0.5)' }
      : {
          shadowColor: ds.colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 15,
          elevation: 8,
        }),
  },
  aiButtonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },

  // Content Area
  contentArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 100, // Space for tab bar
  },

  // Home Content
  homeContent: {
    paddingHorizontal: ds.spacing.lg,
    paddingBottom: ds.spacing.lg,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  searchCard: {
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.md,
    borderRadius: ds.radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.glassBorder,
    backgroundColor: 'rgba(10,10,10,0.92)',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  currentLocationLabel: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    backgroundColor: 'rgba(0,255,115,0.12)',
    borderRadius: ds.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,255,115,0.35)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ds.colors.secondary,
  },
  statusText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.secondary,
  },
  currentLocationValue: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.lg,
  },
  destinationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    backgroundColor: 'rgba(12,12,12,0.9)',
    borderRadius: ds.radius.lg,
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  destinationInputDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ds.colors.primary,
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  destinationInputLabel: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  destinationPlaceholder: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    color: ds.colors.textPrimary,
    marginTop: ds.spacing.xs,
  },
  locationChipsScroll: {
    marginBottom: ds.spacing.md,
  },
  locationChipsContainer: {
    gap: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
  },
  locationChip: {
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.md,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  chipGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ds.radius.lg,
  },
  locationChipText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    color: ds.colors.textPrimary,
  },
  locationChipActive: {
    backgroundColor: 'rgba(0,255,115,0.12)',
    borderColor: 'rgba(0,255,115,0.4)',
    shadowColor: ds.colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  locationChipTextActive: {
    color: ds.colors.secondary,
    fontWeight: ds.typography.weight.semibold as '600',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.md,
    borderRadius: ds.radius['2xl'],
    paddingVertical: ds.spacing.lg,
    marginTop: ds.spacing.lg,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 18px 40px rgba(0,255,115,0.35)' }
      : {
          shadowColor: ds.colors.secondary,
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 12,
        }),
  },
  requestButtonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ds.radius['2xl'],
  },
  requestButtonIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00D870',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestButtonText: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: '#00130A',
    letterSpacing: 1,
  },

  // Ride Selection
  rideSelectionContainer: {
    paddingHorizontal: ds.spacing.lg,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    maxHeight: '70%',
  },
  rideSelectionCard: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#050607E6',
  },
  rideSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.lg,
    paddingBottom: ds.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  rideSelectionTitleContainer: {
    alignItems: 'center',
  },
  rideSelectionSubtitle: {
    fontSize: 10,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.primary,
    letterSpacing: 3,
  },
  rideSelectionTitle: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    letterSpacing: 2,
    marginTop: 2,
  },
  rideOptionsList: {
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.md,
    maxHeight: 280,
  },
  rideOption: {
    marginBottom: ds.spacing.md,
    borderRadius: ds.radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  rideOptionSelected: {
    borderWidth: 1,
    borderColor: ds.colors.primary,
  },
  rideOptionGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ds.colors.primary + '15',
  },
  rideOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.spacing.md,
    backgroundColor: '#121212',
  },
  rideOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: ds.radius.lg,
    backgroundColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ds.spacing.md,
  },
  rideOptionIconSelected: {
    backgroundColor: ds.colors.primary + '30',
    borderWidth: 1,
    borderColor: ds.colors.primary + '50',
  },
  rideOptionEmoji: {
    fontSize: 24,
  },
  rideOptionInfo: {
    flex: 1,
  },
  rideOptionName: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textSecondary,
  },
  rideOptionNameSelected: {
    color: ds.colors.textPrimary,
  },
  rideOptionTime: {
    fontSize: 10,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium as '500',
    color: ds.colors.textSecondary,
    letterSpacing: 1,
    marginTop: 4,
  },
  rideOptionPrice: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textSecondary,
  },
  rideOptionPriceSelected: {
    color: ds.colors.primary,
  },
  rideSelectionFooter: {
    padding: ds.spacing.lg,
    paddingBottom: ds.spacing.xl,
    backgroundColor: '#050607',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616CC',
    borderRadius: ds.radius.lg,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  paymentIcon: {
    width: 48,
    height: 32,
    backgroundColor: '#000',
    borderRadius: ds.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  paymentIconText: {
    fontSize: 10,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: ds.spacing.md,
  },
  paymentLabel: {
    fontSize: 9,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textSecondary,
    letterSpacing: 2,
  },
  paymentValue: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    marginTop: 2,
  },
  paymentChange: {
    backgroundColor: ds.colors.primary + '15',
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.sm,
    borderWidth: 1,
    borderColor: ds.colors.primary + '30',
  },
  paymentChangeText: {
    fontSize: 10,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  confirmButton: {
    marginTop: ds.spacing.md,
  },
  navContainer: {
    paddingHorizontal: ds.spacing.lg,
    paddingBottom: ds.spacing.xl,
  },
  navBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10,10,10,0.95)',
    borderRadius: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    gap: ds.spacing.md,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 18px 40px rgba(0,245,255,0.25)' }
      : {
          shadowColor: ds.colors.primary,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
          elevation: 10,
        }),
  },
  navButton: {
    flex: 1,
    borderRadius: 32,
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  navButtonActive: {
    backgroundColor: 'rgba(0,255,115,0.18)',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 12px 30px rgba(0,255,115,0.3)' }
      : {
          shadowColor: ds.colors.secondary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 6,
        }),
  },
  navButtonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  navGlow: {
    position: 'absolute',
    bottom: ds.spacing.xs,
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00FF73',
    opacity: 0.85,
    left: '50%',
    transform: [{ translateX: -6 }],
  },
});