import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnUI,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ds, TabId } from '@/constants/theme';
import { Globe, GlobeHandle } from '@/components/3d/Globe';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { SleekNav } from '@/components/ui/SleekNav';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { LocaleToggle } from '@/components/ui/ThemeToggle';
import { AccountSettings } from '@/components/navigation/AccountSettings';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { RegisterScreen } from '@/components/auth/RegisterScreen';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { AnimationProvider } from '@/providers/AnimationProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { useTranslation } from 'react-i18next';
import { useEnhancedAuthState, initializeAuthState } from '@/store/useEnhancedAppStore';
import { useRouter } from 'expo-router';
import { MapContainer, MapContainerHandle } from '@/components/map/MapContainer';
import { useTheme } from '@/providers/ThemeLocaleProvider';
import { useFadeAnimation, useScaleAnimation } from '@/hooks/useAnimations';

const { height: screenHeight } = Dimensions.get('window');


export default function PremiumShellScreen() {
  // Initialize auth state on app mount
  useEffect(() => {
    initializeAuthState();
  }, []);

  return (
    <AnimationProvider enablePerformanceMonitoring={true}>
      <PremiumShellScreenContent />
    </AnimationProvider>
  );
}

function PremiumShellScreenContent() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, user } = useEnhancedAuthState();
  const { colors } = useTheme();
  const router = useRouter();
  const { animatedStyle: toggleAnimatedStyle } = useFadeAnimation('modalEnter');
  const { animatedStyle: headerAnimatedStyle } = useFadeAnimation('entrance');
  const { scale: _menuScale, animatedStyle: menuAnimatedStyle, press: pressMenu, release: releaseMenu } = useScaleAnimation('buttonPress');
  const [tab, setTab] = useState<TabId>('home');
  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<[number, number]>([23.3219, 42.6977]);
  const { trigger } = useHaptics();
  const { play } = useSound();
  const globeRef = useRef<GlobeHandle>(null);
  const mapRef = useRef<MapContainerHandle>(null);

  // Animation values for cinematic effects
  const heroOpacity = useSharedValue(1);
  const glassOpacity = useSharedValue(1);
  const globeOpacity = useSharedValue(1);
  const mapOpacity = useSharedValue(0);
  const contentY = useSharedValue(0);

  const handleMenuToggle = useCallback(() => {
    trigger('tap');
    play('tapSoft');
    pressMenu();
    setShowMenu(true);
    setTimeout(() => releaseMenu(), 100);
  }, [trigger, play, pressMenu, releaseMenu]);

  const handleMenuClose = useCallback(() => {
    setShowMenu(false);
  }, []);

  const onSearch = useCallback(async () => {
    if (!destination || isSearching) return;
    
    trigger('confirm');
    play('success');
    setIsSearching(true);
    setErrorMsg(null);
    
    try {
      // Simulate geocoding delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 2/3: Trigger globe → map cinematic zoom
      const animations = () => {
        'worklet';
        heroOpacity.value = withTiming(0, {
          duration: ds.motion.duration.crossFade,
        });
        glassOpacity.value = withTiming(0, {
          duration: ds.motion.duration.crossFade,
        });
      };
      runOnUI(animations)();
      
      // Trigger globe zoom to simulated coordinates
      const lat = 42.6977; // Sofia, Bulgaria
      const lon = 23.3219;
      setMapCoordinates([lon, lat]);
      
      setTimeout(() => {
        if (Platform.OS !== 'web') {
          globeRef.current?.zoomToLocation({ lat, lon });
        }
        
        // After zoom completes, crossfade to map
        setTimeout(() => {
          const crossfadeAnimations = () => {
            'worklet';
            globeOpacity.value = withTiming(0, {
              duration: ds.motion.duration.crossFade,
            });
            mapOpacity.value = withTiming(1, {
              duration: ds.motion.duration.crossFade,
            });
          };
          runOnUI(crossfadeAnimations)();
          setShowMap(true);
        }, Platform.OS !== 'web' ? 2500 : 500); // Shorter delay on web
      }, 500);
      
    } catch {
      setErrorMsg(t('home.error.locationNotFound'));
      trigger('error');
      play('warning');
    } finally {
      setIsSearching(false);
    }
  }, [destination, isSearching, trigger, play, heroOpacity, glassOpacity, globeOpacity, mapOpacity, t]);

  const glassAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glassOpacity.value,
  }));

  const globeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: globeOpacity.value,
  }));

  const mapAnimatedStyle = useAnimatedStyle(() => ({
    opacity: mapOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={[ds.colors.backgroundDeep, ds.colors.background]}
          style={styles.backgroundLayer}
        />
        <View style={styles.loadingContainer}>
          <CustomIcon name="location" size={48} />
          <Text style={styles.loadingText}>Aura</Text>
          <Text style={styles.loadingSubtext}>Preparing your journey...</Text>
        </View>
      </View>
    );
  }

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={[ds.colors.backgroundDeep, ds.colors.background]}
          style={styles.backgroundLayer}
        />
        
        {authMode === 'login' ? (
          <LoginScreen
            onSuccess={() => {
              trigger('confirm');
              play('success');
            }}
            onRegisterPress={() => {
              setAuthMode('register');
              trigger('tap');
              play('tapSoft');
            }}
            onForgotPasswordPress={() => {
              setShowForgotPassword(true);
              trigger('tap');
              play('tapSoft');
            }}
          />
        ) : (
          <RegisterScreen
            onSuccess={() => {
              trigger('confirm');
              play('success');
            }}
            onLoginPress={() => {
              setAuthMode('login');
              trigger('tap');
              play('tapSoft');
            }}
          />
        )}
        
        {/* Dev Portal Button */}
        <TouchableOpacity 
          style={styles.devPortalButton}
          onPress={() => {
            trigger('tap');
            play('tapSoft');
            router.push('/dev-portal');
          }}
        >
          <Text style={styles.devPortalButtonText}>🚀 Dev Portal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={[styles.blob, styles.blobLeft]} />
      <View style={[styles.blob, styles.blobRight]} />

      <View style={[styles.mobileFrame, { backgroundColor: colors.backgroundDeep }]}>
        <LinearGradient
          colors={[colors.backgroundDeep, colors.background]}
          style={styles.backgroundLayer}
        />

        <View style={styles.globeLayer}>
          <Animated.View style={globeAnimatedStyle}>
            <Globe
              ref={globeRef}
              height={screenHeight * 0.55}
              onZoomComplete={() => {
                trigger('tap');
                play('success');
              }}
            />
          </Animated.View>

          {showMap && (
            <Animated.View style={[styles.mapOverlay, mapAnimatedStyle]}>
              <MapContainer
                ref={mapRef}
                coordinate={mapCoordinates}
                zoomLevel={13.2}
                pitch={62}
                heading={18}
                style={styles.mapContainer}
                onMapReady={() => {
                  trigger('tap');
                  play('success');
                }}
              />
            </Animated.View>
          )}
        </View>

        <View style={styles.uiLayer}>
          <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
            {/* Header Section - Floating glass header like reference */}
            <View style={styles.headerRow}>
              <GlassCard style={styles.headerCard}>
                <View style={styles.headerCardContent}>
                  <TouchableOpacity onPress={handleMenuToggle} style={styles.avatarButton}>
                    <CustomIcon name="profile" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <View style={styles.headerTextContainer}>
                    <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>WELCOME BACK</Text>
                    <Text style={[styles.nameText, { color: colors.textPrimary }]}>{user?.name || 'Guest'}</Text>
                  </View>
                </View>
              </GlassCard>
              
              <Animated.View style={[styles.toggleContainer, toggleAnimatedStyle]}>
                <LocaleToggle style={styles.localeToggle} />
              </Animated.View>
            </View>

            {/* Main Content - Search card pushed to bottom */}
            <View style={styles.mainContent}>
              <Animated.View style={glassAnimatedStyle}>
                <GlassCard elevated style={styles.glassCard}>
                  <View style={styles.inputRow}>
                    <View style={styles.dotOrigin} />
                    <Text style={styles.inputStatic}>Current Location</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.inputRow}>
                    <View style={styles.dotDest} />
                    <TextInput
                      value={destination}
                      onChangeText={setDestination}
                      placeholder="Where to?"
                      placeholderTextColor={ds.colors.textSecondary}
                      style={styles.input}
                    />
                  </View>
                </GlassCard>

                {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

                <PremiumButton
                  onPress={onSearch}
                  disabled={!destination || isSearching}
                  loading={isSearching}
                  variant="primary"
                  size="md"
                  style={styles.searchButton}
                >
                  {isSearching ? 'Locating...' : 'Search Rides'}
                </PremiumButton>
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.tabBarContainer} pointerEvents="box-none">
          <SleekNav activeTab={tab} onTabChange={setTab} />
        </View>
      </View>
      
      {showMenu && (
        <AccountSettings onClose={handleMenuClose} />
      )}
      
      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: ds.typography.family,
  },
  blob: {
    position: 'absolute',
    width: ds.spacing.xxxl * 6,
    height: ds.spacing.xxxl * 6,
    borderRadius: ds.spacing.xxxl * 3,
    opacity: 0.3,
    filter: 'blur(40px)',
  },
  blobLeft: {
    backgroundColor: ds.colors.primary,
    top: -100,
    left: -100,
  },
  blobRight: {
    backgroundColor: ds.colors.secondary,
    bottom: -100,
    right: -100,
  },
  mobileFrame: {
    width: ds.layout.shellWidth,
    height: ds.layout.shellHeight,
    backgroundColor: ds.colors.background,
    borderRadius: ds.radius.xl,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 50,
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  globeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    zIndex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  uiLayer: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    pointerEvents: 'box-none',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.lg,
  },
  headerCard: {
    // Just sizing, GlassCard handles the glass effect
  },
  headerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    marginRight: ds.spacing.sm,
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  welcomeText: {
    fontFamily: ds.typography.family,
    fontSize: 10,
    color: ds.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  nameText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: ds.spacing.lg,
    paddingBottom: ds.spacing.xxxl + ds.spacing.lg,
    justifyContent: 'flex-end',
  },
  glassCard: {
    // GlassCard already has padding
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ds.spacing.xl + ds.spacing.md,
    gap: ds.spacing.md + ds.spacing.xs,
  },
  dotOrigin: {
    width: ds.spacing.sm,
    height: ds.spacing.sm,
    borderRadius: ds.spacing.sm / 2,
    backgroundColor: ds.colors.textSecondary,
  },
  dotDest: {
    width: ds.spacing.sm,
    height: ds.spacing.sm,
    borderRadius: ds.spacing.sm / 2,
    backgroundColor: ds.colors.primary,
    shadowColor: ds.colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: ds.spacing.sm,
    elevation: 10,
  },
  divider: {
    height: 1,
    backgroundColor: ds.colors.border,
    marginVertical: ds.spacing.sm + ds.spacing.xs,
    marginLeft: ds.spacing.xl + ds.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ds.spacing.xl,
  },
  loadingText: {
    fontSize: ds.typography.size.hero,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    marginTop: ds.spacing.lg,
    marginBottom: ds.spacing.sm,
    fontFamily: ds.typography.family,
  },
  loadingSubtext: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    fontFamily: ds.typography.family,
  },
  inputStatic: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    flex: 1,
  },
  input: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
    flex: 1,
    padding: 0,
  },
  errorText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.error,
    textAlign: 'center',
    marginBottom: ds.spacing.md + ds.spacing.sm,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: ds.spacing.lg,
  },
  searchButton: {
    height: ds.spacing.xxxl + ds.spacing.lg,
    borderRadius: (ds.spacing.xxxl + ds.spacing.lg) / 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  localeToggle: {
    marginRight: ds.spacing.xs,
  },
  devPortalButton: {
    position: 'absolute',
    bottom: ds.spacing.xl,
    alignSelf: 'center',
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.primary,
  },
  devPortalButtonText: {
    color: ds.colors.primary,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    fontFamily: ds.typography.family,
  },
});
