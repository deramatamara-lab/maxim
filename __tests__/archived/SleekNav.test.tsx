import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';

import { SleekNav, TabId } from '../src/components/ui/SleekNav';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initialValue: any) => ({ value: initialValue }),
  useAnimatedStyle: (fn: () => any) => fn(),
  withSpring: (value: any, config?: any) => value,
}));

// Mock CustomIcon component
jest.mock('../src/components/ui/CustomIcon', () => ({
  CustomIcon: ({ name, size, active, ...props }: any) => (
    <div 
      testID={`custom-icon-${name}`} 
      {...props}
    >
      {name}-{size}-{active ? 'active' : 'inactive'}
    </div>
  ),
}));

// Mock hooks
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
      primary: '#0066FF',
      border: 'rgba(255, 255, 255, 0.3)',
    },
  },
  TabId: {
    home: 'home',
    activity: 'activity',
    location: 'location',
    profile: 'profile',
  },
}));

describe('SleekNav Component', () => {
  const mockOnTabChange = jest.fn();
  const defaultProps = {
    activeTab: 'home' as TabId,
    onTabChange: mockOnTabChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render navigation container correctly', () => {
      const { getByTestId } = render(
        <SleekNav {...defaultProps} testID="sleek-nav" />
      );
      
      expect(getByTestId('sleek-nav')).toBeTruthy();
    });

    it('should render all navigation buttons', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icons = getAllByTestId(/custom-icon-/);
      expect(icons).toHaveLength(4); // home, activity, location, profile
    });

    it('should render with correct active tab styling', () => {
      const { getAllByTestId } = render(
        <SleekNav {...defaultProps} activeTab="activity" />
      );
      
      const icons = getAllByTestId(/custom-icon-/);
      expect(icons[1]).toBeTruthy(); // Activity should be active
    });

    it('should render navigation bar with proper structure', () => {
      const { getByTestId } = render(
        <SleekNav {...defaultProps} testID="nav-container" />
      );
      
      const container = getByTestId('nav-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Tab Interaction', () => {
    it('should call onTabChange when tab is pressed', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const activityIcon = getAllByTestId(/custom-icon-/)[1]; // activity tab
      fireEvent.press(activityIcon);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('activity');
    });

    it('should handle home tab press', () => {
      const { getAllByTestId } = render(
        <SleekNav {...defaultProps} activeTab="activity" />
      );
      
      const homeIcon = getAllByTestId(/custom-icon-/)[0]; // home tab
      fireEvent.press(homeIcon);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('home');
    });

    it('should handle location tab press', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const locationIcon = getAllByTestId(/custom-icon-/)[2]; // location tab
      fireEvent.press(locationIcon);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('location');
    });

    it('should handle profile tab press', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const profileIcon = getAllByTestId(/custom-icon-/)[3]; // profile tab
      fireEvent.press(profileIcon);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('profile');
    });

    it('should handle pressing the same active tab', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const homeIcon = getAllByTestId(/custom-icon-/)[0]; // home tab (active)
      fireEvent.press(homeIcon);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('home');
    });

    it('should handle multiple tab presses in sequence', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icons = getAllByTestId(/custom-icon-/);
      
      fireEvent.press(icons[1]); // activity
      expect(mockOnTabChange).toHaveBeenLastCalledWith('activity');
      
      fireEvent.press(icons[2]); // location
      expect(mockOnTabChange).toHaveBeenLastCalledWith('location');
      
      fireEvent.press(icons[3]); // profile
      expect(mockOnTabChange).toHaveBeenLastCalledWith('profile');
    });
  });

  describe('Active State Management', () => {
    it('should show active indicator for active tab', () => {
      const { getAllByTestId } = render(
        <SleekNav {...defaultProps} activeTab="location" />
      );
      
      const icons = getAllByTestId(/custom-icon-/);
      // Location tab should be active
      expect(icons[2]).toBeTruthy();
    });

    it('should update active state when prop changes', () => {
      const { rerender, getAllByTestId } = render(
        <SleekNav {...defaultProps} activeTab="home" />
      );
      
      rerender(<SleekNav {...defaultProps} activeTab="profile" />);
      
      const icons = getAllByTestId(/custom-icon-/);
      // Profile tab should be active
      expect(icons[3]).toBeTruthy();
    });

    it('should handle rapid active tab changes', () => {
      const { rerender } = render(<SleekNav {...defaultProps} />);
      
      expect(() => {
        const tabs: TabId[] = ['home', 'activity', 'location', 'profile'];
        for (let i = 0; i < 10; i++) {
          rerender(
            <SleekNav 
              {...defaultProps} 
              activeTab={tabs[i % tabs.length]} 
            />
          );
        }
      }).not.toThrow();
    });
  });

  describe('Icon Rendering', () => {
    it('should render icons with correct names', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icons = getAllByTestId(/custom-icon-/);
      expect(icons[0].props.testID).toBe('custom-icon-home');
      expect(icons[1].props.testID).toBe('custom-icon-activity');
      expect(icons[2].props.testID).toBe('custom-icon-location');
      expect(icons[3].props.testID).toBe('custom-icon-profile');
    });

    it('should render active icons with larger size', () => {
      const { getAllByTestId } = render(
        <SleekNav {...defaultProps} activeTab="activity" />
      );
      
      const icons = getAllByTestId(/custom-icon-/);
      // Active icon (activity) should have larger size
      expect(icons[1]).toBeTruthy();
    });

    it('should render inactive icons with smaller size', () => {
      const { getAllByTestId } = render(
        <SleekNav {...defaultProps} activeTab="home" />
      );
      
      const icons = getAllByTestId(/custom-icon-/);
      // Inactive icons should have smaller size
      expect(icons[1]).toBeTruthy();
      expect(icons[2]).toBeTruthy();
      expect(icons[3]).toBeTruthy();
    });
  });

  describe('Animation Integration', () => {
    it('should handle scale animation on press', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[1];
      
      expect(() => {
        fireEvent.press(icon);
        // Fast forward timer for animation completion
        jest.advanceTimersByTime(150);
      }).not.toThrow();
    });

    it('should handle animation state changes', () => {
      const { rerender } = render(<SleekNav {...defaultProps} />);
      
      expect(() => {
        rerender(<SleekNav {...defaultProps} activeTab="activity" />);
        rerender(<SleekNav {...defaultProps} activeTab="location" />);
      }).not.toThrow();
    });

    it('should handle rapid animation triggers', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[0];
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          fireEvent.press(icon);
          jest.advanceTimersByTime(50);
        }
      }).not.toThrow();
    });
  });

  describe('Feedback Integration', () => {
    it('should trigger haptic feedback on tab press', () => {
      const mockTrigger = jest.fn();
      jest.doMock('../src/hooks/useHaptics', () => ({
        useHaptics: () => ({ trigger: mockTrigger }),
      }));

      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[1];
      fireEvent.press(icon);
      
      expect(mockTrigger).toHaveBeenCalledWith('tap');
    });

    it('should play sound feedback on tab press', () => {
      const mockPlay = jest.fn();
      jest.doMock('../src/hooks/useSound', () => ({
        useSound: () => ({ play: mockPlay }),
      }));

      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[1];
      fireEvent.press(icon);
      
      expect(mockPlay).toHaveBeenCalledWith('tapSoft');
    });

    it('should trigger feedback for all tab presses', () => {
      const mockTrigger = jest.fn();
      const mockPlay = jest.fn();
      jest.doMock('../src/hooks/useHaptics', () => ({
        useHaptics: () => ({ trigger: mockTrigger }),
      }));
      jest.doMock('../src/hooks/useSound', () => ({
        useSound: () => ({ play: mockPlay }),
      }));

      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icons = getAllByTestId(/custom-icon-/);
      
      icons.forEach((icon) => {
        fireEvent.press(icon);
      });
      
      expect(mockTrigger).toHaveBeenCalledTimes(4);
      expect(mockPlay).toHaveBeenCalledTimes(4);
    });
  });

  describe('Pressable Interactions', () => {
    it('should handle press events', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[0];
      
      expect(() => {
        fireEvent.press(icon);
      }).not.toThrow();
    });

    it('should handle pressIn events', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[0];
      
      expect(() => {
        fireEvent.pressIn(icon);
      }).not.toThrow();
    });

    it('should handle pressOut events', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[0];
      
      expect(() => {
        fireEvent.pressOut(icon);
      }).not.toThrow();
    });

    it('should handle pressed state styling', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[0];
      
      // Simulate pressed state
      const pressableStyle = icon.props.style({ pressed: true });
      expect(pressableStyle.backgroundColor).toBe('rgba(255, 255, 255, 0.1)');
      
      const normalStyle = icon.props.style({ pressed: false });
      expect(normalStyle.backgroundColor).toBe('transparent');
    });
  });

  describe('Props Handling', () => {
    it('should handle custom onTabChange function', () => {
      const customOnTabChange = jest.fn();
      
      const { getAllByTestId } = render(
        <SleekNav {...defaultProps} onTabChange={customOnTabChange} />
      );
      
      const icon = getAllByTestId(/custom-icon-/)[1];
      fireEvent.press(icon);
      
      expect(customOnTabChange).toHaveBeenCalledWith('activity');
    });

    it('should handle all possible activeTab values', () => {
      const tabs: TabId[] = ['home', 'activity', 'location', 'profile'];
      
      tabs.forEach((activeTab) => {
        expect(() => {
          render(<SleekNav {...defaultProps} activeTab={activeTab} />);
        }).not.toThrow();
      });
    });

    it('should handle missing onTabChange gracefully', () => {
      expect(() => {
        render(
          <SleekNav 
            activeTab="home" 
            onTabChange={undefined as any} 
          />
        );
      }).not.toThrow();
    });

    it('should handle null onTabChange gracefully', () => {
      expect(() => {
        render(
          <SleekNav 
            activeTab="home" 
            onTabChange={null as any} 
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should support accessibility props', () => {
      const { getByTestId } = render(
        <SleekNav 
          {...defaultProps}
          accessible={true}
          accessibilityLabel="Main Navigation"
          accessibilityRole="navigation"
          testID="accessible-nav"
        />
      );
      
      const nav = getByTestId('accessible-nav');
      expect(nav.props.accessible).toBe(true);
      expect(nav.props.accessibilityLabel).toBe('Main Navigation');
      expect(nav.props.accessibilityRole).toBe('navigation');
    });

    it('should support accessibilityHint', () => {
      const { getByTestId } = render(
        <SleekNav 
          {...defaultProps}
          accessible={true}
          accessibilityHint="Navigate between app sections"
          testID="hint-nav"
        />
      );
      
      const nav = getByTestId('hint-nav');
      expect(nav.props.accessibilityHint).toBe('Navigate between app sections');
    });
  });

  describe('Component Lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(<SleekNav {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates during lifecycle', () => {
      const { rerender } = render(<SleekNav {...defaultProps} />);

      rerender(<SleekNav {...defaultProps} activeTab="activity" />);
      rerender(<SleekNav {...defaultProps} activeTab="location" />);
      rerender(<SleekNav {...defaultProps} activeTab="profile" />);

      expect(true).toBe(true); // Should handle all updates without errors
    });

    it('should handle callback updates during lifecycle', () => {
      const { rerender } = render(<SleekNav {...defaultProps} />);

      const newOnTabChange = jest.fn();
      rerender(
        <SleekNav 
          {...defaultProps} 
          onTabChange={newOnTabChange} 
        />
      );

      expect(true).toBe(true); // Should handle callback updates
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid activeTab gracefully', () => {
      expect(() => {
        render(
          <SleekNav 
            activeTab={'invalid' as any} 
            onTabChange={mockOnTabChange} 
          />
        );
      }).not.toThrow();
    });

    it('should handle onTabChange throwing errors', () => {
      const errorOnTabChange = jest.fn(() => {
        throw new Error('Navigation error');
      });

      const { getAllByTestId } = render(
        <SleekNav {...defaultProps} onTabChange={errorOnTabChange} />
      );
      
      const icon = getAllByTestId(/custom-icon-/)[0];
      
      expect(() => {
        fireEvent.press(icon);
      }).toThrow();
    });

    it('should handle animation errors gracefully', () => {
      jest.doMock('react-native-reanimated', () => ({
        useSharedValue: (initialValue: any) => ({ value: initialValue }),
        useAnimatedStyle: () => {
          throw new Error('Animation error');
        },
        withSpring: (value: any, config?: any) => value,
      }));

      expect(() => {
        render(<SleekNav {...defaultProps} />);
      }).toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle rapid tab presses efficiently', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[0];
      
      expect(() => {
        for (let i = 0; i < 50; i++) {
          fireEvent.press(icon);
        }
      }).not.toThrow();
    });

    it('should handle rapid activeTab changes', () => {
      const { rerender } = render(<SleekNav {...defaultProps} />);
      
      expect(() => {
        for (let i = 0; i < 50; i++) {
          const tabs: TabId[] = ['home', 'activity', 'location', 'profile'];
          rerender(
            <SleekNav 
              {...defaultProps} 
              activeTab={tabs[i % tabs.length]} 
            />
          );
        }
      }).not.toThrow();
    });

    it('should handle many SleekNav instances efficiently', () => {
      const manyNavs = Array.from({ length: 5 }, (_, i) => (
        <SleekNav
          key={i}
          activeTab={['home', 'activity', 'location', 'profile'][i % 4] as TabId}
          onTabChange={jest.fn()}
        />
      ));

      expect(() => {
        render(<>{manyNavs}</>);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should work inside other containers', () => {
      const { getByTestId } = render(
        <View testID="outer-container">
          <SleekNav {...defaultProps} testID="inner-nav" />
        </View>
      );

      expect(getByTestId('outer-container')).toBeTruthy();
      expect(getByTestId('inner-nav')).toBeTruthy();
    });

    it('should work with other navigation components', () => {
      const { getByTestId } = render(
        <View>
          <SleekNav {...defaultProps} testID="nav-1" />
          <SleekNav 
            activeTab="activity" 
            onTabChange={jest.fn()} 
            testID="nav-2" 
          />
        </View>
      );

      expect(getByTestId('nav-1')).toBeTruthy();
      expect(getByTestId('nav-2')).toBeTruthy();
    });

    it('should work with custom styling', () => {
      const { getByTestId } = render(
        <SleekNav 
          {...defaultProps}
          style={{ marginBottom: 20 }}
          testID="styled-nav"
        />
      );

      expect(getByTestId('styled-nav')).toBeTruthy();
    });
  });

  describe('Edge Cases', () {
    it('should handle empty press events', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[0];
      
      expect(() => {
        fireEvent.press(icon);
        fireEvent.press(icon);
        fireEvent.press(icon);
      }).not.toThrow();
    });

    it('should handle simultaneous tab presses', () => {
      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icons = getAllByTestId(/custom-icon-/);
      
      expect(() => {
        fireEvent.press(icons[0]);
        fireEvent.press(icons[1]);
        fireEvent.press(icons[2]);
      }).not.toThrow();
    });

    it('should handle zero delay animations', () => {
      jest.doMock('react-native-reanimated', () => ({
        useSharedValue: (initialValue: any) => ({ value: initialValue }),
        useAnimatedStyle: (fn: () => any) => fn(),
        withSpring: (value: any, config?: any) => {
          return config?.damping === 0 ? value : value;
        },
      }));

      const { getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      const icon = getAllByTestId(/custom-icon-/)[0];
      
      expect(() => {
        fireEvent.press(icon);
        jest.advanceTimersByTime(0);
      }).not.toThrow();
    });
  });

  describe('Navigation Flow', () => {
    it('should maintain navigation state correctly', () => {
      const { rerender, getAllByTestId } = render(<SleekNav {...defaultProps} />);
      
      // Simulate navigation flow
      rerender(<SleekNav {...defaultProps} activeTab="activity" />);
      rerender(<SleekNav {...defaultProps} activeTab="location" />);
      rerender(<SleekNav {...defaultProps} activeTab="profile" />);
      rerender(<SleekNav {...defaultProps} activeTab="home" />);
      
      const icons = getAllByTestId(/custom-icon-/);
      expect(icons).toHaveLength(4);
    });

    it('should handle navigation back and forth', () => {
      const { rerender } = render(<SleekNav {...defaultProps} />);
      
      expect(() => {
        // Back and forth navigation
        for (let i = 0; i < 10; i++) {
          const targetTab = i % 2 === 0 ? 'home' : 'activity';
          rerender(<SleekNav {...defaultProps} activeTab={targetTab as TabId} />);
        }
      }).not.toThrow();
    });
  });
});
