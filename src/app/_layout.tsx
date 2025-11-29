import React from 'react';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { ThemeLocaleProvider } from '@/providers/ThemeLocaleProvider';
import { AnimationProvider } from '@/providers/AnimationProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ds } from '@/constants/theme';
import { SplashScreen } from 'expo-router';
import { initSentry } from '@/config/sentry';

SplashScreen.preventAutoHideAsync();

// Initialize Sentry as early as possible
initSentry();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins: require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={ds.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.background} />
      <NoiseOverlay opacity={ds.effects.noiseOpacity} />
      <ErrorBoundary 
        componentName="RootLayout" 
        route="root"
        showRetry={true}
        customMessage="The app encountered an unexpected error. Please try again."
      >
        <LanguageProvider>
          <ThemeLocaleProvider>
            <AnimationProvider enablePerformanceMonitoring={true}>
              <Slot />
            </AnimationProvider>
          </ThemeLocaleProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ds.colors.backgroundDeep,
  },
  loading: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
