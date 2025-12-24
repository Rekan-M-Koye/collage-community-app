import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import AnimatedBackground from '../components/AnimatedBackground';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import { getMessages, sendMessage, canUserSendMessage, deleteMessage } from '../../database/chats';
import { getUserById } from '../../database/users';
import { 
  wp, 
  hp, 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

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
  const flatListRef = useRef(null);
  const pollingInterval = useRef(null);
  const appState = useRef(AppState.currentState);
  const lastMessageId = useRef(null);

  const POLLING_INTERVAL = 3000;

  const getChatDisplayName = () => {
    if (chat.type === 'private' && chat.otherUser) {
      return chat.otherUser.name || chat.otherUser.fullName || chat.name;
    }
    return chat.name;
  };

  useEffect(() => {
    navigation.setOptions({
      title: getChatDisplayName(),
      headerStyle: {
        backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f4ff',
      },
      headerTintColor: theme.text,
      headerRight: () => (
        chat.type === 'custom_group' ? (
          <TouchableOpacity
            style={{ marginRight: spacing.md }}
            onPress={() => navigation.navigate('GroupSettings', { chat })}>
            <Ionicons name="settings-outline" size={moderateScale(22)} color={theme.text} />
          </TouchableOpacity>
        ) : null
      ),
    });
  }, [chat, isDarkMode, theme]);

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
        
        // Cache new user data
        const uniqueSenderIds = [...new Set(reversedMessages.map(m => m.senderId))];
        const newUsers = uniqueSenderIds.filter(id => !userCache[id]);
        
        if (newUsers.length > 0) {
          const newUserCache = { ...userCache };
          for (const senderId of newUsers) {
            try {
              const userData = await getUserById(senderId);
              newUserCache[senderId] = userData;
            } catch (error) {
              newUserCache[senderId] = { name: 'Unknown User' };
            }
          }
          setUserCache(newUserCache);
        }
      }
    } catch (error) {
      // Silent fail for polling
    }
  }, [chat.$id, userCache]);

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
      
      const uniqueSenderIds = [...new Set(reversedMessages.map(m => m.senderId))];
      const newUserCache = { ...userCache };
      
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
      };
      
      // Handle image URL from MessageInput (single URL string)
      if (imageUrl && typeof imageUrl === 'string') {
        messageData.images = [imageUrl];
      }
      
      // Handle reply
      if (replyingTo) {
        messageData.replyToId = replyingTo.$id;
        messageData.replyToContent = replyingTo.content?.substring(0, 100) || '';
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
    const senderName = userCache[item.senderId]?.name || item.senderName || 'Unknown';
    
    const showSenderName = !isCurrentUser && (
      index === 0 || 
      messages[index - 1].senderId !== item.senderId
    );

    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        senderName={showSenderName ? senderName : null}
        onCopy={() => handleCopyMessage(item)}
        onDelete={isCurrentUser ? () => handleDeleteMessage(item) : null}
        onReply={() => handleReplyMessage(item)}
        onForward={() => handleForwardMessage(item)}
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
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item.$id || `message-${index}`}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmpty}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
        />
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
});

export default ChatRoom;
