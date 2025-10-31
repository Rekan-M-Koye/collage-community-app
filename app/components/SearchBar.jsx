import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  Modal,
  Keyboard,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import { GlassContainer } from './GlassComponents';
import { wp, hp, fontSize, spacing, moderateScale } from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';
import UserCard from './UserCard';
import PostCard from './PostCard';
import { searchUsers } from '../../database/users';
import { searchPosts } from '../../database/posts';

const SearchBar = ({ onUserPress, onPostPress, iconOnly = false }) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({
    users: [],
    posts: [],
  });
  const searchTimeout = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      setIsSearching(true);
      
      searchTimeout.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 1000);
    } else {
      setResults({ users: [], posts: [] });
      setIsSearching(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query) => {
    if (!query || query.trim().length === 0) {
      setIsSearching(false);
      return;
    }

    try {
      console.log('Searching for:', query.trim());
      const [usersResults, postsResults] = await Promise.all([
        searchUsers(query.trim(), 5),
        searchPosts(query.trim(), user?.department, user?.major, 10)
      ]);

      console.log('Search results - Users:', usersResults?.length, 'Posts:', postsResults?.length);

      setResults({
        users: usersResults || [],
        posts: postsResults || [],
      });
    } catch (error) {
      console.error('Search error:', error);
      setResults({ users: [], posts: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      performSearch(searchQuery);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults({ users: [], posts: [] });
  };

  const handleOpenModal = () => {
    setIsModalVisible(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSearchQuery('');
    setResults({ users: [], posts: [] });
    Keyboard.dismiss();
  };

  const handleUserSelect = (user) => {
    handleCloseModal();
    if (onUserPress) {
      onUserPress(user);
    }
  };

  const handlePostSelect = (post) => {
    handleCloseModal();
    if (onPostPress) {
      onPostPress(post);
    }
  };

  const renderSearchResults = () => {
    const hasResults = results.users.length > 0 || results.posts.length > 0;
    const hasQuery = searchQuery.trim().length > 0;

    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {t('search.searching')}
          </Text>
        </View>
      );
    }

    if (!hasQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search-outline"
            size={moderateScale(64)}
            color={theme.subText}
          />
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            {t('search.placeholder')}
          </Text>
        </View>
      );
    }

    if (!hasResults) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search-outline"
            size={moderateScale(48)}
            color={theme.subText}
          />
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            {t('search.noResults')}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={[
          ...(results.users.length > 0 ? [{ type: 'header', title: t('search.users') }] : []),
          ...results.users.map(user => ({ type: 'user', data: user })),
          ...(results.posts.length > 0 ? [{ type: 'header', title: t('search.posts') }] : []),
          ...results.posts.map(post => ({ type: 'post', data: post })),
        ]}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Text style={[styles.sectionHeader, { color: theme.text }]}>
                {item.title}
              </Text>
            );
          } else if (item.type === 'user') {
            return (
              <TouchableOpacity
                onPress={() => handleUserSelect(item.data)}
                style={styles.resultItem}
                activeOpacity={0.7}
              >
                <UserCard user={item.data} compact />
              </TouchableOpacity>
            );
          } else if (item.type === 'post') {
            return (
              <View style={styles.resultItem}>
                <PostCard
                  post={item.data}
                  onPress={() => handlePostSelect(item.data)}
                  onUserPress={() => {
                    const userId = item.data.userId;
                    handleCloseModal();
                    if (onUserPress && userId) {
                      onUserPress({ $id: userId });
                    }
                  }}
                />
              </View>
            );
          }
        }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.resultsListContent}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        {iconOnly ? (
          <View 
            style={[
              styles.iconOnlyButton,
              {
                backgroundColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.04)',
                borderWidth: 0.5,
                borderColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'rgba(0, 0, 0, 0.08)',
                borderRadius: borderRadius.md,
              }
            ]}
          >
            <Ionicons
              name="search-outline"
              size={moderateScale(22)}
              color={theme.text}
            />
          </View>
        ) : (
          <GlassContainer borderRadius={borderRadius.lg} style={styles.searchButton}>
            <Ionicons
              name="search-outline"
              size={moderateScale(20)}
              color={theme.subText}
              style={styles.searchIcon}
            />
            <Text style={[styles.searchButtonText, { color: theme.subText, fontSize: fontSize(14) }]}>
              {t('search.placeholder')}
            </Text>
          </GlassContainer>
        )}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.searchHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.backButton}>
              <Ionicons name="arrow-back" size={moderateScale(24)} color={theme.text} />
            </TouchableOpacity>
            
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search-outline"
                size={moderateScale(20)}
                color={theme.subText}
                style={styles.searchIcon}
              />
              <TextInput
                ref={searchInputRef}
                style={[
                  styles.searchInput,
                  {
                    color: theme.text,
                    fontSize: fontSize(16),
                  },
                ]}
                placeholder={t('search.placeholder')}
                placeholderTextColor={theme.input.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                  <Ionicons
                    name="close-circle"
                    size={moderateScale(20)}
                    color={theme.subText}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.resultsContainer}>
            {renderSearchResults()}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  iconOnlyButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchButtonText: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(2),
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize(14),
    textAlign: 'center',
  },
  resultsListContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    fontWeight: 'bold',
    fontSize: fontSize(18),
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  resultItem: {
    marginBottom: spacing.sm,
  },
  postPreview: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  postTitle: {
    fontWeight: '600',
    fontSize: fontSize(15),
    marginBottom: spacing.xs,
  },
  postContent: {
    fontSize: fontSize(13),
    lineHeight: fontSize(18),
  },
});

export default SearchBar;
