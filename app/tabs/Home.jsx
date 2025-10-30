import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  StatusBar,
  Platform,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import { GlassContainer } from '../components/GlassComponents';
import AnimatedBackground from '../components/AnimatedBackground';
import SearchBar from '../components/SearchBar';
import FeedSelector from '../components/FeedSelector';
import StageFilter from '../components/StageFilter';
import PostCard from '../components/PostCard';
import { 
  wp, 
  hp, 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';
import { FEED_TYPES, getDepartmentsInSameMajor } from '../constants/feedCategories';
import { getPosts, getPostsByDepartments, getAllPublicPosts } from '../../database/posts';
import { handleNetworkError } from '../utils/networkErrorHandler';
import { useCustomAlert } from '../hooks/useCustomAlert';

const POSTS_PER_PAGE = 15;

const Home = ({ navigation }) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const { user } = useUser();
  const { showAlert } = useCustomAlert();
  const [selectedFeed, setSelectedFeed] = useState(FEED_TYPES.DEPARTMENT);
  const [selectedStage, setSelectedStage] = useState('all');
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [userInteractions, setUserInteractions] = useState({});

  useEffect(() => {
    if (user && user.department) {
      loadPosts(true);
    }
  }, [selectedFeed, selectedStage, user]);

  const loadPosts = async (reset = false) => {
    if (!user || !user.department) {
      return;
    }

    const currentPage = reset ? 0 : page;
    const loadingState = reset ? setIsLoadingPosts : setIsLoadingMore;
    
    loadingState(true);

    try {
      let fetchedPosts = [];
      const offset = currentPage * POSTS_PER_PAGE;

      if (selectedFeed === FEED_TYPES.DEPARTMENT) {
        const filters = { 
          department: user.department
        };
        if (selectedStage !== 'all') {
          filters.stage = selectedStage;
        }
        fetchedPosts = await getPosts(filters, POSTS_PER_PAGE, offset);
      } else if (selectedFeed === FEED_TYPES.MAJOR) {
        const relatedDepartments = getDepartmentsInSameMajor(user.department);
        fetchedPosts = await getPostsByDepartments(
          relatedDepartments,
          'all',
          POSTS_PER_PAGE,
          offset
        );
      } else if (selectedFeed === FEED_TYPES.PUBLIC) {
        fetchedPosts = await getAllPublicPosts(POSTS_PER_PAGE, offset);
      }

      if (reset) {
        setPosts(fetchedPosts);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
        setPage(prev => prev + 1);
      }

      setHasMore(fetchedPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
      const errorInfo = handleNetworkError(error);
      showAlert(
        errorInfo.isNetworkError ? t('error.noInternet') : t('error.title'),
        errorInfo.message,
        [{ text: t('common.ok') }]
      );
    } finally {
      loadingState(false);
      if (reset) setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPosts(true);
  }, [selectedFeed, selectedStage, user]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoadingPosts) {
      loadPosts(false);
    }
  };

  const handleUserPress = (userData) => {
    navigation.navigate('UserProfile', { userId: userData.$id });
  };

  const handlePostPress = (post) => {
    navigation.navigate('PostDetails', { postId: post.$id });
  };

  const handleFeedChange = (feedType) => {
    setSelectedFeed(feedType);
    if (feedType !== FEED_TYPES.DEPARTMENT) {
      setSelectedStage('all');
    }
    setPosts([]);
    setPage(0);
    setHasMore(true);
  };

  const handleStageChange = (stage) => {
    setSelectedStage(stage);
    setPosts([]);
    setPage(0);
    setHasMore(true);
  };

  const markPostAsViewed = async (postId) => {
    setUserInteractions(prev => ({
      ...prev,
      [postId]: { ...prev[postId], viewed: true }
    }));
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  };

  const renderFeedContent = () => {
    if (isLoadingPosts && posts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text, fontSize: fontSize(14) }]}>
            {t('feed.loadingPosts')}
          </Text>
        </View>
      );
    }

    if (posts.length === 0 && !isLoadingPosts) {
      return (
        <View style={styles.centerContainer}>
          <GlassContainer 
            borderRadius={borderRadius.xl}
            style={styles.emptyStateCard}>
            <View style={[
              styles.emptyIconContainer, 
              { 
                backgroundColor: isDarkMode 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(0, 122, 255, 0.1)' 
              }
            ]}>
              <Ionicons 
                name={
                  selectedFeed === FEED_TYPES.DEPARTMENT 
                    ? 'people-outline' 
                    : selectedFeed === FEED_TYPES.MAJOR 
                    ? 'school-outline' 
                    : 'globe-outline'
                } 
                size={moderateScale(64)} 
                color={isDarkMode ? 'rgba(255,255,255,0.6)' : theme.primary} 
              />
            </View>
            <Text style={[
              styles.emptyTitle, 
              { 
                fontSize: fontSize(20), 
                color: theme.text
              }
            ]}>
              {t('feed.noPosts')}
            </Text>
            <Text style={[
              styles.emptyMessage, 
              { 
                fontSize: fontSize(14), 
                color: theme.subText
              }
            ]}>
              {selectedFeed === FEED_TYPES.DEPARTMENT && t('home.departmentFeedEmpty')}
              {selectedFeed === FEED_TYPES.MAJOR && t('home.majorFeedEmpty')}
              {selectedFeed === FEED_TYPES.PUBLIC && t('home.publicFeedEmpty')}
            </Text>
          </GlassContainer>
        </View>
      );
    }

    return (
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <PostCard
              post={item}
              onPress={() => {
                markPostAsViewed(item.$id);
                handlePostPress(item);
              }}
              onUserPress={() => handleUserPress({ $id: item.userId })}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsListContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      
      <LinearGradient
        colors={isDarkMode 
          ? ['#1a1a2e', '#16213e', '#0f3460'] 
          : ['#e3f2fd', '#bbdefb', '#90caf9']
        }
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <AnimatedBackground particleCount={18} />
        
        <View style={styles.content}>
          <View style={styles.searchSection}>
            <SearchBar 
              onUserPress={handleUserPress}
              onPostPress={handlePostPress}
            />
          </View>

          <View style={styles.feedSelectorSection}>
            <FeedSelector 
              selectedFeed={selectedFeed}
              onFeedChange={handleFeedChange}
            />
          </View>

          {selectedFeed === FEED_TYPES.DEPARTMENT && (
            <View style={styles.filterSection}>
              <StageFilter 
                selectedStage={selectedStage}
                onStageChange={handleStageChange}
                visible={true}
              />
            </View>
          )}

          <View style={styles.feedContent}>
            {renderFeedContent()}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(5),
    paddingBottom: hp(2),
  },
  searchSection: {
    paddingHorizontal: wp(4),
    marginBottom: spacing.sm,
  },
  feedSelectorSection: {
    paddingHorizontal: wp(4),
    marginBottom: spacing.sm,
  },
  filterSection: {
    paddingHorizontal: wp(4),
  },
  feedContent: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  loadingText: {
    marginTop: spacing.md,
  },
  emptyStateCard: {
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: moderateScale(400),
  },
  emptyIconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: fontSize(22),
  },
  postContainer: {
    paddingHorizontal: wp(4),
    marginBottom: spacing.md,
  },
  postsListContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});

export default Home;