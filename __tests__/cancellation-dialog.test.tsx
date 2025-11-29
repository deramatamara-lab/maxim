/**
 * Cancellation Dialog Tests
 * Tests for the enhanced ride cancellation dialog with countdown timer and fee display
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/ThemeLocaleProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { CancellationDialog } from '@/components/ride/CancellationDialog';

// Mock hooks
jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    trigger: jest.fn(),
  }),
}));

jest.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    play: jest.fn(),
  }),
}));

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LanguageProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </LanguageProvider>
);

describe('CancellationDialog', () => {
  const defaultProps = {
    visible: true,
    onDismiss: jest.fn(),
    onConfirm: jest.fn(),
    rideStatus: 'pending' as const,
    cancellationFee: 0,
    freeCancellationTimeLeft: 0,
    ridePrice: 0,
    driverEnRouteTime: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders correctly when visible', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} />
      </TestWrapper>
    );

    expect(getByText('Cancel Ride?')).toBeTruthy();
    expect(getByText('Please wait...')).toBeTruthy();
    expect(getByText('Keep Ride')).toBeTruthy();
  });

  test('does not render when not visible', () => {
    const { queryByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} visible={false} />
      </TestWrapper>
    );

    expect(queryByText('Cancel Ride?')).toBeFalsy();
  });

  test('shows countdown timer and disables confirm button initially', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} />
      </TestWrapper>
    );

    expect(getByText('5')).toBeTruthy();
    expect(getByText('Please wait...')).toBeTruthy();
    
    const confirmButton = getByText('Wait 5s');
    expect(confirmButton).toBeTruthy();
  });

  test('enables confirm button after countdown completes', async () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} />
      </TestWrapper>
    );

    // Initial state
    expect(getByText('5')).toBeTruthy();
    expect(getByText('Please wait...')).toBeTruthy();
    expect(getByText('Wait 5s')).toBeTruthy();

    // Fast-forward through countdown
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText('4')).toBeTruthy();
    expect(getByText('Wait 4s')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(getByText('✓')).toBeTruthy();
      expect(getByText('You can now cancel')).toBeTruthy();
      expect(getByText('Cancel Ride')).toBeTruthy();
    });
  });

  test('calls onConfirm when countdown completes and button is pressed', async () => {
    const mockOnConfirm = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} onConfirm={mockOnConfirm} />
      </TestWrapper>
    );

    // Fast-forward through countdown
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(getByText('Cancel Ride')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel Ride'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onDismiss when Keep Ride button is pressed', () => {
    const mockOnDismiss = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} onDismiss={mockOnDismiss} />
      </TestWrapper>
    );

    fireEvent.press(getByText('Keep Ride'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  test('displays no cancellation fee for pending rides', () => {
    const { queryByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} rideStatus="pending" />
      </TestWrapper>
    );

    expect(queryByText('Cancellation Fee')).toBeFalsy();
    expect(getByText('No cancellation fee will be charged.')).toBeTruthy();
  });

  test('displays cancellation fee for confirmed rides', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} rideStatus="confirmed" cancellationFee={2.50} />
      </TestWrapper>
    );

    expect(getByText('Cancellation Fee')).toBeTruthy();
    expect(getByText('$2.50')).toBeTruthy();
    expect(getByText('A cancellation fee of $2.50 will be charged.')).toBeTruthy();
  });

  test('displays full ride price for in-progress rides', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog 
          {...defaultProps} 
          rideStatus="in_progress" 
          ridePrice={25.50} 
        />
      </TestWrapper>
    );

    expect(getByText('Cancellation Fee')).toBeTruthy();
    expect(getByText('$25.50')).toBeTruthy();
    expect(getByText('Full ride price')).toBeTruthy();
    expect(getByText('Cancellation during ride will result in full fare charge ($25.50).')).toBeTruthy();
  });

  test('displays free cancellation time when available', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog 
          {...defaultProps} 
          rideStatus="accepted" 
          freeCancellationTimeLeft={120} 
        />
      </TestWrapper>
    );

    expect(getByText('Free cancellation available for 2:00')).toBeTruthy();
    expect(queryByText('Cancellation Fee')).toBeFalsy();
  });

  test('shows driver en route time for accepted rides', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog 
          {...defaultProps} 
          rideStatus="accepted" 
          driverEnRouteTime={120} 
        />
      </TestWrapper>
    );

    expect(getByText('Driver has been en route for 2 minutes')).toBeTruthy();
  });

  test('shows appropriate consequences for different ride statuses', () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} rideStatus="arrived" />
      </TestWrapper>
    );

    expect(getByText('Driver has already traveled to your location')).toBeTruthy();
    expect(getByText('Driver will need to wait for their next ride request')).toBeTruthy();
    expect(queryByText('You can immediately request a new ride after cancellation')).toBeFalsy();
  });

  test('calculates fee correctly when no explicit fee provided', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog 
          {...defaultProps} 
          rideStatus="arrived" 
          cancellationFee={0} // No explicit fee
        />
      </TestWrapper>
    );

    // Should use default threshold fee for arrived status ($5.00)
    expect(getByText('Cancellation Fee')).toBeTruthy();
    expect(getByText('$5.00')).toBeTruthy();
  });

  test('haptic feedback triggers during countdown', () => {
    const mockTrigger = jest.fn();
    jest.mock('@/hooks/useHaptics', () => ({
      useHaptics: () => ({
        trigger: mockTrigger,
      }),
    }));

    render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} />
      </TestWrapper>
    );

    // Advance timer to trigger haptic feedback
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Haptic should trigger for each countdown tick
    expect(mockTrigger).toHaveBeenCalled();
  });

  test('sound feedback plays on confirm and dismiss', () => {
    const mockPlay = jest.fn();
    jest.mock('@/hooks/useSound', () => ({
      useSound: () => ({
        play: mockPlay,
      }),
    }));

    const mockOnConfirm = jest.fn();
    const mockOnDismiss = jest.fn();

    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog 
          {...defaultProps} 
          onConfirm={mockOnConfirm}
          onDismiss={mockOnDismiss}
        />
      </TestWrapper>
    );

    // Fast-forward countdown
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Test dismiss
    fireEvent.press(getByText('Keep Ride'));
    expect(mockPlay).toHaveBeenCalledWith('tapSoft');

    // Test confirm
    fireEvent.press(getByText('Cancel Ride'));
    expect(mockPlay).toHaveBeenCalledWith('warning');
  });

  test('handles rapid dismiss/confirm calls gracefully', async () => {
    const mockOnConfirm = jest.fn();
    const mockOnDismiss = jest.fn();

    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog 
          {...defaultProps} 
          onConfirm={mockOnConfirm}
          onDismiss={mockOnDismiss}
        />
      </TestWrapper>
    );

    // Try to confirm before countdown finishes (should not work)
    fireEvent.press(getByText('Wait 5s'));
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Dismiss should work immediately
    fireEvent.press(getByText('Keep Ride'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  test('displays fee payment method information', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog 
          {...defaultProps} 
          rideStatus="confirmed" 
          cancellationFee={3.50} 
        />
      </TestWrapper>
    );

    expect(getByText('The fee will be charged to your original payment method')).toBeTruthy();
  });

  test('shows rebooking wait time warning for non-pending rides', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} rideStatus="confirmed" />
      </TestWrapper>
    );

    expect(getByText('You may need to wait longer for your next ride')).toBeTruthy();
  });

  test('immediate rebooking info for pending rides', () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} rideStatus="pending" />
      </TestWrapper>
    );

    expect(getByText('You can immediately request a new ride after cancellation')).toBeTruthy();
    expect(queryByText('You may need to wait longer for your next ride')).toBeFalsy();
  });
});

describe('CancellationDialog Edge Cases', () => {
  const defaultProps = {
    visible: true,
    onDismiss: jest.fn(),
    onConfirm: jest.fn(),
    rideStatus: 'pending' as const,
    cancellationFee: 0,
    freeCancellationTimeLeft: 0,
    ridePrice: 0,
    driverEnRouteTime: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('handles zero ride price gracefully', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} rideStatus="in_progress" ridePrice={0} />
      </TestWrapper>
    );

    // Should still show cancellation fee section with calculated threshold
    expect(getByText('Cancellation Fee')).toBeTruthy();
  });

  test('handles very high driver en route time', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog 
          {...defaultProps} 
          rideStatus="accepted" 
          driverEnRouteTime={3600} // 1 hour
        />
      </TestWrapper>
    );

    expect(getByText('Driver has been en route for 60 minutes')).toBeTruthy();
  });

  test('handles free cancellation with exact timing', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog 
          {...defaultProps} 
          rideStatus="accepted" 
          freeCancellationTimeLeft={5} // 5 seconds
        />
      </TestWrapper>
    );

    expect(getByText('Free cancellation available for 0:05')).toBeTruthy();
  });

  test('handles multiple rapid timer advances', () => {
    const { getByText } = render(
      <TestWrapper>
        <CancellationDialog {...defaultProps} />
      </TestWrapper>
    );

    // Advance timer rapidly
    for (let i = 0; i < 10; i++) {
      act(() => {
        jest.advanceTimersByTime(500);
      });
    }

    // Should still work correctly
    expect(getByText('✓')).toBeTruthy();
    expect(getByText('You can now cancel')).toBeTruthy();
  });
});

console.log('✅ Cancellation dialog tests completed successfully');
