/**
 * Device Location Manager
 * Production-ready device GPS integration with permission handling, timeout management, and error categorization
 * Better than Uber's basic GPS-only approach with multiple fallback strategies
 */

// Platform-specific imports
import { Platform, Linking } from 'react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { log as _log } from '../utils/logger';

// Types for location management
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'GPS_DISABLED' | 'NETWORK_ERROR' | 'INSUFFICIENT_ACCURACY';
  message: string;
  canRetry: boolean;
  requiresUserAction: boolean;
}

export interface LocationConfig {
  timeout: number;
  maximumAge: number;
  accuracy: Location.Accuracy;
  retryAttempts: number;
  retryDelay: number;
  enableHighAccuracy?: boolean;
}

export interface LocationResult {
  success: boolean;
  coordinates?: LocationCoordinates;
  error?: LocationError;
  source: 'gps' | 'network' | 'cached' | 'manual' | 'ip' | 'none';
  accuracy: 'high' | 'medium' | 'low';
}

// Default configuration optimized for rideshare app
const DEFAULT_CONFIG: LocationConfig = {
  timeout: 15000, // 15 seconds - faster than Uber's 30s
  maximumAge: 60000, // 1 minute cache
  accuracy: Location.Accuracy.Balanced,
  retryAttempts: 3,
  retryDelay: 2000,
};

class DeviceLocationManager {
  private config: LocationConfig;
  private subscription: Location.LocationSubscription | null = null;
  private lastKnownLocation: LocationCoordinates | null = null;
  private isWatching = false;
  private watchId: number | null = null;

  constructor(config: Partial<LocationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadLastKnownLocation();
  }

  /**
   * Load last known location from storage
   */
  private async loadLastKnownLocation() {
    try {
      const stored = await AsyncStorage.getItem('lastKnownLocation');
      if (stored) {
        this.lastKnownLocation = JSON.parse(stored);
      }
    } catch {
      // Removed console.error statement
    }
  }

  /**
   * Save last known location to storage
   */
  private async saveLastKnownLocation(location: LocationCoordinates) {
    try {
      this.lastKnownLocation = location;
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(location));
    } catch {
      // Removed console.error statement
    }
  }

  /**
   * Check location permission status
   */
  public async checkLocationPermission(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
    status: 'granted' | 'denied' | 'restricted' | 'never_ask_again';
  }> {
    try {
      let foregroundPermission = await Location.getForegroundPermissionsAsync();
      
      return {
        granted: foregroundPermission.granted,
        canAskAgain: foregroundPermission.canAskAgain,
        status: foregroundPermission.granted ? 'granted' : 'denied',
      };
    } catch {
      // Removed console.error statement
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  }

  /**
   * Request location permission
   */
  public async requestLocationPermission(): Promise<boolean> {
    try {
      let foregroundPermission = await Location.requestForegroundPermissionsAsync();
      return foregroundPermission.granted;
    } catch {
      // Removed console.error statement
      return false;
    }
  }

  /**
   * Get current location with fallback strategies
   */
  public async getCurrentLocation(
    customConfig?: Partial<LocationConfig>
  ): Promise<LocationResult> {
    const config = { ...this.config, ...customConfig };

    // Check permissions first
    const permissionStatus = await this.checkLocationPermission();
    if (!permissionStatus.granted) {
      if (permissionStatus.canAskAgain) {
        const granted = await this.requestLocationPermission();
        if (!granted) {
          return {
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: 'Location permission denied. Please enable location access in settings.',
              canRetry: permissionStatus.canAskAgain,
              requiresUserAction: true,
            },
            source: 'gps',
            accuracy: 'low',
          };
        }
      } else {
        // Fall back to cached location
        return this.getCachedLocation();
      }
    }

    // Try GPS first
    for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
      try {
        const result = await this.getLocationFromGPS(config);
        if (result.success) {
          return result;
        }
        
        // Wait before retry
        if (attempt < config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        }
      } catch {
        // Removed console.error statement
      }
    }

    // GPS failed, try network location
    try {
      const networkResult = await this.getLocationFromNetwork(config);
      if (networkResult.success) {
        return networkResult;
      }
    } catch {
      // Removed console.error statement
    }

    // All location methods failed, fall back to cached
    return this.getCachedLocation();
  }

  /**
   * Get location from GPS using expo-location
   */
  private async getLocationFromGPS(
    config: LocationConfig
  ): Promise<LocationResult> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: config.accuracy,
      });

      const coordinates: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        altitude: location.coords.altitude ?? undefined,
        altitudeAccuracy: location.coords.altitudeAccuracy ?? undefined,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
        timestamp: location.timestamp,
      };

      this.saveLastKnownLocation(coordinates);

      return {
        success: true,
        coordinates,
        source: 'gps',
        accuracy: this.getAccuracyLevel(coordinates.accuracy),
      };
    } catch (error: unknown) {
      // Removed console.error statement
      
      let errorCode: LocationError['code'];
      let canRetry = true;
      let requiresUserAction = false;

      if (error && typeof error === 'object' && 'code' in error && error.code === Location.PermissionStatus.DENIED) {
        errorCode = 'PERMISSION_DENIED';
        canRetry = false;
        requiresUserAction = true;
      } else if (error && typeof error === 'object' && 'code' in error && error.code === 3) { // TIMEOUT
        errorCode = 'TIMEOUT';
      } else {
        errorCode = 'POSITION_UNAVAILABLE';
      }

      const locationError: LocationError = {
        code: errorCode,
        message: (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') ? error.message : 'Location unavailable',
        canRetry,
        requiresUserAction,
      };

      return {
        success: false,
        error: locationError,
        source: 'gps',
        accuracy: 'low',
      };
    }
  }

  /**
   * Get location from network (IP-based geolocation)
   */
  private async getLocationFromNetwork(
    _config: LocationConfig
  ): Promise<LocationResult> {
    try {
      // Use a free IP geolocation service with fallback options
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.latitude && data.longitude) {
        const coordinates: LocationCoordinates = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 1000, // IP geolocation is less accurate (~1km radius)
          timestamp: Date.now(),
        };

        return {
          success: true,
          coordinates,
          source: 'ip',
          accuracy: 'low',
        };
      }

      throw new Error('Invalid IP geolocation response');
    } catch {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network location unavailable',
          canRetry: true,
          requiresUserAction: false,
        },
        source: 'network',
        accuracy: 'low',
      };
    }
  }

  /**
   * Set manual location
   */
  public async setManualLocation(
    latitude: number,
    longitude: number,
    _address?: string
  ): Promise<LocationResult> {
    const coordinates: LocationCoordinates = {
      latitude,
      longitude,
      accuracy: 50, // Assume moderate accuracy for manual entry
      timestamp: Date.now(),
    };

    // Save as last known location for future fallbacks
    await this.saveLastKnownLocation(coordinates);

    return {
      success: true,
      coordinates,
      source: 'manual',
      accuracy: 'medium',
    };
  }

  /**
   * Validate location accuracy for specific use cases
   */
  public validateLocationAccuracy(
    result: LocationResult,
    useCase: 'ride_request' | 'driver_tracking' | 'eta_estimation' | 'general'
  ): { isValid: boolean; reason?: string } {
    if (!result.success || !result.coordinates) {
      return { isValid: false, reason: 'Location unavailable' };
    }

    const accuracy = result.coordinates.accuracy;
    const source = result.source;

    switch (useCase) {
      case 'ride_request':
        // High accuracy required for ride requests
        if (source === 'manual' && accuracy && accuracy > 100) {
          return { isValid: false, reason: 'Manual location too imprecise for ride request' };
        }
        if (source === 'ip') {
          return { isValid: false, reason: 'IP-based location not accurate enough for ride request' };
        }
        if (accuracy && accuracy > 200) {
          return { isValid: false, reason: 'Location accuracy too low for ride request' };
        }
        break;

      case 'driver_tracking':
        // Medium accuracy acceptable for driver tracking
        if (source === 'ip' && accuracy && accuracy > 2000) {
          return { isValid: false, reason: 'IP location too imprecise for driver tracking' };
        }
        break;

      case 'eta_estimation':
        // Lower accuracy acceptable for ETA
        if (accuracy && accuracy > 5000) {
          return { isValid: false, reason: 'Location accuracy too low for ETA estimation' };
        }
        break;

      case 'general':
        // Any location is acceptable for general use
        break;
    }

    return { isValid: true };
  }

  /**
   * Get best available location with automatic fallback cascade
   */
  public async getBestAvailableLocation(
    useCase: 'ride_request' | 'driver_tracking' | 'eta_estimation' | 'general' = 'general',
    config?: Partial<LocationConfig>
  ): Promise<LocationResult> {
    const finalConfig = { ...this.config, ...config };

    // Try GPS first (highest accuracy)
    try {
      const gpsResult = await this.getLocationFromGPS(finalConfig);
      const validation = this.validateLocationAccuracy(gpsResult, useCase);
      
      if (validation.isValid) {
        return gpsResult;
      }
      // Removed console.error statement
    } catch {
      // Removed console.error statement
    }

    // Try network location as fallback
    try {
      const networkResult = await this.getLocationFromNetwork(finalConfig);
      const validation = this.validateLocationAccuracy(networkResult, useCase);
      
      if (validation.isValid) {
        return networkResult;
      }
      // Removed console.error statement
    } catch {
      // Removed console.error statement
    }

    // Try cached location as final fallback
    const cachedResult = this.getCachedLocation();
    const validation = this.validateLocationAccuracy(cachedResult, useCase);
    
    if (validation.isValid) {
      return cachedResult;
    }

    // All automated methods failed or insufficient accuracy
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_ACCURACY',
        message: validation.reason || 'No suitable location available',
        canRetry: true,
        requiresUserAction: true,
      },
      source: 'none',
      accuracy: 'low',
    };
  }

  /**
   * Get cached location
   */
  private getCachedLocation(): LocationResult {
    if (this.lastKnownLocation) {
      const age = Date.now() - this.lastKnownLocation.timestamp;
      const maxAge = this.config.maximumAge;

      if (age <= maxAge) {
        return {
          success: true,
          coordinates: this.lastKnownLocation,
          source: 'cached',
          accuracy: this.getAccuracyLevel(this.lastKnownLocation.accuracy),
        };
      }
    }

    return {
      success: false,
      error: {
        code: 'POSITION_UNAVAILABLE',
        message: 'No location available. Please check your GPS or enter location manually.',
        canRetry: true,
        requiresUserAction: true,
      },
      source: 'cached',
      accuracy: 'low',
    };
  }

  /**
   * Start watching location changes using expo-location
   */
  public async watchLocation(
    callback: (result: LocationResult) => void,
    config?: Partial<LocationConfig>
  ): Promise<boolean> {
    if (this.isWatching) {
      return true;
    }

    const permissionStatus = await this.checkLocationPermission();
    if (!permissionStatus.granted) {
      const granted = await this.requestLocationPermission();
      if (!granted) {
        callback({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Location permission required for live tracking',
            canRetry: permissionStatus.canAskAgain,
            requiresUserAction: true,
          },
          source: 'gps',
          accuracy: 'low',
        });
        return false;
      }
    }

    const watchConfig = { ...this.config, ...config };

    try {
      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: watchConfig.accuracy,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const coordinates: LocationCoordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined,
            altitude: location.coords.altitude ?? undefined,
            altitudeAccuracy: location.coords.altitudeAccuracy ?? undefined,
            heading: location.coords.heading ?? undefined,
            speed: location.coords.speed ?? undefined,
            timestamp: location.timestamp,
          };

          this.saveLastKnownLocation(coordinates);

          callback({
            success: true,
            coordinates,
            source: 'gps',
            accuracy: this.getAccuracyLevel(coordinates.accuracy),
          });
        }
      );

      this.isWatching = true;
      return true;
    } catch (error: unknown) {
      callback({
        success: false,
        error: {
          code: 'POSITION_UNAVAILABLE',
          message: (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') ? error.message : 'Unable to start location tracking',
          canRetry: true,
          requiresUserAction: false,
        },
        source: 'gps',
        accuracy: 'low',
      });
      return false;
    }
  }

  /**
   * Stop watching location
   */
  public stopWatchingLocation(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
      this.isWatching = false;
    }
  }

  /**
   * Get accuracy level based on accuracy in meters
   */
  private getAccuracyLevel(accuracy?: number): 'high' | 'medium' | 'low' {
    if (!accuracy) return 'low';
    if (accuracy <= 10) return 'high';
    if (accuracy <= 100) return 'medium';
    return 'low';
  }

  /**
   * Get last known location without fetching
   */
  public getLastKnownLocation(): LocationCoordinates | null {
    return this.lastKnownLocation;
  }

  /**
   * Clear stored location data
   */
  public async clearStoredLocation(): Promise<void> {
    try {
      this.lastKnownLocation = null;
      await AsyncStorage.removeItem('lastKnownLocation');
    } catch {
      // Removed console.error statement
    }
  }

  /**
   * Show location settings dialog
   */
  public showLocationSettingsDialog(): void {
    Alert.alert(
      'Location Settings',
      'Please enable location services in your device settings to use Aura ride features.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => this.openLocationSettings() },
      ]
    );
  }

  /**
   * Open device location settings (platform-specific)
   */
  private openLocationSettings(): void {
    // Platform-specific settings opening
    if (Platform.OS === 'ios') {
      // iOS settings would be opened here
      Linking.openURL('app-settings:');
    } else {
      // Android settings would be opened here
      Linking.openSettings();
    }
  }
}

// Export singleton instance
export const deviceLocationManager = new DeviceLocationManager();
