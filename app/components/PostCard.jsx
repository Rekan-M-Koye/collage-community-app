import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Share,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import { POST_COLORS, POST_ICONS } from '../constants/postConstants';
import PostCardImageGallery from './postCard/PostCardImageGallery';
import PostCardMenu from './postCard/PostCardMenu';
import { 
  postCardStyles as styles, 
  STAGE_COLORS, 
  sanitizeTag, 
  formatTimeAgo, 
  getDefaultAvatar 
} from './postCard/styles';

const PostCard = ({ 
  post, 
  onUserPress,
  onLike,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onMarkResolved,
  onTagPress,
  showImages = true,
  isLiked = false,
  isOwner = false,
}) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const { user } = useUser();
  const [showMenu, setShowMenu] = useState(false);
  const [imageGalleryVisible, setImageGalleryVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [resolved, setResolved] = useState(post.isResolved || false);
  const [isExpanded, setIsExpanded] = useState(false);

  const postColor = POST_COLORS[post.postType] || '#6B7280';
  const postIcon = POST_ICONS[post.postType] || 'document-outline';
  const stageColor = STAGE_COLORS[post.stage] || '#6B7280';

  const isCurrentUserPost = user && post.userId === user.$id;
  const postOwnerName = isCurrentUserPost 
    ? user.fullName 
    : (post.userName || post.authorName || t('common.user'));
  const postOwnerAvatar = isCurrentUserPost 
    ? user.profilePicture 
    : (post.userProfilePicture || post.authorPhoto);

  useEffect(() => {
    setLiked(isLiked);
    setLikeCount(post.likeCount || 0);
  }, [isLiked, post.likeCount]);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const previousLiked = liked;
    const previousCount = likeCount;
    
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    
    try {
      if (onLike) {
        await onLike();
      }
    } catch (error) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.topic}\n\n${post.text || ''}`,
        title: post.topic,
      });
    } catch (error) {
      // Share cancelled
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
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.card || theme.cardBackground,
          borderColor: theme.border,
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onUserPress} activeOpacity={0.8}>
          <Image 
            source={{ uri: postOwnerAvatar || getDefaultAvatar(postOwnerName) }} 
            style={styles.userAvatar}
          />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={onUserPress} style={styles.userNameContainer}>
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                {postOwnerName}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {formatTimeAgo(post.$createdAt, t)}
            </Text>
            {post.isEdited === true && (
              <Text style={[styles.editedText, { color: theme.textTertiary }]}>
                ({t('post.edited')})
              </Text>
            )}
          </View>
          <View style={styles.badgesRow}>
            <View style={[styles.stageBadge, { backgroundColor: isDarkMode ? `${stageColor}15` : `${stageColor}20`, borderColor: stageColor }]}>
              <Text style={[styles.stageText, { color: stageColor }]}>
                {t(`stages.${post.stage}`)}
              </Text>
            </View>
            <View style={[styles.typeBadgeInline, { backgroundColor: isDarkMode ? `${postColor}10` : `${postColor}18` }]}>
              <Ionicons name={postIcon} size={10} color={postColor} />
              <Text style={[styles.typeTextInline, { color: postColor }]}>
                {t(`post.types.${post.postType}`)}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
          activeOpacity={0.6}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.topic, { color: theme.text }]} numberOfLines={2} selectable>
          {post.topic}
        </Text>
        {post.text && (
          <Text 
            style={[styles.text, { color: theme.textSecondary }]} 
            numberOfLines={isExpanded ? undefined : 3} 
            selectable
          >
            {post.text}
          </Text>
        )}

        {post.links && post.links.length > 0 && (
          <View style={styles.linksContainer}>
            {(isExpanded ? post.links : post.links.slice(0, 2)).map((link, index) => {
              const isEmail = link.includes('@') && !link.startsWith('http');
              const linkUrl = isEmail ? `mailto:${link}` : link;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => Linking.openURL(linkUrl)}
                  activeOpacity={0.7}
                  style={styles.linkChipDisplay}
                >
                  <Ionicons 
                    name={isEmail ? 'mail-outline' : 'link-outline'} 
                    size={14} 
                    color="#3B82F6" 
                  />
                  <Text style={styles.linkText} numberOfLines={1}>
                    {link}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {(isExpanded ? post.tags : post.tags.slice(0, 4)).map((tag, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.tag, { backgroundColor: isDarkMode ? `${theme.primary}20` : `${theme.primary}15` }]}
                onPress={() => onTagPress && onTagPress(sanitizeTag(tag))}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, { color: theme.primary || '#3B82F6' }]}>#{sanitizeTag(tag)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {((post.text && post.text.length > 150) || 
          (post.links && post.links.length > 2) || 
          (post.tags && post.tags.length > 4)) && (
          <TouchableOpacity 
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.seeMoreButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeMoreText, { color: theme.primary || '#3B82F6' }]}>
              {isExpanded ? t('common.seeLess') : t('common.seeMore')}
            </Text>
          </TouchableOpacity>
        )}

        {showImages && renderImageLayout()}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.footerLeft}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
            disabled={isLiking}
          >
            <Ionicons 
              name={liked ? "heart" : "heart-outline"} 
              size={20} 
              color={liked ? "#EF4444" : theme.textSecondary} 
            />
            <Text style={[styles.actionText, { color: liked ? "#EF4444" : theme.textSecondary }]}>
              {likeCount}
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
              {resolved ? (
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

      {/* Menu Modal */}
      <PostCardMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        isOwner={isOwner}
        isQuestion={post.postType === 'question'}
        isResolved={resolved}
        onEdit={onEdit}
        onDelete={onDelete}
        onReport={onReport}
        onMarkResolved={() => {
          if (onMarkResolved) onMarkResolved();
          setResolved(true);
        }}
        theme={theme}
        t={t}
      />

      {/* Image Gallery Modal */}
      <Modal
        visible={imageGalleryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageGalleryVisible(false)}
      >
        <PostCardImageGallery
          images={post.images || []}
          initialIndex={selectedImageIndex}
          onClose={() => setImageGalleryVisible(false)}
          t={t}
        />
      </Modal>
    </View>
  );
};

export default memo(PostCard);
