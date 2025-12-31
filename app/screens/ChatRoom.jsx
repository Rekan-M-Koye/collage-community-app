import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StatusBar,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import AnimatedBackground from '../components/AnimatedBackground';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import { 
  wp, 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';
import { MuteModal, PinnedMessagesModal, ChatOptionsModal } from './chatRoom/ChatRoomModals';
import { chatRoomStyles as styles } from './chatRoom/styles';
import { useChatRoom } from './chatRoom/useChatRoom';

const ChatRoom = ({ route, navigation }) => {
  const { chat } = route.params;
  const { t, theme, isDarkMode, chatSettings } = useAppSettings();
  const { user } = useUser();

  const {
    messages,
    loading,
    sending,
    canSend,
    userCache,
    replyingTo,
    muteStatus,
    showMuteModal,
    pinnedMessages,
    showPinnedModal,
    bookmarkedMsgIds,
    canPin,
    canMentionEveryone,
    showChatOptionsModal,
    flatListRef,
    chat: chatData,
    groupMembers,
    userFriends,
    setShowMuteModal,
    setShowPinnedModal,
    setShowChatOptionsModal,
    getChatDisplayName,
    handleChatHeaderPress,
    handleViewPinnedMessages,
    handleMuteChat,
    handleUnmuteChat,
    handlePinMessage,
    handleUnpinMessage,
    handleBookmarkMessage,
    handleUnbookmarkMessage,
    handleCopyMessage,
    handleDeleteMessage,
    handleReplyMessage,
    handleForwardMessage,
    cancelReply,
    handleSendMessage,
    handleRetryMessage,
    handleVisitProfile,
    handleBlockUser,
  } = useChatRoom({ chat, user, t, navigation });

  useEffect(() => {
    // Get header background color to match chat background
    const getHeaderBgColor = () => {
      const bgSetting = chatSettings?.backgroundImage;
      if (bgSetting?.startsWith('gradient_')) {
        const gradientMap = {
          'gradient_purple': '#667eea',
          'gradient_blue': '#1a1a2e',
          'gradient_green': '#134e5e',
          'gradient_sunset': '#ff7e5f',
          'gradient_ocean': '#2193b0',
          'gradient_midnight': '#232526',
          'gradient_aurora': '#00c6fb',
          'gradient_rose': '#f4c4f3',
        };
        return gradientMap[bgSetting] || (isDarkMode ? '#1a1a2e' : '#f0f4ff');
      }
      return isDarkMode ? '#1a1a2e' : '#f0f4ff';
    };

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
          <Text style={{ 
            color: theme.textSecondary, 
            fontSize: fontSize(11), 
            textAlign: 'center',
          }}>
            {t('chats.tapForOptions')}
          </Text>
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: getHeaderBgColor(),
      },
      headerTintColor: theme.text,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
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
  }, [chat, isDarkMode, theme, muteStatus, chatSettings]);

  const memoizedMessages = useMemo(() => messages, [messages]);

  // For private chats, find the last message sent by current user that was read by the other user
  const lastSeenMessageId = useMemo(() => {
    if (chat.type !== 'private') return null;
    
    const otherUserId = chat.otherUser?.$id;
    if (!otherUserId) return null;

    // Messages are in chronological order (oldest first, newest last)
    // Find the most recent (newest) message sent by current user that was read by other user
    // Loop backwards to find the newest read message
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.senderId === user.$id && msg.readBy?.includes(otherUserId)) {
        return msg.$id;
      }
    }
    return null;
  }, [messages, chat.type, chat.otherUser, user.$id]);

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.senderId === user.$id;
    const senderData = userCache[item.senderId];
    const senderName = senderData?.name || item.senderName || 'Unknown';
    const senderPhoto = senderData?.profilePicture || item.senderPhoto;
    
    const showSenderName = !isCurrentUser && (
      index === 0 || 
      messages[index - 1].senderId !== item.senderId
    );
    
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

    // Get other user info for private chats (for read receipts)
    const otherUserPhoto = chat.type === 'private' ? chat.otherUser?.profilePicture : null;
    const otherUserName = chat.type === 'private' ? (chat.otherUser?.name || chat.otherUser?.fullName) : null;
    const participantCount = chat.participants?.length || 0;
    
    // Check if this is the last message seen by the other user (for animated read receipt)
    const isLastSeenMessage = isCurrentUser && item.$id === lastSeenMessageId;

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
        onRetry={item._status === 'failed' ? handleRetryMessage : null}
        chatType={chat.type}
        otherUserPhoto={otherUserPhoto}
        otherUserName={otherUserName}
        participantCount={participantCount}
        isLastSeenMessage={isLastSeenMessage}
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

  const getBackgroundColors = () => {
    const bgSetting = chatSettings?.backgroundImage;
    
    if (bgSetting?.startsWith('gradient_')) {
      const gradientMap = {
        'gradient_purple': ['#667eea', '#764ba2'],
        'gradient_blue': ['#1a1a2e', '#16213e'],
        'gradient_green': ['#134e5e', '#71b280'],
        'gradient_sunset': ['#ff7e5f', '#feb47b'],
        'gradient_ocean': ['#2193b0', '#6dd5ed'],
        'gradient_midnight': ['#232526', '#414345'],
        'gradient_aurora': ['#00c6fb', '#005bea'],
        'gradient_rose': ['#f4c4f3', '#fc67fa'],
      };
      return gradientMap[bgSetting] || (isDarkMode 
        ? ['#1a1a2e', '#16213e', '#0f3460'] 
        : ['#f0f4ff', '#d8e7ff', '#c0deff']);
    }
    
    return isDarkMode 
      ? ['#1a1a2e', '#16213e', '#0f3460'] 
      : ['#f0f4ff', '#d8e7ff', '#c0deff'];
  };

  const isCustomImageBackground = chatSettings?.backgroundImage && 
    !chatSettings.backgroundImage.startsWith('gradient_') &&
    !chatSettings.backgroundImage.startsWith('pattern_') &&
    chatSettings.backgroundImage !== null;

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

  const renderChatContent = () => (
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
        showMentionButton={chat.type !== 'private'}
        canMentionEveryone={canMentionEveryone}
        groupMembers={groupMembers}
        friends={userFriends}
      />
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      
      {isCustomImageBackground ? (
        <ImageBackground 
          source={{ uri: chatSettings.backgroundImage }} 
          style={styles.gradient}
          resizeMode="cover">
          <View style={styles.backgroundOverlay}>
            <AnimatedBackground particleCount={15} />
            {renderChatContent()}
          </View>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={getBackgroundColors()}
          style={styles.gradient}>
          <AnimatedBackground particleCount={15} />
          {renderChatContent()}
        </LinearGradient>
      )}

      <MuteModal
        visible={showMuteModal}
        onClose={() => setShowMuteModal(false)}
        muteStatus={muteStatus}
        onMute={handleMuteChat}
        onUnmute={handleUnmuteChat}
        theme={theme}
        isDarkMode={isDarkMode}
        t={t}
      />

      <PinnedMessagesModal
        visible={showPinnedModal}
        onClose={() => setShowPinnedModal(false)}
        pinnedMessages={pinnedMessages}
        canPin={canPin}
        onUnpinMessage={handleUnpinMessage}
        theme={theme}
        isDarkMode={isDarkMode}
        t={t}
      />

      <ChatOptionsModal
        visible={showChatOptionsModal}
        onClose={() => setShowChatOptionsModal(false)}
        chat={chat}
        chatDisplayName={getChatDisplayName()}
        muteStatus={muteStatus}
        onVisitProfile={handleVisitProfile}
        onOpenMuteModal={() => {
          setShowChatOptionsModal(false);
          setShowMuteModal(true);
        }}
        onViewPinnedMessages={() => {
          setShowChatOptionsModal(false);
          handleViewPinnedMessages();
        }}
        onOpenGroupSettings={() => {
          setShowChatOptionsModal(false);
          navigation.navigate('GroupSettings', { chat });
        }}
        onBlockUser={handleBlockUser}
        theme={theme}
        isDarkMode={isDarkMode}
        t={t}
      />
    </View>
  );
};

export default ChatRoom;
