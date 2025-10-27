import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';
import { POST_COLORS, POST_ICONS } from '../constants/postConstants';

const PostCard = ({ 
  post, 
  onPress, 
  onUserPress,
  onLike,
  onReply,
  showImages = true,
  isLiked = false,
}) => {
  const { t } = useTranslation();

  const postColor = POST_COLORS[post.postType] || '#6B7280';
  const postIcon = POST_ICONS[post.postType] || 'document-outline';

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    
    return postDate.toLocaleDateString();
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: postColor }]}>
            <Ionicons name={postIcon} size={20} color="#fff" />
          </View>
          <View style={styles.headerInfo}>
            <TouchableOpacity onPress={onUserPress}>
              <Text style={styles.userName}>{post.userName || 'Anonymous'}</Text>
            </TouchableOpacity>
            <Text style={styles.timeText}>
              {formatTimeAgo(post.$createdAt)}
              {post.isEdited && ` • ${t('post.edited')}`}
            </Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: `${postColor}20` }]}>
          <Text style={[styles.typeText, { color: postColor }]}>
            {t(`post.types.${post.postType}`)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.topic} numberOfLines={2}>
          {post.topic}
        </Text>
        <Text style={styles.text} numberOfLines={3}>
          {post.text}
        </Text>

        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {post.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{post.tags.length - 3}</Text>
            )}
          </View>
        )}

        {showImages && post.images && post.images.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imagesContainer}
          >
            {post.images.slice(0, 4).map((imageUrl, index) => (
              <Image 
                key={index}
                source={{ uri: imageUrl }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ))}
            {post.images.length > 4 && (
              <View style={styles.moreImagesOverlay}>
                <Text style={styles.moreImagesText}>
                  +{post.images.length - 4}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <View style={styles.metaContainer}>
        <View style={styles.metaLeft}>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{post.viewCount || 0}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{post.replyCount || 0}</Text>
          </View>
          {post.postType === 'question' && (
            <View style={styles.metaItem}>
              {post.isResolved ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.metaText, { color: '#10B981' }]}>
                    {t('post.resolved')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="help-circle-outline" size={16} color="#F59E0B" />
                  <Text style={[styles.metaText, { color: '#F59E0B' }]}>
                    {t('post.unanswered')}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onLike}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={isLiked ? "#EF4444" : "#6B7280"} 
          />
          <Text style={[styles.actionText, isLiked && { color: "#EF4444" }]}>
            {post.likeCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onReply}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text style={styles.actionText}>{t('post.reply')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color="#6B7280" />
          <Text style={styles.actionText}>{t('common.share')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  content: {
    marginBottom: 12,
  },
  topic: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 24,
  },
  text: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  imagesContainer: {
    marginTop: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  postImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  moreImagesOverlay: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 12,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default PostCard;
