import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const SWIPE_THRESHOLD = 60;

const MessageBubble = ({ 
  message, 
  isCurrentUser, 
  senderName,
  onCopy,
  onDelete,
  onReply,
  onForward,
}) => {
  const { theme, isDarkMode, t } = useAppSettings();
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

  const handleLongPress = () => {
    setActionsVisible(true);
  };

  const handleAction = (action) => {
    setActionsVisible(false);
    if (action) {
      setTimeout(action, 100);
    }
  };

  const actionButtons = [
    { icon: 'copy-outline', label: t('chats.copy'), action: onCopy, show: hasText },
    { icon: 'arrow-undo-outline', label: t('chats.reply'), action: onReply, show: true },
    { icon: 'arrow-redo-outline', label: t('chats.forward'), action: onForward, show: true },
    { icon: 'trash-outline', label: t('common.delete'), action: onDelete, show: isCurrentUser && onDelete, danger: true },
  ].filter(btn => btn.show);

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      {!isCurrentUser && senderName && (
        <Text style={[
          styles.senderName, 
          { fontSize: fontSize(10), color: theme.primary }
        ]}>
          {senderName}
        </Text>
      )}
      
      <Animated.View 
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}>
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={300}
          style={[
            styles.bubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            {
              backgroundColor: isCurrentUser 
                ? '#667eea'
                : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
            },
            hasImage && !hasText && styles.imageBubble,
          ]}>
          
          {hasReply && (
            <View style={[
              styles.replyContainer,
              { 
                backgroundColor: isCurrentUser 
                  ? 'rgba(255,255,255,0.15)' 
                  : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
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
                {message.replyToSender}
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

          {hasText && (
            <Text style={[
              styles.messageText,
              { 
                fontSize: fontSize(14),
                color: isCurrentUser ? '#FFFFFF' : theme.text 
              },
              hasImage && styles.messageTextWithImage,
            ]}>
              {message.content}
            </Text>
          )}
          
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
        </Pressable>
      </Animated.View>

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
  senderName: {
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: spacing.xs,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.lg,
  },
  imageBubble: {
    padding: spacing.xs / 2,
  },
  currentUserBubble: {
    borderBottomRightRadius: spacing.xs / 2,
  },
  otherUserBubble: {
    borderBottomLeftRadius: spacing.xs / 2,
  },
  replyContainer: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    marginBottom: spacing.xs / 2,
    borderLeftWidth: 2,
    borderRadius: 4,
  },
  replyToSender: {
    fontWeight: '600',
    marginBottom: 1,
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
    lineHeight: fontSize(18),
  },
  messageTextWithImage: {
    marginTop: spacing.xs / 2,
  },
  timeText: {
    alignSelf: 'flex-end',
    marginTop: 2,
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

export default MessageBubble;
