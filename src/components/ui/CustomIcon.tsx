import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { ds } from '@/constants/theme';

export type IconName = 'home' | 'activity' | 'location' | 'profile' | 'search' | 'menu' | 'chevronRight' | 'settings' | 'eye' | 'eye-off' | 'lock' | 'phone' | 'check' | 'alert' | 'user';

export interface CustomIconProps {
  name: IconName;
  size?: number;
  color?: string;
  active?: boolean;
}

export const CustomIcon: React.FC<CustomIconProps> = ({
  name,
  size = 24,
  color = ds.colors.textSecondary,
  active = false,
}) => {
  const activeColor = ds.colors.primary;
  const finalColor = active ? activeColor : color;
  const strokeWidth = active ? 2.5 : 2;

  const iconPaths = {
    // Home (House shape)
    home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    // Activity (Chart/Document)
    activity: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    // Location (Map Pin)
    location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a3 3 0 100-6 3 3 0 000 6',
    // Profile (User)
    profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8',
    // User (same as profile but different name for auth screens)
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8',
    // Search
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
    // Menu
    menu: 'M3 12h18M3 6h18M3 18h18',
    // Chevron Right
    chevronRight: 'M9 18l6-6-6-6',
    // Settings
    settings: 'M12.22 2h-.44a2 2 0 01-2 2.22l-.61.16a2 2 0 00-1.26.91l-.29.5a2 2 0 00.46 2.58l.44.38a1 1 0 010 1.42l-.44.38a2 2 0 00-.46 2.58l.29.5a2 2 0 001.26.91l.61.16a2 2 0 012 2.22h.44a2 2 0 012-2.22l.61-.16a2 2 0 001.26-.91l.29-.5a2 2 0 00-.46-2.58l-.44-.38a1 1 0 010-1.42l.44-.38a2 2 0 00.46-2.58l-.29-.5a2 2 0 00-1.26-.91l-.61-.16a2 2 0 01-2-2.22zM12 15a3 3 0 100-6 3 3 0 000 6z',
    // Eye (show password)
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
    // Eye Off (hide password)
    'eye-off': 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 8 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22',
    // Lock (password)
    lock: 'M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zM9 7c0-1.66 1.34-3 3-3s3 1.34 3 3v3H9V7z',
    // Phone
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    // Check (checkbox)
    check: 'M20 6L9 17l-5-5',
    // Alert (error/warning)
    alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        filter: active ? `drop-shadow(0 0 8px ${ds.colors.primary})` : 'none',
      }}
    >
      <Path
        d={iconPaths[name]}
        stroke={finalColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
