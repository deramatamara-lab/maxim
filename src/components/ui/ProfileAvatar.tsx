import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/theme';

interface ProfileAvatarProps {
  size?: number;
  initials?: string;
  children?: ReactNode;
}

export const ProfileAvatar = ({ size = 44, initials = 'TS', children }: ProfileAvatarProps) => {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {children || (
        <View style={styles.initialsContainer}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: ds.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ds.colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  initialsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.background,
    fontSize: ds.typography.size.body,
  },
});