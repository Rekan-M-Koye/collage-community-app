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
import { useNotifications } from '../hooks/useRealtimeSubscription';

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

// Format time with better granularity
const formatNotificationTime = (dateString, t) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return t('time.justNow') || 'now';
  if (diffMins < 60) return `${diffMins}${t('time.minutesShort') || 'm'}`;
  if (diffHours < 24) return `${diffHours}${t('time.hoursShort') || 'h'}`;
  if (diffDays < 7) return `${diffDays}${t('time.daysShort') || 'd'}`;
  if (diffWeeks < 4) return `${diffWeeks}${t('time.weeksShort') || 'w'}`;
  return date.toLocaleDateString();
};

const NotificationItem = ({ notification, onPress, onLongPress, onDelete, theme, isDarkMode, t }) => {
  const icon = getNotificationIcon(notification.type);
  const isUnread = !notification.isRead;
  
  const getNotificationMessage = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.POST_LIKE:
        return t('notifications.liked') || 'liked';
      case NOTIFICATION_TYPES.POST_REPLY:
        return t('notifications.replied') || 'replied';
      case NOTIFICATION_TYPES.MENTION:
        return t('notifications.mentioned') || 'mentioned';
      case NOTIFICATION_TYPES.FRIEND_POST:
        return t('notifications.posted') || 'posted';
      case NOTIFICATION_TYPES.FOLLOW:
        return t('notifications.followed') || 'followed you';
      default:
        return '';
    }
  };

  return (
    <View
      style={[
        styles.notificationCard,
        { 
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        },
        isUnread && { borderLeftWidth: 3, borderLeftColor: theme.primary },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationItem}
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
              size={moderateScale(40)}
            />
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: icon.color },
              ]}
            >
              <Ionicons name={icon.name} size={10} color="#fff" />
            </View>
          </View>

          <View style={styles.textContainer}>
            <View style={styles.topRow}>
              <Text
                style={[
                  styles.notificationText,
                  { color: theme.text },
                ]}
                numberOfLines={1}
              >
                <Text style={[styles.senderName, { color: theme.text }]}>{notification.senderName}</Text>
                {' '}
                <Text style={{ color: theme.textSecondary }}>{getNotificationMessage()}</Text>
              </Text>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={10} color={theme.textSecondary} />
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {formatNotificationTime(notification.$createdAt, t)}
                </Text>
              </View>
            </View>
            {notification.postPreview && (
              <Text
                style={[styles.previewText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {notification.postPreview}
              </Text>
            )}
          </View>

          <View style={styles.rightSection}>
            {isUnread && (
              <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete && onDelete(notification)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Grouped notification item for multiple likes/replies on same post
const GroupedNotificationItem = ({ group, onPress, theme, isDarkMode, t }) => {
  const icon = getNotificationIcon(group.type);
  const count = group.notifications.length;
  // Get unique users (avoid showing same user twice)
  const uniqueUsers = [];
  const seenIds = new Set();
  for (const notif of group.notifications) {
    if (!seenIds.has(notif.senderId)) {
      seenIds.add(notif.senderId);
      uniqueUsers.push(notif);
    }
    if (uniqueUsers.length >= 3) break;
  }
  
  const getGroupMessage = () => {
    const uniqueCount = seenIds.size;
    const firstName = group.notifications[0]?.senderName?.split(' ')[0] || '';
    
    if (group.type === NOTIFICATION_TYPES.POST_LIKE) {
      if (uniqueCount === 1) {
        return { name: firstName, action: t('notifications.liked') || 'liked' };
      } else if (uniqueCount === 2) {
        const secondName = uniqueUsers[1]?.senderName?.split(' ')[0] || '';
        return { name: `${firstName}, ${secondName}`, action: t('notifications.liked') || 'liked' };
      } else {
        return { name: `${firstName} +${uniqueCount - 1}`, action: t('notifications.liked') || 'liked' };
      }
    } else if (group.type === NOTIFICATION_TYPES.POST_REPLY) {
      if (uniqueCount === 1) {
        return { name: firstName, action: t('notifications.replied') || 'replied' };
      } else if (uniqueCount === 2) {
        const secondName = uniqueUsers[1]?.senderName?.split(' ')[0] || '';
        return { name: `${firstName}, ${secondName}`, action: t('notifications.replied') || 'replied' };
      } else {
        return { name: `${firstName} +${uniqueCount - 1}`, action: t('notifications.replied') || 'replied' };
      }
    }
    return { name: '', action: '' };
  };

  const message = getGroupMessage();

  return (
    <View
      style={[
        styles.notificationCard,
        { 
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        },
        group.hasUnread && { borderLeftWidth: 3, borderLeftColor: theme.primary },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() => onPress(group)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.groupedAvatarContainer}>
            {uniqueUsers.slice(0, 3).map((notif, index) => (
              <View 
                key={notif.$id} 
                style={[
                  styles.stackedAvatar,
                  { left: index * 12, zIndex: 3 - index }
                ]}
              >
                <ProfilePicture
                  uri={notif.senderProfilePicture}
                  name={notif.senderName}
                  size={moderateScale(28)}
                />
              </View>
            ))}
            <View
              style={[
                styles.groupIconBadge,
                { backgroundColor: icon.color },
              ]}
            >
              <Ionicons name={icon.name} size={8} color="#fff" />
            </View>
          </View>

          <View style={styles.textContainer}>
            <View style={styles.topRow}>
              <Text
                style={[
                  styles.notificationText,
                  { color: theme.text },
                ]}
                numberOfLines={1}
              >
                <Text style={[styles.senderName, { color: theme.text }]}>{message.name}</Text>
                {' '}
                <Text style={{ color: theme.textSecondary }}>{message.action}</Text>
              </Text>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={10} color={theme.textSecondary} />
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {formatNotificationTime(group.latestTimestamp, t)}
                </Text>
              </View>
            </View>
            {group.postPreview && (
              <Text
                style={[styles.previewText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {group.postPreview}
              </Text>
            )}
          </View>

          {group.hasUnread && (
            <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
          )}
        </View>
      </TouchableOpacity>
    </View>
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
    if (!user?.$id) {
      setIsLoading(false);
      return;
    }

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
      // Handle error - set empty array on error
      if (reset) {
        setNotifications([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.$id, page]);

  // Handle real-time notification updates
  const handleNewNotification = useCallback((newNotification) => {
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.some(n => n.$id === newNotification.$id);
      if (exists) {
        // Update existing notification
        return prev.map(n => n.$id === newNotification.$id ? newNotification : n);
      }
      // Add new notification at the beginning
      return [newNotification, ...prev];
    });
  }, []);

  // Subscribe to real-time notification updates
  useNotifications(user?.$id, handleNewNotification, handleNewNotification, !!user?.$id);

  useEffect(() => {
    if (user?.$id) {
      setIsLoading(true);
      loadNotifications(true);
    }
  }, [user?.$id]);

  // Reload notifications when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user?.$id) {
        loadNotifications(true);
      }
    });
    return unsubscribe;
  }, [navigation, user?.$id]);

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
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: fontSize(17),
    fontWeight: '700',
  },
  markAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    fontSize: fontSize(12),
    fontWeight: '600',
  },
  placeholder: {
    width: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  emptyList: {
    flex: 1,
  },
  notificationCard: {
    marginVertical: spacing.xs / 2,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  notificationItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  groupedAvatarContainer: {
    position: 'relative',
    width: moderateScale(52),
    height: moderateScale(32),
    marginRight: spacing.sm,
  },
  stackedAvatar: {
    position: 'absolute',
    top: 0,
  },
  groupIconBadge: {
    position: 'absolute',
    bottom: -2,
    left: 32,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  notificationText: {
    fontSize: fontSize(13),
    lineHeight: fontSize(18),
    flex: 1,
  },
  senderName: {
    fontWeight: '600',
  },
  previewText: {
    fontSize: fontSize(12),
    marginTop: 2,
    opacity: 0.7,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeText: {
    fontSize: fontSize(10),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize(13),
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: fontSize(18),
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
    fontSize: fontSize(11),
    flex: 1,
  },
});

export default Notifications;
