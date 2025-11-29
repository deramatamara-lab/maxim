/**
 * Location Service
 * Handles geolocation, address autocomplete, and location-based features
 * Enhanced with device GPS integration and fallback strategies for production reliability
 */

import { apiClient, ApiResponse } from './client';
import { deviceLocationManager, LocationResult } from '../services/deviceLocationManager';
import { log } from '../utils/logger';

export interface Location {
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  accuracy?: number;
  timestamp?: number;
}

export interface AddressAutocomplete {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface GeocodedLocation extends Location {
  placeId: string;
  formattedAddress: string;
  components: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: string; // encoded polyline
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
    geometry: string;
  }>;
}

export interface NearbyDrivers {
  drivers: Array<{
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    vehicle: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
    };
    location: Location;
    estimatedArrival: number; // in seconds
    distance: number; // in meters
  }>;
}

class LocationService {
  /**
   * Get current device location with fallback strategies
   * Enhanced production version with GPS, network, and cached fallbacks
   */
  async getCurrentLocation(): Promise<ApiResponse<Location>> {
    try {
      const locationResult: LocationResult = await deviceLocationManager.getCurrentLocation();
      
      if (locationResult.success && locationResult.coordinates) {
        const location: Location = {
          lat: locationResult.coordinates.latitude,
          lon: locationResult.coordinates.longitude,
          address: locationResult.coordinates.accuracy ? 
            `Location (${Math.round(locationResult.coordinates.accuracy)}m accuracy)` : undefined,
        };

        return {
          success: true,
          data: location,
          message: `Location obtained via ${locationResult.source} with ${locationResult.accuracy} accuracy`,
        };
      }

      return {
        success: false,
        error: locationResult.error?.message || 'Failed to get location',
        message: locationResult.error?.message,
      };
    } catch {
      return {
        success: false,
        error: 'Location service unavailable',
        message: 'Please enable location services or enter your location manually',
      };
    }
  }

  /**
   * Get current location with reverse geocoding
   * Returns coordinates and formatted address
   */
  async getCurrentLocationWithAddress(): Promise<ApiResponse<Location & { formattedAddress: string }>> {
    // First get coordinates
    const locationResponse = await this.getCurrentLocation();
    if (!locationResponse.success || !locationResponse.data) {
      return {
        success: false,
        error: locationResponse.error,
        message: locationResponse.message || 'Failed to get location',
      };
    }

    // Then reverse geocode to get address
    const addressResponse = await this.reverseGeocode(
      locationResponse.data.lat,
      locationResponse.data.lon
    );

    if (addressResponse.success && addressResponse.data) {
      return {
        success: true,
        data: {
          ...locationResponse.data,
          formattedAddress: addressResponse.data.formattedAddress,
        },
        message: locationResponse.message,
      };
    }

    // Return coordinates even if address lookup failed
    return {
      success: true,
      data: {
        ...locationResponse.data,
        formattedAddress: 'Unknown address',
      },
      message: locationResponse.message,
    };
  }

  /**
   * Start watching location changes with fallback strategies
   */
  async watchLocation(
    callback: (result: ApiResponse<Location>) => void,
    options?: { includeAddress?: boolean; updateInterval?: number }
  ): Promise<{ success: boolean; stopWatching: () => void }> {
    const watchSuccess = await deviceLocationManager.watchLocation(
      async (locationResult: LocationResult) => {
        if (locationResult.success && locationResult.coordinates) {
          const location: Location = {
            lat: locationResult.coordinates.latitude,
            lon: locationResult.coordinates.longitude,
          };

          // Include address if requested
          if (options?.includeAddress) {
            try {
              const addressResponse = await this.reverseGeocode(location.lat, location.lon);
              if (addressResponse.success && addressResponse.data) {
                location.address = addressResponse.data.formattedAddress;
              }
            } catch {
              log.warn('Failed to get address for location update', { event: 'get_address_location_update_failed', component: 'locationApi' });
            }
          }

          callback({
            success: true,
            data: location,
            message: `Location updated via ${locationResult.source}`,
          });
        } else {
          callback({
            success: false,
            error: locationResult.error?.message || 'Location update failed',
            message: locationResult.error?.message,
          });
        }
      }
    );

    return {
      success: watchSuccess,
      stopWatching: () => deviceLocationManager.stopWatchingLocation(),
    };
  }

  /**
   * Get last known location without fetching
   */
  getLastKnownLocation(): Location | null {
    const lastKnown = deviceLocationManager.getLastKnownLocation();
    if (!lastKnown) return null;

    return {
      lat: lastKnown.latitude,
      lon: lastKnown.longitude,
      address: `Last known location (${Math.round(lastKnown.accuracy || 0)}m accuracy)`,
    };
  }

  /**
   * Check location permission status
   */
  async getLocationPermission(): Promise<ApiResponse<{
    granted: boolean;
    canAskAgain: boolean;
    status: 'granted' | 'denied' | 'restricted' | 'never_ask_again';
  }>> {
    try {
      const permissionStatus = await deviceLocationManager.checkLocationPermission();
      return {
        success: true,
        data: permissionStatus,
        message: permissionStatus.granted ? 'Location permission granted' : 'Location permission denied',
      };
    } catch {
      return {
        success: false,
        error: 'Failed to check location permission',
        message: 'Unable to verify location permission status',
      };
    }
  }

  /**
   * Request location permission
   */
  async requestLocationPermission(): Promise<ApiResponse<{
    granted: boolean;
    status: string;
  }>> {
    try {
      const granted = await deviceLocationManager.requestLocationPermission();
      return {
        success: true,
        data: {
          granted,
          status: granted ? 'granted' : 'denied',
        },
        message: granted ? 'Location permission granted' : 'Location permission denied',
      };
    } catch {
      return {
        success: false,
        error: 'Failed to request location permission',
        message: 'Unable to request location access',
      };
    }
  }
  /**
   * Get address autocomplete suggestions
   */
  async autocompleteAddress(query: string): Promise<ApiResponse<AddressAutocomplete[]>> {
    return apiClient.get<AddressAutocomplete[]>('/location/autocomplete', { query });
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<ApiResponse<GeocodedLocation[]>> {
    return apiClient.get<GeocodedLocation[]>('/location/geocode', { address });
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lon: number): Promise<ApiResponse<GeocodedLocation>> {
    return apiClient.get<GeocodedLocation>('/location/reverse-geocode', { lat, lon });
  }

  /**
   * Get route information between two points
   */
  async getRoute(
    origin: Location,
    destination: Location,
    alternatives: boolean = false
  ): Promise<ApiResponse<RouteInfo[]>> {
    return apiClient.post<RouteInfo[]>('/location/route', {
      origin,
      destination,
      alternatives,
    });
  }

  /**
   * Get nearby drivers for current location
   */
  async getNearbyDrivers(location: Location, radius: number = 5000): Promise<ApiResponse<NearbyDrivers>> {
    return apiClient.get<NearbyDrivers>('/location/nearby-drivers', {
      lat: location.lat,
      lon: location.lon,
      radius,
    });
  }

  /**
   * Update user's current location (for drivers)
   */
  async updateLocation(location: Location): Promise<ApiResponse<void>> {
    return apiClient.put<void>('/location/update', { location });
  }

  /**
   * Get saved places (home, work, etc.)
   */
  async getSavedPlaces(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    address: string;
    location: Location;
    type: 'home' | 'work' | 'other';
  }>>> {
    return apiClient.get<Array<{
      id: string;
      name: string;
      address: string;
      location: Location;
      type: 'home' | 'work' | 'other';
    }>>('/location/saved-places');
  }

  /**
   * Save a place
   */
  async savePlace(
    name: string,
    address: string,
    location: Location,
    type: 'home' | 'work' | 'other'
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/location/save-place', {
      name,
      address,
      location,
      type,
    });
  }

  /**
   * Delete a saved place
   */
  async deleteSavedPlace(placeId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/location/saved-places/${placeId}`);
  }
}

export const locationService = new LocationService();
