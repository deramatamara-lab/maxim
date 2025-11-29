import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { ds } from '../../constants/theme';

export type IconName = 'home' | 'activity' | 'location' | 'profile' | 'search' | 'menu' | 'chevronRight' | 'settings' | 'star' | 'starOutline' | 'check' | 'globe' | 'close' | 'warning' | 'eye';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  active?: boolean;
  style?: ViewStyle;
}

const iconPaths: Record<IconName, string> = {
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  activity: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  menu: 'M3 12h18M3 6h18M3 18h18',
  chevronRight: 'M9 18l6-6-6-6',
  settings: 'M12.22 2h-.44a2 2 0 0 1-2 2.22l-.61.16a2 2 0 0 0-1.26.91l-.29.5a2 2 0 0 0 .46 2.58l.44.38a1 1 0 0 1 0 1.42l-.44.38a2 2 0 0 0-.46 2.58l.29.5a2 2 0 0 0 1.26.91l.61.16a2 2 0 0 1 2 2.22h.44a2 2 0 0 1 2-2.22l.61-.16a2 2 0 0 0 1.26-.91l.29-.5a2 2 0 0 0-.46-2.58l-.44-.38a1 1 0 0 1 0-1.42l.44-.38a2 2 0 0 0 .46-2.58l-.29-.5a2 2 0 0 0-1.26-.91l-.61-.16a2 2 0 0 1-2-2.22zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  starOutline: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  check: 'M20 6L9 17l-5-5',
  globe: 'M21 12a9 9 0 01-9 9 9 9 0 01-9-9 9 9 0 019-9 9 9 0 019 9zM12 3v6m0 6v6m9-9h-6m-6 0H3',
  close: 'M18 6L6 18M6 6l12 12',
  warning: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
};

export const Icon = ({ name, size = 24, color = ds.colors.textMuted, active = false, style }: IconProps) => {
  const finalColor = active ? ds.colors.primary : color;
  const strokeWidth = active ? 2.5 : 2;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={finalColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d={iconPaths[name]} />
    </Svg>
  );
};