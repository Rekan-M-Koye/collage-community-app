import React, { useState, useEffect, useCallback } from 'react';
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
  SectionList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import AnimatedBackground from '../components/AnimatedBackground';
import ChatListItem from '../components/ChatListItem';
import { 
  initializeUserGroups,
  getAllUserChats,
} from '../../database/chatHelpers';
import { getUnreadCount } from '../../database/chats';
import { 
  wp, 
  hp, 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';
import { useChatList } from '../hooks/useRealtimeSubscription';

const Chats = ({ navigation }) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [defaultGroups, setDefaultGroups] = useState([]);
  const [customGroups, setCustomGroups] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  const stageToValue = (stage) => {
    if (!stage) return null;
    const stageMap = {
      'firstYear': '1',
      'secondYear': '2',
      'thirdYear': '3',
      'fourthYear': '4',
      'fifthYear': '5',
      'sixthYear': '6',
    };
    return stageMap[stage] || stage;
  };

  // Real-time subscription for chat updates (new messages, unread count changes)
  const handleRealtimeChatUpdate = useCallback(async (payload) => {
    // Update the chat in the appropriate list
    const updateChatInList = (list, setList) => {
      const index = list.findIndex(c => c.$id === payload.$id);
      if (index >= 0) {
        setList(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...payload };
          // Re-sort by lastMessageAt
          return updated.sort((a, b) => 
            new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
          );
        });
        return true;
      }
      return false;
    };

    // Try updating in each list
    if (!updateChatInList(defaultGroups, setDefaultGroups)) {
      if (!updateChatInList(customGroups, setCustomGroups)) {
        updateChatInList(privateChats, setPrivateChats);
      }
    }

    // Refresh unread count for this chat
    if (user?.$id) {
      const count = await getUnreadCount(payload.$id, user.$id);
      setUnreadCounts(prev => ({ ...prev, [payload.$id]: count }));
    }
  }, [defaultGroups, customGroups, privateChats, user?.$id]);

  // Subscribe to chat list updates
  useChatList(user?.$id, handleRealtimeChatUpdate, !!user?.$id);

  useEffect(() => {
    if (user?.department) {
      initializeAndLoadChats();
    } else {
      setLoading(false);
      setInitializing(false);
    }
  }, [user]);

  const initializeAndLoadChats = async () => {
    try {
      setInitializing(true);
      const stageValue = stageToValue(user?.stage);
      
      await initializeUserGroups(user.department, stageValue);
      
      setInitializing(false);
      await loadChats();
    } catch (error) {
      setInitializing(false);
      setLoading(false);
    }
  };

  const loadUnreadCounts = async (allChats) => {
    if (!user?.$id || allChats.length === 0) return;
    
    const counts = {};
    await Promise.all(
      allChats.map(async (chat) => {
        const count = await getUnreadCount(chat.$id, user.$id);
        counts[chat.$id] = count;
      })
    );
    setUnreadCounts(counts);
  };

  const loadChats = async () => {
    if (!user?.department) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const stageValue = stageToValue(user.stage);
      
      const chats = await getAllUserChats(user.$id, user.department, stageValue);
      
      setDefaultGroups(chats.defaultGroups || []);
      setCustomGroups(chats.customGroups || []);
      setPrivateChats(chats.privateChats || []);
      
      // Load unread counts for all chats
      const allChats = [
        ...(chats.defaultGroups || []),
        ...(chats.customGroups || []),
        ...(chats.privateChats || []),
      ];
      loadUnreadCounts(allChats);
    } catch (error) {
      setDefaultGroups([]);
      setCustomGroups([]);
      setPrivateChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat) => {
    navigation.navigate('ChatRoom', { chat });
  };

  const getSectionData = () => {
    const sections = [];

    if (defaultGroups.length > 0) {
      sections.push({
        title: t('chats.classGroups'),
        data: defaultGroups,
        icon: 'school',
        color: '#3B82F6',
      });
    }

    if (customGroups.length > 0) {
      sections.push({
        title: t('chats.myGroups'),
        data: customGroups,
        icon: 'people-circle',
        color: '#F59E0B',
      });
    }

    if (privateChats.length > 0) {
      sections.push({
        title: t('chats.directChats'),
        data: privateChats,
        icon: 'chatbubble',
        color: '#10B981',
      });
    }

    return sections;
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconContainer, { backgroundColor: `${section.color}15` }]}>
        <Ionicons name={section.icon} size={moderateScale(14)} color={section.color} />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize(13) }]}>
        {section.title}
      </Text>
      <View style={[styles.sectionBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
        <Text style={[styles.sectionBadgeText, { color: theme.textSecondary, fontSize: fontSize(11) }]}>
          {section.data.length}
        </Text>
      </View>
    </View>
  );

  const renderChatItem = ({ item }) => (
    <ChatListItem 
      chat={item} 
      onPress={() => handleChatPress(item)}
      currentUserId={user?.$id}
      unreadCount={unreadCounts[item.$id] || 0}
    />
  );

  const renderEmpty = () => {
    if (loading || initializing) {
      return null;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: isDarkMode ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.08)' }]}>
          <Ionicons name="chatbubbles" size={moderateScale(56)} color={theme.primary} />
        </View>
        <Text style={[styles.emptyTitle, { fontSize: fontSize(20), color: theme.text }]}>
          {t('chats.emptyTitle')}
        </Text>
        <Text style={[styles.emptyMessage, { fontSize: fontSize(14), color: theme.textSecondary }]}>
          {t('chats.emptyMessage')}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text, fontSize: fontSize(26) }]}>
            {t('chats.title')}
          </Text>
          {user?.department && (
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontSize: fontSize(13) }]}>
              {user.department}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.quickActionsContainer}>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('UserSearch')}>
            <Ionicons name="search" size={moderateScale(18)} color={theme.primary} />
            <Text style={[styles.quickActionButtonText, { color: theme.text, fontSize: fontSize(13) }]}>
              {t('chats.searchUsers')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CreateGroup')}>
            <Ionicons name="add-circle" size={moderateScale(18)} color="#F59E0B" />
            <Text style={[styles.quickActionButtonText, { color: theme.text, fontSize: fontSize(13) }]}>
              {t('chats.createGroup')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (initializing) {
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
            : ['#f0f4ff', '#d8e7ff', '#c0deff']
          }
          style={styles.gradient}>
          <AnimatedBackground particleCount={18} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary, fontSize: fontSize(14) }]}>
              {t('chats.settingUpGroups')}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (loading && !refreshing) {
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
            : ['#f0f4ff', '#d8e7ff', '#c0deff']
          }
          style={styles.gradient}>
          <AnimatedBackground particleCount={18} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary, fontSize: fontSize(14) }]}>
              {t('chats.loadingChats')}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const sections = getSectionData();
  const hasContent = sections.length > 0;

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
          : ['#f0f4ff', '#d8e7ff', '#c0deff']
        }
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <AnimatedBackground particleCount={18} />
        
        <View style={styles.content}>
          {hasContent ? (
            <SectionList
              sections={sections}
              renderItem={renderChatItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={(item) => item.$id}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={renderHeader}
              stickySectionHeadersEnabled={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              }
            />
          ) : (
            <FlatList
              data={[]}
              renderItem={() => null}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              }
            />
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(5),
    paddingBottom: hp(12),
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginTop: spacing.md,
  },
  quickActionsTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  quickActionButtonText: {
    fontWeight: '500',
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionIconContainer: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  sectionTitle: {
    fontWeight: '600',
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: moderateScale(8),
  },
  sectionBadgeText: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(5),
  },
  emptyIconContainer: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: fontSize(20),
    paddingHorizontal: wp(5),
  },
});

export default Chats;