/**
 * SearchingOverlay - Radar-style searching animation
 * Matches reference prototype's pulsing rings effect
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { ds } from '@/constants/theme';
import { CustomIcon } from '@/components/ui/CustomIcon';

interface SearchingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Message to display (e.g., "ЛОКАЛИЗИРАНЕ..." or "Searching...") */
  message?: string;
}

export const SearchingOverlay: React.FC<SearchingOverlayProps> = ({
  visible,
  message = 'Searching...',
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Pulsing Ring 1 */}
      <MotiView
        from={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{
          type: 'timing',
          duration: 2000,
          loop: true,
          easing: Easing.out(Easing.ease),
        }}
        style={styles.ring}
      />
      
      {/* Pulsing Ring 2 (delayed) */}
      <MotiView
        from={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{
          type: 'timing',
          duration: 2000,
          delay: 1000,
          loop: true,
          easing: Easing.out(Easing.ease),
        }}
        style={styles.ring}
      />
      
      {/* Center Loader */}
      <MotiView
        from={{ rotate: '0deg' }}
        animate={{ rotate: '360deg' }}
        transition={{
          type: 'timing',
          duration: 1500,
          loop: true,
          easing: Easing.linear,
        }}
        style={styles.loaderContainer}
      >
        <View style={styles.loader}>
          <CustomIcon name="location" size={36} color={ds.colors.primary} />
        </View>
      </MotiView>
      
      {/* Message */}
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 800,
          loop: true,
          repeatReverse: true,
        }}
        style={styles.messageContainer}
      >
        <Text style={styles.message}>{message.toUpperCase()}</Text>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: ds.colors.primary + '50',
  },
  loaderContainer: {
    position: 'absolute',
  },
  loader: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.backgroundDeep + 'E6',
    borderWidth: 1,
    borderColor: ds.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  messageContainer: {
    position: 'absolute',
    marginTop: 140,
  },
  message: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.primary,
    letterSpacing: 4,
  },
});

export default SearchingOverlay;
