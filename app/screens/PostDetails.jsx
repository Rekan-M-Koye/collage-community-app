import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import { GlassContainer } from '../components/GlassComponents';
import ReplyCard from '../components/ReplyCard';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { uploadImage } from '../../services/imgbbService';
import { createReply, getRepliesByPost, updateReply, deleteReply, markReplyAsAccepted, unmarkReplyAsAccepted } from '../../database/replies';
import { getUserDocument } from '../../database/auth';
import { incrementPostViewCount } from '../../database/posts';
import { wp, hp, fontSize, spacing, moderateScale } from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const PostDetails = ({ navigation, route }) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const { user } = useUser();
  const { showAlert } = useCustomAlert();
  const { post } = route.params || {};

  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyImages, setReplyImages] = useState([]);
  const [replyLinks, setReplyLinks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [showLinksInput, setShowLinksInput] = useState(false);

  useEffect(() => {
    if (post?.$id) {
      loadReplies();
      trackView();
    }
  }, [post?.$id]);

  const trackView = async () => {
    if (!post?.$id || !user?.$id) return;
    
    if (post.userId === user.$id) return;
    
    try {
      await incrementPostViewCount(post.$id, user.$id);
    } catch (error) {
    }
  };

  const loadReplies = async () => {
    if (!post?.$id) return;

    setIsLoadingReplies(true);
    try {
      const fetchedReplies = await getRepliesByPost(post.$id);
      
      const repliesWithUserData = await Promise.all(
        fetchedReplies.map(async (reply) => {
          try {
            const userDoc = await getUserDocument(reply.userId);
            return {
              ...reply,
              userData: {
                fullName: userDoc.fullName,
                profilePicture: userDoc.profilePicture,
              }
            };
          } catch (error) {
            return {
              ...reply,
              userData: {
                fullName: 'User',
                profilePicture: null,
              }
            };
          }
        })
      );
      
      setReplies(repliesWithUserData);
    } catch (error) {
      setReplies([]);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim()) {
      showAlert(t('common.error'), t('post.textRequired'), 'error');
      return;
    }

    if (!post?.$id) {
      showAlert(t('common.error'), 'Post not found', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrls = [];
      let uploadedImageDeleteUrls = [];

      if (replyImages.length > 0) {
        for (const imageUri of replyImages) {
          try {
            const uploadResult = await uploadImage(imageUri);
            uploadedImageUrls.push(uploadResult.url);
            uploadedImageDeleteUrls.push(uploadResult.deleteUrl);
          } catch (uploadError) {
          }
        }
      }

      const linksArray = replyLinks.split('\n').filter(link => link.trim());

      if (editingReply) {
        const updateData = {
          text: replyText.trim(),
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : (editingReply.images || []),
          imageDeleteUrls: uploadedImageDeleteUrls.length > 0 ? uploadedImageDeleteUrls : (editingReply.imageDeleteUrls || []),
          isEdited: true,
        };

        await updateReply(editingReply.$id, updateData);
        showAlert(t('common.success'), t('post.replyUpdated'), 'success');
        setEditingReply(null);
      } else {
        const replyData = {
          postId: post.$id,
          userId: user.$id,
          text: replyText.trim(),
          isAccepted: false,
          images: uploadedImageUrls,
          imageDeleteUrls: uploadedImageDeleteUrls,
          likeCount: 0,
          isEdited: false,
          parentReplyId: null,
          upCount: 0,
          downCount: 0,
          upvotedBy: [],
          downvotedBy: [],
        };

        await createReply(replyData);
        showAlert(t('common.success'), t('post.replyAdded'), 'success');
      }

      await loadReplies();

      setReplyText('');
      setReplyImages([]);
      setReplyLinks('');
      setShowLinksInput(false);
    } catch (error) {
      showAlert(t('common.error'), t('post.replyError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReply = (reply) => {
    setEditingReply(reply);
    setReplyText(reply.text);
    setReplyImages(reply.images || []);
    setReplyLinks(reply.links?.join('\n') || '');
    if (reply.links && reply.links.length > 0) {
      setShowLinksInput(true);
    }
  };

  const handleDeleteReply = async (reply) => {
    Alert.alert(
      t('post.deleteReply'),
      t('common.yes'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReply(reply.$id, post.$id, reply.imageDeleteUrls);
              await loadReplies();
              showAlert(t('common.success'), t('post.replyDeleted'), 'success');
            } catch (error) {
              showAlert(t('common.error'), 'Failed to delete reply', 'error');
            }
          },
        },
      ],
    );
  };

  const handleAcceptReply = async (reply) => {
    try {
      if (reply.isAccepted) {
        await unmarkReplyAsAccepted(reply.$id);
      } else {
        await markReplyAsAccepted(reply.$id);
      }
      await loadReplies();
    } catch (error) {
      showAlert(t('common.error'), 'Failed to update reply', 'error');
    }
  };

  const handleUpvote = async (reply) => {
    try {
      const upvotedBy = reply.upvotedBy || [];
      const downvotedBy = reply.downvotedBy || [];
      
      if (upvotedBy.includes(user.$id)) {
        showAlert(t('common.error'), t('post.alreadyUpvoted'), 'error');
        return;
      }
      
      const wasDownvoted = downvotedBy.includes(user.$id);
      const newUpvotedBy = [...upvotedBy, user.$id];
      const newDownvotedBy = wasDownvoted 
        ? downvotedBy.filter(id => id !== user.$id)
        : downvotedBy;
      
      const newUpCount = newUpvotedBy.length;
      const newDownCount = newDownvotedBy.length;
      
      await updateReply(reply.$id, { 
        upCount: newUpCount,
        downCount: newDownCount,
        upvotedBy: newUpvotedBy,
        downvotedBy: newDownvotedBy,
      });
      
      if (newUpCount >= 5 && !reply.isAccepted) {
        await markReplyAsAccepted(reply.$id);
      }
      
      await loadReplies();
    } catch (error) {
      showAlert(t('common.error'), 'Failed to upvote', 'error');
    }
  };

  const handleDownvote = async (reply) => {
    try {
      const upvotedBy = reply.upvotedBy || [];
      const downvotedBy = reply.downvotedBy || [];
      
      if (downvotedBy.includes(user.$id)) {
        showAlert(t('common.error'), t('post.alreadyDownvoted'), 'error');
        return;
      }
      
      const wasUpvoted = upvotedBy.includes(user.$id);
      const newDownvotedBy = [...downvotedBy, user.$id];
      const newUpvotedBy = wasUpvoted 
        ? upvotedBy.filter(id => id !== user.$id)
        : upvotedBy;
      
      const newUpCount = newUpvotedBy.length;
      const newDownCount = newDownvotedBy.length;
      
      await updateReply(reply.$id, { 
        upCount: newUpCount,
        downCount: newDownCount,
        upvotedBy: newUpvotedBy,
        downvotedBy: newDownvotedBy,
      });
      
      await loadReplies();
    } catch (error) {
      showAlert(t('common.error'), 'Failed to downvote', 'error');
    }
  };

  const handleImagesSelected = async () => {
    if (replyImages.length >= 3) {
      showAlert(t('common.error'), t('post.maxImagesReached').replace('{max}', '3'), 'error');
      return;
    }

    Alert.alert(
      t('post.addImage'),
      t('post.selectImageSource'),
      [
        {
          text: t('post.camera'),
          onPress: handleTakePhoto,
        },
        {
          text: t('post.gallery'),
          onPress: handlePickImages,
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handlePickImages = async () => {
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.slice(0, 3 - replyImages.length).map(asset => asset.uri);
        setReplyImages([...replyImages, ...newImages]);
      }
    } catch (error) {
      showAlert(t('common.error'), t('post.imagePickError'), 'error');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert(t('common.error'), t('settings.cameraPermissionRequired'), 'error');
        return;
      }

      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets) {
        setReplyImages([...replyImages, result.assets[0].uri]);
      }
    } catch (error) {
      showAlert(t('common.error'), t('post.cameraError'), 'error');
    }
  };

  const handleRemoveImage = (index) => {
    setReplyImages(replyImages.filter((_, i) => i !== index));
  };

  const cancelEdit = () => {
    setEditingReply(null);
    setReplyText('');
    setReplyImages([]);
    setReplyLinks('');
    setShowLinksInput(false);
  };

  const isPostOwner = user?.$id === post?.userId;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <LinearGradient
        colors={isDarkMode 
          ? ['#1a1a2e', '#16213e', '#0f3460'] 
          : ['#e3f2fd', '#bbdefb', '#90caf9']
        }
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}>
            <GlassContainer borderRadius={borderRadius.round} style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={moderateScale(24)} color={isDarkMode ? "#FFFFFF" : "#1C1C1E"} />
            </GlassContainer>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { fontSize: fontSize(18) }]}>
            {t('post.replies')}
          </Text>
          
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          <GlassContainer borderRadius={borderRadius.xl} style={styles.repliesSection}>
            <View style={styles.repliesHeader}>
              <Ionicons name="chatbubbles-outline" size={moderateScale(24)} color={theme.text} />
              <Text style={[styles.repliesTitle, { fontSize: fontSize(18), color: theme.text }]}>
                {t('post.repliesCount').replace('{count}', replies.length)}
              </Text>
            </View>

            {isLoadingReplies ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { fontSize: fontSize(14), color: theme.textSecondary }]}>
                  {t('common.loading')}
                </Text>
              </View>
            ) : replies.length === 0 ? (
              <View style={styles.emptyReplies}>
                <Ionicons name="chatbubble-outline" size={moderateScale(50)} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { fontSize: fontSize(16), color: theme.textSecondary }]}>
                  {t('post.noReplies')}
                </Text>
                <Text style={[styles.emptySubtext, { fontSize: fontSize(13), color: theme.textSecondary }]}>
                  {t('post.beFirstToReply')}
                </Text>
              </View>
            ) : (
              <View style={styles.repliesList}>
                {replies.map((reply) => (
                  <ReplyCard
                    key={reply.$id}
                    reply={reply}
                    isOwner={reply.userId === user?.$id}
                    isPostOwner={isPostOwner}
                    showAcceptButton={post?.type === 'question'}
                    onEdit={handleEditReply}
                    onDelete={handleDeleteReply}
                    onAccept={handleAcceptReply}
                    onUpvote={handleUpvote}
                    onDownvote={handleDownvote}
                  />
                ))}
              </View>
            )}
          </GlassContainer>

          <GlassContainer borderRadius={borderRadius.xl} style={styles.replyInputSection}>
            {editingReply && (
              <View style={styles.editingBanner}>
                <Text style={[styles.editingText, { fontSize: fontSize(13) }]}>
                  {t('post.editReply')}
                </Text>
                <TouchableOpacity onPress={cancelEdit}>
                  <Ionicons name="close-circle" size={moderateScale(20)} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={[
                styles.replyInput,
                { 
                  fontSize: fontSize(14),
                  color: theme.text,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }
              ]}
              placeholder={t('post.writeReply')}
              placeholderTextColor={theme.textSecondary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={2000}
            />

            <TouchableOpacity
              style={[
                styles.toggleLinksButton,
                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
              ]}
              onPress={() => setShowLinksInput(!showLinksInput)}
              activeOpacity={0.7}>
              <Ionicons 
                name={showLinksInput ? "chevron-up" : "link-outline"} 
                size={moderateScale(18)} 
                color={theme.text} 
              />
              <Text style={[styles.toggleLinksText, { fontSize: fontSize(13), color: theme.text }]}>
                {showLinksInput ? t('common.hide') : t('post.links')}
              </Text>
            </TouchableOpacity>

            {showLinksInput && (
              <TextInput
                style={[
                  styles.linksInput,
                  { 
                    fontSize: fontSize(12),
                    color: theme.text,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  }
                ]}
                placeholder={t('post.linksPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={replyLinks}
                onChangeText={setReplyLinks}
                multiline
              />
            )}

            {replyImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreview}>
                {replyImages.map((image, index) => (
                  <View key={index} style={styles.imagePreviewItem}>
                    <Image source={{ uri: image }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}>
                      <Ionicons name="close-circle" size={moderateScale(24)} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.replyActions}>
              <TouchableOpacity
                style={[
                  styles.imageButton,
                  { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                ]}
                onPress={handleImagesSelected}
                disabled={replyImages.length >= 3}
                activeOpacity={0.7}>
                <Ionicons 
                  name="image-outline" 
                  size={moderateScale(20)} 
                  color={replyImages.length >= 3 ? theme.textSecondary : '#4287f5'} 
                />
                <Text 
                  style={[
                    styles.imageButtonText, 
                    { 
                      fontSize: fontSize(12),
                      color: replyImages.length >= 3 ? theme.textSecondary : '#4287f5'
                    }
                  ]}>
                  {replyImages.length}/3
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { 
                    backgroundColor: replyText.trim() ? '#4287f5' : 'rgba(66,135,245,0.3)',
                    opacity: isSubmitting ? 0.6 : 1,
                  }
                ]}
                onPress={handleAddReply}
                disabled={!replyText.trim() || isSubmitting}
                activeOpacity={0.8}>
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={moderateScale(18)} color="#FFFFFF" />
                    <Text style={[styles.submitButtonText, { fontSize: fontSize(14) }]}>
                      {editingReply ? t('common.save') : t('post.addReply')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </GlassContainer>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
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
    paddingHorizontal: wp(4),
    paddingTop: hp(6),
    paddingBottom: hp(2),
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  backButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerRight: {
    width: moderateScale(40),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(5),
    paddingBottom: hp(12),
  },
  repliesSection: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  repliesTitle: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  emptyReplies: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtext: {
    marginTop: spacing.xs,
  },
  repliesList: {
    gap: spacing.sm,
  },
  replyInputSection: {
    padding: spacing.lg,
  },
  editingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(66,135,245,0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  editingText: {
    color: '#4287f5',
    fontWeight: '600',
  },
  replyInput: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: moderateScale(100),
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  toggleLinksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  toggleLinksText: {
    fontWeight: '500',
  },
  linksInput: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: moderateScale(60),
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  imagePreview: {
    marginBottom: spacing.md,
  },
  imagePreviewItem: {
    marginRight: spacing.sm,
    position: 'relative',
  },
  previewImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  imageButtonText: {
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default PostDetails;
