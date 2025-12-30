import React, { useState, useRef, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Image, 
  Dimensions,
  Animated,
  PanResponder,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import ProfilePicture from './ProfilePicture';
import { 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const SWIPE_THRESHOLD = 60;

// Message status indicator component
const MessageStatusIndicator = ({ 
  status, 
  readBy, 
  chatType, 
  otherUserPhoto, 
  otherUserName,
  participantCount,
  theme,
  isDarkMode 
}) => {
  // For optimistic/sending messages
  if (status === 'sending') {
    return (
      <View style={statusStyles.container}>
        <ActivityIndicator size={moderateScale(10)} color="rgba(255,255,255,0.6)" />
      </View>
    );
  }
  
  // For failed messages
  if (status === 'failed') {
    return (
      <View style={statusStyles.container}>
        <Ionicons name="alert-circle" size={moderateScale(14)} color="#EF4444" />
      </View>
    );
  }
  
  // Message sent but not read
  if (status === 'sent' || !readBy || readBy.length === 0) {
    return (
      <View style={statusStyles.container}>
        <Ionicons name="checkmark" size={moderateScale(12)} color="rgba(255,255,255,0.6)" />
      </View>
    );
  }
  
  // For private chats - show other user's profile picture when read
  if (chatType === 'private' && readBy.length > 0) {
    return (
      <View style={statusStyles.container}>
        {otherUserPhoto ? (
          <Image 
            source={{ uri: otherUserPhoto }} 
            style={statusStyles.readAvatar}
          />
        ) : (
          <View style={[statusStyles.readAvatarPlaceholder, { backgroundColor: theme.primary }]}>
            <Text style={statusStyles.readAvatarText}>
              {(otherUserName || '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    );
  }
  
  // For group chats - show double check when all have read
  if ((chatType === 'custom_group' || chatType === 'stage_group' || chatType === 'department_group') && readBy.length > 0) {
    const allRead = participantCount && readBy.length >= participantCount - 1; // -1 for sender
    return (
      <View style={statusStyles.container}>
        <Ionicons 
          name={allRead ? "checkmark-done" : "checkmark"} 
          size={moderateScale(12)} 
          color={allRead ? "#60A5FA" : "rgba(255,255,255,0.6)"} 
        />
      </View>
    );
  }
  
  // Default - single check
  return (
    <View style={statusStyles.container}>
      <Ionicons name="checkmark" size={moderateScale(12)} color="rgba(255,255,255,0.6)" />
    </View>
  );
};

const statusStyles = StyleSheet.create({
  container: {
    marginLeft: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: moderateScale(14),
  },
  readAvatar: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
  },
  readAvatarPlaceholder: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  readAvatarText: {
    color: '#FFFFFF',
    fontSize: moderateScale(8),
    fontWeight: '600',
  },
});

const MessageBubble = ({ 
  message, 
  isCurrentUser, 
  senderName,
  senderPhoto,
  showAvatar = true,
  onCopy,
  onDelete,
  onReply,
  onForward,
  onPin,
  onUnpin,
  onBookmark,
  onUnbookmark,
  isBookmarked = false,
  onAvatarPress,
  onRetry,
  chatType,
  otherUserPhoto,
  otherUserName,
  participantCount,
}) => {
  const { theme, isDarkMode, t, chatSettings } = useAppSettings();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeDirection = isCurrentUser ? -1 : 1;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx * swipeDirection;
        if (dx > 0 && dx < SWIPE_THRESHOLD + 20) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const dx = gestureState.dx * swipeDirection;
        if (dx > SWIPE_THRESHOLD && onReply) {
          onReply();
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      },
    })
  ).current;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasImages = message.images && message.images.length > 0;
  const hasLegacyImage = message.imageUrl && message.imageUrl.trim().length > 0;
  const imageUrl = hasImages ? message.images[0] : (hasLegacyImage ? message.imageUrl : null);
  const hasImage = !!imageUrl;
  const hasText = message.content && message.content.trim().length > 0;
  const hasReply = message.replyToId && message.replyToContent;
  const isPinned = message.isPinned;
  const mentionsAll = message.mentionsAll;

  const handleLongPress = () => {
    setActionsVisible(true);
  };

  const handleAction = (action) => {
    setActionsVisible(false);
    if (action) {
      setTimeout(action, 100);
    }
  };

  // Render message content with @everyone highlighting
  const renderMessageContent = () => {
    if (!hasText) return null;
    
    const content = message.content;
    
    // Check if contains @everyone or @all
    if (mentionsAll || content.toLowerCase().includes('@everyone') || content.toLowerCase().includes('@all')) {
      const parts = content.split(/(@everyone|@all)/gi);
      return (
        <Text style={[
          styles.messageText,
          { 
            fontSize: fontSize(14),
            color: isCurrentUser ? '#FFFFFF' : theme.text 
          },
          hasImage && styles.messageTextWithImage,
        ]}>
          {parts.map((part, index) => {
            if (part.toLowerCase() === '@everyone' || part.toLowerCase() === '@all') {
              return (
                <Text key={index} style={styles.mentionHighlight}>
                  {part}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      );
    }

    return (
      <Text style={[
        styles.messageText,
        { 
          fontSize: fontSize(14),
          color: isCurrentUser ? '#FFFFFF' : theme.text 
        },
        hasImage && styles.messageTextWithImage,
      ]}>
        {content}
      </Text>
    );
  };

  const actionButtons = [
    { icon: 'copy-outline', label: t('chats.copy'), action: onCopy, show: hasText },
    { icon: 'arrow-undo-outline', label: t('chats.reply'), action: onReply, show: true },
    { icon: 'arrow-redo-outline', label: t('chats.forward'), action: onForward, show: true },
    { icon: isPinned ? 'pin' : 'pin-outline', label: isPinned ? t('chats.unpin') : t('chats.pin'), action: isPinned ? onUnpin : onPin, show: onPin || onUnpin },
    { icon: isBookmarked ? 'bookmark' : 'bookmark-outline', label: isBookmarked ? t('chats.unbookmark') : t('chats.bookmark'), action: isBookmarked ? onUnbookmark : onBookmark, show: onBookmark || onUnbookmark },
    { icon: 'trash-outline', label: t('common.delete'), action: onDelete, show: isCurrentUser && onDelete, danger: true },
  ].filter(btn => btn.show);

  // Render bubble content (used by both gradient and solid bubbles)
  const renderBubbleContent = () => (
    <>
      {/* Pinned indicator */}
      {isPinned && (
        <View style={styles.pinnedIndicator}>
          <Ionicons name="pin" size={moderateScale(12)} color={isCurrentUser ? 'rgba(255,255,255,0.7)' : theme.primary} />
          <Text style={[styles.pinnedText, { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : theme.primary, fontSize: fontSize(9) }]}>
            {t('chats.pinnedMessages').split(' ')[0]}
          </Text>
        </View>
      )}
      
      {hasReply && (
        <View style={[
          styles.replyContainer,
          { 
            borderLeftColor: isCurrentUser ? 'rgba(255,255,255,0.5)' : theme.primary,
          }
        ]}>
          <Text style={[
            styles.replyToSender, 
            { 
              fontSize: fontSize(10), 
              color: isCurrentUser ? 'rgba(255,255,255,0.9)' : theme.primary 
            }
          ]}>
            {message.replyToSender || t('common.user')}
          </Text>
          <Text 
            style={[
              styles.replyToContent, 
              { 
                fontSize: fontSize(11), 
                color: isCurrentUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary 
              }
            ]}
            numberOfLines={1}>
            {message.replyToContent}
          </Text>
        </View>
      )}

      {hasImage && (
        <TouchableOpacity 
          onPress={() => setImageModalVisible(true)}
          activeOpacity={0.9}>
          <Image 
            source={{ uri: imageUrl }}
            style={[
              styles.messageImage,
              !hasText && styles.messageImageOnly,
            ]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {renderMessageContent()}
      
      <View style={styles.timeStatusRow}>
        <Text style={[
          styles.timeText,
          { 
            fontSize: fontSize(9),
            color: isCurrentUser 
              ? 'rgba(255,255,255,0.6)' 
              : theme.textSecondary
          }
        ]}>
          {formatTime(message.createdAt || message.$createdAt)}
        </Text>
        
        {/* Status indicator for current user's messages */}
        {isCurrentUser && (
          <MessageStatusIndicator
            status={message._status}
            readBy={message.readBy}
            chatType={chatType}
            otherUserPhoto={otherUserPhoto}
            otherUserName={otherUserName}
            participantCount={participantCount}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        )}
      </View>
      
      {/* Retry button for failed messages */}
      {message._status === 'failed' && onRetry && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => onRetry(message)}
        >
          <Ionicons name="refresh" size={moderateScale(12)} color="#EF4444" />
          <Text style={styles.retryText}>{t('common.retry') || 'Retry'}</Text>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      {/* Show sender name for other users */}
      {!isCurrentUser && senderName && (
        <Text style={[
          styles.senderName, 
          { fontSize: fontSize(11), color: theme.primary, marginLeft: showAvatar ? moderateScale(40) : spacing.xs }
        ]}>
          {senderName}
        </Text>
      )}
      
      <View style={styles.messageRow}>
        {/* Show avatar for other users */}
        {!isCurrentUser && showAvatar && (
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => onAvatarPress && onAvatarPress(message.senderId)}
            activeOpacity={0.7}
          >
            <ProfilePicture 
              uri={senderPhoto || message.senderPhoto}
              name={senderName || message.senderName}
              size={moderateScale(32)}
            />
          </TouchableOpacity>
        )}
        
        <Animated.View 
          style={[
            { transform: [{ translateX }] },
            !isCurrentUser && showAvatar && styles.bubbleWithAvatar,
          ]}
          {...panResponder.panHandlers}>
          {/* Render bubble with gradient or solid color based on chatSettings */}
          {isCurrentUser && chatSettings?.bubbleColor?.startsWith('gradient::') ? (
            <Pressable
              onLongPress={handleLongPress}
              delayLongPress={300}>
              <LinearGradient
                colors={chatSettings.bubbleColor.replace('gradient::', '').split(',')}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.bubble,
                  styles.currentUserBubble,
                  getBubbleStyleRadius(chatSettings?.bubbleStyle),
                  hasImage && !hasText && styles.imageBubble,
                  isPinned && styles.pinnedBubble,
                ]}>
                {renderBubbleContent()}
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              onLongPress={handleLongPress}
              delayLongPress={300}
              style={[
                styles.bubble,
                isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
                getBubbleStyleRadius(chatSettings?.bubbleStyle),
                {
                  backgroundColor: isCurrentUser 
                    ? (chatSettings?.bubbleColor || '#667eea')
                    : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                },
                hasImage && !hasText && styles.imageBubble,
                isPinned && styles.pinnedBubble,
              ]}>
              {renderBubbleContent()}
            </Pressable>
          )}
        </Animated.View>
      </View>

      {/* Swipe indicator */}
      <View style={[
        styles.swipeIndicator,
        isCurrentUser ? styles.swipeIndicatorLeft : styles.swipeIndicatorRight,
      ]}>
        <Ionicons 
          name="arrow-undo" 
          size={moderateScale(16)} 
          color={theme.textSecondary} 
        />
      </View>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}>
                <Ionicons name="close" size={moderateScale(28)} color="#FFFFFF" />
              </TouchableOpacity>
              <Image 
                source={{ uri: imageUrl }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Actions Modal */}
      <Modal
        visible={actionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActionsVisible(false)}>
        <Pressable 
          style={styles.actionsOverlay}
          onPress={() => setActionsVisible(false)}>
          <View style={[
            styles.actionsContainer,
            { backgroundColor: isDarkMode ? '#2a2a40' : '#FFFFFF' }
          ]}>
            {actionButtons.map((btn, index) => (
              <TouchableOpacity
                key={btn.icon}
                style={[
                  styles.actionButton,
                  index < actionButtons.length - 1 && styles.actionButtonBorder,
                  { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                ]}
                onPress={() => handleAction(btn.action)}>
                <Ionicons 
                  name={btn.icon} 
                  size={moderateScale(20)} 
                  color={btn.danger ? '#EF4444' : theme.text} 
                />
                <Text style={[
                  styles.actionLabel,
                  { 
                    fontSize: fontSize(14), 
                    color: btn.danger ? '#EF4444' : theme.text 
                  }
                ]}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// Helper function to get bubble radius based on style
const getBubbleStyleRadius = (bubbleStyle) => {
  switch (bubbleStyle) {
    case 'minimal':
      return { borderRadius: borderRadius.sm };
    case 'sharp':
      return { borderRadius: borderRadius.xs };
    case 'bubble':
      return { borderRadius: borderRadius.xxl || 24 };
    case 'classic':
      return { borderRadius: borderRadius.md };
    default: // modern
      return { borderRadius: borderRadius.lg };
  }
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    position: 'relative',
  },
  currentUserContainer: {
    alignItems: 'flex-end',
  },
  otherUserContainer: {
    alignItems: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarContainer: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  bubbleWithAvatar: {
    maxWidth: '85%',
  },
  senderName: {
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: spacing.xs,
  },
  bubble: {
    maxWidth: moderateScale(280),
    minWidth: moderateScale(60),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  imageBubble: {
    padding: spacing.xs / 2,
  },
  currentUserBubble: {
    borderBottomRightRadius: spacing.xs,
  },
  otherUserBubble: {
    borderBottomLeftRadius: spacing.xs,
  },
  pinnedBubble: {
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
    gap: 2,
  },
  pinnedText: {
    fontWeight: '500',
  },
  mentionHighlight: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 2,
    fontWeight: '600',
  },
  replyContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
  },
  replyToSender: {
    fontWeight: '600',
    marginBottom: 2,
  },
  replyToContent: {
    fontWeight: '400',
  },
  messageImage: {
    width: moderateScale(180),
    height: moderateScale(180),
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs / 2,
  },
  messageImageOnly: {
    marginBottom: 0,
  },
  messageText: {
    lineHeight: fontSize(14) * 1.5,
  },
  messageTextWithImage: {
    marginTop: spacing.xs,
  },
  timeText: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs / 2,
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    marginTop: -moderateScale(8),
    opacity: 0.3,
  },
  swipeIndicatorLeft: {
    left: spacing.xs,
  },
  swipeIndicatorRight: {
    right: spacing.xs,
  },
  timeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  retryText: {
    color: '#EF4444',
    fontSize: fontSize(10),
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: moderateScale(50),
    right: moderateScale(20),
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: moderateScale(18),
    padding: spacing.sm,
  },
  fullImage: {
    width: '95%',
    height: '80%',
  },
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    width: '70%',
    maxWidth: 280,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionButtonBorder: {
    borderBottomWidth: 1,
  },
  actionLabel: {
    fontWeight: '500',
  },
});

export default memo(MessageBubble);
