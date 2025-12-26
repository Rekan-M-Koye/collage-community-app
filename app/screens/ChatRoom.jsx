import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import AnimatedBackground from '../components/AnimatedBackground';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import { 
  getMessages, 
  sendMessage, 
  canUserSendMessage, 
  deleteMessage, 
  pinMessage, 
  unpinMessage, 
  getPinnedMessages,
  canUserPinMessage,
  canUserMentionEveryone,
  markChatAsRead,
} from '../../database/chats';
import { getUserById, blockUser } from '../../database/users';
import { 
  muteChat, 
  unmuteChat, 
  getMuteStatus, 
  bookmarkMessage, 
  unbookmarkMessage, 
  getBookmarkedMessages,
  MUTE_TYPES,
  MUTE_DURATIONS,
} from '../../database/userChatSettings';
import { 
  wp, 
  hp, 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';
import { useChatMessages } from '../hooks/useRealtimeSubscription';

const SMART_POLL_INTERVAL = 10000; // Reduced polling, mostly rely on realtime

const ChatRoom = ({ route, navigation }) => {
  const { chat } = route.params;
  const { t, theme, isDarkMode } = useAppSettings();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canSend, setCanSend] = useState(false);
  const [userCache, setUserCache] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [muteStatus, setMuteStatus] = useState({ isMuted: false });
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [bookmarkedMsgIds, setBookmarkedMsgIds] = useState([]);
  const [canPin, setCanPin] = useState(false);
  const [canMentionEveryone, setCanMentionEveryone] = useState(false);
  const flatListRef = useRef(null);
  const pollingInterval = useRef(null);
  const appState = useRef(AppState.currentState);
  const lastMessageId = useRef(null);
  const userCacheRef = useRef({});
  const [showChatOptionsModal, setShowChatOptionsModal] = useState(false);
  const isRealtimeActive = useRef(false);

  // Smart realtime subscription for new messages
  const handleRealtimeNewMessage = useCallback(async (payload) => {
    isRealtimeActive.current = true;
    
    // Add new message to the list if it's for this chat
    if (payload.chatId === chat.$id) {
      setMessages(prev => {
        // Check if message already exists
        if (prev.some(m => m.$id === payload.$id)) {
          return prev;
        }
        return [...prev, payload];
      });
      
      // Cache sender info if not cached
      if (payload.senderId && !userCacheRef.current[payload.senderId]) {
        try {
          const userData = await getUserById(payload.senderId);
          userCacheRef.current[payload.senderId] = userData;
          setUserCache({ ...userCacheRef.current });
        } catch (e) {
          userCacheRef.current[payload.senderId] = { name: payload.senderName || 'Unknown' };
        }
      }
      
      // Scroll to bottom for new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chat.$id]);

  const handleRealtimeMessageDeleted = useCallback((payload) => {
    isRealtimeActive.current = true;
    setMessages(prev => prev.filter(m => m.$id !== payload.$id));
  }, []);

  // Use realtime subscription
  useChatMessages(
    chat.$id,
    handleRealtimeNewMessage,
    handleRealtimeMessageDeleted,
    !!chat.$id && !!user?.$id
  );

  const POLLING_INTERVAL = SMART_POLL_INTERVAL;

  const getChatDisplayName = () => {
    if (chat.type === 'private' && chat.otherUser) {
      return chat.otherUser.name || chat.otherUser.fullName || chat.name;
    }
    return chat.name;
  };

  const handleChatHeaderPress = () => {
    if (chat.type === 'custom_group') {
      navigation.navigate('GroupSettings', { chat });
    } else if (chat.type === 'private') {
      setShowChatOptionsModal(true);
    } else {
      // For stage/department groups, show basic info modal
      setShowChatOptionsModal(true);
    }
  };

  const handleVisitProfile = () => {
    setShowChatOptionsModal(false);
    if (chat.type === 'private' && chat.otherUser) {
      navigation.navigate('UserProfile', { userId: chat.otherUser.$id || chat.otherUser.id });
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity onPress={handleChatHeaderPress} activeOpacity={0.7}>
          <Text style={{ 
            color: theme.text, 
            fontSize: fontSize(17), 
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {getChatDisplayName()}
          </Text>
          {chat.type === 'private' && (
            <Text style={{ 
              color: theme.textSecondary, 
              fontSize: fontSize(11), 
              textAlign: 'center',
            }}>
              {t('chats.tapForOptions')}
            </Text>
          )}
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f4ff',
      },
      headerTintColor: theme.text,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {/* Mute button */}
          <TouchableOpacity
            style={{ padding: spacing.xs }}
            onPress={() => setShowMuteModal(true)}>
            <Ionicons 
              name={muteStatus.isMuted ? 'notifications-off' : 'notifications-outline'} 
              size={moderateScale(22)} 
              color={muteStatus.isMuted ? '#F59E0B' : theme.text} 
            />
          </TouchableOpacity>
          
          {/* Pinned messages button */}
          <TouchableOpacity
            style={{ padding: spacing.xs }}
            onPress={handleViewPinnedMessages}>
            <Ionicons name="pin-outline" size={moderateScale(22)} color={theme.text} />
          </TouchableOpacity>
          
          {/* Settings button for groups */}
          {chat.type === 'custom_group' && (
            <TouchableOpacity
              style={{ marginRight: spacing.md }}
              onPress={() => navigation.navigate('GroupSettings', { chat })}>
              <Ionicons name="settings-outline" size={moderateScale(22)} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [chat, isDarkMode, theme, muteStatus]);

  // Load mute status, pinned messages, and bookmarks
  useEffect(() => {
    loadChatSettings();
  }, [chat.$id, user.$id]);

  const loadChatSettings = async () => {
    try {
      const [status, pinPermission, mentionPermission, bookmarks] = await Promise.all([
        getMuteStatus(user.$id, chat.$id),
        canUserPinMessage(chat.$id, user.$id),
        canUserMentionEveryone(chat.$id, user.$id),
        getBookmarkedMessages(user.$id, chat.$id),
      ]);
      setMuteStatus(status);
      setCanPin(pinPermission);
      setCanMentionEveryone(mentionPermission);
      setBookmarkedMsgIds(bookmarks);
    } catch (error) {
      // Silently fail
    }
  };

  const handleViewPinnedMessages = async () => {
    try {
      const pinned = await getPinnedMessages(chat.$id);
      setPinnedMessages(pinned);
      setShowPinnedModal(true);
    } catch (error) {
      Alert.alert(t('common.error'), t('chats.pinError'));
    }
  };

  const handleMuteChat = async (duration, muteType = MUTE_TYPES.ALL) => {
    try {
      await muteChat(user.$id, chat.$id, muteType, duration);
      setMuteStatus({ isMuted: true, muteType, expiresAt: duration ? new Date(Date.now() + duration).toISOString() : null });
      setShowMuteModal(false);
      Alert.alert(t('common.success'), t('chats.chatMuted'));
    } catch (error) {
      Alert.alert(t('common.error'), t('chats.muteError'));
    }
  };

  const handleUnmuteChat = async () => {
    try {
      await unmuteChat(user.$id, chat.$id);
      setMuteStatus({ isMuted: false, muteType: MUTE_TYPES.NONE, expiresAt: null });
      setShowMuteModal(false);
      Alert.alert(t('common.success'), t('chats.chatUnmuted'));
    } catch (error) {
      Alert.alert(t('common.error'), t('chats.unmuteError'));
    }
  };

  const handlePinMessage = async (message) => {
    try {
      await pinMessage(chat.$id, message.$id, user.$id);
      // Update local state
      setMessages(prev => prev.map(m => 
        m.$id === message.$id ? { ...m, isPinned: true, pinnedBy: user.$id } : m
      ));
      Alert.alert(t('common.success'), t('chats.messagePinned'));
    } catch (error) {
      Alert.alert(t('common.error'), t('chats.pinError'));
    }
  };

  const handleUnpinMessage = async (message) => {
    try {
      await unpinMessage(chat.$id, message.$id);
      // Update local state
      setMessages(prev => prev.map(m => 
        m.$id === message.$id ? { ...m, isPinned: false, pinnedBy: null } : m
      ));
      Alert.alert(t('common.success'), t('chats.messageUnpinned'));
    } catch (error) {
      Alert.alert(t('common.error'), t('chats.unpinError'));
    }
  };

  const handleBookmarkMessage = async (message) => {
    try {
      await bookmarkMessage(user.$id, chat.$id, message.$id);
      setBookmarkedMsgIds(prev => [...prev, message.$id]);
      Alert.alert(t('common.success'), t('chats.messageBookmarked'));
    } catch (error) {
      Alert.alert(t('common.error'), t('chats.bookmarkError'));
    }
  };

  const handleUnbookmarkMessage = async (message) => {
    try {
      await unbookmarkMessage(user.$id, chat.$id, message.$id);
      setBookmarkedMsgIds(prev => prev.filter(id => id !== message.$id));
      Alert.alert(t('common.success'), t('chats.messageUnbookmarked'));
    } catch (error) {
      Alert.alert(t('common.error'), t('chats.unbookmarkError'));
    }
  };

  // Polling-based message fetching (fallback for Appwrite Realtime issues)
  const pollMessages = useCallback(async () => {
    try {
      const fetchedMessages = await getMessages(chat.$id, 100);
      const reversedMessages = fetchedMessages.reverse();
      
      // Only update if there are new messages
      const newLastId = reversedMessages.length > 0 ? reversedMessages[reversedMessages.length - 1].$id : null;
      if (newLastId !== lastMessageId.current) {
        lastMessageId.current = newLastId;
        setMessages(reversedMessages);
        
        // Cache new user data using ref to avoid re-render loop
        const uniqueSenderIds = [...new Set(reversedMessages.map(m => m.senderId))];
        const newUsers = uniqueSenderIds.filter(id => !userCacheRef.current[id]);
        
        if (newUsers.length > 0) {
          const newUserCache = { ...userCacheRef.current };
          for (const senderId of newUsers) {
            try {
              const userData = await getUserById(senderId);
              newUserCache[senderId] = userData;
            } catch (error) {
              newUserCache[senderId] = { name: 'Unknown User' };
            }
          }
          userCacheRef.current = newUserCache;
          setUserCache(newUserCache);
        }
      }
    } catch (error) {
      // Silent fail for polling
    }
  }, [chat.$id]);

  useEffect(() => {
    loadMessages();
    checkPermissions();
    
    // Start polling for new messages
    pollingInterval.current = setInterval(pollMessages, POLLING_INTERVAL);
    
    // Handle app state changes to pause/resume polling
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        pollMessages();
        if (!pollingInterval.current) {
          pollingInterval.current = setInterval(pollMessages, POLLING_INTERVAL);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      }
      appState.current = nextAppState;
    });
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      subscription.remove();
    };
  }, [chat.$id, pollMessages]);

  const checkPermissions = async () => {
    try {
      const hasPermission = await canUserSendMessage(chat.$id, user.$id);
      setCanSend(hasPermission);
    } catch (error) {
      setCanSend(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const fetchedMessages = await getMessages(chat.$id, 100);
      const reversedMessages = fetchedMessages.reverse();
      lastMessageId.current = reversedMessages.length > 0 ? reversedMessages[reversedMessages.length - 1].$id : null;
      setMessages(reversedMessages);
      
      // Mark messages as read when entering the chat
      if (user?.$id) {
        markChatAsRead(chat.$id, user.$id);
      }
      
      const uniqueSenderIds = [...new Set(reversedMessages.map(m => m.senderId))];
      const newUserCache = { ...userCacheRef.current };
      
      for (const senderId of uniqueSenderIds) {
        if (!newUserCache[senderId]) {
          try {
            const userData = await getUserById(senderId);
            newUserCache[senderId] = userData;
          } catch (error) {
            newUserCache[senderId] = { name: 'Unknown User' };
          }
        }
      }
      
      userCacheRef.current = newUserCache;
      setUserCache(newUserCache);
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('chats.errorLoadingMessages'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async (message) => {
    if (message.content) {
      await Clipboard.setStringAsync(message.content);
      Alert.alert(t('common.success'), t('chats.messageCopied'));
    }
  };

  const handleDeleteMessage = async (message) => {
    Alert.alert(
      t('chats.deleteMessage'),
      t('chats.deleteMessageConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(message.$id);
              setMessages(prev => prev.filter(m => m.$id !== message.$id));
            } catch (error) {
              Alert.alert(t('common.error'), t('chats.deleteMessageError'));
            }
          },
        },
      ]
    );
  };

  const handleReplyMessage = (message) => {
    const senderName = userCache[message.senderId]?.name || message.senderName || 'Unknown';
    setReplyingTo({ ...message, senderName });
  };

  const handleForwardMessage = (message) => {
    navigation.navigate('ForwardMessage', { message });
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleSendMessage = async (content, imageUrl = null) => {
    if (!canSend) {
      Alert.alert(t('chats.noPermission'), t('chats.representativeOnlyMessage'));
      return;
    }

    try {
      setSending(true);
      const messageData = {
        content: content || '',
        senderId: user.$id,
        senderName: user.fullName,
        senderPhoto: user.profilePicture || null,
      };
      
      // Handle image URL from MessageInput (single URL string)
      if (imageUrl && typeof imageUrl === 'string') {
        messageData.images = [imageUrl];
      }
      
      // Handle reply - truncate content to prevent long quotes
      if (replyingTo) {
        messageData.replyToId = replyingTo.$id;
        messageData.replyToContent = replyingTo.content?.substring(0, 50) || '';
        messageData.replyToSender = replyingTo.senderName || '';
      }
      
      await sendMessage(chat.$id, messageData);
      setReplyingTo(null);
      
      // Immediately poll for new messages
      pollMessages();
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('chats.errorSendingMessage'));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.senderId === user.$id;
    const senderData = userCache[item.senderId];
    const senderName = senderData?.name || item.senderName || 'Unknown';
    const senderPhoto = senderData?.profilePicture || item.senderPhoto;
    
    // Show sender name only for first message in a group from same sender
    const showSenderName = !isCurrentUser && (
      index === 0 || 
      messages[index - 1].senderId !== item.senderId
    );
    
    // Show avatar only for first message in a group from same sender
    const showAvatar = !isCurrentUser && (
      index === messages.length - 1 ||
      messages[index + 1]?.senderId !== item.senderId
    );

    const isBookmarked = bookmarkedMsgIds.includes(item.$id);

    const handleAvatarPress = (senderId) => {
      if (senderId) {
        navigation.navigate('UserProfile', { userId: senderId });
      }
    };

    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        senderName={showSenderName ? senderName : null}
        senderPhoto={senderPhoto}
        showAvatar={showAvatar}
        onCopy={() => handleCopyMessage(item)}
        onDelete={isCurrentUser ? () => handleDeleteMessage(item) : null}
        onReply={() => handleReplyMessage(item)}
        onForward={() => handleForwardMessage(item)}
        onPin={canPin ? () => handlePinMessage(item) : null}
        onUnpin={canPin && item.isPinned ? () => handleUnpinMessage(item) : null}
        onBookmark={() => handleBookmarkMessage(item)}
        onUnbookmark={isBookmarked ? () => handleUnbookmarkMessage(item) : null}
        isBookmarked={isBookmarked}
        onAvatarPress={handleAvatarPress}
      />
    );
  };

  const renderEmpty = () => {
    const cardBackground = isDarkMode 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(255, 255, 255, 0.6)';
    
    return (
      <View style={styles.emptyContainer}>
        <View 
          style={[
            styles.emptyCard,
            { 
              backgroundColor: cardBackground,
              borderRadius: borderRadius.xl,
              borderWidth: isDarkMode ? 0 : 1,
              borderColor: 'rgba(0, 0, 0, 0.04)',
            }
          ]}>
          <Ionicons 
            name="chatbubbles-outline" 
            size={moderateScale(60)} 
            color={theme.textSecondary} 
          />
          <Text style={[
            styles.emptyText, 
            { fontSize: fontSize(16), color: theme.textSecondary, marginTop: spacing.md }
          ]}>
            {t('chats.noMessages')}
          </Text>
          <Text style={[
            styles.emptySubtext, 
            { fontSize: fontSize(13), color: theme.textSecondary, marginTop: spacing.xs }
          ]}>
            {t('chats.beFirstToMessage')}
          </Text>
        </View>
      </View>
    );
  };

  // Memoize messages list for performance - must be before any conditional returns
  const memoizedMessages = useMemo(() => messages, [messages]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f4ff' }]}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      
      <LinearGradient
        colors={isDarkMode 
          ? ['#1a1a2e', '#16213e', '#0f3460'] 
          : ['#f0f4ff', '#d8e7ff', '#c0deff']
        }
        style={styles.gradient}>
        
        <AnimatedBackground particleCount={15} />
        
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 95 : 85}>
          
          {chat.requiresRepresentative && !canSend && (
            <View style={[
              styles.warningBanner,
              { backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.15)' }
            ]}>
              <Ionicons name="information-circle" size={moderateScale(18)} color="#F59E0B" />
              <Text style={[styles.warningText, { fontSize: fontSize(12), color: '#F59E0B' }]}>
                {t('chats.representativeOnlyChat')}
              </Text>
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={memoizedMessages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.$id || `message-${index}`}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={renderEmpty}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={20}
          />

          <MessageInput 
            onSend={handleSendMessage}
            disabled={sending || !canSend}
            placeholder={
              canSend 
                ? t('chats.typeMessage')
                : t('chats.cannotSendMessage')
            }
            replyingTo={replyingTo}
            onCancelReply={cancelReply}
            showMentionButton={chat.type === 'group'}
            canMentionEveryone={canMentionEveryone}
          />
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Mute Options Modal */}
      <Modal
        visible={showMuteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMuteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#2a2a40' : '#FFFFFF' }
          ]}>
            <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize(18) }]}>
              {t('chats.muteOptions')}
            </Text>
            
            {muteStatus.isMuted ? (
              <TouchableOpacity
                style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                onPress={handleUnmuteChat}>
                <Ionicons name="notifications-outline" size={moderateScale(22)} color="#10B981" />
                <Text style={[styles.muteOptionText, { color: '#10B981', fontSize: fontSize(15) }]}>
                  {t('chats.unmute')}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  onPress={() => handleMuteChat(MUTE_DURATIONS.ONE_HOUR)}>
                  <Ionicons name="time-outline" size={moderateScale(22)} color={theme.primary} />
                  <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                    {t('chats.muteFor1Hour')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  onPress={() => handleMuteChat(MUTE_DURATIONS.EIGHT_HOURS)}>
                  <Ionicons name="time-outline" size={moderateScale(22)} color={theme.primary} />
                  <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                    {t('chats.muteFor8Hours')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  onPress={() => handleMuteChat(MUTE_DURATIONS.ONE_DAY)}>
                  <Ionicons name="today-outline" size={moderateScale(22)} color={theme.primary} />
                  <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                    {t('chats.muteFor1Day')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  onPress={() => handleMuteChat(MUTE_DURATIONS.ONE_WEEK)}>
                  <Ionicons name="calendar-outline" size={moderateScale(22)} color={theme.primary} />
                  <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                    {t('chats.muteFor1Week')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  onPress={() => handleMuteChat(MUTE_DURATIONS.FOREVER)}>
                  <Ionicons name="notifications-off-outline" size={moderateScale(22)} color="#F59E0B" />
                  <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                    {t('chats.muteForever')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  onPress={() => handleMuteChat(MUTE_DURATIONS.FOREVER, MUTE_TYPES.MENTIONS_ONLY)}>
                  <Ionicons name="at-outline" size={moderateScale(22)} color={theme.primary} />
                  <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                    {t('chats.muteMentionsOnly')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMuteModal(false)}>
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary, fontSize: fontSize(15) }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pinned Messages Modal */}
      <Modal
        visible={showPinnedModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPinnedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[
            styles.pinnedModalContent,
            { backgroundColor: isDarkMode ? '#2a2a40' : '#FFFFFF' }
          ]}>
            <View style={styles.pinnedModalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize(18) }]}>
                {t('chats.pinnedMessages')}
              </Text>
              <TouchableOpacity onPress={() => setShowPinnedModal(false)}>
                <Ionicons name="close" size={moderateScale(24)} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.pinnedList}>
              {pinnedMessages.length === 0 ? (
                <View style={styles.emptyPinned}>
                  <Ionicons name="pin-outline" size={moderateScale(40)} color={theme.textSecondary} />
                  <Text style={[styles.emptyPinnedText, { color: theme.textSecondary, fontSize: fontSize(14) }]}>
                    {t('chats.noPinnedMessages')}
                  </Text>
                </View>
              ) : (
                pinnedMessages.map((msg) => (
                  <View 
                    key={msg.$id} 
                    style={[
                      styles.pinnedMessageItem,
                      { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    ]}>
                    <View style={styles.pinnedMessageContent}>
                      <Text style={[styles.pinnedSenderName, { color: theme.primary, fontSize: fontSize(12) }]}>
                        {msg.senderName}
                      </Text>
                      <Text style={[styles.pinnedMessageText, { color: theme.text, fontSize: fontSize(14) }]} numberOfLines={2}>
                        {msg.content || t('chats.image')}
                      </Text>
                    </View>
                    {canPin && (
                      <TouchableOpacity
                        onPress={() => {
                          handleUnpinMessage(msg);
                          setShowPinnedModal(false);
                        }}>
                        <Ionicons name="close-circle" size={moderateScale(20)} color={theme.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chat Options Modal for Direct Messages and Groups */}
      <Modal
        visible={showChatOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChatOptionsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#2a2a40' : '#FFFFFF' }
          ]}>
            <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize(18) }]}>
              {getChatDisplayName()}
            </Text>
            
            {/* Visit Profile - only for private chats */}
            {chat.type === 'private' && chat.otherUser && (
              <TouchableOpacity
                style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                onPress={handleVisitProfile}>
                <Ionicons name="person-outline" size={moderateScale(22)} color={theme.primary} />
                <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                  {t('chats.visitProfile')}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Mute/Unmute */}
            <TouchableOpacity
              style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
              onPress={() => {
                setShowChatOptionsModal(false);
                setShowMuteModal(true);
              }}>
              <Ionicons 
                name={muteStatus.isMuted ? 'notifications-outline' : 'notifications-off-outline'} 
                size={moderateScale(22)} 
                color={theme.primary} 
              />
              <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                {muteStatus.isMuted ? t('chats.unmute') : t('chats.mute')}
              </Text>
            </TouchableOpacity>
            
            {/* View Pinned Messages */}
            <TouchableOpacity
              style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
              onPress={() => {
                setShowChatOptionsModal(false);
                handleViewPinnedMessages();
              }}>
              <Ionicons name="pin-outline" size={moderateScale(22)} color={theme.primary} />
              <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                {t('chats.pinnedMessages')}
              </Text>
            </TouchableOpacity>
            
            {/* Search in Chat */}
            <TouchableOpacity
              style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
              onPress={() => {
                setShowChatOptionsModal(false);
                Alert.alert(t('common.info'), t('chats.searchComingSoon'));
              }}>
              <Ionicons name="search-outline" size={moderateScale(22)} color={theme.primary} />
              <Text style={[styles.muteOptionText, { color: theme.text, fontSize: fontSize(15) }]}>
                {t('chats.searchInChat')}
              </Text>
            </TouchableOpacity>
            
            {/* Clear Chat */}
            <TouchableOpacity
              style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
              onPress={() => {
                setShowChatOptionsModal(false);
                Alert.alert(t('common.info'), t('chats.clearChatComingSoon'));
              }}>
              <Ionicons name="trash-outline" size={moderateScale(22)} color="#EF4444" />
              <Text style={[styles.muteOptionText, { color: '#EF4444', fontSize: fontSize(15) }]}>
                {t('chats.clearChat')}
              </Text>
            </TouchableOpacity>
            
            {/* Block User - only for private chats */}
            {chat.type === 'private' && (
              <TouchableOpacity
                style={[styles.muteOption, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                onPress={() => {
                  setShowChatOptionsModal(false);
                  const otherUserId = chat.otherUser?.$id || chat.otherUser?.id;
                  const otherUserName = chat.otherUser?.name || chat.otherUser?.fullName || getChatDisplayName();
                  if (!otherUserId) {
                    Alert.alert(t('common.error'), t('chats.blockError') || 'Cannot block this user');
                    return;
                  }
                  Alert.alert(
                    t('chats.blockUser'),
                    (t('chats.blockConfirm') || 'Are you sure you want to block {name}?').replace('{name}', otherUserName),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.block') || 'Block',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await blockUser(user.$id, otherUserId);
                            Alert.alert(
                              t('common.success'),
                              t('chats.userBlocked') || 'User has been blocked'
                            );
                            navigation.goBack();
                          } catch (error) {
                            Alert.alert(t('common.error'), t('chats.blockError') || 'Failed to block user');
                          }
                        }
                      }
                    ]
                  );
                }}>
                <Ionicons name="ban-outline" size={moderateScale(22)} color="#EF4444" />
                <Text style={[styles.muteOptionText, { color: '#EF4444', fontSize: fontSize(15) }]}>
                  {t('chats.blockUser')}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowChatOptionsModal(false)}>
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary, fontSize: fontSize(15) }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: Platform.OS === 'ios' ? hp(1) : 0,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontWeight: '500',
  },
  messagesList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: moderateScale(400),
  },
  emptyText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl + 20 : spacing.xl,
  },
  modalTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  muteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  muteOptionText: {
    fontWeight: '500',
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    fontWeight: '500',
  },
  pinnedModalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl + 20 : spacing.xl,
    maxHeight: '70%',
  },
  pinnedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  pinnedList: {
    paddingHorizontal: spacing.md,
  },
  emptyPinned: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyPinnedText: {
    marginTop: spacing.md,
  },
  pinnedMessageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  pinnedMessageContent: {
    flex: 1,
  },
  pinnedSenderName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  pinnedMessageText: {
    fontWeight: '400',
  },
});

export default ChatRoom;
