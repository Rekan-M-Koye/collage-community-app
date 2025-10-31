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
  TouchableOpacity,
  Animated,
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
import { PostCardSkeleton } from '../components/SkeletonLoader';
import { 
  wp, 
  hp, 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';
import { FEED_TYPES, getDepartmentsInSameMajor } from '../constants/feedCategories';
import { getPosts, getPostsByDepartments, getAllPublicPosts, togglePostLike } from '../../database/posts';
import { handleNetworkError } from '../utils/networkErrorHandler';
import { useCustomAlert } from '../hooks/useCustomAlert';

const POSTS_PER_PAGE = 15;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

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
  const [showStageModal, setShowStageModal] = useState(false);
  
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const lastTapTime = useRef(0);

  useEffect(() => {
    if (user && user.department) {
      loadPosts(true);
    }
  }, [selectedFeed, selectedStage, user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
        e.preventDefault();
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setTimeout(() => {
          handleRefresh();
        }, 300);
      }
      lastTapTime.current = now;
    });

    return unsubscribe;
  }, [navigation]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        if (diff > 5 && currentScrollY > 50) {
          Animated.timing(headerTranslateY, {
            toValue: -70,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (diff < -5 || currentScrollY < 50) {
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }

        lastScrollY.current = currentScrollY;
      },
    }
  );

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

  const getStagePreviewText = () => {
    if (selectedStage === 'all') return t('filter.all');
    if (selectedStage === 'graduate') return 'G';
    return selectedStage.replace('stage_', '');
  };

  const markPostAsViewed = async (postId) => {
    setUserInteractions(prev => ({
      ...prev,
      [postId]: { ...prev[postId], viewed: true }
    }));
  };

  const handleLike = async (postId) => {
    if (!user?.$id) return;
    
    try {
      const result = await togglePostLike(postId, user.$id);
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.$id === postId 
            ? { 
                ...post, 
                likedBy: result.isLiked 
                  ? [...(post.likedBy || []), user.$id]
                  : (post.likedBy || []).filter(id => id !== user.$id),
                likeCount: result.likeCount 
              }
            : post
        )
      );
    } catch (error) {
      const errorInfo = handleNetworkError(error);
      showAlert(
        errorInfo.isNetworkError ? t('error.noInternet') : t('error.title'),
        errorInfo.message,
        [{ text: t('common.ok') }]
      );
    }
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
        <View style={styles.feedContent}>
          <View style={styles.postContainer}>
            <PostCardSkeleton />
          </View>
          <View style={styles.postContainer}>
            <PostCardSkeleton />
          </View>
          <View style={styles.postContainer}>
            <PostCardSkeleton />
          </View>
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
                  ? 'rgba(255,255,255,0.15)' 
                  : 'rgba(0, 0, 0, 0.05)' 
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
                color={isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0, 0, 0, 0.4)'} 
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
      <AnimatedFlatList
        ref={flatListRef}
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
              onLike={() => handleLike(item.$id)}
              onReply={() => handlePostPress(item)}
              isLiked={item.likedBy?.includes(user?.$id)}
              isOwner={item.userId === user?.$id}
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
          : ['#FFFEF7', '#FFF9E6', '#FFF4D6']
        }
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <AnimatedBackground particleCount={18} />
        
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.headerRow,
              {
                transform: [{ translateY: headerTranslateY }],
              }
            ]}
          >
            <View style={styles.searchIconButton}>
              <SearchBar 
                iconOnly={true}
                onUserPress={handleUserPress}
                onPostPress={handlePostPress}
              />
            </View>

            <View style={styles.feedSelectorWrapper}>
              <FeedSelector 
                selectedFeed={selectedFeed}
                onFeedChange={handleFeedChange}
              />
            </View>

            {selectedFeed === FEED_TYPES.DEPARTMENT && (
              <TouchableOpacity 
                style={styles.stageButton}
                onPress={() => setShowStageModal(true)}
                activeOpacity={0.7}
              >
                <View 
                  style={[
                    styles.stageContainer,
                    {
                      backgroundColor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.04)',
                      borderWidth: 0.5,
                      borderColor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.15)' 
                        : 'rgba(0, 0, 0, 0.08)',
                    }
                  ]}
                >
                  <Ionicons name="filter-outline" size={moderateScale(18)} color={theme.primary} />
                  <Text style={[styles.stageText, { color: theme.text, fontSize: fontSize(12) }]}>
                    {getStagePreviewText()}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </Animated.View>

          <View style={styles.feedContent}>
            {renderFeedContent()}
          </View>
        </View>
      </LinearGradient>

      <StageFilter 
        selectedStage={selectedStage}
        onStageChange={handleStageChange}
        visible={showStageModal}
        onClose={() => setShowStageModal(false)}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    marginBottom: spacing.sm,
    gap: spacing.xs,
    height: 44,
  },
  searchIconButton: {
    width: 44,
    height: 44,
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedSelectorWrapper: {
    flex: 1,
    height: 44,
  },
  stageButton: {
    height: 44,
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: spacing.md,
    gap: 6,
    borderRadius: borderRadius.lg,
  },
  stageText: {
    fontWeight: '600',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontWeight: '500',
  },
  emptyStateCard: {
    padding: spacing.xl * 1.5,
    alignItems: 'center',
    width: '100%',
    maxWidth: moderateScale(400),
  },
  emptyIconContainer: {
    width: moderateScale(130),
    height: moderateScale(130),
    borderRadius: moderateScale(65),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: fontSize(22),
    opacity: 0.9,
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