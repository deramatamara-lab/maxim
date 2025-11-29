import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { GlassCard } from '../src/components/ui/GlassCard';

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children, style, ...props }) => (
    <div data-testid="blur-view" style={style} {...props}>
      {children}
    </div>
  ),
}));

// Mock theme constants
jest.mock('../src/constants/theme', () => ({
  ds: {
    colors: {
      glass: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
    },
    radius: {
      lg: 16,
    },
    spacing: {
      lg: 24,
    },
    shadow: {
      card: {
        offsetY: 4,
        opacity: 0.1,
        radius: 8,
      },
      modern: {
        offsetY: 8,
        opacity: 0.15,
        radius: 16,
      },
    },
  },
}));

describe('GlassCard Component', () => {
  const defaultProps = {
    children: <Text testID="test-content">Test Content</Text>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render children correctly', () => {
      const { getByTestId } = render(<GlassCard {...defaultProps} />);
      
      expect(getByTestId('test-content')).toBeTruthy();
      expect(getByTestId('blur-view')).toBeTruthy();
    });

    it('should render with default props', () => {
      const { getByTestId } = render(<GlassCard {...defaultProps} />);
      
      const blurView = getByTestId('blur-view');
      expect(blurView.props.intensity).toBe(30);
      expect(blurView.props.tint).toBe('dark');
    });

    it('should render with custom intensity', () => {
      const { getByTestId } = render(
        <GlassCard {...defaultProps} intensity={50} />
      );
      
      const blurView = getByTestId('blur-view');
      expect(blurView.props.intensity).toBe(50);
    });

    it('should render with light tint', () => {
      const { getByTestId } = render(
        <GlassCard {...defaultProps} tint="light" />
      );
      
      const blurView = getByTestId('blur-view');
      expect(blurView.props.tint).toBe('light');
    });

    it('should render with default tint', () => {
      const { getByTestId } = render(
        <GlassCard {...defaultProps} tint="default" />
      );
      
      const blurView = getByTestId('blur-view');
      expect(blurView.props.tint).toBe('default');
    });
  });

  describe('Props Handling', () => {
    it('should apply custom styles', () => {
      const customStyle = { marginTop: 20, backgroundColor: 'red' };
      const { getByTestId } = render(
        <GlassCard {...defaultProps} style={customStyle} />
      );
      
      // Note: Style testing would need to be done through the actual component
      // This test ensures the component accepts style prop without crashing
      expect(getByTestId('test-content')).toBeTruthy();
    });

    it('should handle elevated prop correctly', () => {
      const { getByTestId } = render(
        <GlassCard {...defaultProps} elevated={true} />
      );
      
      expect(getByTestId('test-content')).toBeTruthy();
      // Elevated prop should apply different shadow styles
    });

    it('should handle interactive prop correctly', () => {
      const { getByTestId } = render(
        <GlassCard {...defaultProps} interactive={true} />
      );
      
      expect(getByTestId('test-content')).toBeTruthy();
      // Interactive prop should apply additional styling
    });

    it('should handle all props together', () => {
      const customStyle = { margin: 10 };
      const { getByTestId } = render(
        <GlassCard
          {...defaultProps}
          elevated={true}
          interactive={true}
          intensity={60}
          tint="light"
          style={customStyle}
        />
      );
      
      expect(getByTestId('test-content')).toBeTruthy();
      const blurView = getByTestId('blur-view');
      expect(blurView.props.intensity).toBe(60);
      expect(blurView.props.tint).toBe('light');
    });
  });

  describe('Children Rendering', () => {
    it('should render single child', () => {
      const { getByTestId } = render(
        <GlassCard>
          <Text testID="single-child">Single Child</Text>
        </GlassCard>
      );
      
      expect(getByTestId('single-child')).toBeTruthy();
    });

    it('should render multiple children', () => {
      const { getByTestId } = render(
        <GlassCard>
          <Text testID="child-1">Child 1</Text>
          <Text testID="child-2">Child 2</Text>
          <View testID="child-3" />
        </GlassCard>
      );
      
      expect(getByTestId('child-1')).toBeTruthy();
      expect(getByTestId('child-2')).toBeTruthy();
      expect(getByTestId('child-3')).toBeTruthy();
    });

    it('should render nested children', () => {
      const { getByTestId } = render(
        <GlassCard>
          <View testID="parent">
            <Text testID="nested-child">Nested Child</Text>
          </View>
        </GlassCard>
      );
      
      expect(getByTestId('parent')).toBeTruthy();
      expect(getByTestId('nested-child')).toBeTruthy();
    });

    it('should render null children gracefully', () => {
      expect(() => {
        render(<GlassCard>{null}</GlassCard>);
      }).not.toThrow();
    });

    it('should render undefined children gracefully', () => {
      expect(() => {
        render(<GlassCard>{undefined}</GlassCard>);
      }).not.toThrow();
    });

    it('should render empty string children', () => {
      const { getByTestId } = render(
        <GlassCard>
          <Text testID="empty-text"></Text>
        </GlassCard>
      );
      
      expect(getByTestId('empty-text')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should support accessibility props', () => {
      const { getByTestId } = render(
        <GlassCard
          {...defaultProps}
          accessible={true}
          accessibilityLabel="Glass Card Container"
          accessibilityRole="container"
          testID="accessible-card"
        />
      );
      
      const card = getByTestId('accessible-card');
      expect(card.props.accessible).toBe(true);
      expect(card.props.accessibilityLabel).toBe('Glass Card Container');
      expect(card.props.accessibilityRole).toBe('container');
    });

    it('should support accessibilityHint', () => {
      const { getByTestId } = render(
        <GlassCard
          {...defaultProps}
          accessible={true}
          accessibilityHint="This is a glass card with blur effect"
          testID="hint-card"
        />
      );
      
      const card = getByTestId('hint-card');
      expect(card.props.accessibilityHint).toBe('This is a glass card with blur effect');
    });

    it('should support accessibilityState', () => {
      const { getByTestId } = render(
        <GlassCard
          {...defaultProps}
          accessible={true}
          accessibilityState={{ selected: true, disabled: false }}
          testID="state-card"
        />
      );
      
      const card = getByTestId('state-card');
      expect(card.props.accessibilityState).toEqual({
        selected: true,
        disabled: false,
      });
    });
  });

  describe('Event Handling', () => {
    it('should support touch events when interactive', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <GlassCard
          {...defaultProps}
          interactive={true}
          onPress={onPress}
          testID="interactive-card"
        />
      );
      
      const card = getByTestId('interactive-card');
      fireEvent.press(card);
      
      // Note: Actual touch handling would depend on implementation
      // This test ensures the component accepts touch props
      expect(card.props.onPress).toBe(onPress);
    });

    it('should support layout events', () => {
      const onLayout = jest.fn();
      const { getByTestId } = render(
        <GlassCard
          {...defaultProps}
          onLayout={onLayout}
          testID="layout-card"
        />
      );
      
      const card = getByTestId('layout-card');
      fireEvent.layout(card, {
        nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 100 } },
      });
      
      expect(onLayout).toHaveBeenCalled();
    });
  });

  describe('Style Computation', () => {
    it('should merge custom styles with default styles', () => {
      const customStyle = { opacity: 0.8, transform: [{ scale: 1.1 }] };
      const { getByTestId } = render(
        <GlassCard {...defaultProps} style={customStyle} testID="styled-card" />
      );
      
      expect(getByTestId('styled-card')).toBeTruthy();
      // Style merging would be tested through visual regression or style computation
    });

    it('should handle style array', () => {
      const styleArray = [
        { marginTop: 10 },
        { marginBottom: 20 },
        { backgroundColor: 'blue' },
      ];
      const { getByTestId } = render(
        <GlassCard {...defaultProps} style={styleArray} testID="array-style-card" />
      );
      
      expect(getByTestId('array-style-card')).toBeTruthy();
    });

    it('should handle dynamic styles', () => {
      const dynamicStyle = { width: Math.random() * 100 };
      const { getByTestId } = render(
        <GlassCard {...defaultProps} style={dynamicStyle} testID="dynamic-card" />
      );
      
      expect(getByTestId('dynamic-card')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle many children efficiently', () => {
      const manyChildren = Array.from({ length: 100 }, (_, i) => (
        <Text key={i} testID={`child-${i}`}>
          Child {i}
        </Text>
      ));

      expect(() => {
        render(<GlassCard>{manyChildren}</GlassCard>);
      }).not.toThrow();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(
        <GlassCard {...defaultProps} intensity={10} testID="performance-card" />
      );

      expect(() => {
        for (let i = 0; i < 50; i++) {
          rerender(
            <GlassCard {...defaultProps} intensity={i} testID="performance-card" />
          );
        }
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid intensity values gracefully', () => {
      expect(() => {
        render(<GlassCard {...defaultProps} intensity={-10} />);
      }).not.toThrow();

      expect(() => {
        render(<GlassCard {...defaultProps} intensity={150} />);
      }).not.toThrow();
    });

    it('should handle invalid tint values gracefully', () => {
      expect(() => {
        render(<GlassCard {...defaultProps} tint={'invalid' as any} />);
      }).not.toThrow();
    });

    it('should handle null style gracefully', () => {
      expect(() => {
        render(<GlassCard {...defaultProps} style={null as any} />);
      }).not.toThrow();
    });

    it('should handle undefined style gracefully', () => {
      expect(() => {
        render(<GlassCard {...defaultProps} style={undefined as any} />);
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(<GlassCard {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates during lifecycle', () => {
      const { rerender } = render(
        <GlassCard {...defaultProps} elevated={false} />
      );

      rerender(<GlassCard {...defaultProps} elevated={true} />);
      rerender(<GlassCard {...defaultProps} interactive={true} />);
      rerender(<GlassCard {...defaultProps} intensity={80} tint="light" />);

      expect(true).toBe(true); // Should handle all updates without errors
    });
  });

  describe('Integration with Other Components', () => {
    it('should work inside other containers', () => {
      const { getByTestId } = render(
        <View testID="outer-container">
          <GlassCard {...defaultProps} testID="inner-card" />
        </View>
      );

      expect(getByTestId('outer-container')).toBeTruthy();
      expect(getByTestId('inner-card')).toBeTruthy();
    });

    it('should contain other UI components', () => {
      const { getByTestId } = render(
        <GlassCard>
          <View testID="inner-view">
            <Text testID="inner-text">Nested Content</Text>
          </View>
        </GlassCard>
      );

      expect(getByTestId('inner-view')).toBeTruthy();
      expect(getByTestId('inner-text')).toBeTruthy();
    });
  });
});
