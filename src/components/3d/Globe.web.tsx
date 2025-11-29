/**
 * Web Globe Stub
 * 3D globe is disabled on web for now to avoid heavy three.js/drei/zustand/tunnel-rat bundle issues.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ds } from '@/constants/theme';

export type GlobeHandle = {
  zoomToLocation: (coords: { lat: number; lon: number }) => void;
};

export function Globe() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Cinematic Globe (web stub)</Text>
        <Text style={styles.subtitle}>3D globe is currently disabled on web.</Text>
        <Text style={styles.subtitle}>Use native builds for full 3D experience.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    paddingVertical: ds.spacing.xl,
    paddingHorizontal: ds.spacing.xxl,
    borderRadius: ds.radius.xl,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  title: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
    marginBottom: ds.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
});
