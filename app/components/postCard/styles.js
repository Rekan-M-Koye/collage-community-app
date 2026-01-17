import { StyleSheet } from 'react-native';

export const postCardStyles = StyleSheet.create({
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
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  userNameContainer: {
    flex: 1,
    marginRight: 5,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '400',
  },
  editedText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  stageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  stageText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 2,
  },
  typeTextInline: {
    fontSize: 9,
    fontWeight: '600',
  },
  menuButton: {
    padding: 6,
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
  linksContainer: {
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  linkChipDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 13,
    color: '#3B82F6',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  seeMoreButton: {
    marginTop: 8,
    marginBottom: 4,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
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
  // Compact mode styles
  cardCompact: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 16,
  },
  headerCompact: {
    marginBottom: 8,
  },
  userAvatarCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  contentCompact: {
    marginBottom: 8,
  },
  topicCompact: {
    fontSize: 15,
    marginBottom: 4,
    lineHeight: 22,
  },
  footerCompact: {
    paddingTop: 8,
    marginTop: 8,
  },
  // Compact image styles
  compactImageContainer: {
    marginTop: 8,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  compactImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  compactImageCount: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  compactImageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export const STAGE_COLORS = {
  stage_1: '#3B82F6',
  stage_2: '#8B5CF6',
  stage_3: '#10B981',
  stage_4: '#F59E0B',
  stage_5: '#EF4444',
  stage_6: '#EC4899',
  graduate: '#6366F1',
  all: '#6B7280',
};

export const sanitizeTag = (tag) => {
  if (!tag) return '';
  return String(tag).replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s_-]/g, '').trim();
};

export const formatTimeAgo = (timestamp, t) => {
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
    return '';
  }
};

export const getDefaultAvatar = (name) => {
  const sanitizedName = (name || 'User').replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
  return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(sanitizedName) + '&size=200&background=667eea&color=fff&bold=true';
};
