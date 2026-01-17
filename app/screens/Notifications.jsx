import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Group notifications by post and type
const groupNotifications = (notifications) => {
  const groups = {};
  const standalone = [];
  
  notifications.forEach(notification => {
    // Only group post-related notifications (likes, replies, mentions)
    if (notification.postId && 
        (notification.type === NOTIFICATION_TYPES.POST_LIKE || 
         notification.type === NOTIFICATION_TYPES.POST_REPLY)) {
      const key = `${notification.postId}_${notification.type}`;
      if (!groups[key]) {
        groups[key] = {
          type: notification.type,
          postId: notification.postId,
          postPreview: notification.postPreview,
          notifications: [],
          latestTimestamp: notification.$createdAt,
          hasUnread: false,
        };
      }
      groups[key].notifications.push(notification);
      if (!notification.isRead) {
        groups[key].hasUnread = true;
      }
      // Keep the latest timestamp
      if (new Date(notification.$createdAt) > new Date(groups[key].latestTimestamp)) {
        groups[key].latestTimestamp = notification.$createdAt;
      }
    } else {
      // Keep as standalone (follows, mentions, friend posts)
      standalone.push({ isGroup: false, notification });
    }
  });
  
  // Convert groups to array
  const groupedItems = Object.values(groups).map(group => ({
    isGroup: true,
    ...group,
    id: `group_${group.postId}_${group.type}`,
  }));
  
  // Merge and sort by timestamp
  const allItems = [...groupedItems, ...standalone].sort((a, b) => {
    const timeA = a.isGroup ? new Date(a.latestTimestamp) : new Date(a.notification.$createdAt);
    const timeB = b.isGroup ? new Date(b.latestTimestamp) : new Date(b.notification.$createdAt);
    return timeB - timeA;
  });
  
  return allItems;
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

// Grouped notification item for multiple likes/replies on same post
const GroupedNotificationItem = ({ group, onPress, theme, isDarkMode, t }) => {
  const icon = getNotificationIcon(group.type);
  const count = group.notifications.length;
  const recentUsers = group.notifications.slice(0, 3);
  
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
  
  const getGroupMessage = () => {
    const othersCount = count - 1;
    const firstName = group.notifications[0]?.senderName || '';
    
    if (group.type === NOTIFICATION_TYPES.POST_LIKE) {
      if (count === 1) {
        return `${firstName} ${t('notifications.likedPost') || 'liked your post'}`;
      } else if (count === 2) {
        const secondName = group.notifications[1]?.senderName || '';
        return `${firstName} ${t('common.and') || 'and'} ${secondName} ${t('notifications.likedPost') || 'liked your post'}`;
      } else {
        return `${firstName} ${t('common.and') || 'and'} ${othersCount} ${t('notifications.others') || 'others'} ${t('notifications.likedPost') || 'liked your post'}`;
      }
    } else if (group.type === NOTIFICATION_TYPES.POST_REPLY) {
      if (count === 1) {
        return `${firstName} ${t('notifications.repliedPost') || 'replied to your post'}`;
      } else if (count === 2) {
        const secondName = group.notifications[1]?.senderName || '';
        return `${firstName} ${t('common.and') || 'and'} ${secondName} ${t('notifications.repliedPost') || 'replied to your post'}`;
      } else {
        return `${firstName} ${t('common.and') || 'and'} ${othersCount} ${t('notifications.others') || 'others'} ${t('notifications.repliedPost') || 'replied to your post'}`;
      }
    }
    return '';
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: group.hasUnread
            ? isDarkMode
              ? 'rgba(10, 132, 255, 0.1)'
              : 'rgba(0, 122, 255, 0.08)'
            : 'transparent',
        },
      ]}
      onPress={() => onPress(group)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.groupedAvatarContainer}>
          {recentUsers.slice(0, 3).map((notif, index) => (
            <View 
              key={notif.$id} 
              style={[
                styles.stackedAvatar,
                { left: index * 15, zIndex: 3 - index }
              ]}
            >
              <ProfilePicture
                uri={notif.senderProfilePicture}
                name={notif.senderName}
                size={moderateScale(32)}
              />
            </View>
          ))}
          <View
            style={[
              styles.groupIconBadge,
              { backgroundColor: icon.color },
            ]}
          >
            <Ionicons name={icon.name} size={10} color="#fff" />
          </View>
          {count > 3 && (
            <View style={[styles.moreCount, { backgroundColor: theme.primary }]}>
              <Text style={styles.moreCountText}>+{count - 3}</Text>
            </View>
          )}
        </View>

        <View style={[styles.textContainer, { marginLeft: count > 1 ? spacing.lg : 0 }]}>
          <Text
            style={[
              styles.notificationText,
              { color: theme.text },
            ]}
            numberOfLines={2}
          >
            {getGroupMessage()}
          </Text>
          {group.postPreview && (
            <Text
              style={[styles.previewText, { color: theme.subText }]}
              numberOfLines={1}
            >
              "{group.postPreview}"
            </Text>
          )}
          <Text style={[styles.timeText, { color: theme.subText }]}>
            {formatTime(group.latestTimestamp)}
          </Text>
        </View>

        {group.hasUnread && (
          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
        )}
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

  // Group notifications by post and type
  const groupedNotifications = useMemo(() => {
    return groupNotifications(notifications);
  }, [notifications]);

  // Handle grouped notification press
  const handleGroupPress = async (group) => {
    // Mark all notifications in group as read
    const unreadInGroup = group.notifications.filter(n => !n.isRead);
    if (unreadInGroup.length > 0) {
      try {
        await Promise.all(
          unreadInGroup.map(n => markNotificationAsRead(n.$id))
        );
        setNotifications(prev =>
          prev.map(n =>
            group.notifications.some(gn => gn.$id === n.$id)
              ? { ...n, isRead: true }
              : n
          )
        );
      } catch (error) {
        // Handle error silently
      }
    }

    // Navigate to post
    if (group.postId) {
      navigation.navigate('PostDetails', { postId: group.postId });
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255, 149, 0, 0.1)' }]}>
        <Ionicons
          name="notifications-outline"
          size={moderateScale(48)}
          color={theme.warning}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {t('notifications.noNotifications') || 'No notifications yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
        {t('notifications.noNotificationsDesc') || 'When you get notifications, they will appear here'}
      </Text>
      <View style={[styles.emptyHintContainer, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <Ionicons name="bulb-outline" size={moderateScale(16)} color={theme.textSecondary} />
        <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
          {t('notifications.hintText') || 'Follow users and interact with posts to receive updates'}
        </Text>
      </View>
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
            data={groupedNotifications}
            keyExtractor={(item) => item.isGroup ? item.id : item.notification.$id}
            renderItem={({ item }) => {
              if (item.isGroup) {
                return (
                  <GroupedNotificationItem
                    group={item}
                    onPress={handleGroupPress}
                    theme={theme}
                    isDarkMode={isDarkMode}
                    t={t}
                  />
                );
              }
              return (
                <NotificationItem
                  notification={item.notification}
                  onPress={handleNotificationPress}
                  onLongPress={handleMarkSingleAsRead}
                  onDelete={handleDeleteNotification}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  t={t}
                />
              );
            }}
            contentContainerStyle={[
              styles.listContent,
              groupedNotifications.length === 0 && styles.emptyList,
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
  groupedAvatarContainer: {
    position: 'relative',
    width: moderateScale(64),
    height: moderateScale(48),
    marginRight: spacing.md,
  },
  stackedAvatar: {
    position: 'absolute',
    top: 0,
  },
  groupIconBadge: {
    position: 'absolute',
    bottom: -2,
    left: 45,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  moreCount: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
  emptyIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize(14),
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: fontSize(20),
  },
  emptyHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: spacing.xs,
  },
  emptyHint: {
    fontSize: fontSize(12),
    flex: 1,
  },
});

export default Notifications;
