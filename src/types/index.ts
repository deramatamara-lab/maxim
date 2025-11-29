/**
 * Shared Type Definitions
 * Core domain types used across the application
 */

// User and Authentication Types
export { User } from '../api/auth';

// Extracted from User interface for reusability
export type UserRole = 'rider' | 'driver' | 'admin';
export type KYCStatus = 'pending' | 'verified' | 'rejected' | 'not_started';

// Ride Lifecycle Types
export interface RideRequest {
  id: string;
  riderId: string;
  origin: Location;
  destination: Location;
  fare?: FareEstimate;
  status: 'pending' | 'searching' | 'cancelled';
  createdAt: string;
}

export interface RideAssignment {
  id: string;
  rideId: string;
  driverId: string;
  estimatedArrival: string;
  status: 'assigned' | 'accepted' | 'declined';
  assignedAt: string;
}

export interface ActiveRide {
  id: string;
  riderId: string;
  driverId: string;
  origin: Location;
  destination: Location;
  status: 'in_progress' | 'arrived' | 'driver_en_route';
  fare: FareEstimate;
  driver: Driver;
  vehicle: Vehicle;
  startedAt: string;
  estimatedArrival?: string;
}

export interface CompletedRide {
  id: string;
  riderId: string;
  driverId: string;
  origin: Location;
  destination: Location;
  fare: FareEstimate;
  status: 'completed';
  completedAt: string;
  duration: number;
  distance: number;
}

// Location and Navigation Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface Route {
  points: Location[];
  distance: number;
  duration: number;
  polyline: string;
}

// Driver and Vehicle Types
export interface Driver {
  id: string;
  name: string;
  phone?: string;
  email: string;
  rating: number;
  totalTrips: number;
  vehicle?: Vehicle;
  isOnline: boolean;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: VehicleType;
  capacity: number;
}

export type VehicleType = 'sedan' | 'suv' | 'luxury' | 'electric' | 'motorcycle';

// Payment and Pricing Types
export interface FareEstimate {
  base: number;
  distance: number;
  time: number;
  tip?: number;
  total: number;
  currency: string;
  breakdown?: FareBreakdown[];
}

export interface FareBreakdown {
  type: 'base' | 'distance' | 'time' | 'tip' | 'surge' | 'discount';
  amount: number;
  description: string;
}

export interface PaymentMethod {
  id: string;
  type: PaymentType;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export type PaymentType = 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash';

// KYC and Document Types - consolidated in types/kyc.ts
export type { 
  KYCDocumentConfig, 
  KYCConfigurationResponse, 
  UserKYCStatus, 
  KYCStepResult 
} from './kyc';

// Legacy KYC types for backward compatibility
export type KYCDocumentType = 'id_card' | 'passport' | 'driver_license' | 'selfie' | 'proof_of_address';

// WebSocket and Real-time Types
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
  messageId: string;
}

export interface RideRequestMessage {
  rideId: string;
  riderId: string;
  origin: Location;
  destination: Location;
  fare: FareEstimate;
  estimatedArrival: string;
}

export interface DriverLocationUpdate {
  driverId: string;
  location: Location;
  heading?: number;
  speed?: number;
  timestamp: string;
}

// UI and Component Types
export interface StyleProp<T = Record<string, unknown>> {
  [key: string]: T | T[] | undefined;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Rating and Feedback Types
export interface Rating {
  overall: number;
  safety?: number;
  cleanliness?: number;
  navigation?: number;
  communication?: number;
}

export interface RideFeedback {
  rideId: string;
  rating: Rating;
  feedback?: string;
  submittedAt: string;
}
