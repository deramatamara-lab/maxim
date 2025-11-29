/**
 * GlassView Component
 * Premium glassmorphism container with blur, noise texture, and inner glow
 * Adapted from web prototype to React Native with expo-blur
 */

import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { ds } from '@/constants/theme';

export interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'low' | 'medium' | 'high';
  border?: boolean;
  elevated?: boolean;
  interactive?: boolean;
  tint?: 'light' | 'dark' | 'default';
}

export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 'medium',
  border = true,
  elevated = false,
  interactive = false,
  tint = 'dark',
}) => {
  const _getBackgroundOpacity = () => {
    switch (intensity) {
      case 'low': return ds.effects.glass.low;
      case 'high': return ds.effects.glass.high;
      default: return ds.effects.glass.medium;
    }
  };

  // Get blur intensity for expo-blur with platform optimization
  const getBlurIntensity = () => {
    switch (intensity) {
      case 'low': return 20;
      case 'high': return 80;
      default: return ds.effects.blurIntensity;
    }
  };

  // Platform-specific blur configuration
  const getBlurTint = () => {
    // Android may need different tint for better blur effect
    if (Platform.OS === 'android') {
      return tint === 'dark' ? 'dark' : 'light';
    }
    return tint;
  };

  // Get shadow style
  const getShadowStyle = (): ViewStyle => {
    if (!elevated) return {};
    
    return {
      shadowColor: ds.shadow.modern.color || ds.colors.glowCyan,
      shadowOffset: {
        width: 0,
        height: ds.shadow.modern.offsetY,
      },
      shadowOpacity: ds.shadow.modern.opacity,
      shadowRadius: ds.shadow.modern.radius,
      elevation: 8, // Android elevation
    };
  };

  const containerStyle: ViewStyle = {
    borderRadius: ds.radius.xl,
    overflow: 'hidden',
    ...getShadowStyle(),
    ...style,
  };

  return (
    <View style={containerStyle}>
      {/* Blur View Background */}
      <BlurView
        intensity={getBlurIntensity()}
        tint={getBlurTint()}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Inner Glow Effect - positioned before noise for visibility */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: ds.shadow.inner.color,
            opacity: ds.shadow.inner.opacity,
            borderRadius: ds.radius.xl,
          },
        ]}
      />

      {/* Noise Texture Overlay */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            opacity: ds.effects.noiseOpacity,
          },
        ]}
      />
      {/* Additional noise layer for texture */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(0, 245, 255, 0.01)',
            opacity: ds.effects.noiseOpacity * 0.5,
          },
        ]}
      />

      {/* Border */}
      {border && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderWidth: 1,
            borderColor: ds.colors.glassBorder,
            borderRadius: ds.radius.xl,
            backgroundColor: 'transparent',
          }}
        />
      )}

      {/* Edge Highlights for elevated glass */}
      {elevated && (
        <>
          {/* Top-left corner highlight */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 8,
              height: 8,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderTopColor: 'rgba(255, 255, 255, 0.8)',
              borderLeftColor: 'rgba(255, 255, 255, 0.8)',
              borderTopLeftRadius: ds.radius.sm,
            }}
          />
          {/* Bottom-right corner highlight */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 8,
              height: 8,
              borderBottomWidth: 2,
              borderRightWidth: 2,
              borderBottomColor: 'rgba(255, 255, 255, 0.8)',
              borderRightColor: 'rgba(255, 255, 255, 0.8)',
              borderBottomRightRadius: ds.radius.sm,
            }}
          />
        </>
      )}

      {/* Content Container */}
      <View
        style={[
          styles.contentContainer,
          interactive && styles.interactive,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    position: 'relative',
    zIndex: 10,
  },
  interactive: {
    // Add subtle interaction styles if needed
  },
});

export default GlassView;
