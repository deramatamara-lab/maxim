/**
 * Ratings and Reviews Service
 * Handles driver and rider ratings, reviews, and feedback system
 */

import { apiClient, ApiResponse } from './client';

export interface Rating {
  id: string;
  rideId: string;
  raterId: string;
  ratedUserId: string;
  rating: number; // 1-5 stars
  comment?: string;
  categories: {
    safety: number;
    cleanliness: number;
    navigation: number;
    communication: number;
    punctuality: number;
  };
  tags: string[]; // e.g., 'friendly', 'professional', 'great_music'
  timestamp: string;
  isPublic: boolean;
  responseFromRated?: {
    comment: string;
    timestamp: string;
  };
}

export interface ReviewStats {
  userId: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages: {
    safety: number;
    cleanliness: number;
    navigation: number;
    communication: number;
    punctuality: number;
  };
  recentComments: Array<{
    rating: number;
    comment: string;
    timestamp: string;
    rideId: string;
  }>;
  badges: Array<{
    type: 'top_rated' | 'safety_expert' | 'great_communicator' | 'professional';
    earnedAt: string;
  }>;
}

export interface RatingRequest {
  rideId: string;
  rating: number;
  comment?: string;
  categories: {
    safety: number;
    cleanliness: number;
    navigation: number;
    communication: number;
    punctuality: number;
  };
  tags: string[];
  isPublic: boolean;
}

export interface RatingGuidelines {
  minRating: number;
  maxRating: number;
  requiredCategories: string[];
  suggestedTags: string[];
  prohibitedContent: string[];
  tips: string[];
}

export interface RatingDispute {
  id: string;
  ratingId: string;
  disputedBy: string;
  reason: string;
  description: string;
  evidence: Array<{
    type: 'screenshot' | 'recording' | 'witness_statement';
    url: string;
    description: string;
  }>;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

class RatingsService {
  /**
   * Submit rating for ride
   */
  async submitRating(request: RatingRequest): Promise<ApiResponse<Rating>> {
    return apiClient.post<Rating, RatingRequest>('/ratings/submit', request);
  }

  /**
   * Get user's rating statistics
   */
  async getUserRatingStats(userId: string): Promise<ApiResponse<ReviewStats>> {
    return apiClient.get<ReviewStats>(`/ratings/user/${userId}/stats`);
  }

  /**
   * Get user's recent ratings
   */
  async getUserRatings(
    userId: string,
    page: number = 1,
    limit: number = 20,
    rating?: number
  ): Promise<ApiResponse<{
    ratings: Rating[];
    total: number;
    average: number;
  }>> {
    const params: Record<string, string | number> = { page, limit };
    if (rating) params.rating = rating;
    
    return apiClient.get(`/ratings/user/${userId}`, params);
  }

  /**
   * Get rating guidelines
   */
  async getRatingGuidelines(): Promise<ApiResponse<RatingGuidelines>> {
    return apiClient.get<RatingGuidelines>('/ratings/guidelines');
  }

  /**
   * Respond to a rating (for the rated user)
   */
  async respondToRating(
    ratingId: string,
    response: string
  ): Promise<ApiResponse<Rating>> {
    return apiClient.post<Rating>(`/ratings/${ratingId}/respond`, {
      response,
    });
  }

  /**
   * Report inappropriate rating
   */
  async reportRating(
    ratingId: string,
    reason: string,
    description: string
  ): Promise<ApiResponse<{
    reportId: string;
    status: string;
  }>> {
    return apiClient.post(`/ratings/${ratingId}/report`, {
      reason,
      description,
    });
  }

  /**
   * Dispute a rating
   */
  async disputeRating(
    ratingId: string,
    reason: string,
    description: string,
    evidence?: Array<{
      type: string;
      url: string;
      description: string;
    }>
  ): Promise<ApiResponse<RatingDispute>> {
    return apiClient.post<RatingDispute>(`/ratings/${ratingId}/dispute`, {
      reason,
      description,
      evidence,
    });
  }

  /**
   * Get rating disputes for user
   */
  async getRatingDisputes(
    userId: string,
    status?: RatingDispute['status']
  ): Promise<ApiResponse<RatingDispute[]>> {
    const params = status ? { status } : {};
    return apiClient.get<RatingDispute[]>(`/ratings/user/${userId}/disputes`, params as Record<string, string | number | boolean>);
  }

  /**
   * Get top-rated drivers in area
   */
  async getTopRatedDrivers(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    limit: number = 10
  ): Promise<ApiResponse<Array<{
    driverId: string;
    name: string;
    averageRating: number;
    totalRatings: number;
    badges: string[];
    vehicle: {
      make: string;
      model: string;
      color: string;
    };
  }>>> {
    const params = { ...bounds, limit };
    return apiClient.get('/ratings/top-drivers', params);
  }

  /**
   * Get rating trends for user
   */
  async getRatingTrends(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ApiResponse<{
    averageRating: number;
    totalRatings: number;
    trend: 'improving' | 'stable' | 'declining';
    breakdown: Array<{
      date: string;
      averageRating: number;
      ratingCount: number;
    }>;
    categoryTrends: {
      safety: number;
      cleanliness: number;
      navigation: number;
      communication: number;
      punctuality: number;
    };
  }>> {
    const params = { period };
    return apiClient.get(`/ratings/user/${userId}/trends`, params);
  }

  /**
   * Validate rating request
   */
  validateRatingRequest(request: RatingRequest): string[] {
    const errors: string[] = [];
    
    if (!request.rideId) {
      errors.push('Ride ID is required');
    }
    
    if (!request.rating || request.rating < 1 || request.rating > 5) {
      errors.push('Rating must be between 1 and 5 stars');
    }
    
    if (request.comment && request.comment.length > 500) {
      errors.push('Comment must be less than 500 characters');
    }
    
    // Validate category ratings
    const requiredCategories = ['safety', 'cleanliness', 'navigation', 'communication', 'punctuality'];
    for (const category of requiredCategories) {
      const value = request.categories[category as keyof typeof request.categories];
      if (!value || value < 1 || value > 5) {
        errors.push(`${category} rating must be between 1 and 5`);
      }
    }
    
    if (request.tags && request.tags.length > 5) {
      errors.push('Maximum 5 tags allowed');
    }
    
    return errors;
  }

  /**
   * Calculate rating impact on dispatch score
   */
  calculateRatingImpact(ratingStats: ReviewStats): {
    scoreBonus: number;
    reliability: number;
    passengerPreference: number;
  } {
    let scoreBonus = 0;
    let reliability = 0.5;
    let passengerPreference = 0.5;
    
    // Rating-based score bonus
    if (ratingStats.averageRating >= 4.9) {
      scoreBonus = 25;
      reliability = 0.95;
      passengerPreference = 0.9;
    } else if (ratingStats.averageRating >= 4.7) {
      scoreBonus = 15;
      reliability = 0.85;
      passengerPreference = 0.75;
    } else if (ratingStats.averageRating >= 4.5) {
      scoreBonus = 10;
      reliability = 0.75;
      passengerPreference = 0.6;
    } else if (ratingStats.averageRating >= 4.0) {
      scoreBonus = 5;
      reliability = 0.6;
      passengerPreference = 0.4;
    } else {
      scoreBonus = -10;
      reliability = 0.3;
      passengerPreference = 0.2;
    }
    
    // Volume bonus (more ratings = more reliable)
    if (ratingStats.totalRatings >= 1000) {
      scoreBonus += 5;
      reliability += 0.05;
    } else if (ratingStats.totalRatings >= 500) {
      scoreBonus += 3;
      reliability += 0.03;
    } else if (ratingStats.totalRatings < 50) {
      scoreBonus -= 5;
      reliability -= 0.1;
    }
    
    // Category-specific bonuses
    if (ratingStats.categoryAverages.safety >= 4.8) {
      scoreBonus += 10;
    }
    
    if (ratingStats.categoryAverages.communication >= 4.7) {
      scoreBonus += 5;
    }
    
    if (ratingStats.categoryAverages.navigation >= 4.6) {
      scoreBonus += 3;
    }
    
    return {
      scoreBonus,
      reliability: Math.max(0, Math.min(1, reliability)),
      passengerPreference: Math.max(0, Math.min(1, passengerPreference)),
    };
  }

  /**
   * Get suggested tags based on rating
   */
  async getSuggestedTags(rating: number): Promise<ApiResponse<string[]>> {
    const tagMapping: Record<number, string[]> = {
      5: ['excellent', 'professional', 'friendly', 'clean_car', 'great_music', 'smooth_ride'],
      4: ['good_driver', 'on_time', 'polite', 'safe', 'comfortable'],
      3: ['okay', 'average', 'got_there'],
      2: ['late', 'rude', 'unclean'],
      1: ['terrible', 'unsafe', 'rude', 'dirty'],
    };
    
    const tags = tagMapping[rating] || [];
    
    return {
      success: true,
      data: tags,
    };
  }

  /**
   * Simulate rating submission for demo
   */
  async simulateRatingSubmission(request: RatingRequest): Promise<Rating> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockRating: Rating = {
      id: `rating-${Date.now()}`,
      rideId: request.rideId,
      raterId: 'user-demo',
      ratedUserId: 'driver-demo',
      rating: request.rating,
      comment: request.comment,
      categories: request.categories,
      tags: request.tags,
      timestamp: new Date().toISOString(),
      isPublic: request.isPublic,
    };
    
    return mockRating;
  }

  /**
   * Generate rating insights for driver
   */
  async generateRatingInsights(_userId: string): Promise<ApiResponse<{
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    comparisonToPeers: {
      averageRating: number;
      percentile: number;
    };
  }>> {
    // This would analyze rating patterns and provide actionable insights
    return {
      success: true,
      data: {
        strengths: ['Excellent safety record', 'Great communication', 'Punctual arrivals'],
        improvements: ['Vehicle cleanliness could be better', 'Consider offering water'],
        recommendations: [
          'Maintain current safety standards',
          'Add small amenities like phone chargers',
          'Continue friendly communication style',
        ],
        comparisonToPeers: {
          averageRating: 4.7,
          percentile: 85, // Better than 85% of drivers
        },
      },
    };
  }
}

export const ratingsService = new RatingsService();
