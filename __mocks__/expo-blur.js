import React from 'react';

// Mock expo-blur BlurView
export const BlurView = ({ children, style, ...props }) => 
  React.createElement('div', { 'data-testid': 'blur-view', style, ...props }, children);
