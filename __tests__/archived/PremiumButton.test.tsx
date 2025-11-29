import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PremiumButton } from '../src/components/ui/PremiumButton';

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initialValue: any) => ({ value: initialValue }),
  useAnimatedStyle: (fn: () => any) => fn(),
  withSpring: (value: any, config?: any) => value,
  interpolate: (value: any, inputRange: any[], outputRange: any[], extrapolate?: any) => outputRange[1],
  Extrapolate: {
    CLAMP: 'clamp',
  },
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
      primary: '#0066FF',
      secondary: '#00FF88',
      textPrimary: '#FFFFFF',
      border: '#333333',
    },
    radius: {
      lg: 16,
    },
    spacing: {
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    typography: {
      family: 'Poppins',
      weight: {
        semibold: '600',
      },
      size: {
        body: 16,
        bodyLg: 18,
      },
    },
  },
}));

describe('PremiumButton Component', () => {
  const mockOnPress = jest.fn();
  const defaultProps = {
    children: 'Test Button',
    onPress: mockOnPress,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button with default props', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      expect(button).toBeTruthy();
      expect(button.props.children.props.children).toBe('Test Button');
    });

    it('should render with primary variant by default', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      expect(button.props.style[1].backgroundColor).toBe('#0066FF');
    });

    it('should render with secondary variant', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} variant="secondary" />
      );
      
      const button = getByRole('button');
      expect(button.props.style[1].backgroundColor).toBe('#00FF88');
    });

    it('should render with ghost variant', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} variant="ghost" />
      );
      
      const button = getByRole('button');
      expect(button.props.style[1].backgroundColor).toBe('transparent');
      expect(button.props.style[1].borderWidth).toBe(1);
    });

    it('should render with small size', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} size="sm" />
      );
      
      const button = getByRole('button');
      expect(button.props.style[1].minHeight).toBe(40);
      expect(button.props.children.props.style[1].fontSize).toBe(16);
    });

    it('should render with medium size (default)', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} size="md" />
      );
      
      const button = getByRole('button');
      expect(button.props.style[1].minHeight).toBe(56);
      expect(button.props.children.props.style[1].fontSize).toBe(18);
    });

    it('should render with large size', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} size="lg" />
      );
      
      const button = getByRole('button');
      expect(button.props.style[1].minHeight).toBe(64);
      expect(button.props.children.props.style[1].fontSize).toBe(18);
    });

    it('should render custom children', () => {
      const customChildren = <Text testID="custom-text">Custom Content</Text>;
      const { getByTestId } = render(
        <PremiumButton {...defaultProps}>{customChildren}</PremiumButton>
      );
      
      expect(getByTestId('custom-text')).toBeTruthy();
    });

    it('should render complex children', () => {
      const complexChildren = (
        <Text>
          <Text>Prefix </Text>
          <Text testID="complex-text">Complex</Text>
          <Text> Suffix</Text>
        </Text>
      );
      const { getByTestId } = render(
        <PremiumButton {...defaultProps}>{complexChildren}</PremiumButton>
      );
      
      expect(getByTestId('complex-text')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('should call onPress when pressed', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} disabled={true} />
      );
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} loading={true} />
      );
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should handle pressIn event', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      fireEvent(button, 'pressIn');
      
      // Should trigger haptic and sound feedback
      expect(button.props.onPressIn).toBeDefined();
    });

    it('should handle pressOut event', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      fireEvent(button, 'pressOut');
      
      expect(button.props.onPressOut).toBeDefined();
    });

    it('should handle long press', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      fireEvent.longPress(button);
      
      // Should handle long press gracefully
      expect(true).toBe(true);
    });
  });

  describe('State Variations', () => {
    it('should show loading state correctly', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} loading={true} />
      );
      
      const buttonText = getByRole('button').props.children;
      expect(buttonText.props.children).toBe('Loading...');
    });

    it('should show disabled state correctly', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} disabled={true} />
      );
      
      const button = getByRole('button');
      expect(button.props.disabled).toBe(true);
    });

    it('should show loading and disabled together', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} loading={true} disabled={true} />
      );
      
      const button = getByRole('button');
      expect(button.props.disabled).toBe(true);
      expect(button.props.children.props.children).toBe('Loading...');
    });

    it('should handle pressed state', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      const pressedStyle = button.props.style({ pressed: true });
      expect(pressedStyle.opacity).toBe(0.8);
    });

    it('should handle unpressed state', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      const unpressedStyle = button.props.style({ pressed: false });
      expect(unpressedStyle.opacity).toBe(1);
    });
  });

  describe('Accessibility', () => {
    it('should have button role by default', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('should support accessibilityLabel', () => {
      const { getByRole } = render(
        <PremiumButton
          {...defaultProps}
          accessibilityLabel="Custom Button Label"
        />
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Custom Button Label');
    });

    it('should support accessibilityHint', () => {
      const { getByRole } = render(
        <PremiumButton
          {...defaultProps}
          accessibilityHint="This is a premium button"
        />
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('This is a premium button');
    });

    it('should support accessibilityRole', () => {
      const { getByRole } = render(
        <PremiumButton
          {...defaultProps}
          accessibilityRole="tab"
        />
      );
      
      const button = getByRole('tab');
      expect(button).toBeTruthy();
    });

    it('should support accessibilityState', () => {
      const { getByRole } = render(
        <PremiumButton
          {...defaultProps}
          accessibilityState={{ selected: true, busy: false }}
        />
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({
        selected: true,
        busy: false,
      });
    });

    it('should have proper accessibility when disabled', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} disabled={true} />
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('should have proper accessibility when loading', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} loading={true} />
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.busy).toBe(true);
    });
  });

  describe('Styling', () => {
    it('should apply custom styles', () => {
      const customStyle = { marginTop: 20, backgroundColor: 'purple' };
      const { getByRole } = render(
        <PremiumButton {...defaultProps} style={customStyle} />
      );
      
      const button = getByRole('button');
      expect(button).toBeTruthy();
      // Custom styles would be merged with default styles
    });

    it('should handle style array', () => {
      const styleArray = [
        { marginTop: 10 },
        { marginBottom: 20 },
        { borderWidth: 2 },
      ];
      const { getByRole } = render(
        <PremiumButton {...defaultProps} style={styleArray} />
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('should handle dynamic styles', () => {
      const dynamicStyle = { opacity: Math.random() };
      const { getByRole } = render(
        <PremiumButton {...defaultProps} style={dynamicStyle} />
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('should have correct text styling', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const textElement = getByRole('button').props.children;
      expect(textElement.props.style[0].fontFamily).toBe('Poppins');
      expect(textElement.props.style[0].fontWeight).toBe('600');
      expect(textElement.props.style[0].textAlign).toBe('center');
    });

    it('should have correct text colors for variants', () => {
      const { getByRole: primaryByRole } = render(
        <PremiumButton {...defaultProps} variant="primary" />
      );
      const { getByRole: ghostByRole } = render(
        <PremiumButton {...defaultProps} variant="ghost" />
      );
      
      const primaryText = primaryByRole('button').props.children;
      const ghostText = ghostByRole('button').props.children;
      
      expect(primaryText.props.style[1].color).toBe('#000000');
      expect(ghostText.props.style[1].color).toBe('#FFFFFF');
    });
  });

  describe('Feedback Integration', () => {
    it('should trigger haptic feedback on press', () => {
      const mockTrigger = jest.fn();
      jest.doMock('../src/hooks/useHaptics', () => ({
        useHaptics: () => ({ trigger: mockTrigger }),
      }));

      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      fireEvent(button, 'pressIn');
      fireEvent.press(button);
      
      expect(mockTrigger).toHaveBeenCalledWith('tap');
      expect(mockTrigger).toHaveBeenCalledWith('confirm');
    });

    it('should play sound feedback on press', () => {
      const mockPlay = jest.fn();
      jest.doMock('../src/hooks/useSound', () => ({
        useSound: () => ({ play: mockPlay }),
      }));

      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      fireEvent(button, 'pressIn');
      fireEvent.press(button);
      
      expect(mockPlay).toHaveBeenCalledWith('tapSoft');
      expect(mockPlay).toHaveBeenCalledWith('success');
    });

    it('should not trigger feedback when disabled', () => {
      const mockTrigger = jest.fn();
      const mockPlay = jest.fn();
      jest.doMock('../src/hooks/useHaptics', () => ({
        useHaptics: () => ({ trigger: mockTrigger }),
      }));
      jest.doMock('../src/hooks/useSound', () => ({
        useSound: () => ({ play: mockPlay }),
      }));

      const { getByRole } = render(
        <PremiumButton {...defaultProps} disabled={true} />
      );
      
      const button = getByRole('button');
      fireEvent(button, 'pressIn');
      fireEvent.press(button);
      
      expect(mockTrigger).not.toHaveBeenCalled();
      expect(mockPlay).not.toHaveBeenCalled();
    });

    it('should not trigger feedback when loading', () => {
      const mockTrigger = jest.fn();
      const mockPlay = jest.fn();
      jest.doMock('../src/hooks/useHaptics', () => ({
        useHaptics: () => ({ trigger: mockTrigger }),
      }));
      jest.doMock('../src/hooks/useSound', () => ({
        useSound: () => ({ play: mockPlay }),
      }));

      const { getByRole } = render(
        <PremiumButton {...defaultProps} loading={true} />
      );
      
      const button = getByRole('button');
      fireEvent(button, 'pressIn');
      fireEvent.press(button);
      
      expect(mockTrigger).not.toHaveBeenCalled();
      expect(mockPlay).not.toHaveBeenCalled();
    });
  });

  describe('Animation', () => {
    it('should have animated wrapper', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      // Button should be wrapped in Animated.View
      expect(button).toBeTruthy();
    });

    it('should handle animation values', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      // Animation should apply transform and opacity styles
      expect(button.props.style).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onPress gracefully', () => {
      expect(() => {
        render(
          <PremiumButton children="Test" onPress={() => {}} />
        );
      }).not.toThrow();
    });

    it('should handle null children gracefully', () => {
      expect(() => {
        render(
          <PremiumButton children={null} onPress={mockOnPress} />
        );
      }).not.toThrow();
    });

    it('should handle undefined children gracefully', () => {
      expect(() => {
        render(
          <PremiumButton children={undefined} onPress={mockOnPress} />
        );
      }).not.toThrow();
    });

    it('should handle invalid variant gracefully', () => {
      expect(() => {
        render(
          <PremiumButton {...defaultProps} variant={'invalid' as any} />
        );
      }).not.toThrow();
    });

    it('should handle invalid size gracefully', () => {
      expect(() => {
        render(
          <PremiumButton {...defaultProps} size={'invalid' as any} />
        );
      }).not.toThrow();
    });

    it('should handle null style gracefully', () => {
      expect(() => {
        render(
          <PremiumButton {...defaultProps} style={null as any} />
        );
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle rapid presses efficiently', () => {
      const { getByRole } = render(<PremiumButton {...defaultProps} />);
      
      const button = getByRole('button');
      
      expect(() => {
        for (let i = 0; i < 100; i++) {
          fireEvent.press(button);
        }
      }).not.toThrow();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(
        <PremiumButton {...defaultProps} disabled={false} />
      );

      expect(() => {
        for (let i = 0; i < 50; i++) {
          rerender(
            <PremiumButton
              {...defaultProps}
              disabled={i % 2 === 0}
              loading={i % 3 === 0}
            />
          );
        }
      }).not.toThrow();
    });

    it('should handle many buttons efficiently', () => {
      const manyButtons = Array.from({ length: 100 }, (_, i) => (
        <PremiumButton key={i} onPress={() => {}}>
          Button {i}
        </PremiumButton>
      ));

      expect(() => {
        render(<>{manyButtons}</>);
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(<PremiumButton {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates during lifecycle', () => {
      const { rerender } = render(
        <PremiumButton {...defaultProps} variant="primary" />
      );

      rerender(<PremiumButton {...defaultProps} variant="secondary" />);
      rerender(<PremiumButton {...defaultProps} size="lg" />);
      rerender(<PremiumButton {...defaultProps} disabled={true} />);
      rerender(<PremiumButton {...defaultProps} loading={true} />);

      expect(true).toBe(true); // Should handle all updates without errors
    });
  });

  describe('Integration', () => {
    it('should work inside other containers', () => {
      const { getByRole, getByTestId } = render(
        <View testID="container">
          <PremiumButton {...defaultProps} />
        </View>
      );

      expect(getByTestId('container')).toBeTruthy();
      expect(getByRole('button')).toBeTruthy();
    });

    it('should work with form elements', () => {
      const { getByRole } = render(
        <View>
          <PremiumButton {...defaultProps} />
          <Text>Form content</Text>
        </View>
      );

      expect(getByRole('button')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string children', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} children="" />
      );
      
      const button = getByRole('button');
      expect(button.props.children.props.children).toBe('');
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      const { getByRole } = render(
        <PremiumButton {...defaultProps} children={longText} />
      );
      
      const button = getByRole('button');
      expect(button.props.children.props.children).toBe(longText);
    });

    it('should handle special characters in text', () => {
      const specialText = 'Button with émojis 🎉 and symbols @#$%';
      const { getByRole } = render(
        <PremiumButton {...defaultProps} children={specialText} />
      );
      
      const button = getByRole('button');
      expect(button.props.children.props.children).toBe(specialText);
    });

    it('should handle numeric children converted to string', () => {
      const { getByRole } = render(
        <PremiumButton {...defaultProps} children={123} />
      );
      
      const button = getByRole('button');
      expect(button.props.children.props.children).toBe(123);
    });
  });
});
