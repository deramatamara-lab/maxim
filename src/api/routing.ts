/**
 * Routing Service
 * Handles route calculation, optimization, and navigation
 */

import { apiClient, ApiResponse } from './client';
import { Location } from './location';

export interface RoutePoint {
  lat: number;
  lon: number;
  address?: string;
  type: 'pickup' | 'dropoff' | 'waypoint';
}

export interface RouteSegment {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: string; // encoded polyline
  instruction: string;
  maneuver?: {
    type: string;
    bearing_before?: number;
    bearing_after?: number;
    location: [number, number];
  };
}

export interface Route {
  id: string;
  distance: number; // in meters
  duration: number; // in seconds
  geometry: string; // encoded polyline
  segments: RouteSegment[];
  waypoints: RoutePoint[];
  trafficCondition: 'light' | 'moderate' | 'heavy' | 'severe';
  estimatedFuelCost?: number;
  tollCost?: number;
}

export interface RouteOptions {
  origin: Location;
  destination: Location;
  waypoints?: Location[];
  alternatives: boolean;
  avoid: {
    tolls?: boolean;
    highways?: boolean;
    ferries?: boolean;
  };
  vehicleType: 'car' | 'motorcycle' | 'bicycle' | 'pedestrian';
  optimize: 'time' | 'distance' | 'fuel';
}

export interface RouteOptimization {
  routes: Route[];
  recommended: Route;
  alternatives: Route[];
  reasoning: {
    fastest: string;
    shortest: string;
    most_economical: string;
  };
}

export interface TrafficInfo {
  currentCondition: 'light' | 'moderate' | 'heavy' | 'severe';
  incidents: Array<{
    id: string;
    type: 'accident' | 'construction' | 'closure' | 'weather';
    severity: 'minor' | 'moderate' | 'major';
    description: string;
    location: Location;
    affectedRoutes: string[];
    estimatedDelay: number; // in minutes
    createdAt: string;
  }>;
  liveUpdates: boolean;
  lastUpdated: string;
}

export interface NavigationInstruction {
  step: number;
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
  geometry: string;
  maneuver: {
    type: string;
    modifier?: string;
    bearing_before?: number;
    bearing_after?: number;
    location: [number, number];
  };
  voiceInstruction?: string;
}

export interface ETAUpdate {
  rideId: string;
  currentLocation: Location;
  estimatedArrival: string; // ISO timestamp
  remainingDistance: number; // in meters
  remainingDuration: number; // in seconds
  nextWaypoint: RoutePoint;
  confidence: number; // 0-1
}

class RoutingService {
  /**
   * Calculate route between two or more points
   */
  async calculateRoute(options: RouteOptions): Promise<ApiResponse<Route[]>> {
    return apiClient.post<Route[], RouteOptions>('/routing/calculate', options);
  }

  /**
   * Get optimized route options with recommendations
   */
  async getOptimizedRoutes(options: RouteOptions): Promise<ApiResponse<RouteOptimization>> {
    return apiClient.post<RouteOptimization, RouteOptions>('/routing/optimize', options);
  }

  /**
   * Get current traffic information for area
   */
  async getTrafficInfo(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }
  ): Promise<ApiResponse<TrafficInfo>> {
    return apiClient.get<TrafficInfo>('/routing/traffic', bounds);
  }

  /**
   * Get turn-by-turn navigation instructions
   */
  async getNavigationInstructions(routeId: string): Promise<ApiResponse<NavigationInstruction[]>> {
    return apiClient.get<NavigationInstruction[]>(`/routing/navigation/${routeId}`);
  }

  /**
   * Update ETA during active ride
   */
  async updateETA(
    rideId: string,
    currentLocation: Location,
    targetLocation: Location
  ): Promise<ApiResponse<ETAUpdate>> {
    return apiClient.post<ETAUpdate>('/routing/eta', {
      rideId,
      currentLocation,
      targetLocation,
    });
  }

  /**
   * Calculate route for shared ride (multiple passengers)
   */
  async calculateSharedRoute(
    requests: Array<{
      id: string;
      pickup: Location;
      dropoff: Location;
      priority: number;
    }>,
    maxDetourMinutes: number = 10
  ): Promise<ApiResponse<{
    route: Route;
    pickups: Array<{
      requestId: string;
      location: Location;
      estimatedPickupTime: string;
      detourFromOptimal: number; // in minutes
    }>;
    totalEfficiency: number; // percentage of optimal route efficiency
  }>> {
    return apiClient.post('/routing/shared', {
      requests,
      maxDetourMinutes,
    });
  }

  /**
   * Get route for scheduled ride (predictive traffic)
   */
  async getScheduledRoute(
    origin: Location,
    destination: Location,
    scheduledTime: string // ISO timestamp
  ): Promise<ApiResponse<{
    route: Route;
    confidence: number; // 0-1, how confident we are about the prediction
    trafficPrediction: {
      condition: 'light' | 'moderate' | 'heavy' | 'severe';
      factors: string[];
    };
    alternativeTimes: Array<{
      time: string;
      duration: number;
      reason: string;
    }>;
  }>> {
    return apiClient.post('/routing/scheduled', {
      origin,
      destination,
      scheduledTime,
    });
  }

  /**
   * Validate route is feasible for vehicle type
   */
  async validateRoute(
    route: Route,
    vehicleType: string,
    constraints?: {
      maxHeight?: number; // in meters
      maxWeight?: number; // in kg
      hazardousMaterials?: boolean;
    }
  ): Promise<ApiResponse<{
    isValid: boolean;
    restrictions: Array<{
      type: string;
      location: Location;
      description: string;
    }>;
    alternatives?: Route[];
  }>> {
    return apiClient.post('/routing/validate', {
      route,
      vehicleType,
      constraints,
    });
  }

  /**
   * Calculate distance and duration locally (for offline/demo mode)
   */
  calculateBasicRoute(origin: Location, destination: Location): {
    distance: number; // in meters
    duration: number; // in seconds
    estimatedFare: number;
  } {
    // Haversine formula for distance calculation
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (origin.lat * Math.PI) / 180;
    const lat2Rad = (destination.lat * Math.PI) / 180;
    const deltaLatRad = ((destination.lat - origin.lat) * Math.PI) / 180;
    const deltaLonRad = ((destination.lon - origin.lon) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLonRad / 2) *
        Math.sin(deltaLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate duration based on average city speed (25 km/h)
    const avgSpeedMs = 25 * 1000 / 3600; // Convert km/h to m/s
    const duration = distance / avgSpeedMs;

    // Basic fare estimation (will be overridden by pricing service)
    const estimatedFare = (distance / 1000) * 1.5 + 5; // $1.50 per km + $5 base

    return {
      distance: Math.round(distance),
      duration: Math.round(duration),
      estimatedFare: Math.round(estimatedFare * 100) / 100,
    };
  }

  /**
   * Decode encoded polyline string to coordinates
   */
  decodePolyline(encoded: string): Array<[number, number]> {
    const coordinates: Array<[number, number]> = [];
    let index = 0;
    let lat = 0;
    let lon = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLon = result & 1 ? ~(result >> 1) : result >> 1;
      lon += deltaLon;

      coordinates.push([lon * 1e-5, lat * 1e-5]);
    }

    return coordinates;
  }

  /**
   * Encode coordinates to polyline string
   */
  encodePolyline(coordinates: Array<[number, number]>): string {
    let encoded = '';
    let prevLat = 0;
    let prevLon = 0;

    for (const [lon, lat] of coordinates) {
      const latDiff = Math.round(lat * 1e5) - prevLat;
      const lonDiff = Math.round(lon * 1e5) - prevLon;

      encoded += this.encodeNumber(latDiff);
      encoded += this.encodeNumber(lonDiff);

      prevLat += latDiff;
      prevLon += lonDiff;
    }

    return encoded;
  }

  /**
   * Helper method to encode a number for polyline
   */
  private encodeNumber(num: number): string {
    let encoded = '';
    num = num < 0 ? ~(num << 1) : num << 1;

    while (num >= 0x20) {
      encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
      num >>= 5;
    }

    encoded += String.fromCharCode(num + 63);
    return encoded;
  }

  /**
   * Validate routing request parameters
   */
  validateRoutingRequest(options: RouteOptions): string[] {
    const errors: string[] = [];
    
    if (!options.origin.lat || !options.origin.lon) {
      errors.push('Valid origin location is required');
    }
    
    if (!options.destination.lat || !options.destination.lon) {
      errors.push('Valid destination location is required');
    }
    
    if (options.waypoints && options.waypoints.length > 10) {
      errors.push('Maximum 10 waypoints allowed');
    }
    
    const validVehicleTypes = ['car', 'motorcycle', 'bicycle', 'pedestrian'];
    if (!validVehicleTypes.includes(options.vehicleType)) {
      errors.push('Invalid vehicle type');
    }
    
    const validOptimizations = ['time', 'distance', 'fuel'];
    if (!validOptimizations.includes(options.optimize)) {
      errors.push('Invalid optimization preference');
    }

    return errors;
  }
}

export const routingService = new RoutingService();
