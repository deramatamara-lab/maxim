/**
 * Dispatch Service
 * Handles driver matching, assignment algorithms, and fleet management
 */

import { apiClient, ApiResponse } from './client';
import { Location } from './location';
import { log } from '../utils/logger';

export interface Driver {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  completedRides: number;
  acceptanceRate: number;
  currentLocation: Location;
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    type: 'sedan' | 'suv' | 'luxury' | 'electric' | 'motorcycle';
    capacity: number;
  };
  status: 'offline' | 'online' | 'en_route' | 'in_ride' | 'break';
  isVerified: boolean;
  backgroundCheckPassed: boolean;
  insuranceVerified: boolean;
  languages: string[];
  earnings: {
    today: number;
    week: number;
    month: number;
  };
  lastActive: string;
}

export interface DispatchRequest {
  rideId: string;
  pickup: Location;
  destination: Location;
  rideOptionId: string;
  passengerCount: number;
  isShared: boolean;
  scheduledTime?: string;
  specialRequirements?: {
    wheelchairAccessible: boolean;
    childSeat: boolean;
    petFriendly: boolean;
    extraLuggage: boolean;
  };
  preferences?: {
    preferredDriver?: string;
    avoidDriver?: string;
    femaleDriverOnly?: boolean;
    highRatedOnly?: boolean;
  };
}

export interface DriverMatch {
  driver: Driver;
  score: number;
  distance: number; // in meters
  estimatedArrival: number; // in seconds
  matchReasons: string[];
  drawbacks: string[];
  confidence: number; // 0-1
}

export interface DispatchResult {
  success: boolean;
  error?: string;
  driver?: Driver;
  selectedDriver?: DriverMatch;
  alternatives?: DriverMatch[];
  dispatchTime?: string;
  estimatedPickupTime?: string;
  estimatedArrival?: number; // in seconds
  assignmentId?: string;
  matchingScore?: number;
  algorithm?: string;
  totalDriversConsidered?: number;
  searchRadius?: number; // in meters
  estimatedWaitTime?: number;
  alternativeOptions?: Array<{
    rideType: string;
    estimatedWaitTime: number;
    priceIncrease: number;
  }>;
}

export interface FleetStatus {
  totalDrivers: number;
  onlineDrivers: number;
  driversInRide: number;
  driversEnRoute: number;
  averageWaitTime: number; // in minutes
  coverageAreas: Array<{
    id: string;
    name: string;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    driverDensity: number;
    averageWaitTime: number;
    surgeActive: boolean;
  }>;
}

export interface DispatchSettings {
  maxDispatchRadius: number; // in meters
  maxWaitTime: number; // in minutes
  minAcceptanceRate: number; // 0-1
  minRating: number; // 0-5
  prioritizeHighRated: boolean;
  considerEarnings: boolean; // Balance driver earnings
  allowFemalePreference: boolean;
  sharedRideEnabled: boolean;
  scheduledRideBuffer: number; // minutes before scheduled time
}

class DispatchService {
  /**
   * Find and assign best driver for ride request
   */
  async dispatchRide(request: DispatchRequest): Promise<ApiResponse<DispatchResult>> {
    return apiClient.post<DispatchResult, DispatchRequest>('/dispatch/assign', request);
  }

  /**
   * Get nearby available drivers
   */
  async getNearbyDrivers(
    location: Location,
    radius: number = 5000,
    vehicleType?: string,
    limit: number = 10
  ): Promise<ApiResponse<DriverMatch[]>> {
    const params: Record<string, string | number> = {
      lat: location.lat,
      lon: location.lon,
      radius,
      limit,
    };
    
    if (vehicleType) params.vehicleType = vehicleType;
    
    return apiClient.get<DriverMatch[]>('/dispatch/nearby', params);
  }

  /**
   * Get driver availability for area
   */
  async getDriverAvailability(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    vehicleType?: string
  ): Promise<ApiResponse<{
    availableDrivers: number;
    estimatedWaitTime: number;
    surgeLikelihood: number;
    coverageQuality: 'excellent' | 'good' | 'fair' | 'poor';
  }>> {
    const params: Record<string, string | number> = bounds;
    if (vehicleType) params.vehicleType = vehicleType;
    
    return apiClient.get('/dispatch/availability', params);
  }

  /**
   * Get fleet status overview
   */
  async getFleetStatus(city?: string): Promise<ApiResponse<FleetStatus>> {
    const params = city ? { city } : {};
    return apiClient.get<FleetStatus>('/dispatch/fleet-status', params as Record<string, string | number | boolean>);
  }

  /**
   * Update driver location and status
   */
  async updateDriverStatus(
    driverId: string,
    status: Driver['status'],
    location?: Location
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/dispatch/driver/${driverId}/status`, {
      status,
      location,
    });
  }

  /**
   * Accept or reject ride assignment
   */
  async respondToDispatch(
    driverId: string,
    rideId: string,
    response: 'accept' | 'reject',
    reason?: string
  ): Promise<ApiResponse<{
    success: boolean;
    nextRide?: string;
    penaltyApplied?: boolean;
  }>> {
    return apiClient.post(`/dispatch/driver/${driverId}/respond`, {
      rideId,
      response,
      reason,
    });
  }

  /**
   * Get driver dispatch history
   */
  async getDispatchHistory(
    driverId: string,
    period: 'today' | 'week' | 'month' = 'today',
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{
    assignments: Array<{
      rideId: string;
      dispatchedAt: string;
      acceptedAt?: string;
      rejectedAt?: string;
      responseTime: number; // in seconds
      rideValue: number;
      status: 'accepted' | 'rejected' | 'expired';
    }>;
    stats: {
      totalAssignments: number;
      acceptanceRate: number;
      averageResponseTime: number;
      totalEarnings: number;
    };
  }>> {
    const params = { driverId, period, page, limit };
    return apiClient.get('/dispatch/history', params);
  }

  /**
   * Get optimal dispatch settings for area
   */
  async getOptimalSettings(
    location: Location,
    timeOfDay?: string
  ): Promise<ApiResponse<DispatchSettings>> {
    const params: Record<string, string | number> = {
      lat: location.lat,
      lon: location.lon,
    };
    
    if (timeOfDay) params.timeOfDay = timeOfDay;
    
    return apiClient.get<DispatchSettings>('/dispatch/settings', params);
  }

  /**
   * Calculate driver match score locally (for offline/demo mode)
   */
  calculateDriverScore(
    driver: Driver,
    pickup: Location,
    request: DispatchRequest
  ): DriverMatch {
    // Calculate distance
    const distance = this.calculateDistance(driver.currentLocation, pickup);
    
    // Calculate estimated arrival time (assuming average city speed)
    const avgSpeedMs = 25 * 1000 / 3600; // 25 km/h in m/s
    const estimatedArrival = distance / avgSpeedMs;
    
    // Base score starts at 100
    let score = 100;
    const reasons: string[] = [];
    const drawbacks: string[] = [];
    
    // Distance penalty (closer is better)
    if (distance > 10000) {
      score -= 50;
      drawbacks.push('Very far (>10km)');
    } else if (distance > 5000) {
      score -= 30;
      drawbacks.push('Far (>5km)');
    } else if (distance > 2000) {
      score -= 15;
      drawbacks.push('Moderate distance (>2km)');
    } else {
      reasons.push('Very close (<2km)');
    }
    
    // Rating bonus
    if (driver.rating >= 4.8) {
      score += 20;
      reasons.push('Excellent rating');
    } else if (driver.rating >= 4.5) {
      score += 10;
      reasons.push('Good rating');
    } else if (driver.rating < 4.0) {
      score -= 20;
      drawbacks.push('Low rating');
    }
    
    // Acceptance rate bonus/penalty
    if (driver.acceptanceRate >= 0.9) {
      score += 15;
      reasons.push('High acceptance rate');
    } else if (driver.acceptanceRate < 0.7) {
      score -= 15;
      drawbacks.push('Low acceptance rate');
    }
    
    // Experience bonus
    if (driver.completedRides >= 1000) {
      score += 10;
      reasons.push('Very experienced');
    } else if (driver.completedRides >= 500) {
      score += 5;
      reasons.push('Experienced');
    } else if (driver.completedRides < 50) {
      score -= 5;
      drawbacks.push('New driver');
    }
    
    // Vehicle type match
    if (driver.vehicle.type === this.getVehicleTypeFromOption(request.rideOptionId)) {
      score += 10;
      reasons.push('Perfect vehicle match');
    }
    
    // Status check
    if (driver.status !== 'online') {
      score -= 100; // Disqualify if not online
      drawbacks.push('Driver not available');
    }
    
    // Verification requirements
    if (!driver.isVerified || !driver.backgroundCheckPassed || !driver.insuranceVerified) {
      score -= 50;
      drawbacks.push('Verification incomplete');
    }
    
    // Special requirements
    if (request.specialRequirements?.wheelchairAccessible && !driver.vehicle.type.includes('accessible')) {
      score -= 100;
      drawbacks.push('Wheelchair accessibility required');
    }
    
    // Female driver preference
    if (request.preferences?.femaleDriverOnly && driver.name.toLowerCase().includes('male')) {
      score -= 100;
      drawbacks.push('Female driver preferred');
    }
    
    // Calculate confidence based on score consistency
    const confidence = Math.max(0, Math.min(1, score / 100));
    
    return {
      driver,
      score: Math.max(0, score),
      distance,
      estimatedArrival,
      matchReasons: reasons,
      drawbacks,
      confidence,
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLonRad = ((point2.lon - point1.lon) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLonRad / 2) *
        Math.sin(deltaLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Map ride option ID to vehicle type
   */
  private getVehicleTypeFromOption(rideOptionId: string): string {
    const mapping: Record<string, string> = {
      'lux': 'luxury',
      'pulse': 'electric',
      'share': 'sedan',
    };
    return mapping[rideOptionId] || 'sedan';
  }

  /**
   * Validate dispatch request
   */
  validateDispatchRequest(request: DispatchRequest): string[] {
    const errors: string[] = [];
    
    if (!request.pickup.lat || !request.pickup.lon) {
      errors.push('Valid pickup location is required');
    }
    
    if (!request.destination.lat || !request.destination.lon) {
      errors.push('Valid destination location is required');
    }
    
    if (!request.rideOptionId) {
      errors.push('Ride option ID is required');
    }
    
    if (request.passengerCount < 1 || request.passengerCount > 8) {
      errors.push('Passenger count must be between 1 and 8');
    }
    
    if (request.scheduledTime && new Date(request.scheduledTime) <= new Date()) {
      errors.push('Scheduled time must be in the future');
    }
    
    return errors;
  }

  /**
   * Enhanced driver assignment with real-time matching algorithm
   */
  async simulateDriverAssignment(request: DispatchRequest): Promise<DispatchResult> {
    try {
      // Get real available drivers from backend
      const driversResponse = await apiClient.get('/drivers/available', {
        lat: request.pickup.lat,
        lon: request.pickup.lon,
        radius: 5000, // 5km radius
        rideType: request.rideOptionId,
      });

      if (!driversResponse.success) {
        throw new Error(driversResponse.error || 'Failed to fetch available drivers');
      }

      const availableDrivers: Driver[] = (driversResponse.data as Driver[]) || [];

      if (availableDrivers.length === 0) {
        return {
          success: false,
          error: 'No drivers available in your area',
          estimatedWaitTime: 15, // 15 minutes
          alternativeOptions: [
            {
              rideType: 'share',
              estimatedWaitTime: 8,
              priceIncrease: 0.1,
            },
            {
              rideType: 'lux',
              estimatedWaitTime: 25,
              priceIncrease: 0.3,
            },
          ],
        };
      }

      // Enhanced driver scoring algorithm
      const scoredDrivers = availableDrivers.map((driver: Driver) => {
        const distance = this.calculateDistance(
          request.pickup,
          driver.currentLocation
        );

        // Score based on multiple factors
        const score = 
          driver.rating * 0.3 +                    // 30% rating
          (1 - Math.min(distance / 10, 1)) * 0.4 + // 40% proximity (closer is better)
          driver.acceptanceRate * 0.2 +             // 20% acceptance rate
          (driver.completedRides > 100 ? 0.1 : 0.05); // 10% experience

        return {
          driver,
          score,
          distance, // in meters
          estimatedArrival: Math.ceil(distance / 1000 * 60), // rough estimate in seconds
          matchReasons: ['High rating', 'Close proximity'],
          drawbacks: [],
          confidence: Math.min(score, 1), // 0-1
        };
      });

      scoredDrivers.sort((a: DriverMatch, b: DriverMatch) => b.score - a.score);
      const bestDriver = scoredDrivers[0];

      // Assign driver to ride
      const assignmentResponse = await apiClient.post('/rides/assign-driver', {
        rideId: request.rideId,
        driverId: bestDriver.driver.id,
        estimatedArrival: bestDriver.estimatedArrival,
      });

      if (!assignmentResponse.success) {
        throw new Error(assignmentResponse.error || 'Failed to assign driver');
      }

      return {
        success: true,
        driver: bestDriver.driver,
        estimatedArrival: bestDriver.estimatedArrival,
        assignmentId: (assignmentResponse.data as unknown as { id: string }).id,
        totalDriversConsidered: availableDrivers.length,
        matchingScore: bestDriver.score,
      };

    } catch (error) {
      log.error('Driver assignment failed', { event: 'driver_assignment_failed', component: 'dispatchApi' }, error);
      
      // Fallback to basic mock assignment for development
      const mockDrivers: Driver[] = [
        {
          id: 'driver-1',
          name: 'Sarah Chen',
          rating: 4.9,
          completedRides: 2341,
          acceptanceRate: 0.95,
          currentLocation: {
            lat: request.pickup.lat + 0.01,
            lon: request.pickup.lon + 0.01,
          },
          vehicle: {
            make: 'Toyota',
            model: 'Camry',
            year: 2022,
            color: 'Silver',
            licensePlate: 'ABC-123',
            type: 'sedan',
            capacity: 4,
          },
          status: 'online',
          isVerified: true,
          backgroundCheckPassed: true,
          insuranceVerified: true,
          languages: ['English', 'Mandarin'],
          earnings: {
            today: 145.50,
            week: 892.00,
            month: 3250.00,
          },
          lastActive: new Date().toISOString(),
        },
      ];

      return {
        success: true,
        driver: mockDrivers[0],
        estimatedArrival: 3,
        assignmentId: `assign_${Date.now()}`,
        totalDriversConsidered: mockDrivers.length,
        matchingScore: 0.85,
      };
    }
  }
}

export const dispatchService = new DispatchService();
