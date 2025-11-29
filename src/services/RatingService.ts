/**
 * Rating Service Stub
 * Minimal implementation to unblock UI while keeping types aligned
 * TODO: Replace with real backend integration
 */

import { log } from '../utils/logger';

export interface RatingBreakdown {
  overall: number;
  safety: number;
  cleanliness: number;
  navigation: number;
  communication: number;
}

export interface SubmitRatingPayload {
  rating: RatingBreakdown;
  feedback: string;
  tipAmount: number;
}

export interface SubmitRatingResult {
  success: boolean;
  error?: string;
}

export class RatingService {
  /**
   * Submit a ride rating
   */
  static async submitRating(rideId: string, payload: SubmitRatingPayload): Promise<SubmitRatingResult> {
    const isValid = RatingService.validateRating(payload.rating);

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid rating data',
      };
    }

    // Stub implementation: log and pretend submission succeeded
    log.warn('Submitting rating for ride', { event: 'submitting_rating', component: 'ratingService', rideId, rating: payload.rating, feedback: payload.feedback, tipAmount: payload.tipAmount });

    return { success: true };
  }

  /**
   * Get average rating for a driver
   */
  static async getDriverRating(_driverId: string): Promise<number> {
    // Stubbed average rating
    return 4.8;
  }

  /**
   * Validate rating data
   */
  static validateRating(rating: RatingBreakdown): boolean {
    const inRange = (value: number) => value >= 1 && value <= 5;

    return (
      inRange(rating.overall) &&
      inRange(rating.safety) &&
      inRange(rating.cleanliness) &&
      inRange(rating.navigation) &&
      inRange(rating.communication)
    );
  }
}
