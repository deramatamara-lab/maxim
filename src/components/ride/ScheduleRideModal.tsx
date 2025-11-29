/**
 * ScheduleRideModal - Future ride booking
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
  pickup?: string;
  destination?: string;
}

const TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export function ScheduleRideModal({ visible, onClose, onSchedule, pickup, destination }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const haptics = useHaptics();

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const formatDate = (d: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] };
  };

  const handleSchedule = useCallback(() => {
    if (!selectedDate || !selectedTime) return;
    haptics.trigger('confirm');
    const [h, m] = selectedTime.split(':').map(Number);
    const scheduled = new Date(selectedDate);
    scheduled.setHours(h, m, 0, 0);
    onSchedule(scheduled);
    onClose();
  }, [selectedDate, selectedTime, onSchedule, onClose, haptics]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View entering={SlideInUp.springify()} style={styles.content}>
          <Pressable onPress={e => e.stopPropagation()}>
            <GlassCard style={styles.card} elevated>
              <View style={styles.header}>
                <Text style={styles.title}>Schedule Ride</Text>
                <Pressable onPress={onClose}><CustomIcon name="activity" size={24} color={ds.colors.text} /></Pressable>
              </View>

              {(pickup || destination) && (
                <View style={styles.route}>
                  {pickup && <Text style={styles.routeText} numberOfLines={1}>📍 {pickup}</Text>}
                  {destination && <Text style={styles.routeText} numberOfLines={1}>🎯 {destination}</Text>}
                </View>
              )}

              <Text style={styles.sectionTitle}>Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                {dates.map((d, i) => {
                  const { day, date, month } = formatDate(d);
                  const isSelected = selectedDate?.toDateString() === d.toDateString();
                  return (
                    <Pressable key={i} onPress={() => { haptics.trigger('tap'); setSelectedDate(d); }} style={[styles.dateCard, isSelected && styles.dateCardSelected]}>
                      <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>{day}</Text>
                      <Text style={[styles.dateNum, isSelected && styles.dateTextSelected]}>{date}</Text>
                      <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>{month}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.sectionTitle}>Select Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {TIMES.map(t => {
                  const isSelected = selectedTime === t;
                  return (
                    <Pressable key={t} onPress={() => { haptics.trigger('tap'); setSelectedTime(t); }} style={[styles.timeCard, isSelected && styles.timeCardSelected]}>
                      <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <PremiumButton 
                onPress={handleSchedule} 
                variant="primary" 
                size="lg" 
                style={styles.confirm}
                disabled={!selectedDate || !selectedTime}
              >
                Schedule for {selectedDate && selectedTime ? `${formatDate(selectedDate).day} ${selectedTime}` : '...'}
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
  content: { maxHeight: '85%' },
  card: { padding: ds.spacing.lg, borderTopLeftRadius: ds.radius.xl, borderTopRightRadius: ds.radius.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ds.spacing.md },
  title: { fontFamily: ds.typography.family, fontWeight: '700', fontSize: ds.typography.size.title, color: ds.colors.text },
  route: { backgroundColor: ds.colors.surface, borderRadius: ds.radius.md, padding: ds.spacing.sm, marginBottom: ds.spacing.md },
  routeText: { fontFamily: ds.typography.family, fontSize: ds.typography.size.caption, color: ds.colors.textSecondary, marginVertical: 2 },
  sectionTitle: { fontFamily: ds.typography.family, fontWeight: '600', fontSize: ds.typography.size.caption, color: ds.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: ds.spacing.md, marginBottom: ds.spacing.sm },
  dateScroll: { marginBottom: ds.spacing.sm },
  dateCard: { alignItems: 'center', padding: ds.spacing.sm, marginRight: ds.spacing.sm, borderRadius: ds.radius.md, backgroundColor: ds.colors.surface, minWidth: 60 },
  dateCardSelected: { backgroundColor: ds.colors.primary },
  dateDay: { fontFamily: ds.typography.family, fontSize: ds.typography.size.caption, color: ds.colors.textSecondary },
  dateNum: { fontFamily: ds.typography.family, fontWeight: '700', fontSize: ds.typography.size.title, color: ds.colors.text },
  dateMonth: { fontFamily: ds.typography.family, fontSize: ds.typography.size.caption, color: ds.colors.textSecondary },
  dateTextSelected: { color: ds.colors.backgroundDeep },
  timeScroll: { marginBottom: ds.spacing.md },
  timeCard: { paddingHorizontal: ds.spacing.md, paddingVertical: ds.spacing.sm, marginRight: ds.spacing.sm, borderRadius: ds.radius.md, backgroundColor: ds.colors.surface },
  timeCardSelected: { backgroundColor: ds.colors.primary },
  timeText: { fontFamily: ds.typography.family, fontSize: ds.typography.size.body, color: ds.colors.text },
  timeTextSelected: { color: ds.colors.backgroundDeep, fontWeight: '600' },
  confirm: { marginTop: ds.spacing.md },
});

export default ScheduleRideModal;
