import React from 'react';

// Mock React Native components for testing
export const View = ({ children, testID, style, ...props }) => 
  React.createElement('div', { 'data-testid': testID, style, ...props }, children);

export const Text = ({ children, testID, style, ...props }) => 
  React.createElement('span', { 'data-testid': testID, style, ...props }, children);

export const Pressable = ({ children, testID, style, onPress, ...props }) => 
  React.createElement('button', { 'data-testid': testID, style, onClick: onPress, ...props }, children);

export const TextInput = ({ testID, style, ...props }) => 
  React.createElement('input', { 'data-testid': testID, style, ...props });

export const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => style,
  hairlineWidth: 1,
};

export const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
};

export const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
};

export const PixelRatio = {
  get: () => 2,
};
