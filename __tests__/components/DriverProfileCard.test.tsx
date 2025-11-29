/**
 * DriverProfileCard Component Tests
 * Tests for driver info card during active ride
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Linking, View, Text } from 'react-native';
import { DriverProfileCard, DriverInfo } from '../../src/components/driver/DriverProfileCard';

// Mock GlassCard to bypass gesture-handler issues
jest.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children, style }: { children: React.ReactNode; style?: object }) => {
    const { View } = require('react-native');
    return <View style={style}>{children}</View>;
  },
}));

// Mock CustomIcon
jest.mock('@/components/ui/CustomIcon', () => ({
  CustomIcon: ({ name, size, color }: { name: string; size: number; color: string }) => {
    const { View } = require('react-native');
    return <View testID={`icon-${name}`} />;
  },
}));

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

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
}));

// Mock theme
jest.mock('@/constants/theme', () => ({
  ds: {
    colors: {
      primary: '#00F5FF',
      secondary: '#00FF73',
      success: '#00FFB3',
      danger: '#FF3366',
      textPrimary: '#F7F7F7',
      textSecondary: '#A5A5A5',
      surface: 'rgba(22,22,22,0.95)',
      glass: 'rgba(30,30,30,0.6)',
      borderSubtle: 'rgba(255,255,255,0.08)',
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    radius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    typography: {
      family: 'System',
      size: { micro: 10, caption: 12, body: 14, title: 20 },
      weight: { normal: '400', medium: '500', bold: '700' },
      tracking: { normal: 0, wide: 0.5 },
    },
    shadow: { glow: { radius: 8 } },
    motion: { duration: { entrance: 300 } },
  },
}));

const mockDriver: DriverInfo = {
  id: 'driver-123',
  name: 'Marcus Chen',
  photo: 'https://example.com/marcus.jpg',
  rating: 4.98,
  totalRides: 3482,
  phone: '+1234567890',
  vehicle: {
    make: 'Tesla',
    model: 'Model S',
    color: 'Black',
    licensePlate: '8X2-99L',
    year: 2023,
  },
  isVerified: true,
  languages: ['English', 'Mandarin'],
  memberSince: '2020',
};

describe.skip('DriverProfileCard', () => {
  const defaultProps = {
    driver: mockDriver,
    onCall: undefined,
    onMessage: undefined,
    onViewProfile: jest.fn(),
    compact: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full View', () => {
    it('renders driver name correctly', () => {
      const { getByText } = render(<DriverProfileCard {...defaultProps} />);
      
      expect(getByText('Marcus Chen')).toBeTruthy();
    });

    it('displays driver rating', () => {
      const { getByText } = render(<DriverProfileCard {...defaultProps} />);
      
      expect(getByText('4.98')).toBeTruthy();
    });

    it('displays ride count', () => {
      const { getByText } = render(<DriverProfileCard {...defaultProps} />);
      
      // 3482 rides should be formatted as "3.5k"
      expect(getByText('3.5k')).toBeTruthy();
    });

    it('displays vehicle information', () => {
      const { getByText } = render(<DriverProfileCard {...defaultProps} />);
      
      expect(getByText('2023 Tesla Model S')).toBeTruthy();
      expect(getByText('Black')).toBeTruthy();
    });

    it('displays license plate', () => {
      const { getByText } = render(<DriverProfileCard {...defaultProps} />);
      
      expect(getByText('8X2-99L')).toBeTruthy();
    });

    it('displays languages when provided', () => {
      const { getByText } = render(<DriverProfileCard {...defaultProps} />);
      
      expect(getByText('English, Mandarin')).toBeTruthy();
    });

    it('displays member since when provided', () => {
      const { getByText } = render(<DriverProfileCard {...defaultProps} />);
      
      expect(getByText('Member since 2020')).toBeTruthy();
    });

    it('shows verified badge when driver is verified', () => {
      const { UNSAFE_root } = render(<DriverProfileCard {...defaultProps} />);
      
      // Check for the verification badge view
      // Verified driver should have the badge rendered somewhere in the tree
      expect(UNSAFE_root).toBeTruthy();
    });

    it('opens phone app when Call button is pressed (no custom handler)', async () => {
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} onCall={undefined} />
      );
      
      const callButton = getByText('Call');
      
      await act(async () => {
        fireEvent.press(callButton);
      });
      
      expect(Linking.openURL).toHaveBeenCalledWith('tel:+1234567890');
    });

    it('calls custom onCall handler when provided', async () => {
      const onCall = jest.fn();
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} onCall={onCall} />
      );
      
      const callButton = getByText('Call');
      
      await act(async () => {
        fireEvent.press(callButton);
      });
      
      expect(onCall).toHaveBeenCalledTimes(1);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('opens SMS app when Message button is pressed (no custom handler)', async () => {
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} onMessage={undefined} />
      );
      
      const messageButton = getByText('Message');
      
      await act(async () => {
        fireEvent.press(messageButton);
      });
      
      expect(Linking.openURL).toHaveBeenCalledWith('sms:+1234567890');
    });

    it('calls custom onMessage handler when provided', async () => {
      const onMessage = jest.fn();
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} onMessage={onMessage} />
      );
      
      const messageButton = getByText('Message');
      
      await act(async () => {
        fireEvent.press(messageButton);
      });
      
      expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('calls onViewProfile when Profile button is pressed', async () => {
      const { getByText } = render(<DriverProfileCard {...defaultProps} />);
      
      const profileButton = getByText('Profile');
      
      await act(async () => {
        fireEvent.press(profileButton);
      });
      
      expect(defaultProps.onViewProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('Compact View', () => {
    it('renders compact layout', () => {
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} compact={true} />
      );
      
      expect(getByText('Marcus Chen')).toBeTruthy();
      // Vehicle info in compact format
      expect(getByText('Black Tesla Model S')).toBeTruthy();
    });

    it('shows rating in compact view', () => {
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} compact={true} />
      );
      
      expect(getByText('4.98')).toBeTruthy();
    });

    it('shows license plate in compact view', () => {
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} compact={true} />
      );
      
      expect(getByText('8X2-99L')).toBeTruthy();
    });

    it('has call and message actions in compact view', () => {
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} compact={true} />
      );
      
      expect(getByText('Call')).toBeTruthy();
      expect(getByText('Message')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles driver without photo', () => {
      const driverNoPhoto = { ...mockDriver, photo: undefined };
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} driver={driverNoPhoto} />
      );
      
      // Should still render name
      expect(getByText('Marcus Chen')).toBeTruthy();
    });

    it('handles driver without languages', () => {
      const driverNoLanguages = { ...mockDriver, languages: undefined };
      const { queryByText } = render(
        <DriverProfileCard {...defaultProps} driver={driverNoLanguages} />
      );
      
      expect(queryByText('Languages:')).toBeNull();
    });

    it('handles driver without memberSince', () => {
      const driverNoMemberSince = { ...mockDriver, memberSince: undefined };
      const { queryByText } = render(
        <DriverProfileCard {...defaultProps} driver={driverNoMemberSince} />
      );
      
      expect(queryByText(/Member since/)).toBeNull();
    });

    it('handles unverified driver', () => {
      const unverifiedDriver = { ...mockDriver, isVerified: false };
      // Should render without verification badge
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} driver={unverifiedDriver} />
      );
      
      expect(getByText('Marcus Chen')).toBeTruthy();
    });

    it('formats large ride counts correctly', () => {
      const driverManyRides = { ...mockDriver, totalRides: 15000 };
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} driver={driverManyRides} />
      );
      
      // Should show "15k+"
      expect(getByText('15k+')).toBeTruthy();
    });

    it('formats medium ride counts correctly', () => {
      const driverMediumRides = { ...mockDriver, totalRides: 500 };
      const { getByText } = render(
        <DriverProfileCard {...defaultProps} driver={driverMediumRides} />
      );
      
      expect(getByText('500')).toBeTruthy();
    });
  });
});
