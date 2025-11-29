import React from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { ds } from '../../constants/theme';

interface AccentLineProps {
  width?: number | string;
  height?: number;
}

export const AccentLine = ({ width = '100%', height = 6 }: AccentLineProps) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 4">
      <Defs>
        <LinearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={ds.colors.secondary} stopOpacity={0.4} />
          <Stop offset="50%" stopColor={ds.colors.primary} stopOpacity={1} />
          <Stop offset="100%" stopColor={ds.colors.secondary} stopOpacity={0.8} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={4} rx={2} fill="url(#accent)" opacity={0.85} />
    </Svg>
  );
};
