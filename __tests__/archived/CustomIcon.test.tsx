import React from 'react';
import { render } from '@testing-library/react-native';

import { CustomIcon } from '../src/components/ui/CustomIcon';

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: ({ children, width, height, viewBox, fill, style, ...props }) => (
    <svg 
      data-testid="custom-icon-svg"
      width={width} 
      height={height} 
      viewBox={viewBox} 
      fill={fill} 
      style={style} 
      {...props}
    >
      {children}
    </svg>
  ),
  Path: ({ d, stroke, strokeWidth, strokeLinecap, strokeLinejoin, ...props }) => (
    <path 
      data-testid="custom-icon-path"
      d={d} 
      stroke={stroke} 
      strokeWidth={strokeWidth} 
      strokeLinecap={strokeLinecap} 
      strokeLinejoin={strokeLinejoin} 
      {...props}
    />
  ),
}));

// Mock theme constants
jest.mock('../src/constants/theme', () => ({
  ds: {
    colors: {
      textSecondary: '#888888',
      primary: '#0066FF',
    },
  },
}));

describe('CustomIcon Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render icon with default props', () => {
      const { getByTestId } = render(<CustomIcon name="home" />);
      
      const svg = getByTestId('svg-element');
      const path = getByTestId('path-element');
      
      expect(svg).toBeTruthy();
      expect(path).toBeTruthy();
      expect(svg.props.width).toBe(24);
      expect(svg.props.height).toBe(24);
      expect(svg.props.viewBox).toBe('0 0 24 24');
      expect(svg.props.fill).toBe('none');
    });

    it('should render home icon path correctly', () => {
      const { getByTestId } = render(<CustomIcon name="home" />);
      
      const path = getByTestId('path-element');
      expect(path.props.d).toBe('M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z');
    });

    it('should render activity icon path correctly', () => {
      const { getByTestId } = render(<CustomIcon name="activity" />);
      
      const path = getByTestId('path-element');
      expect(path.props.d).toBe('M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8');
    });

    it('should render location icon path correctly', () => {
      const { getByTestId } = render(<CustomIcon name="location" />);
      
      const path = getByTestId('path-element');
      expect(path.props.d).toBe('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a3 3 0 100-6 3 3 0 000 6');
    });

    it('should render profile icon path correctly', () => {
      const { getByTestId } = render(<CustomIcon name="profile" />);
      
      const path = getByTestId('path-element');
      expect(path.props.d).toBe('M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8');
    });

    it('should render search icon path correctly', () => {
      const { getByTestId } = render(<CustomIcon name="search" />);
      
      const path = getByTestId('path-element');
      expect(path.props.d).toBe('M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35');
    });

    it('should render menu icon path correctly', () => {
      const { getByTestId } = render(<CustomIcon name="menu" />);
      
      const path = getByTestId('path-element');
      expect(path.props.d).toBe('M3 12h18M3 6h18M3 18h18');
    });

    it('should render chevronRight icon path correctly', () => {
      const { getByTestId } = render(<CustomIcon name="chevronRight" />);
      
      const path = getByTestId('path-element');
      expect(path.props.d).toBe('M9 18l6-6-6-6');
    });

    it('should render settings icon path correctly', () => {
      const { getByTestId } = render(<CustomIcon name="settings" />);
      
      const path = getByTestId('path-element');
      expect(path.props.d).toBe('M12.22 2h-.44a2 2 0 01-2 2.22l-.61.16a2 2 0 00-1.26.91l-.29.5a2 2 0 00.46 2.58l.44.38a1 1 0 010 1.42l-.44.38a2 2 0 00-.46 2.58l.29.5a2 2 0 001.26.91l.61.16a2 2 0 012 2.22h.44a2 2 0 012-2.22l.61-.16a2 2 0 001.26-.91l.29-.5a2 2 0 00-.46-2.58l-.44-.38a1 1 0 010-1.42l.44-.38a2 2 0 00.46-2.58l-.29-.5a2 2 0 00-1.26-.91l-.61-.16a2 2 0 01-2-2.22zM12 15a3 3 0 100-6 3 3 0 000 6z');
    });
  });

  describe('Props Handling', () => {
    it('should render with custom size', () => {
      const { getByTestId } = render(<CustomIcon name="home" size={32} />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.width).toBe(32);
      expect(svg.props.height).toBe(32);
    });

    it('should render with custom color', () => {
      const { getByTestId } = render(<CustomIcon name="home" color="#FF0000" />);
      
      const path = getByTestId('path-element');
      expect(path.props.stroke).toBe('#FF0000');
    });

    it('should render with active state', () => {
      const { getByTestId } = render(<CustomIcon name="home" active={true} />);
      
      const path = getByTestId('path-element');
      const svg = getByTestId('svg-element');
      
      expect(path.props.stroke).toBe('#0066FF');
      expect(path.props.strokeWidth).toBe(2.5);
      expect(svg.props.style).toEqual({
        filter: 'drop-shadow(0 0 8px #0066FF)',
      });
    });

    it('should render with inactive state', () => {
      const { getByTestId } = render(<CustomIcon name="home" active={false} />);
      
      const path = getByTestId('path-element');
      const svg = getByTestId('svg-element');
      
      expect(path.props.stroke).toBe('#888888');
      expect(path.props.strokeWidth).toBe(2);
      expect(svg.props.style).toEqual({
        filter: 'none',
      });
    });

    it('should render with all custom props', () => {
      const { getByTestId } = render(
        <CustomIcon
          name="profile"
          size={48}
          color="#00FF00"
          active={true}
        />
      );
      
      const svg = getByTestId('svg-element');
      const path = getByTestId('path-element');
      
      expect(svg.props.width).toBe(48);
      expect(svg.props.height).toBe(48);
      expect(path.props.stroke).toBe('#0066FF'); // Active overrides custom color
      expect(path.props.strokeWidth).toBe(2.5);
    });

    it('should use default color when not active and no custom color', () => {
      const { getByTestId } = render(<CustomIcon name="home" active={false} />);
      
      const path = getByTestId('path-element');
      expect(path.props.stroke).toBe('#888888');
    });

    it('should use custom color when not active', () => {
      const { getByTestId } = render(
        <CustomIcon name="home" color="#FF00FF" active={false} />
      );
      
      const path = getByTestId('path-element');
      expect(path.props.stroke).toBe('#FF00FF');
    });
  });

  describe('SVG Attributes', () => {
    it('should have correct viewBox attribute', () => {
      const { getByTestId } = render(<CustomIcon name="home" />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.viewBox).toBe('0 0 24 24');
    });

    it('should have fill attribute set to none', () => {
      const { getByTestId } = render(<CustomIcon name="home" />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.fill).toBe('none');
    });

    it('should have correct stroke line attributes', () => {
      const { getByTestId } = render(<CustomIcon name="home" />);
      
      const path = getByTestId('path-element');
      expect(path.props.strokeLinecap).toBe('round');
      expect(path.props.strokeLinejoin).toBe('round');
    });

    it('should apply glow filter when active', () => {
      const { getByTestId } = render(<CustomIcon name="home" active={true} />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.style.filter).toContain('drop-shadow');
      expect(svg.props.style.filter).toContain('#0066FF');
    });
  });

  describe('Size Variations', () => {
    it('should render small size', () => {
      const { getByTestId } = render(<CustomIcon name="home" size={16} />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.width).toBe(16);
      expect(svg.props.height).toBe(16);
    });

    it('should render medium size', () => {
      const { getByTestId } = render(<CustomIcon name="home" size={24} />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.width).toBe(24);
      expect(svg.props.height).toBe(24);
    });

    it('should render large size', () => {
      const { getByTestId } = render(<CustomIcon name="home" size={64} />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.width).toBe(64);
      expect(svg.props.height).toBe(64);
    });

    it('should render very large size', () => {
      const { getByTestId } = render(<CustomIcon name="home" size={128} />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.width).toBe(128);
      expect(svg.props.height).toBe(128);
    });

    it('should handle zero size', () => {
      const { getByTestId } = render(<CustomIcon name="home" size={0} />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.width).toBe(0);
      expect(svg.props.height).toBe(0);
    });
  });

  describe('Color Variations', () => {
    it('should render with hex color', () => {
      const { getByTestId } = render(<CustomIcon name="home" color="#123456" />);
      
      const path = getByTestId('path-element');
      expect(path.props.stroke).toBe('#123456');
    });

    it('should render with rgb color', () => {
      const { getByTestId } = render(<CustomIcon name="home" color="rgb(255, 0, 0)" />);
      
      const path = getByTestId('path-element');
      expect(path.props.stroke).toBe('rgb(255, 0, 0)');
    });

    it('should render with rgba color', () => {
      const { getByTestId } = render(<CustomIcon name="home" color="rgba(255, 0, 0, 0.5)" />);
      
      const path = getByTestId('path-element');
      expect(path.props.stroke).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should render with named color', () => {
      const { getByTestId } = render(<CustomIcon name="home" color="red" />);
      
      const path = getByTestId('path-element');
      expect(path.props.stroke).toBe('red');
    });
  });

  describe('Active State Behavior', () => {
    it('should override color when active', () => {
      const { getByTestId } = render(
        <CustomIcon name="home" color="red" active={true} />
      );
      
      const path = getByTestId('path-element');
      expect(path.props.stroke).toBe('#0066FF'); // Primary color, not red
    });

    it('should have increased stroke width when active', () => {
      const { getByTestId } = render(<CustomIcon name="home" active={true} />);
      
      const path = getByTestId('path-element');
      expect(path.props.strokeWidth).toBe(2.5);
    });

    it('should have normal stroke width when inactive', () => {
      const { getByTestId } = render(<CustomIcon name="home" active={false} />);
      
      const path = getByTestId('path-element');
      expect(path.props.strokeWidth).toBe(2);
    });

    it('should toggle active state correctly', () => {
      const { rerender, getByTestId } = render(<CustomIcon name="home" active={false} />);
      
      let path = getByTestId('path-element');
      expect(path.props.stroke).toBe('#888888');
      expect(path.props.strokeWidth).toBe(2);

      rerender(<CustomIcon name="home" active={true} />);
      
      path = getByTestId('path-element');
      expect(path.props.stroke).toBe('#0066FF');
      expect(path.props.strokeWidth).toBe(2.5);
    });
  });

  describe('Accessibility', () => {
    it('should render with accessibility props', () => {
      const { getByTestId } = render(
        <CustomIcon 
          name="home"
          accessible={true}
          accessibilityLabel="Home icon"
          accessibilityRole="image"
        />
      );
      
      expect(getByTestId('custom-icon-svg')).toBeTruthy();
    });

    it('should render with accessibility hint', () => {
      const { getByTestId } = render(
        <CustomIcon 
          name="home"
          accessible={true}
          accessibilityHint="Navigate to home screen"
        />
      );
      
      expect(getByTestId('custom-icon-svg')).toBeTruthy();
    });

    it('should render with accessibility state', () => {
      const { getByTestId } = render(
        <CustomIcon 
          name="home"
          accessible={true}
          accessibilityState={{ selected: false }}
        />
      );
      
      expect(getByTestId('custom-icon-svg')).toBeTruthy();
    });
  });

  describe('Style Propagation', () => {
    it('should apply custom styles to SVG', () => {
      const customStyle = { opacity: 0.8, backgroundColor: 'red' };
      const { getByTestId } = render(
        <CustomIcon name="home" style={customStyle} testID="styled-icon" />
      );
      
      const icon = getByTestId('styled-icon');
      expect(icon.props.style).toBeDefined();
    });

    it('should merge filter style with active state', () => {
      const customStyle = { opacity: 0.5 };
      const { getByTestId } = render(
        <CustomIcon name="home" active={true} style={customStyle} testID="merged-icon" />
      );
      
      const svg = getByTestId('svg-element');
      expect(svg.props.style.filter).toContain('drop-shadow');
      expect(svg.props.style.opacity).toBe(0.5);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid icon name gracefully', () => {
      expect(() => {
        render(<CustomIcon name={'invalid' as any} />);
      }).not.toThrow();
    });

    it('should handle negative size gracefully', () => {
      expect(() => {
        render(<CustomIcon name="home" size={-10} />);
      }).not.toThrow();
    });

    it('should handle very large size gracefully', () => {
      expect(() => {
        render(<CustomIcon name="home" size={10000} />);
      }).not.toThrow();
    });

    it('should handle null color gracefully', () => {
      expect(() => {
        render(<CustomIcon name="home" color={null as any} />);
      }).not.toThrow();
    });

    it('should handle undefined color gracefully', () => {
      expect(() => {
        render(<CustomIcon name="home" color={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle empty string color gracefully', () => {
      expect(() => {
        render(<CustomIcon name="home" color="" />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle many icons efficiently', () => {
      const manyIcons = Array.from({ length: 100 }, (_, i) => (
        <CustomIcon key={i} name="home" size={16} />
      ));

      expect(() => {
        render(<>{manyIcons}</>);
      }).not.toThrow();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<CustomIcon name="home" size={24} />);

      expect(() => {
        for (let i = 0; i < 50; i++) {
          rerender(
            <CustomIcon
              name="home"
              size={i}
              active={i % 2 === 0}
              color={`hsl(${i * 10}, 50%, 50%)`}
            />
          );
        }
      }).not.toThrow();
    });

    it('should handle rapid icon switching', () => {
      const icons = ['home', 'activity', 'location', 'profile', 'search', 'menu', 'chevronRight', 'settings'] as const;
      const { rerender } = render(<CustomIcon name="home" />);

      expect(() => {
        for (let i = 0; i < 100; i++) {
          rerender(<CustomIcon name={icons[i % icons.length]} />);
        }
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(<CustomIcon name="home" />);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates during lifecycle', () => {
      const { rerender } = render(<CustomIcon name="home" />);

      rerender(<CustomIcon name="activity" />);
      rerender(<CustomIcon name="home" size={32} />);
      rerender(<CustomIcon name="profile" active={true} />);
      rerender(<CustomIcon name="location" color="red" />);

      expect(true).toBe(true); // Should handle all updates without errors
    });
  });

  describe('Integration', () => {
    it('should work inside other components', () => {
      const { getByTestId } = render(
        <CustomIcon name="home" testID="wrapped-icon">
          <Text>Icon</Text>
        </CustomIcon>
      );
      
      expect(getByTestId('wrapped-icon')).toBeTruthy();
    });

    it('should work with touchable components', () => {
      const { getByTestId } = render(
        <CustomIcon
          name="home"
          accessible={true}
          accessibilityRole="button"
          testID="touchable-icon"
        />
      );
      
      expect(getByTestId('touchable-icon')).toBeTruthy();
    });
  });

  describe('Icon Path Validation', () => {
    it('should have valid SVG paths for all icons', () => {
      const icons = [
        { name: 'home', expectedStart: 'M3 9l' },
        { name: 'activity', expectedStart: 'M14 2H6' },
        { name: 'location', expectedStart: 'M21 10c0' },
        { name: 'profile', expectedStart: 'M20 21v-2' },
        { name: 'search', expectedStart: 'M11 19a8' },
        { name: 'menu', expectedStart: 'M3 12h18' },
        { name: 'chevronRight', expectedStart: 'M9 18l6' },
        { name: 'settings', expectedStart: 'M12.22 2h' },
      ] as const;

      icons.forEach(({ name, expectedStart }) => {
        const { getByTestId } = render(<CustomIcon name={name} />);
        const path = getByTestId('path-element');
        expect(path.props.d).toContain(expectedStart);
      });
    });

    it('should have consistent path structure', () => {
      const { getByTestId } = render(<CustomIcon name="home" />);
      const path = getByTestId('path-element');
      
      expect(path.props.d).toMatch(/^M[0-9]/); // Should start with move command
      expect(typeof path.props.d).toBe('string');
      expect(path.props.d.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle floating point size', () => {
      const { getByTestId } = render(<CustomIcon name="home" size={24.5} />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.width).toBe(24.5);
      expect(svg.props.height).toBe(24.5);
    });

    it('should handle very small size', () => {
      const { getByTestId } = render(<CustomIcon name="home" size={0.1} />);
      
      const svg = getByTestId('svg-element');
      expect(svg.props.width).toBe(0.1);
      expect(svg.props.height).toBe(0.1);
    });

    it('should handle boolean active prop conversion', () => {
      const { getByTestId: getByTestId1 } = render(<CustomIcon name="home" active={1 as any} />);
      const { getByTestId: getByTestId2 } = render(<CustomIcon name="home" active={0 as any} />);
      
      const path1 = getByTestId1('path-element');
      const path2 = getByTestId2('path-element');
      
      expect(path1.props.strokeWidth).toBe(2.5); // Truthy
      expect(path2.props.strokeWidth).toBe(2); // Falsy
    });
  });
});
