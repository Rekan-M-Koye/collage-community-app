import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useUser } from '../../context/UserContext';
import { GlassInput } from '../../components/GlassComponents';
import AnimatedBackground from '../../components/AnimatedBackground';
import ProfilePicture from '../../components/ProfilePicture';
import { getUsersByDepartment, getFriends, searchUsers } from '../../../database/users';
import { createCustomGroup } from '../../../database/chatHelpers';
import { 
  wp, 
  hp, 
  fontSize, 
  spacing, 
  moderateScale,
} from '../../utils/responsive';
import { borderRadius } from '../../theme/designTokens';

const CreateGroup = ({ navigation }) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const { user: currentUser } = useUser();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    if (!currentUser?.$id) {
      setLoading(false);
      return;
    }

    try {
      // Load friends first (priority)
      const userFriends = await getFriends(currentUser.$id);
      const filteredFriends = userFriends.filter(u => u.$id !== currentUser.$id);
      setFriends(filteredFriends);
      
      // Also load department users
      if (currentUser.department) {
        const deptUsers = await getUsersByDepartment(currentUser.department, 50);
        // Filter out current user and friends (to avoid duplicates)
        const friendIds = filteredFriends.map(f => f.$id);
        const nonFriendDeptUsers = deptUsers.filter(
          u => u.$id !== currentUser.$id && !friendIds.includes(u.$id)
        );
        setDepartmentUsers(nonFriendDeptUsers);
      }
    } catch (error) {
      setFriends([]);
      setDepartmentUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const debounceTimeout = React.useRef(null);

  const handleSearch = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchUsers(query, 20);
      const filteredResults = results.filter(u => u.$id !== currentUser?.$id);
      setSearchResults(filteredResults);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [currentUser]);

  const handleQueryChange = (text) => {
    setSearchQuery(text);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      handleSearch(text);
    }, 300);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert(t('common.error'), t('chats.groupName'));
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert(t('common.error'), t('chats.selectMembers'));
      return;
    }

    setCreating(true);

    try {
      const chat = await createCustomGroup({
        name: groupName.trim(),
        description: description.trim(),
        members: selectedUsers,
        department: currentUser?.department,
      }, currentUser.$id);

      if (chat) {
        navigation.replace('ChatRoom', { chat });
      } else {
        Alert.alert(t('common.error'), t('chats.groupCreateError'));
      }
    } catch (error) {
      let errorMessage = t('chats.groupCreateError');
      if (error?.message) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.includes(item.$id);
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggleUserSelection(item.$id)}
        style={[
          styles.userCard,
          { 
            backgroundColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(255, 255, 255, 0.7)',
          },
          isSelected && styles.userCardSelected,
          isSelected && { borderColor: theme.primary }
        ]}>
        <ProfilePicture 
          uri={item.profilePicture}
          name={item.name}
          size={moderateScale(44)}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text, fontSize: fontSize(14) }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.userDetails, { color: theme.textSecondary, fontSize: fontSize(11) }]} numberOfLines={1}>
            {item.department}
          </Text>
        </View>
        <View style={[
          styles.checkbox,
          { 
            backgroundColor: isSelected ? theme.primary : 'transparent',
            borderColor: isSelected ? theme.primary : theme.textSecondary,
          }
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={moderateScale(16)} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
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
          : ['#f0f4ff', '#d8e7ff', '#c0deff']
        }
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <AnimatedBackground particleCount={15} />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Ionicons 
                name="arrow-back" 
                size={moderateScale(24)} 
                color={theme.text} 
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text, fontSize: fontSize(20) }]}>
              {t('chats.createGroup')}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize(14) }]}>
                {t('chats.groupName')}
              </Text>
              <GlassInput style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: theme.text, fontSize: fontSize(15) }]}
                  placeholder={t('chats.groupNamePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={groupName}
                  onChangeText={setGroupName}
                  maxLength={50}
                />
              </GlassInput>
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize(14) }]}>
                {t('chats.groupDescription')}
              </Text>
              <GlassInput style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: theme.text, fontSize: fontSize(15) }]}
                  placeholder={t('chats.groupDescriptionPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </GlassInput>
            </View>

            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize(14) }]}>
                  {t('chats.selectMembers')}
                </Text>
                {selectedUsers.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.badgeText, { fontSize: fontSize(12) }]}>
                      {selectedUsers.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Search Bar */}
              <GlassInput style={styles.searchContainer}>
                <Ionicons name="search" size={moderateScale(18)} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text, fontSize: fontSize(14) }]}
                  placeholder={t('chats.searchUsers')}
                  placeholderTextColor={theme.textSecondary}
                  value={searchQuery}
                  onChangeText={handleQueryChange}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                    <Ionicons name="close-circle" size={moderateScale(18)} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </GlassInput>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              ) : searchQuery.length > 0 ? (
                // Show search results
                searching ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                  </View>
                ) : searchResults.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: fontSize(14) }]}>
                      {t('chats.emptySearchMessage')}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={searchResults}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item.$id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.usersList}
                  />
                )
              ) : (
                // Show friends first, then department users
                <>
                  {friends.length > 0 && (
                    <>
                      <Text style={[styles.subSectionTitle, { color: theme.textSecondary, fontSize: fontSize(12) }]}>
                        {t('chats.friends')}
                      </Text>
                      <FlatList
                        data={friends}
                        renderItem={renderUserItem}
                        keyExtractor={(item) => item.$id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.usersList}
                      />
                    </>
                  )}
                  
                  {departmentUsers.length > 0 && (
                    <>
                      <Text style={[styles.subSectionTitle, { color: theme.textSecondary, fontSize: fontSize(12), marginTop: spacing.md }]}>
                        {t('chats.departmentUsers')}
                      </Text>
                      <FlatList
                        data={departmentUsers}
                        renderItem={renderUserItem}
                        keyExtractor={(item) => item.$id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.usersList}
                      />
                    </>
                  )}

                  {friends.length === 0 && departmentUsers.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: fontSize(14) }]}>
                        {t('chats.emptySearchMessage')}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                { 
                  backgroundColor: theme.primary,
                  opacity: (!groupName.trim() || selectedUsers.length === 0 || creating) ? 0.5 : 1,
                }
              ]}
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0 || creating}>
              {creating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={moderateScale(22)} color="#FFFFFF" />
                  <Text style={[styles.createButtonText, { fontSize: fontSize(16) }]}>
                    {t('chats.createGroupButton')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  placeholder: {
    width: moderateScale(40),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
  },
  textAreaContainer: {
    paddingVertical: spacing.md,
  },
  input: {
    fontWeight: '400',
  },
  textArea: {
    height: moderateScale(80),
    textAlignVertical: 'top',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: moderateScale(10),
    marginBottom: spacing.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  usersList: {
    gap: spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  userCardSelected: {
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  userDetails: {
    fontWeight: '400',
  },
  checkbox: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontWeight: '400',
  },
  subSectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CreateGroup;
