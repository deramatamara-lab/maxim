import type { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: 'Aura',
  slug: 'aura',
  version: '1.0.0',
  scheme: 'aura',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  plugins: [
    'expo-secure-store'
  ],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
    // PWA Configuration
    name: 'Aura Ride',
    shortName: 'Aura',
    description: 'Premium ride-sharing experience with ultra-modern design',
    lang: 'en',
    themeColor: '#0A0A0F',
    backgroundColor: '#0A0A0F',
    display: 'standalone',
    orientation: 'portrait',
    startUrl: '/',
    scope: '/',
    preferRelatedApplications: false,
  },
  extra: {},
  updates: {},
  newArchEnabled: true,
};

export default config;
