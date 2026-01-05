import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import ProfilePicture from '../components/ProfilePicture';
import { wp, hp, fontSize, spacing, moderateScale } from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications } from '../../database/notifications';

const NOTIFICATION_TYPES = {
  POST_LIKE: 'post_like',
  POST_REPLY: 'post_reply',
  MENTION: 'mention',
  FRIEND_POST: 'friend_post',
  FOLLOW: 'follow',
};

const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.POST_LIKE:
      return { name: 'heart', color: '#FF3B30' };
    case NOTIFICATION_TYPES.POST_REPLY:
      return { name: 'chatbubble', color: '#007AFF' };
    case NOTIFICATION_TYPES.MENTION:
      return { name: 'at', color: '#5856D6' };
    case NOTIFICATION_TYPES.FRIEND_POST:
      return { name: 'document-text', color: '#34C759' };
    case NOTIFICATION_TYPES.FOLLOW:
      return { name: 'person-add', color: '#FF9500' };
    default:
      return { name: 'notifications', color: '#8E8E93' };
  }
};

const NotificationItem = ({ notification, onPress, onLongPress, onDelete, theme, isDarkMode, t }) => {
  const icon = getNotificationIcon(notification.type);
  const isUnread = !notification.isRead;
  
  const getNotificationMessage = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.POST_LIKE:
        return t('notifications.likedPost') || 'liked your post';
      case NOTIFICATION_TYPES.POST_REPLY:
        return t('notifications.repliedPost') || 'replied to your post';
      case NOTIFICATION_TYPES.MENTION:
        return t('notifications.mentionedYou') || 'mentioned you';
      case NOTIFICATION_TYPES.FRIEND_POST:
        return t('notifications.newPost') || 'shared a new post';
      case NOTIFICATION_TYPES.FOLLOW:
        return t('notifications.startedFollowing') || 'started following you';
      default:
        return notification.message || '';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins}${t('time.minutesShort') || 'm'}`;
    if (diffHours < 24) return `${diffHours}${t('time.hoursShort') || 'h'}`;
    if (diffDays < 7) return `${diffDays}${t('time.daysShort') || 'd'}`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: isUnread
            ? isDarkMode
              ? 'rgba(10, 132, 255, 0.1)'
              : 'rgba(0, 122, 255, 0.08)'
            : 'transparent',
        },
      ]}
      onPress={() => onPress(notification)}
      onLongPress={() => onLongPress && onLongPress(notification)}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.avatarContainer}>
          <ProfilePicture
            uri={notification.senderProfilePicture}
            name={notification.senderName}
            size={moderateScale(48)}
          />
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: icon.color },
            ]}
          >
            <Ionicons name={icon.name} size={12} color="#fff" />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.notificationText,
              { color: theme.text },
            ]}
            numberOfLines={2}
          >
            <Text style={styles.senderName}>{notification.senderName}</Text>
            {' '}
            {getNotificationMessage()}
          </Text>
          {notification.postPreview && (
            <Text
              style={[styles.previewText, { color: theme.subText }]}
              numberOfLines={1}
            >
              "{notification.postPreview}"
            </Text>
          )}
          <Text style={[styles.timeText, { color: theme.subText }]}>
            {formatTime(notification.$createdAt)}
          </Text>
        </View>

        {isUnread && (
          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
        )}
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete && onDelete(notification)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={theme.subText} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const Notifications = ({ navigation }) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadNotifications = useCallback(async (reset = false) => {
    if (!user?.$id) return;

    const currentPage = reset ? 0 : page;
    
    try {
      const fetchedNotifications = await getNotifications(user.$id, 20, currentPage * 20);
      
      if (reset) {
        setNotifications(fetchedNotifications || []);
        setPage(1);
      } else {
        setNotifications(prev => [...prev, ...(fetchedNotifications || [])]);
        setPage(prev => prev + 1);
      }
      
      setHasMore((fetchedNotifications?.length || 0) === 20);
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.$id, page]);

  useEffect(() => {
    loadNotifications(true);
  }, [user?.$id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadNotifications(false);
    }
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.$id);
        setNotifications(prev =>
          prev.map(n =>
            n.$id === notification.$id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        // Handle error silently
      }
    }

    // Navigate based on notification type
    if (notification.postId) {
      navigation.navigate('PostDetails', { postId: notification.postId });
    } else if (notification.senderId) {
      navigation.navigate('UserProfile', { userId: notification.senderId });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.$id) return;
    
    try {
      await markAllNotificationsAsRead(user.$id);
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      // Handle error silently
    }
  };

  const handleMarkSingleAsRead = async (notification) => {
    if (notification.isRead) return;
    
    try {
      await markNotificationAsRead(notification.$id);
      setNotifications(prev =>
        prev.map(n =>
          n.$id === notification.$id ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      // Handle error silently
    }
  };

  const handleDeleteNotification = async (notification) => {
    try {
      await deleteNotification(notification.$id);
      setNotifications(prev => prev.filter(n => n.$id !== notification.$id));
    } catch (error) {
      // Handle error silently
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      t('notifications.clearAll') || 'Clear All',
      t('notifications.clearAllConfirm') || 'Are you sure you want to clear all notifications?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.clear') || 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllNotifications(user.$id);
              setNotifications([]);
            } catch (error) {
              // Handle error silently
            }
          },
        },
      ]
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off-outline"
        size={moderateScale(64)}
        color={theme.subText}
      />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {t('notifications.noNotifications') || 'No notifications yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
        {t('notifications.noNotificationsDesc') || 'When you get notifications, they will appear here'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode
          ? ['#1a1a2e', '#16213e', '#0f3460']
          : ['#FFFEF7', '#FFF9E6', '#FFF4D6']
        }
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={moderateScale(24)} color={theme.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t('notifications.title') || 'Notifications'}
          </Text>
          
          {unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={[styles.markAllText, { color: theme.primary }]}>
                {t('notifications.markAllRead') || 'Mark all read'}
              </Text>
            </TouchableOpacity>
          ) : notifications.length > 0 ? (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleClearAll}
            >
              <Text style={[styles.markAllText, { color: '#FF3B30' }]}>
                {t('notifications.clearAll') || 'Clear all'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onPress={handleNotificationPress}
                onLongPress={handleMarkSingleAsRead}
                onDelete={handleDeleteNotification}
                theme={theme}
                isDarkMode={isDarkMode}
                t={t}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              notifications.length === 0 && styles.emptyList,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontWeight: '700',
  },
  markAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    fontSize: fontSize(13),
    fontWeight: '600',
  },
  placeholder: {
    width: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: fontSize(14),
    lineHeight: fontSize(20),
  },
  senderName: {
    fontWeight: '600',
  },
  previewText: {
    fontSize: fontSize(13),
    marginTop: 4,
    fontStyle: 'italic',
  },
  timeText: {
    fontSize: fontSize(12),
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.sm,
    marginTop: 6,
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize(14),
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: fontSize(20),
  },
});

export default Notifications;
