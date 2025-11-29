/**
 * User Domain Types
 * Consolidated user-related interfaces across the application
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  isDriver: boolean;
  isVerified: boolean;
  role: 'rider' | 'driver' | 'admin';
  kycStatus: 'pending' | 'verified' | 'rejected' | 'not_started';
  kycDocuments?: KYCDocument[];
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
  authToken?: string; // For WebSocket authentication
}

export interface KYCDocument {
  id: string;
  type: 'id_card' | 'passport' | 'driver_license' | 'proof_of_address' | 'selfie';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// Simplified user profile for UI contexts (subset of full User)
export type UserProfile = Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'phone'>;
