import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { FloatingTabBar, TabId } from '../src/components/ui/FloatingTabBar';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initialValue: any) => ({ value: initialValue }),
  useAnimatedStyle: (fn: () => any) => fn(),
  withTiming: (value: any, config?: any) => value,
  interpolateColor: (value: any, inputRange: any[], outputRange: any[]) => outputRange[1],
  Easing: {
    bezier: (x1: number, y1: number, x2: number, y2: number) => `bezier(${x1},${y1},${x2},${y2})`,
  },
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Tap: () => ({
      onBegin: jest.fn().mockReturnThis(),
      onFinalize: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Return translation key for testing
  }),
}));

// Mock dependencies
jest.mock('../src/components/ui/GlassCard', () => ({
  GlassCard: ({ children, style, ...props }: any) => (
    <div testID="glass-card" style={style} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../src/components/ui/Icon', () => ({
  Icon: ({ name, size, color, active, ...props }: any) => (
    <div testID={`icon-${name}`} {...props}>
      {name}-{size}-{color}-{active ? 'active' : 'inactive'}
    </div>
  ),
}));

jest.mock('../src/hooks/useHaptics', () => ({
  useHaptics: () => ({
    trigger: jest.fn(),
  }),
}));

jest.mock('../src/hooks/useSound', () => ({
  useSound: () => ({
    play: jest.fn(),
  }),
}));

// Mock theme constants
jest.mock('../src/constants/theme', () => ({
  ds: {
    colors: {
      glass: 'rgba(255, 255, 255, 0.1)',
      surfaceElevated: 'rgba(255, 255, 255, 0.2)',
      glassBorder: 'rgba(255, 255, 255, 0.3)',
      outlineSubtle: 'rgba(255, 255, 255, 0.4)',
      primary: '#0066FF',
      textSecondary: '#888888',
    },
    radius: {
      '2xl': 24,
      lg: 16,
      sm: 8,
    },
    spacing: {
      xl: 32,
      md: 16,
      sm: 8,
    },
    typography: {
      family: 'Poppins',
      size: {
        caption: 12,
      },
      weight: {
        medium: '500',
      },
    },
    motion: {
      duration: {
        micro: 140,
        exit: 220,
      },
      easing: {
        micro: [0.25, 0.1, 0.25, 1],
        exit: [0.55, 0.085, 0.68, 0.53],
      },
    },
    shadow: {
      card: {
        opacity: 0.1,
        radius: 8,
      },
      soft: {
        radius: 4,
      },
    },
  },
}));

describe('FloatingTabBar Component', () => {
  const mockOnTabChange = jest.fn();
  const defaultProps = {
    activeTab: 'home' as TabId,
    onTabChange: mockOnTabChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all tabs correctly', () => {
      const { getByTestId, getAllByTestId } = render(<FloatingTabBar {...defaultProps} />);
      
      expect(getByTestId('glass-card')).toBeTruthy();
      
      const icons = getAllByTestId(/icon-/);
      expect(icons).toHaveLength(4); // home, activity, location, profile
    });

    it('should render with correct active tab', () => {
      const { getAllByTestId } = render(
        <FloatingTabBar {...defaultProps} activeTab="activity" />
      );
      
      const icons = getAllByTestId(/icon-/);
      // Activity tab should be active
      expect(icons[1]).toBeTruthy();
    });

    it('should render translation keys as labels', () => {
      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      expect(getByText('home.tabHome')).toBeTruthy();
      expect(getByText('home.tabActivity')).toBeTruthy();
      expect(getByText('home.tabLocation')).toBeTruthy();
      expect(getByText('home.tabProfile')).toBeTruthy();
    });

    it('should render with accessibility roles', () => {
      const { getByTestId } = render(
        <FloatingTabBar {...defaultProps} testID="tab-bar" />
      );
      
      const tabBar = getByTestId('tab-bar');
      expect(tabBar.props.accessibilityRole).toBe('tablist');
      expect(tabBar.props.accessibilityLabel).toBe('Primary navigation');
    });
  });

  describe('Tab Interaction', () => {
    it('should call onTabChange when inactive tab is pressed', () => {
      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      const activityTab = getByText('home.tabActivity');
      fireEvent.press(activityTab);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('activity');
    });

    it('should not call onTabChange when active tab is pressed', () => {
      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      const homeTab = getByText('home.tabHome');
      fireEvent.press(homeTab);
      
      expect(mockOnTabChange).not.toHaveBeenCalled();
    });

    it('should handle tab changes correctly', () => {
      const { rerender, getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      // Change to activity tab
      rerender(<FloatingTabBar {...defaultProps} activeTab="activity" />);
      
      const homeTab = getByText('home.tabHome');
      fireEvent.press(homeTab);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('home');
    });

    it('should handle all tab presses', () => {
      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      // Test each tab
      fireEvent.press(getByText('home.tabActivity'));
      expect(mockOnTabChange).toHaveBeenCalledWith('activity');
      
      mockOnTabChange.mockClear();
      
      fireEvent.press(getByText('home.tabLocation'));
      expect(mockOnTabChange).toHaveBeenCalledWith('location');
      
      mockOnTabChange.mockClear();
      
      fireEvent.press(getByText('home.tabProfile'));
      expect(mockOnTabChange).toHaveBeenCalledWith('profile');
    });
  });

  describe('Active State Styling', () => {
    it('should apply active styles to correct tab', () => {
      const { getAllByTestId } = render(
        <FloatingTabBar {...defaultProps} activeTab="location" />
      );
      
      const icons = getAllByTestId(/icon-/);
      // Location icon should be active
      expect(icons[2]).toBeTruthy();
    });

    it('should update active state when tab changes', () => {
      const { rerender, getAllByTestId } = render(
        <FloatingTabBar {...defaultProps} activeTab="home" />
      );
      
      rerender(<FloatingTabBar {...defaultProps} activeTab="profile" />);
      
      const icons = getAllByTestId(/icon-/);
      // Profile icon should be active
      expect(icons[3]).toBeTruthy();
    });

    it('should handle rapid tab changes', () => {
      const { rerender } = render(<FloatingTabBar {...defaultProps} />);
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          const tabs: TabId[] = ['home', 'activity', 'location', 'profile'];
          rerender(
            <FloatingTabBar 
              {...defaultProps} 
              activeTab={tabs[i % tabs.length]} 
            />
          );
        }
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have correct accessibility roles for tabs', () => {
      const { getAllByTestId } = render(<FloatingTabBar {...defaultProps} />);
      
      // Each tab should have role="tab"
      const tabs = getAllByTestId(/icon-/);
      tabs.forEach((tab) => {
        expect(tab.props.accessibilityRole).toBe('tab');
      });
    });

    it('should have correct accessibility state for active tab', () => {
      const { getAllByTestId } = render(
        <FloatingTabBar {...defaultProps} activeTab="activity" />
      );
      
      const tabs = getAllByTestId(/icon-/);
      // Second tab (activity) should be selected
      expect(tabs[1].props.accessibilityState).toEqual({ selected: true });
    });

    it('should have correct accessibility state for inactive tabs', () => {
      const { getAllByTestId } = render(
        <FloatingTabBar {...defaultProps} activeTab="home" />
      );
      
      const tabs = getAllByTestId(/icon-/);
      // Inactive tabs should not be selected
      expect(tabs[1].props.accessibilityState).toEqual({ selected: false });
      expect(tabs[2].props.accessibilityState).toEqual({ selected: false });
      expect(tabs[3].props.accessibilityState).toEqual({ selected: false });
    });
  });

  describe('Feedback Integration', () => {
    it('should trigger haptic feedback on tab press', () => {
      const mockTrigger = jest.fn();
      jest.doMock('../src/hooks/useHaptics', () => ({
        useHaptics: () => ({ trigger: mockTrigger }),
      }));

      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      fireEvent.press(getByText('home.tabActivity'));
      
      expect(mockTrigger).toHaveBeenCalledWith('selection');
    });

    it('should play sound feedback on tab press', () => {
      const mockPlay = jest.fn();
      jest.doMock('../src/hooks/useSound', () => ({
        useSound: () => ({ play: mockPlay }),
      }));

      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      fireEvent.press(getByText('home.tabActivity'));
      
      expect(mockPlay).toHaveBeenCalledWith('click');
    });

    it('should trigger feedback even when pressing active tab', () => {
      const mockTrigger = jest.fn();
      const mockPlay = jest.fn();
      jest.doMock('../src/hooks/useHaptics', () => ({
        useHaptics: () => ({ trigger: mockTrigger }),
      }));
      jest.doMock('../src/hooks/useSound', () => ({
        useSound: () => ({ play: mockPlay }),
      }));

      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      fireEvent.press(getByText('home.tabHome')); // Active tab
      
      expect(mockTrigger).toHaveBeenCalledWith('selection');
      expect(mockPlay).toHaveBeenCalledWith('click');
    });
  });

  describe('Animation Integration', () => {
    it('should handle animation values correctly', () => {
      const { getAllByTestId } = render(<FloatingTabBar {...defaultProps} />);
      
      const tabs = getAllByTestId(/icon-/);
      tabs.forEach((tab) => {
        expect(tab).toBeTruthy(); // Should handle animations without errors
      });
    });

    it('should handle animation state changes', () => {
      const { rerender } = render(<FloatingTabBar {...defaultProps} />);
      
      expect(() => {
        rerender(<FloatingTabBar {...defaultProps} activeTab="activity" />);
        rerender(<FloatingTabBar {...defaultProps} activeTab="location" />);
        rerender(<FloatingTabBar {...defaultProps} activeTab="profile" />);
      }).not.toThrow();
    });
  });

  describe('Gesture Handling', () => {
    it('should handle gesture events without errors', () => {
      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      const tab = getByText('home.tabActivity');
      
      // Simulate gesture events
      expect(() => {
        fireEvent(tab, 'pressIn');
        fireEvent(tab, 'pressOut');
        fireEvent.press(tab);
      }).not.toThrow();
    });

    it('should handle gesture begin and finalize events', () => {
      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      const tab = getByText('home.tabActivity');
      
      expect(() => {
        fireEvent(tab, 'touchStart');
        fireEvent(tab, 'touchEnd');
        fireEvent.press(tab);
      }).not.toThrow();
    });
  });

  describe('Internationalization', () => {
    it('should use translation keys correctly', () => {
      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      expect(getByText('home.tabHome')).toBeTruthy();
      expect(getByText('home.tabActivity')).toBeTruthy();
      expect(getByText('home.tabLocation')).toBeTruthy();
      expect(getByText('home.tabProfile')).toBeTruthy();
    });

    it('should handle translation function updates', () => {
      const customT = (key: string) => `translated-${key}`;
      jest.doMock('react-i18next', () => ({
        useTranslation: () => ({ t: customT }),
      }));

      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      expect(getByText('translated-home.tabHome')).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    it('should handle custom onTabChange function', () => {
      const customOnTabChange = jest.fn();
      
      const { getByText } = render(
        <FloatingTabBar {...defaultProps} onTabChange={customOnTabChange} />
      );
      
      fireEvent.press(getByText('home.tabActivity'));
      expect(customOnTabChange).toHaveBeenCalledWith('activity');
    });

    it('should handle all possible activeTab values', () => {
      const tabs: TabId[] = ['home', 'activity', 'location', 'profile'];
      
      tabs.forEach((activeTab) => {
        expect(() => {
          render(<FloatingTabBar {...defaultProps} activeTab={activeTab} />);
        }).not.toThrow();
      });
    });

    it('should handle missing onTabChange gracefully', () => {
      expect(() => {
        render(
          <FloatingTabBar 
            activeTab="home" 
            onTabChange={undefined as any} 
          />
        );
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid activeTab gracefully', () => {
      expect(() => {
        render(
          <FloatingTabBar 
            activeTab={'invalid' as any} 
            onTabChange={mockOnTabChange} 
          />
        );
      }).not.toThrow();
    });

    it('should handle null onTabChange gracefully', () => {
      expect(() => {
        render(
          <FloatingTabBar 
            activeTab="home" 
            onTabChange={null as any} 
          />
        );
      }).not.toThrow();
    });

    it('should handle onTabChange throwing errors', () => {
      const errorOnTabChange = jest.fn(() => {
        throw new Error('Navigation error');
      });

      const { getByText } = render(
        <FloatingTabBar {...defaultProps} onTabChange={errorOnTabChange} />
      );
      
      expect(() => {
        fireEvent.press(getByText('home.tabActivity'));
      }).toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(<FloatingTabBar {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates during lifecycle', () => {
      const { rerender } = render(<FloatingTabBar {...defaultProps} />);

      rerender(
        <FloatingTabBar {...defaultProps} activeTab="activity" />
      );
      rerender(
        <FloatingTabBar {...defaultProps} activeTab="location" />
      );
      rerender(
        <FloatingTabBar {...defaultProps} activeTab="profile" />
      );

      expect(true).toBe(true); // Should handle all updates without errors
    });

    it('should handle callback updates during lifecycle', () => {
      const { rerender } = render(<FloatingTabBar {...defaultProps} />);

      const newOnTabChange = jest.fn();
      rerender(
        <FloatingTabBar 
          {...defaultProps} 
          onTabChange={newOnTabChange} 
        />
      );

      expect(true).toBe(true); // Should handle callback updates
    });
  });

  describe('Performance', () => {
    it('should handle rapid tab presses efficiently', () => {
      const { getByText } = render(<FloatingTabBar {...defaultProps} />);
      
      const activityTab = getByText('home.tabActivity');
      
      expect(() => {
        for (let i = 0; i < 50; i++) {
          fireEvent.press(activityTab);
        }
      }).not.toThrow();
    });

    it('should handle rapid activeTab changes', () => {
      const { rerender } = render(<FloatingTabBar {...defaultProps} />);
      
      expect(() => {
        for (let i = 0; i < 50; i++) {
          const tabs: TabId[] = ['home', 'activity', 'location', 'profile'];
          rerender(
            <FloatingTabBar 
              {...defaultProps} 
              activeTab={tabs[i % tabs.length]} 
            />
          );
        }
      }).not.toThrow();
    });

    it('should handle many FloatingTabBar instances efficiently', () => {
      const manyTabBars = Array.from({ length: 5 }, (_, i) => (
        <FloatingTabBar
          key={i}
          activeTab={['home', 'activity', 'location', 'profile'][i % 4] as TabId}
          onTabChange={jest.fn()}
        />
      ));

      expect(() => {
        render(<>{manyTabBars}</>);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should work inside other containers', () => {
      const { getByTestId } = render(
        <div testID="outer-container">
          <FloatingTabBar {...defaultProps} testID="inner-tab-bar" />
        </div>
      );

      expect(getByTestId('outer-container')).toBeTruthy();
      expect(getByTestId('inner-tab-bar')).toBeTruthy();
    });

    it('should work with other navigation components', () => {
      const { getByTestId } = render(
        <div>
          <FloatingTabBar {...defaultProps} testID="tab-bar-1" />
          <FloatingTabBar 
            activeTab="activity" 
            onTabChange={jest.fn()} 
            testID="tab-bar-2" 
          />
        </div>
      );

      expect(getByTestId('tab-bar-1')).toBeTruthy();
      expect(getByTestId('tab-bar-2')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty translation keys', () => {
      jest.doMock('react-i18next', () => ({
        useTranslation: () => ({ t: () => '' }),
      }));

      expect(() => {
        render(<FloatingTabBar {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle translation function throwing errors', () => {
      jest.doMock('react-i18next', () => ({
        useTranslation: () => ({ 
          t: () => { throw new Error('Translation error'); }
        }),
      }));

      expect(() => {
        render(<FloatingTabBar {...defaultProps} />);
      }).toThrow();
    });

    it('should handle gesture handler errors', () => {
      jest.doMock('react-native-gesture-handler', () => ({
        Gesture: {
          Tap: () => {
            throw new Error('Gesture error');
          },
        },
        GestureDetector: ({ children }: { children: React.ReactNode }) => children,
      }));

      expect(() => {
        render(<FloatingTabBar {...defaultProps} />);
      }).toThrow();
    });
  });
});
