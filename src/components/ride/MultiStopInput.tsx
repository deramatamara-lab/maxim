/**
 * MultiStopInput - Multiple destination stops for a ride
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';

export interface Stop {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  order: number;
}

interface Props {
  pickup: string;
  onStopsChange: (stops: Stop[]) => void;
  maxStops?: number;
}

export function MultiStopInput({ pickup, onStopsChange, maxStops = 4 }: Props) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const haptics = useHaptics();

  const addStop = useCallback(() => {
    if (!newAddress.trim() || stops.length >= maxStops) return;
    haptics.trigger('tap');
    const newStop: Stop = { id: Date.now().toString(), address: newAddress.trim(), order: stops.length + 1 };
    const updated = [...stops, newStop];
    setStops(updated);
    onStopsChange(updated);
    setNewAddress('');
  }, [newAddress, stops, maxStops, onStopsChange, haptics]);

  const removeStop = useCallback((id: string) => {
    haptics.trigger('tap');
    const filtered = stops.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }));
    setStops(filtered);
    onStopsChange(filtered);
  }, [stops, onStopsChange, haptics]);

  const moveStop = useCallback((id: string, direction: 'up' | 'down') => {
    haptics.trigger('tap');
    const idx = stops.findIndex(s => s.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === stops.length - 1)) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...stops];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
    setStops(reordered);
    onStopsChange(reordered);
  }, [stops, onStopsChange, haptics]);

  return (
    <GlassCard style={styles.container}>
      {/* Pickup */}
      <View style={styles.stopRow}>
        <View style={[styles.marker, styles.pickupMarker]} />
        <Text style={styles.pickupText} numberOfLines={1}>{pickup || 'Current location'}</Text>
      </View>

      {/* Intermediate Stops */}
      {stops.map((stop, idx) => (
        <Animated.View key={stop.id} entering={FadeIn} exiting={FadeOut} layout={Layout.springify()} style={styles.stopRow}>
          <View style={styles.connector} />
          <View style={[styles.marker, styles.stopMarker]}><Text style={styles.stopNum}>{idx + 1}</Text></View>
          <Text style={styles.stopText} numberOfLines={1}>{stop.address}</Text>
          <View style={styles.actions}>
            {idx > 0 && <Pressable onPress={() => moveStop(stop.id, 'up')}><View style={{ transform: [{ rotate: '-90deg' }] }}><CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} /></View></Pressable>}
            {idx < stops.length - 1 && <Pressable onPress={() => moveStop(stop.id, 'down')}><View style={{ transform: [{ rotate: '90deg' }] }}><CustomIcon name="chevronRight" size={16} color={ds.colors.textSecondary} /></View></Pressable>}
            <Pressable onPress={() => removeStop(stop.id)}><CustomIcon name="activity" size={16} color={ds.colors.danger} /></Pressable>
          </View>
        </Animated.View>
      ))}

      {/* Add Stop Input */}
      {stops.length < maxStops && (
        <View style={styles.addRow}>
          <View style={styles.connector} />
          <View style={[styles.marker, styles.addMarker]}><CustomIcon name="location" size={12} color={ds.colors.textSecondary} /></View>
          <TextInput
            style={styles.input}
            value={newAddress}
            onChangeText={setNewAddress}
            placeholder={`Add stop ${stops.length + 1}`}
            placeholderTextColor={ds.colors.textSecondary}
            onSubmitEditing={addStop}
            returnKeyType="done"
          />
          {newAddress.trim() && (
            <Pressable onPress={addStop} style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Final Destination Hint */}
      <View style={styles.destRow}>
        <View style={styles.connector} />
        <View style={[styles.marker, styles.destMarker]} />
        <Text style={styles.destText}>Final destination</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { padding: ds.spacing.md },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: ds.spacing.sm, gap: ds.spacing.sm },
  connector: { position: 'absolute', left: 11, top: -8, width: 2, height: 24, backgroundColor: ds.colors.glassBorder },
  marker: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pickupMarker: { backgroundColor: ds.colors.primary },
  stopMarker: { backgroundColor: ds.colors.surface, borderWidth: 2, borderColor: ds.colors.primary },
  stopNum: { fontFamily: ds.typography.family, fontSize: 10, fontWeight: '700', color: ds.colors.primary },
  addMarker: { backgroundColor: ds.colors.surface, borderWidth: 1, borderColor: ds.colors.glassBorder, borderStyle: 'dashed' },
  destMarker: { backgroundColor: ds.colors.success },
  pickupText: { flex: 1, fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.text },
  stopText: { flex: 1, fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.text },
  destText: { flex: 1, fontFamily: ds.typography.family, fontSize: ds.typography.size.caption, color: ds.colors.textSecondary, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: ds.spacing.xs },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: ds.spacing.sm, gap: ds.spacing.sm },
  destRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: ds.spacing.sm, gap: ds.spacing.sm, opacity: 0.5 },
  input: { flex: 1, fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.text, backgroundColor: ds.colors.surface, borderRadius: ds.radius.sm, paddingHorizontal: ds.spacing.sm, paddingVertical: ds.spacing.xs },
  addBtn: { backgroundColor: ds.colors.primary, paddingHorizontal: ds.spacing.sm, paddingVertical: ds.spacing.xs, borderRadius: ds.radius.sm },
  addBtnText: { fontFamily: ds.typography.family, fontSize: ds.typography.size.caption, fontWeight: '600', color: ds.colors.backgroundDeep },
});

export default MultiStopInput;
