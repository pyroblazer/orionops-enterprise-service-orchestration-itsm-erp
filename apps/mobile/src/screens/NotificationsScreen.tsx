import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../theme/ThemeProvider';
import { apiClient } from '../services/api';
import { EmptyState } from '../components/EmptyState';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  groupedDate?: string;
}

interface NotificationGroup {
  label: string;
  notifications: Notification[];
}

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { colors, isHighContrast } = useTheme();
  const queryClient = useQueryClient();

  const {
    data: notificationsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.getNotifications({ limit: 100 }),
    staleTime: 1000 * 30,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications: Notification[] = notificationsData?.items || [];

  // Group notifications by date
  const groupedNotifications: NotificationGroup[] = (() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const thisWeek = new Date(today.getTime() - 7 * 86400000);

    const groups: Record<string, Notification[]> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Older: [],
    };

    notifications.forEach((n) => {
      const date = new Date(n.createdAt);
      if (date >= today) {
        groups['Today'].push(n);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(n);
      } else if (date >= thisWeek) {
        groups['This Week'].push(n);
      } else {
        groups['Older'].push(n);
      }
    });

    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label, notifications: items }));
  })();

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markReadMutation.mutate(notification.id);
      }
      // Deep link to related ticket
      const ticketId = notification.data?.ticketId as string | undefined;
      if (ticketId) {
        navigation.navigate('TicketDetail', { ticketId });
      }
    },
    [markReadMutation, navigation]
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'incident_escalation':
        return '🚨';
      case 'approval_request':
        return '✅';
      case 'sla_breach':
      case 'sla_warning':
        return '⏰';
      case 'ticket_assigned':
        return '📌';
      case 'ticket_updated':
        return '🔄';
      case 'comment_added':
        return '💬';
      default:
        return '🔔';
    }
  };

  const renderGroupHeader = useCallback(
    (label: string) => (
      <View style={styles.groupHeader}>
        <Text
          style={[styles.groupTitle, { color: colors.text }]}
          accessibilityRole="header"
        >
          {label}
        </Text>
      </View>
    ),
    [colors.text]
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor: item.read ? colors.surface : colors.card,
            borderColor: isHighContrast ? colors.borderStrong : colors.border,
            borderWidth: isHighContrast ? 2 : 1,
            borderLeftWidth: item.read ? (isHighContrast ? 2 : 1) : 4,
            borderLeftColor: item.read
              ? isHighContrast ? colors.borderStrong : colors.border
              : colors.primary,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
        accessibilityLabel={`${item.read ? 'Read' : 'Unread'} notification: ${item.title}. ${item.body}`}
        accessibilityRole="button"
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationIcon}>
              {getNotificationIcon(item.type)}
            </Text>
            <Text
              style={[
                styles.notificationTitle,
                {
                  color: colors.text,
                  fontWeight: item.read ? '400' : '700',
                },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <Text
            style={[styles.notificationBody, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.body}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [colors, isHighContrast, handleNotificationPress]
  );

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Flatten grouped notifications for FlatList with section headers
  const flatListData = groupedNotifications.flatMap((group) => [
    { type: 'header' as const, label: group.label },
    ...group.notifications.map((n) => ({ type: 'notification' as const, notification: n })),
  ]);

  const keyExtractor = (item: any, index: number) => {
    if (item.type === 'header') return `header-${item.label}`;
    return item.notification.id;
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel="Loading notifications"
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Failed to load notifications"
          subtitle="Pull down to refresh or try again later"
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Mark All Read Button */}
      {notifications.some((n) => !n.read) && (
        <View style={styles.toolbar}>
          <TouchableOpacity
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            accessibilityLabel="Mark all notifications as read"
            accessibilityRole="button"
            style={[styles.markAllButton, { borderColor: colors.primary, borderWidth: 1 }]}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Mark All as Read
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          subtitle="You're all caught up! New alerts will appear here."
          actionLabel="Refresh"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={flatListData}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return renderGroupHeader(item.label);
            }
            return renderItem({ item: item.notification });
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              accessibilityLabel="Pull to refresh notifications"
            />
          }
          accessibilityLabel="Notifications list"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  markAllButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  groupHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notificationCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationIcon: {
    fontSize: 16,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
});
