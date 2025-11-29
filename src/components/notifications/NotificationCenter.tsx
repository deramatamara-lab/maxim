/**
 * Notification Center Component
 * In-app notifications panel with categories and actions
 * Ultra-premium design with glassmorphism and animations
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
  Layout,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';

type IconName = 'home' | 'activity' | 'location' | 'profile' | 'search' | 'menu' | 'chevronRight' | 'settings';

export type NotificationType = 
  | 'ride_update'
  | 'payment'
  | 'promo'
  | 'safety'
  | 'system'
  | 'driver';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  imageUrl?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationCenterProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onNotificationPress: (notification: Notification) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onRefresh?: () => Promise<void>;
}

const NotificationIcon: Record<NotificationType, IconName> = {
  ride_update: 'activity',
  payment: 'home',
  promo: 'activity',
  safety: 'location',
  system: 'settings',
  driver: 'profile',
};

const NotificationColor: Record<NotificationType, string> = {
  ride_update: ds.colors.primary,
  payment: ds.colors.success,
  promo: ds.colors.secondary,
  safety: ds.colors.danger,
  system: ds.colors.textSecondary,
  driver: ds.colors.primary,
};

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const haptics = useHaptics();
  const iconColor = NotificationColor[notification.type];
  const iconName = NotificationIcon[notification.type];

  const handlePress = useCallback(() => {
    haptics.trigger('tap');
    onPress();
  }, [haptics, onPress]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      entering={SlideInRight.springify().damping(15)}
      exiting={SlideOutRight.duration(200)}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.notificationItem,
          !notification.read && styles.unreadItem,
          pressed && styles.pressedItem,
        ]}
        accessibilityLabel={`${notification.title}. ${notification.message}`}
        accessibilityRole="button"
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <CustomIcon name={iconName} size={20} color={iconColor} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.notificationTitle,
                !notification.read && styles.unreadTitle,
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text style={styles.timestamp}>{formatTime(notification.timestamp)}</Text>
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          
          {notification.actionLabel && (
            <Text style={styles.actionLabel}>{notification.actionLabel}</Text>
          )}
        </View>
        
        {!notification.read && <View style={styles.unreadDot} />}
      </Pressable>
    </Animated.View>
  );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible,
  notifications,
  onClose,
  onNotificationPress,
  onMarkAllRead,
  onClearAll,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const haptics = useHaptics();
  const sound = useSound();

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    haptics.trigger('tap');
    await onRefresh();
    setIsRefreshing(false);
    haptics.trigger('confirm');
  }, [onRefresh, haptics]);

  const handleMarkAllRead = useCallback(() => {
    haptics.trigger('confirm');
    sound.play('success');
    onMarkAllRead();
  }, [haptics, sound, onMarkAllRead]);

  const handleClearAll = useCallback(() => {
    haptics.trigger('tap');
    onClearAll();
  }, [haptics, onClearAll]);

  const handleClose = useCallback(() => {
    haptics.trigger('tap');
    onClose();
  }, [haptics, onClose]);

  const handleFilterChange = useCallback((newFilter: NotificationType | 'all') => {
    haptics.trigger('selection');
    setFilter(newFilter);
  }, [haptics]);

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notification={item}
        onPress={() => onNotificationPress(item)}
      />
    ),
    [onNotificationPress]
  );

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <CustomIcon name="activity" size={48} color={ds.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptyMessage}>
          You are all caught up! Check back later.
        </Text>
      </View>
    ),
    []
  );

  const filters: Array<{ label: string; value: NotificationType | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'Rides', value: 'ride_update' },
    { label: 'Payments', value: 'payment' },
    { label: 'Promos', value: 'promo' },
    { label: 'Safety', value: 'safety' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      
      <Pressable style={styles.backdrop} onPress={handleClose} />
      
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.container}
      >
        <GlassCard elevated style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <CustomIcon name="menu" size={20} color={ds.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Filters */}
          <View style={styles.filters}>
            {filters.map(f => (
              <Pressable
                key={f.value}
                onPress={() => handleFilterChange(f.value)}
                style={[
                  styles.filterButton,
                  filter === f.value && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f.value && styles.filterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Actions */}
          {notifications.length > 0 && (
            <View style={styles.actions}>
              {unreadCount > 0 && (
                <Pressable onPress={handleMarkAllRead} style={styles.actionButton}>
                  <Text style={styles.actionText}>Mark all read</Text>
                </Pressable>
              )}
              <Pressable onPress={handleClearAll} style={styles.actionButton}>
                <Text style={[styles.actionText, styles.clearText]}>Clear all</Text>
              </Pressable>
            </View>
          )}

          {/* Notification List */}
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotification}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={ListEmptyComponent}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={ds.colors.primary}
                />
              ) : undefined
            }
          />
        </GlassCard>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    maxHeight: '85%',
    borderTopLeftRadius: ds.radius.xl,
    borderTopRightRadius: ds.radius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.xl,
    paddingTop: ds.spacing.xl,
    paddingBottom: ds.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  title: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
  },
  badge: {
    backgroundColor: ds.colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.xs,
  },
  badgeText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.bold,
    color: '#FFFFFF',
  },
  closeButton: {
    padding: ds.spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: ds.spacing.xl,
    paddingBottom: ds.spacing.md,
    gap: ds.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.surface,
  },
  filterButtonActive: {
    backgroundColor: ds.colors.primary,
  },
  filterText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  filterTextActive: {
    color: ds.colors.backgroundDeep,
    fontWeight: ds.typography.weight.medium,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: ds.spacing.xl,
    paddingBottom: ds.spacing.md,
    gap: ds.spacing.lg,
  },
  actionButton: {
    padding: ds.spacing.xs,
  },
  actionText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.primary,
  },
  clearText: {
    color: ds.colors.danger,
  },
  listContent: {
    paddingHorizontal: ds.spacing.lg,
    paddingBottom: ds.spacing.xxxl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: ds.spacing.md,
    marginBottom: ds.spacing.sm,
    borderRadius: ds.radius.md,
    backgroundColor: 'transparent',
  },
  unreadItem: {
    backgroundColor: `${ds.colors.primary}10`,
  },
  pressedItem: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ds.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ds.spacing.xs,
  },
  notificationTitle: {
    flex: 1,
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
    marginRight: ds.spacing.sm,
  },
  unreadTitle: {
    fontWeight: ds.typography.weight.semibold,
  },
  timestamp: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
  },
  notificationMessage: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    lineHeight: 18,
  },
  actionLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.primary,
    marginTop: ds.spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.primary,
    marginLeft: ds.spacing.sm,
    marginTop: ds.spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing.xxxl,
  },
  emptyTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginTop: ds.spacing.lg,
  },
  emptyMessage: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.sm,
    textAlign: 'center',
  },
});

export default NotificationCenter;
