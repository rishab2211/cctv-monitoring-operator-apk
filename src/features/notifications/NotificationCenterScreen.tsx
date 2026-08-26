import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { NotificationApi } from '../../api/endpoints/notification.api';
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  removeNotification,
  setNotifications,
} from '../../store/slices/notificationSlice';
import { NotificationItem } from '../../types/notification.types';
import { formatRelativeTime } from '../../utils/date';

interface NotificationCenterScreenProps {
  navigation: any;
}

export const NotificationCenterScreen: React.FC<NotificationCenterScreenProps> = ({
  navigation,
}) => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await NotificationApi.getNotifications({ page: 1, limit: 40 });
      dispatch(setNotifications(data.notifications));
    } catch (e) {
      console.warn('[Notifications] Error loading notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationApi.markAllAsRead();
      dispatch(markAllNotificationsAsRead());
    } catch (e) {
      console.warn('[Notifications] Mark all read failed:', e);
    }
  };

  const handleMarkRead = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await NotificationApi.markAsRead(item._id);
        dispatch(markNotificationAsRead(item._id));
      } catch (e) {}
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await NotificationApi.deleteNotification(id);
      dispatch(removeNotification(id));
    } catch (e) {}
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleMarkRead(item)}
      style={[styles.notifCard, !item.isRead ? styles.unreadCard : {}]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          {!item.isRead && <View style={styles.unreadDot} />}
          <Text style={[styles.title, !item.isRead ? { fontWeight: '900' } : {}]}>
            {item.title}
          </Text>
        </View>
        <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
      </View>

      <Text style={styles.body}>{item.body}</Text>

      <View style={styles.footerRow}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleDelete(item._id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Notification Center"
        subtitle={`${unreadCount} unread`}
        onBack={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity activeOpacity={0.8} onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>You are all caught up on system and camera alerts.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  markAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  notifCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  unreadCard: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  time: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  body: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  footerRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  deleteText: {
    fontSize: 11,
    color: Colors.critical,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
