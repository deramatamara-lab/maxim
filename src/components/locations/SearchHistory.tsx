/**
 * SearchHistory - Recent destinations with quick select
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import Animated, { SlideInRight, Layout } from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';

export interface SearchHistoryItem {
  id: string;
  address: string;
  city?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  frequency: number;
}

interface Props {
  onSelect: (item: SearchHistoryItem) => void;
  onClear?: () => void;
  maxItems?: number;
}

const mockHistory: SearchHistoryItem[] = [
  { id: '1', address: '123 Main Street', city: 'San Francisco', latitude: 37.7749, longitude: -122.4194, timestamp: new Date().toISOString(), frequency: 5 },
  { id: '2', address: 'SFO Airport', city: 'San Francisco', latitude: 37.6213, longitude: -122.379, timestamp: new Date().toISOString(), frequency: 3 },
  { id: '3', address: '456 Market St', city: 'San Francisco', latitude: 37.7891, longitude: -122.4009, timestamp: new Date().toISOString(), frequency: 1 },
];

export function SearchHistory({ onSelect, onClear, maxItems = 10 }: Props) {
  const [history, setHistory] = useState(mockHistory.slice(0, maxItems));
  const haptics = useHaptics();

  const handleSelect = useCallback((item: SearchHistoryItem) => {
    haptics.trigger('tap');
    onSelect(item);
  }, [onSelect, haptics]);

  const handleClear = useCallback(() => {
    Alert.alert('Clear History', 'Clear all recent searches?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { setHistory([]); onClear?.(); } },
    ]);
  }, [onClear]);

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <CustomIcon name="search" size={48} color={ds.colors.textSecondary} />
        <Text style={styles.emptyText}>No recent searches</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent</Text>
        {onClear && <Pressable onPress={handleClear}><Text style={styles.clear}>Clear</Text></Pressable>}
      </View>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={SlideInRight.delay(index * 50)} layout={Layout.springify()}>
            <Pressable onPress={() => handleSelect(item)}>
              <GlassCard style={styles.item} interactive>
                <CustomIcon name="location" size={18} color={ds.colors.textSecondary} />
                <View style={styles.itemText}>
                  <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
                  <Text style={styles.city}>{item.city}</Text>
                </View>
                <CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} />
              </GlassCard>
            </Pressable>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: ds.spacing.md },
  title: { fontFamily: ds.typography.family, fontWeight: '700', fontSize: ds.typography.size.title, color: ds.colors.text },
  clear: { fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.primary },
  item: { flexDirection: 'row', alignItems: 'center', padding: ds.spacing.sm, marginBottom: ds.spacing.xs, gap: ds.spacing.sm },
  itemText: { flex: 1 },
  address: { fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.text },
  city: { fontFamily: ds.typography.family, fontSize: ds.typography.size.caption, color: ds.colors.textSecondary },
  empty: { alignItems: 'center', justifyContent: 'center', padding: ds.spacing.xl },
  emptyText: { fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.textSecondary, marginTop: ds.spacing.md },
});

export default SearchHistory;
