/**
 * ShellBackdrop
 * Purpose: Provides the premium shell hero background (vignette + starfield)
 * using the Aura design system tokens. Ensures deterministic layout across
 * platforms without relying on web-specific APIs.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ds } from '../../constants/theme';

interface StarPoint {
  cx: number;
  cy: number;
  radius: number;
  opacity: number;
}

const STAR_COUNT = 96;

const seededNoise = (seed: number, index: number) => {
  const m = 0x80000000;
  const a = 1103515245;
  const c = 12345;
  let state = (seed + index) % m;
  state = (a * state + c) % m;
  return state / m;
};

interface ShellBackdropProps {
  width: number;
  height: number;
}

export const ShellBackdrop: React.FC<ShellBackdropProps> = ({ width, height }) => {
  const stars = useMemo<StarPoint[]>(() => {
    return Array.from({ length: STAR_COUNT }, (_, index) => {
      const normalizedIndex = index + 1;
      const cx = 15 + seededNoise(42, index) * 70;
      const cy = 10 + seededNoise(84, index) * 70;
      const radius = 0.18 + (normalizedIndex % 5) * 0.05;
      const opacity = 0.015 + (normalizedIndex % 7) * 0.008;
      return { cx, cy, radius, opacity };
    });
  }, []);

  return (
    <View pointerEvents="none" style={[styles.container, { width, height }]}> 
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="shellGlow" cx="50%" cy="38%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor={ds.colors.glowCyan} stopOpacity={0.4} />
            <Stop offset="55%" stopColor={ds.colors.background} stopOpacity={0.92} />
            <Stop offset="100%" stopColor={ds.colors.backgroundDeep} stopOpacity={1} />
          </RadialGradient>
          <RadialGradient id="shellVignette" cx="50%" cy="65%" rx="80%" ry="70%">
            <Stop offset="0%" stopColor={ds.colors.backgroundDeep} stopOpacity={0} />
            <Stop offset="85%" stopColor={ds.colors.backgroundDeep} stopOpacity={0.72} />
            <Stop offset="100%" stopColor={ds.colors.backgroundDeep} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#shellGlow)" />
        {stars.map((star, idx) => (
          <Circle
            key={`star-${idx}`}
            cx={star.cx}
            cy={star.cy}
            r={star.radius}
            fill={ds.colors.textPrimary}
            opacity={star.opacity}
          />
        ))}
        <Rect x={0} y={0} width={100} height={100} fill="url(#shellVignette)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
