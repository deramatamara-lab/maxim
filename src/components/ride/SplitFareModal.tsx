/**
 * SplitFareModal - Split payment between multiple riders
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, FlatList, Pressable } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';

export interface SplitParticipant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  share: number;
  status: 'pending' | 'accepted' | 'declined';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  totalFare: number;
  onConfirm: (participants: SplitParticipant[]) => void;
}

export function SplitFareModal({ visible, onClose, totalFare, onConfirm }: Props) {
  const [participants, setParticipants] = useState<SplitParticipant[]>([
    { id: '1', name: 'You', share: 100, status: 'accepted' },
  ]);
  const [newContact, setNewContact] = useState('');
  const haptics = useHaptics();

  const addParticipant = useCallback(() => {
    if (!newContact.trim()) return;
    haptics.trigger('tap');
    const newP: SplitParticipant = {
      id: Date.now().toString(),
      name: newContact,
      share: 0,
      status: 'pending',
    };
    setParticipants(prev => {
      const updated = [...prev, newP];
      const share = Math.floor(100 / updated.length);
      return updated.map((p, i) => ({ ...p, share: i === updated.length - 1 ? 100 - share * (updated.length - 1) : share }));
    });
    setNewContact('');
  }, [newContact, haptics]);

  const removeParticipant = useCallback((id: string) => {
    haptics.trigger('tap');
    setParticipants(prev => {
      const filtered = prev.filter(p => p.id !== id);
      const share = Math.floor(100 / filtered.length);
      return filtered.map((p, i) => ({ ...p, share: i === filtered.length - 1 ? 100 - share * (filtered.length - 1) : share }));
    });
  }, [haptics]);

  const handleConfirm = useCallback(() => {
    haptics.trigger('confirm');
    onConfirm(participants);
    onClose();
  }, [participants, onConfirm, onClose, haptics]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View entering={SlideInUp.springify()} style={styles.content}>
          <Pressable onPress={e => e.stopPropagation()}>
            <GlassCard style={styles.card} elevated>
              <View style={styles.header}>
                <Text style={styles.title}>Split Fare</Text>
                <Pressable onPress={onClose}><CustomIcon name="activity" size={24} color={ds.colors.text} /></Pressable>
              </View>

              <Text style={styles.total}>Total: ${totalFare.toFixed(2)}</Text>

              <FlatList
                data={participants}
                keyExtractor={p => p.id}
                renderItem={({ item }) => (
                  <View style={styles.participant}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.share}>${((totalFare * item.share) / 100).toFixed(2)} ({item.share}%)</Text>
                    </View>
                    {item.id !== '1' && (
                      <Pressable onPress={() => removeParticipant(item.id)}>
                        <CustomIcon name="activity" size={20} color={ds.colors.danger} />
                      </Pressable>
                    )}
                  </View>
                )}
                style={styles.list}
              />

              <View style={styles.addRow}>
                <TextInput
                  style={styles.input}
                  value={newContact}
                  onChangeText={setNewContact}
                  placeholder="Add phone or email"
                  placeholderTextColor={ds.colors.textSecondary}
                />
                <PremiumButton onPress={addParticipant} variant="secondary" size="sm">Add</PremiumButton>
              </View>

              <PremiumButton onPress={handleConfirm} variant="primary" size="lg" style={styles.confirm}>
                Send Split Requests
              </PremiumButton>
            </GlassCard>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  content: { maxHeight: '80%' },
  card: { padding: ds.spacing.lg, borderTopLeftRadius: ds.radius.xl, borderTopRightRadius: ds.radius.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ds.spacing.md },
  title: { fontFamily: ds.typography.family, fontWeight: '700', fontSize: ds.typography.size.title, color: ds.colors.text },
  total: { fontFamily: ds.typography.family, fontWeight: '600', fontSize: ds.typography.size.bodyLg, color: ds.colors.primary, textAlign: 'center', marginBottom: ds.spacing.md },
  list: { maxHeight: 200 },
  participant: { flexDirection: 'row', alignItems: 'center', paddingVertical: ds.spacing.sm, borderBottomWidth: 1, borderBottomColor: ds.colors.glassBorder },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: ds.colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: ds.typography.family, fontWeight: '700', fontSize: ds.typography.size.body, color: ds.colors.backgroundDeep },
  info: { flex: 1, marginLeft: ds.spacing.sm },
  name: { fontFamily: ds.typography.family, fontWeight: '600', fontSize: ds.typography.size.body, color: ds.colors.text },
  share: { fontFamily: ds.typography.family, fontSize: ds.typography.size.caption, color: ds.colors.textSecondary },
  addRow: { flexDirection: 'row', gap: ds.spacing.sm, marginTop: ds.spacing.md },
  input: { flex: 1, backgroundColor: ds.colors.surface, borderRadius: ds.radius.md, paddingHorizontal: ds.spacing.md, paddingVertical: ds.spacing.sm, fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.text },
  confirm: { marginTop: ds.spacing.lg },
});

export default SplitFareModal;
