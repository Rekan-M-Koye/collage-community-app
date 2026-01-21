import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  Text,
  FlatList,
  Modal,
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
import { pickAndCompressImages, takePictureAndCompress } from '../utils/imageCompression';
import { uploadToImgbb } from '../../services/imgbbService';

const MessageInput = ({ 
  onSend, 
  disabled = false, 
  placeholder, 
  replyingTo, 
  onCancelReply, 
  showMentionButton = false, 
  canMentionEveryone = false,
  groupMembers = [],
  friends = [],
}) => {
  const { theme, isDarkMode, t } = useAppSettings();
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [showAttachmentsMenu, setShowAttachmentsMenu] = useState(false);
  const inputRef = useRef(null);

  // Get mention suggestions based on context
  const getMentionSuggestions = () => {
    const suggestions = [];
    
    // Add @everyone option if allowed
    if (canMentionEveryone) {
      suggestions.push({ 
        id: 'everyone', 
        name: 'everyone', 
        displayName: t('chats.mentionEveryone') || 'Everyone',
        isSpecial: true 
      });
    }
    
    // Combine group members and friends, prioritize group members
    const allUsers = [...groupMembers];
    friends.forEach(friend => {
      if (!allUsers.find(u => u.$id === friend.$id)) {
        allUsers.push(friend);
      }
    });
    
    // Filter by query
    const query = mentionQuery.toLowerCase();
    const filteredUsers = allUsers.filter(user => {
      const name = (user.name || user.fullName || '').toLowerCase();
      return name.includes(query);
    });
    
    // Add users to suggestions (limit to 3)
    filteredUsers.slice(0, 3).forEach(user => {
      suggestions.push({
        id: user.$id,
        name: user.name || user.fullName,
        displayName: user.name || user.fullName,
        profilePicture: user.profilePicture,
        isSpecial: false,
      });
    });
    
    return suggestions.slice(0, 4); // Max 4 suggestions (1 everyone + 3 users)
  };

  const handleTextChange = (text) => {
    setMessage(text);
    
    // Check for @ mention trigger
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = text.slice(lastAtIndex + 1);
      // Check if there's no space after @ (still typing mention)
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
        setMentionStartIndex(lastAtIndex);
        setMentionQuery(textAfterAt);
        setShowMentionSuggestions(true);
        return;
      }
    }
    
    setShowMentionSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
  };

  const handleSelectMention = (suggestion) => {
    const beforeMention = message.slice(0, mentionStartIndex);
    const afterMention = message.slice(mentionStartIndex + mentionQuery.length + 1);
    const mentionText = suggestion.isSpecial ? '@everyone' : `@${suggestion.name}`;
    
    setMessage(beforeMention + mentionText + ' ' + afterMention);
    setShowMentionSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
  };

  const handleInsertMention = (mention) => {
    setMessage(prev => prev + mention + ' ');
    setShowMentionSuggestions(false);
  };

  const handlePickImage = async () => {
    if (disabled || uploading) return;
    setShowAttachmentsMenu(false);
    
    try {
      const result = await pickAndCompressImages({
        allowsMultipleSelection: false,
        maxImages: 1,
        quality: 'medium',
      });

      if (result && result.length > 0) {
        setSelectedImage(result[0]);
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('chats.imagePickError'));
    }
  };

  const handleTakePicture = async () => {
    if (disabled || uploading) return;
    setShowAttachmentsMenu(false);
    
    try {
      const result = await takePictureAndCompress({
        quality: 'medium',
      });

      if (result) {
        setSelectedImage(result);
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('chats.cameraError'));
    }
  };

  const handleSendLocation = () => {
    setShowAttachmentsMenu(false);
    Alert.alert(
      t('chats.sendLocation') || 'Send Location',
      t('chats.comingSoon') || 'This feature is coming soon!'
    );
  };

  const handleSendFile = () => {
    setShowAttachmentsMenu(false);
    Alert.alert(
      t('chats.sendFile') || 'Send File',
      t('chats.comingSoon') || 'This feature is coming soon!'
    );
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      handlePickImage();
      return;
    }

    Alert.alert(
      t('chats.addImage'),
      t('chats.selectImageSource'),
      [
        {
          text: t('chats.camera'),
          onPress: handleTakePicture,
        },
        {
          text: t('chats.gallery'),
          onPress: handlePickImage,
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage && !selectedImage) return;
    if (!onSend) return;

    // Store the message before clearing for immediate UI feedback
    const messageToSend = trimmedMessage;
    const imageToSend = selectedImage;
    
    // Clear message immediately for better UX
    setMessage('');
    
    // Keep focus on input to prevent keyboard from closing
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    try {
      let imageUrl = null;

      if (imageToSend) {
        setUploading(true);
        setSelectedImage(null);
        const uploadResult = await uploadToImgbb(imageToSend.base64);
        imageUrl = uploadResult.url;
      }

      await onSend(messageToSend, imageUrl);
    } catch (error) {
      // Restore message on error
      setMessage(messageToSend);
      Alert.alert(t('common.error'), error.message || t('chats.sendError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDarkMode 
          ? 'rgba(255,255,255,0.05)' 
          : 'rgba(0,0,0,0.02)',
        borderTopColor: isDarkMode 
          ? 'rgba(255,255,255,0.1)' 
          : 'rgba(0,0,0,0.05)',
        paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.md,
      }
    ]}>
        {replyingTo && (
          <View style={[
            styles.replyPreview,
            { 
              backgroundColor: 'transparent',
              borderLeftColor: theme.primary,
            }
          ]}>
            <View style={styles.replyContent}>
              <Text style={[styles.replyLabel, { color: theme.primary, fontSize: fontSize(11) }]}>
                {t('chats.replyingTo')} {replyingTo.senderName}
              </Text>
              <Text 
                style={[styles.replyText, { color: theme.textSecondary, fontSize: fontSize(12) }]}
                numberOfLines={1}>
                {replyingTo.content || t('chats.image')}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={onCancelReply}
              style={styles.cancelReplyButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={moderateScale(20)} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: selectedImage.uri }} 
              style={styles.imagePreview}
              resizeMode="cover"
            />
            {!uploading && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
                activeOpacity={0.7}>
                <Ionicons name="close-circle" size={moderateScale(24)} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Mention suggestions popup */}
        {showMentionSuggestions && (groupMembers.length > 0 || friends.length > 0 || canMentionEveryone) && (
          <View style={[
            styles.mentionSuggestions,
            { backgroundColor: isDarkMode ? '#2a2a40' : '#FFFFFF' }
          ]}>
            {getMentionSuggestions().map((suggestion) => (
              <TouchableOpacity 
                key={suggestion.id}
                style={styles.mentionSuggestionItem}
                onPress={() => handleSelectMention(suggestion)}>
                {suggestion.isSpecial ? (
                  <View style={[styles.mentionIcon, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="people" size={moderateScale(16)} color={theme.primary} />
                  </View>
                ) : suggestion.profilePicture ? (
                  <Image 
                    source={{ uri: suggestion.profilePicture }} 
                    style={styles.mentionAvatar} 
                  />
                ) : (
                  <View style={[styles.mentionIcon, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={{ color: theme.primary, fontWeight: '600' }}>
                      {suggestion.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <Text style={[styles.mentionSuggestionText, { color: theme.text, fontSize: fontSize(14) }]}>
                  {suggestion.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputRow}>
          {/* Attachments menu button (9-dot grid) */}
          <TouchableOpacity
            style={[
              styles.imageIconButton,
              { 
                opacity: disabled || uploading ? 0.5 : 1,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              }
            ]}
            onPress={() => setShowAttachmentsMenu(true)}
            disabled={disabled || uploading}
            activeOpacity={0.7}>
            <Ionicons 
              name="apps-outline" 
              size={moderateScale(20)} 
              color={theme.primary} 
            />
          </TouchableOpacity>

          {/* @ mention button */}
          {showMentionButton && (
            <TouchableOpacity
              style={[
                styles.iconButton,
                { opacity: disabled || uploading ? 0.5 : 1 }
              ]}
              onPress={() => {
                setMessage(prev => prev + '@');
                setMentionStartIndex(message.length);
                setMentionQuery('');
                setShowMentionSuggestions(true);
              }}
              disabled={disabled || uploading}
              activeOpacity={0.7}>
              <Ionicons 
                name="at" 
                size={moderateScale(24)} 
                color={showMentionSuggestions ? theme.primary : theme.textSecondary} 
              />
            </TouchableOpacity>
          )}

          <View style={[
            styles.inputContainer,
            {
              backgroundColor: isDarkMode 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.05)',
            }
          ]}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                { 
                  fontSize: fontSize(14),
                  color: theme.text,
                }
              ]}
              placeholder={placeholder || t('chats.typeMessage')}
              placeholderTextColor={theme.textSecondary}
              value={message}
              onChangeText={handleTextChange}
              multiline
              maxLength={1000}
              editable={!disabled && !uploading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: (message.trim() || selectedImage) && !disabled && !uploading 
                  ? theme.primary 
                  : theme.border,
              }
            ]}
            onPress={handleSend}
            disabled={(!message.trim() && !selectedImage) || disabled || uploading}
            activeOpacity={0.7}>
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons 
                name="send" 
                size={moderateScale(20)} 
                color="#FFFFFF" 
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Attachments Menu Modal */}
        <Modal
          visible={showAttachmentsMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAttachmentsMenu(false)}>
          <Pressable 
            style={styles.attachmentsOverlay}
            onPress={() => setShowAttachmentsMenu(false)}>
            <View style={[
              styles.attachmentsMenu,
              { backgroundColor: isDarkMode ? '#2a2a40' : '#FFFFFF' }
            ]}>
              <Text style={[styles.attachmentsTitle, { color: theme.text, fontSize: fontSize(16) }]}>
                {t('chats.attachments') || 'Attachments'}
              </Text>
              
              <View style={styles.attachmentsGrid}>
                {/* Camera */}
                <TouchableOpacity 
                  style={styles.attachmentItem}
                  onPress={handleTakePicture}
                  activeOpacity={0.7}>
                  <View style={[styles.attachmentIconContainer, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="camera" size={moderateScale(24)} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.attachmentLabel, { color: theme.text, fontSize: fontSize(12) }]}>
                    {t('chats.camera') || 'Camera'}
                  </Text>
                </TouchableOpacity>
                
                {/* Gallery */}
                <TouchableOpacity 
                  style={styles.attachmentItem}
                  onPress={handlePickImage}
                  activeOpacity={0.7}>
                  <View style={[styles.attachmentIconContainer, { backgroundColor: '#8B5CF6' }]}>
                    <Ionicons name="images" size={moderateScale(24)} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.attachmentLabel, { color: theme.text, fontSize: fontSize(12) }]}>
                    {t('chats.gallery') || 'Gallery'}
                  </Text>
                </TouchableOpacity>
                
                {/* Location (Coming Soon) */}
                <TouchableOpacity 
                  style={styles.attachmentItem}
                  onPress={handleSendLocation}
                  activeOpacity={0.7}>
                  <View style={[styles.attachmentIconContainer, { backgroundColor: '#F59E0B' }]}>
                    <Ionicons name="location" size={moderateScale(24)} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.attachmentLabel, { color: theme.text, fontSize: fontSize(12) }]}>
                    {t('chats.location') || 'Location'}
                  </Text>
                </TouchableOpacity>
                
                {/* Files (Coming Soon) */}
                <TouchableOpacity 
                  style={styles.attachmentItem}
                  onPress={handleSendFile}
                  activeOpacity={0.7}>
                  <View style={[styles.attachmentIconContainer, { backgroundColor: '#3B82F6' }]}>
                    <Ionicons name="document" size={moderateScale(24)} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.attachmentLabel, { color: theme.text, fontSize: fontSize(12) }]}>
                    {t('chats.file') || 'File'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontWeight: '400',
  },
  cancelReplyButton: {
    padding: spacing.xs,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  imagePreview: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  imageIconButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  inputContainer: {
    flex: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    maxHeight: moderateScale(100),
  },
  input: {
    maxHeight: moderateScale(80),
    minHeight: moderateScale(20),
  },
  sendButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionSuggestions: {
    position: 'absolute',
    bottom: moderateScale(60),
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    maxHeight: moderateScale(180),
  },
  mentionSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  mentionSuggestionText: {
    fontWeight: '500',
    flex: 1,
  },
  mentionAvatar: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
  },
  mentionIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Attachments Menu Styles
  attachmentsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  attachmentsMenu: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  attachmentsTitle: {
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  attachmentItem: {
    alignItems: 'center',
    width: moderateScale(70),
  },
  attachmentIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  attachmentLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MessageInput;
