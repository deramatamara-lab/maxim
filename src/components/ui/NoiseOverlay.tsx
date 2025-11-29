import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated from 'react-native-reanimated';

import { ds } from '../../constants/theme';

const PARTICLE_COUNT = 120;

interface Particle {
  cx: number;
  cy: number;
  radius: number;
  opacity: number;
}

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const generateParticles = (): Particle[] => {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    cx: Math.random() * 100,
    cy: Math.random() * 100,
    radius: 0.15 + Math.random() * 0.45,
    opacity: 0.02 + Math.random() * 0.03,
  }));
};

interface NoiseOverlayProps {
  opacity?: number;
}

export const NoiseOverlay = React.memo(({ opacity = 0.03 }: NoiseOverlayProps) => {
  const particles = useMemo(() => generateParticles(), []);

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {particles.map((particle, index) => (
          <Circle
            key={`particle-${index}`}
            cx={particle.cx}
            cy={particle.cy}
            r={particle.radius}
            fill={hexToRgba(ds.colors.text, particle.opacity)}
          />
        ))}
      </Svg>
    </Animated.View>
  );
});

NoiseOverlay.displayName = 'NoiseOverlay';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
});
