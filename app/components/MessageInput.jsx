import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  Text,
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

const MessageInput = ({ onSend, disabled = false, placeholder, replyingTo, onCancelReply }) => {
  const { theme, isDarkMode, t } = useAppSettings();
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    if (disabled || uploading) return;
    
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

    try {
      setUploading(true);
      let imageUrl = null;

      if (selectedImage) {
        const uploadResult = await uploadToImgbb(selectedImage.base64);
        imageUrl = uploadResult.url;
      }

      await onSend(trimmedMessage, imageUrl);
      setMessage('');
      setSelectedImage(null);
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('chats.sendError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={[
        styles.container,
        {
          backgroundColor: isDarkMode 
            ? 'rgba(255,255,255,0.05)' 
            : 'rgba(0,0,0,0.02)',
          borderTopColor: isDarkMode 
            ? 'rgba(255,255,255,0.1)' 
            : 'rgba(0,0,0,0.1)',
        }
      ]}>
        {replyingTo && (
          <View style={[
            styles.replyPreview,
            { 
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
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

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { opacity: disabled || uploading ? 0.5 : 1 }
            ]}
            onPress={showImageOptions}
            disabled={disabled || uploading}
            activeOpacity={0.7}>
            <Ionicons 
              name="image-outline" 
              size={moderateScale(24)} 
              color={theme.primary} 
            />
          </TouchableOpacity>

          <View style={[
            styles.inputContainer,
            {
              backgroundColor: isDarkMode 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.05)',
            }
          ]}>
            <TextInput
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
              onChangeText={setMessage}
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
      </View>
    </KeyboardAvoidingView>
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
});

export default MessageInput;
