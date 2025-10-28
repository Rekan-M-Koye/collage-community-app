import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import { POST_COLORS, POST_ICONS } from '../constants/postConstants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STAGE_COLORS = {
  stage_1: '#3B82F6',
  stage_2: '#8B5CF6',
  stage_3: '#10B981',
  stage_4: '#F59E0B',
  stage_5: '#EF4444',
  stage_6: '#EC4899',
  graduate: '#6366F1',
  all: '#6B7280',
};

const PostCard = ({ 
  post, 
  onPress, 
  onUserPress,
  onLike,
  onReply,
  onEdit,
  onDelete,
  onReport,
  showImages = true,
  isLiked = false,
  isOwner = false,
}) => {
  const { t, theme } = useAppSettings();
  const { user } = useUser();
  const [showMenu, setShowMenu] = useState(false);
  const [imageGalleryVisible, setImageGalleryVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const postColor = POST_COLORS[post.postType] || '#6B7280';
  const postIcon = POST_ICONS[post.postType] || 'document-outline';
  const stageColor = STAGE_COLORS[post.stage] || '#6B7280';

  const postOwnerName = user && post.userId === user.$id ? user.fullName : (post.userName || 'Anonymous');
  const postOwnerAvatar = user && post.userId === user.$id ? user.profilePicture : post.userProfilePicture;

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const now = new Date();
      const postDate = new Date(timestamp);
      
      if (isNaN(postDate.getTime())) return '';
      
      const diffMs = now - postDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t('time.justNow');
      if (diffMins < 60) return t('time.minutesAgo').replace('{count}', diffMins);
      if (diffHours < 24) return t('time.hoursAgo').replace('{count}', diffHours);
      if (diffDays < 7) return t('time.daysAgo').replace('{count}', diffDays);
      
      return postDate.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const getDefaultAvatar = (name) => {
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'User') + '&size=200&background=667eea&color=fff&bold=true';
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    if (action === 'edit' && onEdit) onEdit();
    if (action === 'delete' && onDelete) onDelete();
    if (action === 'report' && onReport) onReport();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.topic}\n\n${post.text || ''}`,
        title: post.topic,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openImageGallery = (index) => {
    setSelectedImageIndex(index);
    setImageGalleryVisible(true);
  };

  const renderImageLayout = () => {
    if (!post.images || post.images.length === 0) return null;

    const imageCount = post.images.length;

    if (imageCount === 1) {
      return (
        <TouchableOpacity onPress={() => openImageGallery(0)} activeOpacity={0.9}>
          <Image 
            source={{ uri: post.images[0] }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (imageCount === 2) {
      return (
        <View style={styles.twoImagesContainer}>
          {post.images.slice(0, 2).map((img, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.twoImageWrapper}
              onPress={() => openImageGallery(index)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: img }} style={styles.twoImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (imageCount === 3) {
      return (
        <View style={styles.threeImagesContainer}>
          <TouchableOpacity 
            style={styles.threeImageMain}
            onPress={() => openImageGallery(0)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: post.images[0] }} style={styles.threeMainImage} resizeMode="cover" />
          </TouchableOpacity>
          <View style={styles.threeImageSide}>
            {post.images.slice(1, 3).map((img, index) => (
              <TouchableOpacity 
                key={index + 1}
                style={styles.threeSideWrapper}
                onPress={() => openImageGallery(index + 1)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: img }} style={styles.threeSideImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (imageCount >= 4) {
      return (
        <View style={styles.gridContainer}>
          {post.images.slice(0, 4).map((img, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.gridImageWrapper}
              onPress={() => openImageGallery(index)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: img }} style={styles.gridImage} resizeMode="cover" />
              {index === 3 && imageCount > 4 && (
                <View style={styles.moreImagesOverlay}>
                  <Text style={styles.moreImagesText}>+{imageCount - 4}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onUserPress} activeOpacity={0.8}>
            <Image 
              source={{ uri: postOwnerAvatar || getDefaultAvatar(postOwnerName) }} 
              style={styles.userAvatar}
            />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <TouchableOpacity onPress={onUserPress}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {postOwnerName}
              </Text>
            </TouchableOpacity>
            <View style={styles.metaRow}>
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                {formatTimeAgo(post.$createdAt)}
              </Text>
              {post.isEdited && (
                <>
                  <Text style={[styles.dotSeparator, { color: theme.textTertiary }]}> • </Text>
                  <Text style={[styles.editedText, { color: theme.textTertiary }]}>{t('post.edited')}</Text>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.stageBadge, { backgroundColor: `${stageColor}15`, borderColor: stageColor }]}>
            <Text style={[styles.stageText, { color: stageColor }]}>
              {t(`stages.${post.stage}`)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.6}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.typeBadge, { backgroundColor: `${postColor}15`, borderLeftColor: postColor }]}>
        <Ionicons name={postIcon} size={14} color={postColor} />
        <Text style={[styles.typeText, { color: postColor }]}>
          {t(`post.types.${post.postType}`)}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.topic, { color: theme.text }]} numberOfLines={2}>
          {post.topic}
        </Text>
        {post.text && (
          <Text style={[styles.text, { color: theme.textSecondary }]} numberOfLines={4}>
            {post.text}
          </Text>
        )}

        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.border }]}>
                <Text style={[styles.tagText, { color: theme.textSecondary }]}>#{tag}</Text>
              </View>
            ))}
            {post.tags.length > 3 && (
              <Text style={[styles.moreTagsText, { color: theme.textTertiary }]}>+{post.tags.length - 3}</Text>
            )}
          </View>
        )}

        {showImages && renderImageLayout()}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.footerLeft}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onLike}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? "#EF4444" : theme.textSecondary} 
            />
            <Text style={[styles.actionText, { color: isLiked ? "#EF4444" : theme.textSecondary }]}>
              {post.likeCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onReply}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              {t('post.reply')} ({post.replyCount || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footerRight}>
          <View style={styles.statsItem}>
            <Ionicons name="eye-outline" size={14} color={theme.textTertiary} />
            <Text style={[styles.statsText, { color: theme.textTertiary }]}>{post.viewCount || 0}</Text>
          </View>
          {post.postType === 'question' && (
            <View style={styles.statsItem}>
              {post.isResolved ? (
                <>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={[styles.statsText, { color: '#10B981' }]}>
                    {t('post.resolved')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="help-circle-outline" size={14} color="#F59E0B" />
                  <Text style={[styles.statsText, { color: '#F59E0B' }]}>
                    {t('post.unanswered')}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuModal, { backgroundColor: theme.cardBackground }]}>
            {isOwner ? (
              <>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleMenuAction('edit')}
                >
                  <Ionicons name="create-outline" size={22} color="#3B82F6" />
                  <Text style={[styles.menuText, { color: '#3B82F6' }]}>
                    {t('common.edit')}
                  </Text>
                </TouchableOpacity>
                <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleMenuAction('delete')}
                >
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  <Text style={[styles.menuText, { color: '#EF4444' }]}>
                    {t('common.delete')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => handleMenuAction('report')}
              >
                <Ionicons name="flag-outline" size={22} color="#F59E0B" />
                <Text style={[styles.menuText, { color: '#F59E0B' }]}>
                  {t('post.report')}
                </Text>
              </TouchableOpacity>
            )}
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => setShowMenu(false)}
            >
              <Ionicons name="close-outline" size={22} color={theme.textSecondary} />
              <Text style={[styles.menuText, { color: theme.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={imageGalleryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageGalleryVisible(false)}
      >
        <View style={styles.galleryContainer}>
          <TouchableOpacity 
            style={styles.galleryCloseButton}
            onPress={() => setImageGalleryVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: selectedImageIndex * SCREEN_WIDTH, y: 0 }}
          >
            {post.images && post.images.map((img, index) => (
              <View key={index} style={styles.galleryImageWrapper}>
                <Image 
                  source={{ uri: img }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          
          {post.images && post.images.length > 1 && (
            <View style={styles.galleryCounter}>
              <Text style={styles.galleryCounterText}>
                {selectedImageIndex + 1} / {post.images.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 13,
  },
  dotSeparator: {
    fontSize: 13,
  },
  editedText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuButton: {
    padding: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderLeftWidth: 4,
    gap: 8,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    marginBottom: 14,
  },
  topic: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 26,
  },
  text: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  singleImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    marginTop: 14,
  },
  twoImagesContainer: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  twoImageWrapper: {
    flex: 1,
  },
  twoImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  threeImagesContainer: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
    height: 280,
  },
  threeImageMain: {
    flex: 2,
  },
  threeMainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  threeImageSide: {
    flex: 1,
    gap: 8,
  },
  threeSideWrapper: {
    flex: 1,
  },
  threeSideImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 8,
  },
  gridImageWrapper: {
    width: '48.5%',
    height: 160,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    borderRadius: 18,
    width: '85%',
    maxWidth: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 22,
    gap: 14,
  },
  menuText: {
    fontSize: 17,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  galleryCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryImageWrapper: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  galleryCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  galleryCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PostCard;