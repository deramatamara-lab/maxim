/**
 * Integration Tests for Core Flows
 * Tests end-to-end functionality and component interactions
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

// Mock the modules
jest.mock('@/services/tokenManager');
jest.mock('@/utils/securityConfig');
jest.mock('@/utils/piiCompliance');
jest.mock('@/api/client');
jest.mock('@/api/auth');
jest.mock('@/api/rides');
jest.mock('@/api/payment');

// Import components and services
import { tokenManager } from '@/services/tokenManager';
import { securityConfig } from '@/utils/securityConfig';
import { apiClient } from '@/api/client';
import { authService } from '@/api/auth';
import { rideService } from '@/api/rides';
import { paymentService } from '@/api/payment';

// Mock UI components
import RiderHome from '@/app/(rider)/index';
import RideCompletionScreen from '@/app/(rider)/ride-completion';

describe('Rider Booking + Payment Success Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful authentication
    jest.spyOn(tokenManager, 'isAuthenticated').mockResolvedValue(true);
    jest.spyOn(tokenManager, 'getValidAccessToken').mockResolvedValue('mock-token');
    jest.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      success: true,
      data: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'rider',
        isVerified: true,
        hasCompletedOnboarding: true,
        kycStatus: 'verified',
      },
    });
  });

  it('should complete full rider booking flow with successful payment', async () => {
    // Mock ride search and options
    const mockRideOptions = [
      {
        id: 'lux',
        name: 'Aura Lux',
        basePrice: 12.00,
        estimatedTime: '2 min',
        available: true,
      },
      {
        id: 'pulse',
        name: 'Aura Pulse',
        basePrice: 8.00,
        estimatedTime: '3 min',
        available: true,
      },
    ];

    jest.spyOn(rideService, 'getRideOptions').mockResolvedValue({
      success: true,
      data: mockRideOptions,
    });

    // Mock ride estimate
    jest.spyOn(rideService, 'getRideEstimate').mockResolvedValue({
      success: true,
      data: {
        estimatedFare: 12.00,
        estimatedDuration: 1200,
        distance: 5000,
      },
    });

    // Mock ride request
    jest.spyOn(rideService, 'requestRide').mockResolvedValue({
      success: true,
      data: {
        id: 'ride-123',
        status: 'searching',
        pickup: { latitude: 40.7128, longitude: -74.0060, address: 'Pickup Location' },
        dropoff: { latitude: 40.7589, longitude: -73.9851, address: 'Dropoff Location' },
      },
    });

    // Mock payment processing
    jest.spyOn(paymentService, 'processPayment').mockResolvedValue({
      success: true,
      data: {
        paymentIntentId: 'pi_123',
        status: 'succeeded',
        amount: 1200,
      },
    });

    // Mock driver assignment
    jest.spyOn(rideService, 'getActiveRide').mockResolvedValue({
      success: true,
      data: {
        id: 'ride-123',
        status: 'assigned',
        driver: {
          id: 'driver-1',
          name: 'John Driver',
          rating: 4.8,
          vehicle: { make: 'Toyota', model: 'Camry', color: 'Black', licensePlate: 'ABC123' },
        },
      },
    });

    // Render the rider home screen
    render(<RiderHome />);

    // Step 1: Search for destination
    const destinationInput = screen.getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Times Square, New York');

    // Step 2: Select ride option
    await waitFor(() => {
      expect(screen.getByText('Aura Lux')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Aura Lux'));

    // Step 3: Confirm ride request
    await waitFor(() => {
      expect(screen.getByText('Request Aura Lux')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Request Aura Lux'));

    // Step 4: Verify ride was requested
    await waitFor(() => {
      expect(rideService.requestRide).toHaveBeenCalledWith({
        pickup: expect.any(Object),
        dropoff: expect.any(Object),
        rideOptionId: 'lux',
      });
    });

    // Step 5: Verify payment was processed
    await waitFor(() => {
      expect(paymentService.processPayment).toHaveBeenCalled();
    });

    // Step 6: Verify driver assignment
    await waitFor(() => {
      expect(screen.getByText('John Driver')).toBeTruthy();
      expect(screen.getByText('Toyota Camry')).toBeTruthy();
    });

    // Verify all services were called correctly
    expect(rideService.getRideOptions).toHaveBeenCalled();
    expect(rideService.getRideEstimate).toHaveBeenCalled();
    expect(paymentService.processPayment).toHaveBeenCalled();
    expect(rideService.getActiveRide).toHaveBeenCalled();
  });

  it('should handle payment failure gracefully', async () => {
    // Mock payment failure
    jest.spyOn(paymentService, 'processPayment').mockResolvedValue({
      success: false,
      error: 'Payment declined',
    });

    // Mock alert
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();

    // Render and attempt booking
    render(<RiderHome />);

    const destinationInput = screen.getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Times Square, New York');

    await waitFor(() => {
      expect(screen.getByText('Request Aura Lux')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Request Aura Lux'));

    // Verify error handling
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Payment Error', expect.any(String));
    });
  });
});

describe('Rider Booking + Payment Failure Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(tokenManager, 'isAuthenticated').mockResolvedValue(true);
  });

  it('should handle payment decline with retry option', async () => {
    // Mock payment decline
    jest.spyOn(paymentService, 'processPayment')
      .mockResolvedValueOnce({
        success: false,
        error: 'Insufficient funds',
      })
      .mockResolvedValueOnce({
        success: true,
        data: { paymentIntentId: 'pi-123', status: 'succeeded', amount: 1200 },
      });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();

    render(<RiderHome />);

    // Attempt booking
    const destinationInput = screen.getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Times Square, New York');

    await waitFor(() => {
      expect(screen.getByText('Request Aura Lux')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Request Aura Lux'));

    // Verify first payment attempt failed
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Payment Error', expect.stringContaining('Insufficient funds'));
    });

    // Retry payment
    const retryButton = screen.getByText('Retry Payment');
    fireEvent.press(retryButton);

    // Verify second payment attempt succeeded
    await waitFor(() => {
      expect(paymentService.processPayment).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle network timeout during payment', async () => {
    // Mock network timeout
    jest.spyOn(paymentService, 'processPayment').mockRejectedValue(new Error('Network timeout'));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();

    render(<RiderHome />);

    // Attempt booking
    const destinationInput = screen.getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Times Square, New York');

    await waitFor(() => {
      expect(screen.getByText('Request Aura Lux')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Request Aura Lux'));

    // Verify network error handling
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Network Error', expect.stringContaining('timeout'));
    });
  });
});

describe('KYC Completion Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(tokenManager, 'isAuthenticated').mockResolvedValue(true);
  });

  it('should complete KYC verification successfully', async () => {
    // Mock KYC configuration
    const mockKYCConfig = [
      {
        type: 'id_card',
        title: 'ID Card',
        description: 'Front and back of national ID',
        required: true,
        requiredForRoles: ['rider', 'driver'],
        examples: ['Front of ID', 'Back of ID'],
      },
      {
        type: 'selfie',
        title: 'Selfie',
        description: 'Clear photo of your face',
        required: true,
        requiredForRoles: ['rider', 'driver'],
        examples: ['Front facing photo'],
      },
    ];

    jest.spyOn(require('@/api/kycConfiguration'), 'KYCConfigurationService')
      .mockImplementation({
        getConfiguration: () => Promise.resolve({
          configurations: mockKYCConfig,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system',
        }),
      } as any);

    // Mock document upload
    jest.spyOn(require('@/api/auth'), 'authService')
      .mockImplementation({
        uploadKYCDocument: () => Promise.resolve({
          success: true,
          data: { id: 'doc-123', status: 'pending' },
        }),
        submitKYC: () => Promise.resolve({
          success: true,
          data: { status: 'pending', message: 'KYC submitted for review' },
        }),
      } as any);

    // Render KYC flow (assuming it's part of onboarding)
    const { getByText } = render(<RiderHome />);

    // Navigate to KYC
    fireEvent.press(getByText('Complete Verification'));

    // Upload ID card
    await waitFor(() => {
      expect(getByText('ID Card')).toBeTruthy();
    });
    fireEvent.press(getByText('Upload ID Card'));

    // Upload selfie
    await waitFor(() => {
      expect(getByText('Selfie')).toBeTruthy();
    });
    fireEvent.press(getByText('Upload Selfie'));

    // Submit KYC
    await waitFor(() => {
      expect(getByText('Submit Verification')).toBeTruthy();
    });
    fireEvent.press(getByText('Submit Verification'));

    // Verify KYC was submitted
    await waitFor(() => {
      expect(getByText('Verification Submitted')).toBeTruthy();
    });
  });

  it('should handle KYC document upload failure', async () => {
    // Mock upload failure
    jest.spyOn(require('@/api/auth'), 'authService')
      .mockImplementation({
        uploadKYCDocument: () => Promise.resolve({
          success: false,
          error: 'Document upload failed',
        }),
      } as any);

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();

    render(<RiderHome />);

    // Attempt KYC upload
    fireEvent.press(screen.getByText('Complete Verification'));
    fireEvent.press(screen.getByText('Upload ID Card'));

    // Verify error handling
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Upload Error', expect.stringContaining('failed'));
    });
  });
});

describe('Cancellation Mid-Ride Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(tokenManager, 'isAuthenticated').mockResolvedValue(true);
  });

  it('should handle rider cancellation before pickup', async () => {
    // Mock active ride
    jest.spyOn(rideService, 'getActiveRide').mockResolvedValue({
      success: true,
      data: {
        id: 'ride-123',
        status: 'assigned',
        driver: { id: 'driver-1', name: 'John Driver' },
        canCancel: true,
      },
    });

    // Mock cancellation
    jest.spyOn(rideService, 'cancelRide').mockResolvedValue({
      success: true,
      data: { status: 'cancelled', refundAmount: 0 },
    });

    render(<RiderHome />);

    // Cancel ride
    await waitFor(() => {
      expect(screen.getByText('Cancel Ride')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Cancel Ride'));

    // Confirm cancellation
    await waitFor(() => {
      expect(screen.getByText('Confirm Cancellation')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Confirm Cancellation'));

    // Verify ride was cancelled
    await waitFor(() => {
      expect(rideService.cancelRide).toHaveBeenCalledWith('ride-123', expect.any(String));
    });

    // Verify UI reflects cancellation
    await waitFor(() => {
      expect(screen.getByText('Ride Cancelled')).toBeTruthy();
    });
  });

  it('should prevent cancellation after pickup', async () => {
    // Mock ride in progress
    jest.spyOn(rideService, 'getActiveRide').mockResolvedValue({
      success: true,
      data: {
        id: 'ride-123',
        status: 'in_progress',
        driver: { id: 'driver-1', name: 'John Driver' },
        canCancel: false,
      },
    });

    render(<RiderHome />);

    // Verify cancellation is not available
    await waitFor(() => {
      expect(screen.queryByText('Cancel Ride')).toBeNull();
    });
  });
});

describe('Real-time Updates Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(tokenManager, 'isAuthenticated').mockResolvedValue(true);
  });

  it('should handle driver location updates', async () => {
    // Mock WebSocket connection
    const mockWebSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    jest.spyOn(require('@/services/websocketService'), 'websocketService')
      .mockReturnValue(mockWebSocket);

    // Mock ride with driver
    jest.spyOn(rideService, 'getActiveRide').mockResolvedValue({
      success: true,
      data: {
        id: 'ride-123',
        status: 'driver_en_route',
        driver: { id: 'driver-1', name: 'John Driver' },
      },
    });

    render(<RiderHome />);

    // Simulate location update
    const locationUpdateHandler = mockWebSocket.on.mock.calls.find(
      call => call[0] === 'driver_location_update'
    )?.[1];

    if (locationUpdateHandler) {
      locationUpdateHandler({
        rideId: 'ride-123',
        driverId: 'driver-1',
        location: { latitude: 40.7128, longitude: -74.0060 },
        estimatedArrival: 5,
      });

      // Verify UI updates with new location
      await waitFor(() => {
        expect(screen.getByText('5 min away')).toBeTruthy();
      });
    }
  });

  it('should handle ride status changes', async () => {
    const mockWebSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    jest.spyOn(require('@/services/websocketService'), 'websocketService')
      .mockReturnValue(mockWebSocket);

    jest.spyOn(rideService, 'getActiveRide').mockResolvedValue({
      success: true,
      data: {
        id: 'ride-123',
        status: 'assigned',
        driver: { id: 'driver-1', name: 'John Driver' },
      },
    });

    render(<RiderHome />);

    // Simulate status change
    const statusUpdateHandler = mockWebSocket.on.mock.calls.find(
      call => call[0] === 'ride_status_update'
    )?.[1];

    if (statusUpdateHandler) {
      statusUpdateHandler({
        rideId: 'ride-123',
        status: 'arrived',
        message: 'Driver has arrived',
      });

      // Verify UI updates with new status
      await waitFor(() => {
        expect(screen.getByText('Driver Has Arrived')).toBeTruthy();
      });
    }
  });
});

describe('Payment Integration Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(tokenManager, 'isAuthenticated').mockResolvedValue(true);
  });

  it('should handle multiple payment method attempts', async () => {
    // Mock multiple payment methods
    jest.spyOn(paymentService, 'getPaymentMethods').mockResolvedValue({
      success: true,
      data: [
        { id: 'card-1', type: 'card', last4: '1234', isDefault: true },
        { id: 'card-2', type: 'card', last4: '5678', isDefault: false },
      ],
    });

    // Mock payment failures on first method, success on second
    jest.spyOn(paymentService, 'processPayment')
      .mockImplementationOnce(() => Promise.resolve({
        success: false,
        error: 'Card declined',
      }))
      .mockImplementationOnce(() => Promise.resolve({
        success: true,
        data: { paymentIntentId: 'pi-123', status: 'succeeded', amount: 1200 },
      }));

    render(<RiderHome />);

    // Attempt booking
    const destinationInput = screen.getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Times Square, New York');

    await waitFor(() => {
      expect(screen.getByText('Request Aura Lux')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Request Aura Lux'));

    // First payment fails
    await waitFor(() => {
      expect(screen.getByText('Try Another Payment Method')).toBeTruthy();
    });

    // Select second payment method
    fireEvent.press(screen.getByText('•••• 5678'));

    // Retry payment
    fireEvent.press(screen.getByText('Retry Payment'));

    // Verify second payment succeeded
    await waitFor(() => {
      expect(paymentService.processPayment).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle payment processing timeout', async () => {
    // Mock payment timeout
    jest.spyOn(paymentService, 'processPayment').mockImplementation(
      () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Payment timeout')), 100)
      )
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();

    render(<RiderHome />);

    // Attempt booking
    const destinationInput = screen.getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Times Square, New York');

    await waitFor(() => {
      expect(screen.getByText('Request Aura Lux')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Request Aura Lux'));

    // Verify timeout handling
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Payment Error', expect.stringContaining('timeout'));
    }, { timeout: 200 });
  });
});
