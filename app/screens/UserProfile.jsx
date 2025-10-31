import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../components/GlassComponents';
import AnimatedBackground from '../components/AnimatedBackground';
import PostCard from '../components/PostCard';
import { getPostsByUser, togglePostLike } from '../../database/posts';
import { wp, hp, fontSize, spacing, moderateScale } from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const UserProfile = ({ route, navigation }) => {
  const { userId, userData } = route.params;
  const { t, theme, isDarkMode } = useAppSettings();
  const { user: currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('about');
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const loadUserPosts = useCallback(async () => {
    if (!userId) return;
    
    setLoadingPosts(true);
    setPostsError(null);
    try {
      const posts = await getPostsByUser(userId, 20, 0);
      setUserPosts(posts);
      setPostsLoaded(true);
    } catch (error) {
      console.error('Error loading user posts:', error);
      setPostsError(error.message);
    } finally {
      setLoadingPosts(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && !postsLoaded) {
      loadUserPosts();
    }
  }, [userId, loadUserPosts, postsLoaded]);

  useEffect(() => {
    if (activeTab === 'posts' && !postsLoaded && userId) {
      loadUserPosts();
    }
  }, [activeTab, postsLoaded, userId, loadUserPosts]);

  const handleFollowToggle = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(!isFollowing);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser?.$id) return;
    
    try {
      const result = await togglePostLike(postId, currentUser.$id);
      
      setUserPosts(prevPosts => 
        prevPosts.map(post => 
          post.$id === postId 
            ? { 
                ...post, 
                likedBy: result.isLiked 
                  ? [...(post.likedBy || []), currentUser.$id]
                  : (post.likedBy || []).filter(id => id !== currentUser.$id),
                likeCount: result.likeCount 
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const getStageKey = (stageValue) => {
    if (!stageValue) return '';
    
    const stageMap = {
      1: 'firstYear',
      2: 'secondYear',
      3: 'thirdYear',
      4: 'fourthYear',
      5: 'fifthYear',
      6: 'sixthYear',
      'first year': 'firstYear',
      'second year': 'secondYear',
      'third year': 'thirdYear',
      'fourth year': 'fourthYear',
      'fifth year': 'fifthYear',
      'sixth year': 'sixthYear',
    };
    
    const normalized = typeof stageValue === 'string' ? stageValue.toLowerCase() : stageValue;
    return stageMap[normalized] || stageValue;
  };

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: spacing.md }]}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.fullName || 'User') + '&size=400&background=667eea&color=fff&bold=true';
  const avatarUri = userData.profilePicture ? userData.profilePicture : defaultAvatar;
  
  const stageKey = getStageKey(userData.stage);
  const stageTranslation = userData.stage ? t(`stages.${stageKey}`) : '';
  const departmentTranslation = userData.department ? t(`departments.${userData.department}`) : '';
  
  const userProfile = {
    name: userData.fullName || 'User',
    email: userData.email || '',
    bio: userData.bio || t('profile.defaultBio'),
    avatar: avatarUri,
    university: userData.university ? t(`universities.${userData.university}`) : '',
    college: userData.college ? t(`colleges.${userData.college}`) : '',
    stage: stageTranslation,
    department: departmentTranslation,
    stats: {
      posts: userPosts.length || userData.postsCount || 0,
      followers: userData.followersCount || 0,
      following: userData.followingCount || 0
    }
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      <GlassContainer borderRadius={borderRadius.lg} style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={moderateScale(20)} color={theme.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('profile.email')}</Text>
            <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]}>{userProfile.email}</Text>
          </View>
        </View>
        
        {userProfile.university && (
          <>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={moderateScale(20)} color={theme.success} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('profile.university')}</Text>
                <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]}>{userProfile.university}</Text>
              </View>
            </View>
          </>
        )}
        
        {userProfile.college && (
          <>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="library-outline" size={moderateScale(20)} color={theme.warning} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('profile.college')}</Text>
                <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]}>{userProfile.college}</Text>
              </View>
            </View>
          </>
        )}
        
        {userProfile.stage && (
          <>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="stats-chart-outline" size={moderateScale(20)} color={theme.secondary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('profile.stage')}</Text>
                <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]}>{userProfile.stage}</Text>
              </View>
            </View>
          </>
        )}
        
        {userProfile.department && (
          <>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={moderateScale(20)} color={theme.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('auth.selectDepartment')}</Text>
                <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]}>{userProfile.department}</Text>
              </View>
            </View>
          </>
        )}
      </GlassContainer>
    </View>
  );

  const renderPostsTab = () => {
    if (loadingPosts) {
      return (
        <View style={styles.tabContent}>
          <GlassContainer borderRadius={borderRadius.lg} style={styles.emptyCard}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.emptyText, { fontSize: fontSize(14), color: theme.textSecondary, marginTop: spacing.sm }]}>
              {t('common.loading')}
            </Text>
          </GlassContainer>
        </View>
      );
    }

    if (postsError) {
      return (
        <View style={styles.tabContent}>
          <GlassContainer borderRadius={borderRadius.lg} style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={moderateScale(40)} color={theme.error} />
            <Text style={[styles.emptyText, { fontSize: fontSize(14), color: theme.textSecondary, marginTop: spacing.sm }]}>
              {t('common.error')}
            </Text>
            <TouchableOpacity onPress={loadUserPosts} style={styles.retryButton}>
              <Text style={[styles.retryButtonText, { color: theme.primary }]}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </GlassContainer>
        </View>
      );
    }

    if (!userPosts || userPosts.length === 0) {
      return (
        <View style={styles.tabContent}>
          <GlassContainer borderRadius={borderRadius.lg} style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={moderateScale(40)} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { fontSize: fontSize(14), color: theme.textSecondary, marginTop: spacing.sm }]}>
              {t('profile.noPosts')}
            </Text>
          </GlassContainer>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {userPosts.map((post, index) => (
          <PostCard
            key={post.$id || index}
            post={{
              ...post,
              userName: userData.fullName,
              userProfilePicture: userData.profilePicture,
            }}
            onReply={() => navigation.navigate('PostDetails', { post })}
            onLike={() => handleLike(post.$id)}
            onUserPress={() => {}}
            isOwner={false}
            isLiked={post.likedBy?.includes(currentUser?.$id)}
            showImages={true}
          />
        ))}
      </View>
    );
  };

  const renderActivityTab = () => (
    <View style={styles.tabContent}>
      <GlassContainer borderRadius={borderRadius.lg} style={styles.emptyCard}>
        <Ionicons name="pulse-outline" size={moderateScale(40)} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { fontSize: fontSize(14), color: theme.textSecondary, marginTop: spacing.sm }]}>{t('profile.noActivity')}</Text>
      </GlassContainer>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AnimatedBackground particleCount={35} />
      <LinearGradient colors={isDarkMode ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#e3f2fd', '#bbdefb', '#90caf9']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <GlassContainer borderRadius={borderRadius.round} style={styles.backButtonInner}>
                <Ionicons name="arrow-back" size={moderateScale(24)} color={isDarkMode ? "#FFFFFF" : "#1C1C1E"} />
              </GlassContainer>
            </TouchableOpacity>
            
            <View style={styles.avatarContainer}>
              <LinearGradient colors={theme.gradient} style={styles.avatarBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={[styles.avatarInner, { backgroundColor: theme.background }]}>
                  <Image 
                    source={{ uri: userProfile.avatar, cache: 'reload' }} 
                    style={styles.avatar}
                  />
                </View>
              </LinearGradient>
            </View>
            
            <Text style={[styles.name, { fontSize: fontSize(22), color: isDarkMode ? '#FFFFFF' : '#1C1C1E' }]}>{userProfile.name}</Text>
            {userProfile.bio && <Text style={[styles.bio, { fontSize: fontSize(13), color: 'rgba(255,255,255,0.8)' }]} numberOfLines={2}>{userProfile.bio}</Text>}
            
            <TouchableOpacity 
              onPress={handleFollowToggle} 
              activeOpacity={0.8}
              disabled={followLoading}
              style={styles.followButtonContainer}
            >
              <LinearGradient
                colors={isFollowing ? ['#64748b', '#475569'] : theme.gradient}
                style={styles.followButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons 
                      name={isFollowing ? 'person-remove-outline' : 'person-add-outline'} 
                      size={moderateScale(18)} 
                      color="#FFFFFF" 
                    />
                    <Text style={[styles.followButtonText, { fontSize: fontSize(14) }]}>
                      {isFollowing ? t('profile.unfollow') : t('profile.follow')}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={[styles.statsContainer, { backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={[styles.statNumber, { fontSize: fontSize(18), color: theme.text }]}>{userProfile.stats.posts}</Text>
                <Text style={[styles.statLabel, { fontSize: fontSize(11), color: theme.textSecondary }]}>{t('profile.posts')}</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={[styles.statNumber, { fontSize: fontSize(18), color: theme.text }]}>{userProfile.stats.followers}</Text>
                <Text style={[styles.statLabel, { fontSize: fontSize(11), color: theme.textSecondary }]}>{t('profile.followers')}</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={[styles.statNumber, { fontSize: fontSize(18), color: theme.text }]}>{userProfile.stats.following}</Text>
                <Text style={[styles.statLabel, { fontSize: fontSize(11), color: theme.textSecondary }]}>{t('profile.following')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.tabsSection}>
            <View style={[styles.tabsContainer, { backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
              <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('about')} activeOpacity={0.7}>
                <Text style={[styles.tabText, { fontSize: fontSize(13), color: activeTab === 'about' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'about' ? '700' : '500' }]}>{t('profile.about')}</Text>
                {activeTab === 'about' && <LinearGradient colors={theme.gradient} style={styles.tabIndicator} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('posts')} activeOpacity={0.7}>
                <Text style={[styles.tabText, { fontSize: fontSize(13), color: activeTab === 'posts' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'posts' ? '700' : '500' }]}>{t('profile.posts')}</Text>
                {activeTab === 'posts' && <LinearGradient colors={theme.gradient} style={styles.tabIndicator} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('activity')} activeOpacity={0.7}>
                <Text style={[styles.tabText, { fontSize: fontSize(13), color: activeTab === 'activity' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'activity' ? '700' : '500' }]}>{t('profile.activity')}</Text>
                {activeTab === 'activity' && <LinearGradient colors={theme.gradient} style={styles.tabIndicator} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
              </TouchableOpacity>
            </View>
            {activeTab === 'about' && renderAboutTab()}
            {activeTab === 'posts' && renderPostsTab()}
            {activeTab === 'activity' && renderActivityTab()}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({ 
  container: { flex: 1 }, 
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  loadingText: {
    fontSize: fontSize(16),
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  gradient: { flex: 1 }, 
  scrollView: { flex: 1 }, 
  scrollContent: { paddingTop: Platform.OS === 'ios' ? hp(5) : hp(3), paddingBottom: hp(10) }, 
  profileHeader: { alignItems: 'center', paddingHorizontal: wp(5), marginBottom: spacing.md, position: 'relative' }, 
  backButton: { position: 'absolute', top: spacing.md, left: wp(5), zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }, 
  backButtonInner: { width: moderateScale(44), height: moderateScale(44), justifyContent: 'center', alignItems: 'center' }, 
  avatarContainer: { marginBottom: spacing.sm }, 
  avatarBorder: { width: moderateScale(110), height: moderateScale(110), borderRadius: moderateScale(55), padding: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }, 
  avatarInner: { width: moderateScale(104), height: moderateScale(104), borderRadius: moderateScale(52), padding: 3 }, 
  avatar: { width: moderateScale(98), height: moderateScale(98), borderRadius: moderateScale(49) }, 
  name: { fontWeight: '700', marginBottom: spacing.xs / 2, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }, 
  bio: { textAlign: 'center', marginBottom: spacing.md, lineHeight: fontSize(18), paddingHorizontal: wp(5) }, 
  followButtonContainer: {
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl * 1.5,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    minWidth: wp(35),
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%', 
    paddingVertical: spacing.md, 
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  }, 
  statItem: { alignItems: 'center', flex: 1 }, 
  statNumber: { fontWeight: '700', marginBottom: 2 }, 
  statLabel: { fontWeight: '500' }, 
  statDivider: { width: 1, height: moderateScale(30), opacity: 0.2 }, 
  tabsSection: { paddingHorizontal: wp(5) }, 
  tabsContainer: { 
    flexDirection: 'row', 
    padding: 3, 
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  }, 
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, position: 'relative' }, 
  tabText: { marginBottom: 2 }, 
  tabIndicator: { position: 'absolute', bottom: 0, height: 2.5, width: '80%', borderRadius: borderRadius.xs }, 
  tabContent: {}, 
  infoCard: { 
    padding: spacing.md,
    overflow: 'hidden',
  }, 
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs }, 
  infoDivider: { height: 1, opacity: 0.1, marginVertical: spacing.xs / 2 },
  infoTextContainer: { flex: 1, flexShrink: 1 }, 
  infoLabel: { fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 }, 
  infoValue: { fontWeight: '500', flexWrap: 'wrap' }, 
  emptyCard: { 
    padding: spacing.lg, 
    alignItems: 'center',
    overflow: 'hidden',
  }, 
  emptyText: { fontWeight: '500', textAlign: 'center' },
});

export default UserProfile;
