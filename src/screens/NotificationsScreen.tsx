import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Icon } from '../components/Icon';
import { AppNotification, NotificationType } from '../types/api';
import { NotificationService } from '../services/PetHealthService';

interface NotificationsScreenProps {
  onBack: () => void;
  onNotificationSelect?: (notification: AppNotification) => void;
  onUnreadCountChange?: (unreadCount: number) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  onNotificationSelect,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await NotificationService.listNotifications();
      // Sort newest first
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(sorted);
      const unreadCount = sorted.filter((n) => !n.is_read).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadCount);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to sync notifications with medical cloud.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (item: AppNotification) => {
    if (!item.is_read) {
      // Optimistic update
      const updatedList = notifications.map((n) =>
        n.id === item.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      );
      setNotifications(updatedList);
      const newUnread = updatedList.filter((n) => !n.is_read).length;
      if (onUnreadCountChange) onUnreadCountChange(newUnread);

      try {
        await NotificationService.markAsRead(item.id);
      } catch (err) {
        // Silently rollback on error if necessary
      }
    }

    if (onNotificationSelect) {
      onNotificationSelect(item);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    // Optimistic update
    const updatedList = notifications.map((n) => ({
      ...n,
      is_read: true,
      read_at: new Date().toISOString(),
    }));
    setNotifications(updatedList);
    if (onUnreadCountChange) onUnreadCountChange(0);

    try {
      await NotificationService.markAllAsRead();
    } catch (err: any) {
      setError('Failed to mark all notifications as read.');
      // Re-fetch to synchronize truth
      fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIconInfo = (type: NotificationType) => {
    switch (type) {
      case 'activity_anomaly':
        return { name: 'flame' as const, color: Colors.secondary, bg: Colors.secondaryLight };
      case 'rest_change':
        return { name: 'moon' as const, color: Colors.accentBlue, bg: '#EFF6FF' };
      case 'vaccine_reminder':
        return { name: 'syringe' as const, color: Colors.primary, bg: Colors.primaryLight };
      case 'intake_alert':
        return { name: 'file-text' as const, color: '#7E22CE', bg: '#F3E8FF' };
      case 'battery_low':
        return { name: 'battery' as const, color: Colors.warning, bg: '#FEF3C7' };
      case 'vitals_alert':
        return { name: 'alert' as const, color: Colors.danger, bg: Colors.dangerLight };
      default:
        return { name: 'bell' as const, color: Colors.textSecondary, bg: '#F3F4F6' };
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const iconInfo = getNotificationIconInfo(item.notification_type);
    return (
      <TouchableOpacity
        style={[styles.itemCard, !item.is_read && styles.itemCardUnread]}
        onPress={() => handleMarkAsRead(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconInfo.bg }]}>
          <Icon name={iconInfo.name} size={18} color={iconInfo.color} />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeaderRow}>
            <Text style={[styles.itemTitle, !item.is_read && styles.itemTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.itemTime}>{formatTimestamp(item.created_at)}</Text>
          </View>

          <Text style={styles.itemMessage} numberOfLines={2}>
            {item.message}
          </Text>

          <View style={styles.itemMetaRow}>
            {item.pet_name ? (
              <View style={styles.petBadge}>
                <Text style={styles.petBadgeText}>{item.pet_name}</Text>
              </View>
            ) : null}
            <Text style={styles.typeBadgeText}>
              {item.notification_type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon name="bell" size={34} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>You're all caught up!</Text>
      <Text style={styles.emptySubtitle}>
        No unread pet health alerts or vaccine reminders right now.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Clinical Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Icon name="chevron-left" size={18} color={Colors.text} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerCountPill}>
              <Text style={styles.headerCountText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={markingAll}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAllText}>
              {markingAll ? 'Updating...' : 'Mark all read'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchNotifications()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification List / Loading Skeleton */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Syncing patient alerts...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyListContent : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 2,
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  headerCountPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingLeft: 8,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  separator: {
    height: 8,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  itemCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.primaryMuted,
    elevation: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm + 2,
  },
  itemContent: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 6,
  },
  itemTitleUnread: {
    fontWeight: '800',
    color: Colors.text,
  },
  itemTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  itemMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petBadge: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EFE3D3',
    marginRight: 8,
  },
  petBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 6,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
});
