import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useUser } from '../../context/UserContext';
import AnimatedBackground from '../../components/AnimatedBackground';
import ProfilePicture from '../../components/ProfilePicture';
import { getAllUserChats } from '../../../database/chatHelpers';
import { sendMessage } from '../../../database/chats';
import { 
  fontSize, 
  spacing, 
  moderateScale,
  hp,
} from '../../utils/responsive';
import { borderRadius } from '../../theme/designTokens';

const ForwardMessage = ({ navigation, route }) => {
  const { message } = route.params || {};
  const { t, theme, isDarkMode } = useAppSettings();
  const { user } = useUser();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forwarding, setForwarding] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const result = await getAllUserChats(user.$id, user.department, user.stage);
      const allChats = [
        ...(result.defaultGroups || []),
        ...(result.customGroups || []),
        ...(result.privateChats || []),
      ];
      setChats(allChats);
    } catch (error) {
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async (chat) => {
    if (forwarding) return;

    setForwarding(chat.$id);
    try {
      const forwardedContent = message.content 
        ? `${t('chats.forwarded')}\n${message.content}`
        : t('chats.forwarded');

      const messageData = {
        content: forwardedContent,
        senderId: user.$id,
        senderName: user.fullName,
      };

      if (message.images && message.images.length > 0) {
        messageData.images = message.images;
      } else if (message.imageUrl) {
        messageData.images = [message.imageUrl];
      }

      await sendMessage(chat.$id, messageData);
      
      Alert.alert(
        t('common.success'),
        t('chats.messageForwarded'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('chats.forwardError'));
      setForwarding(null);
    }
  };

  const getChatName = (chat) => {
    if (chat.type === 'private' && chat.otherUser) {
      return chat.otherUser.name || chat.otherUser.fullName || chat.name;
    }
    return chat.name;
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const name = getChatName(chat).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const renderChatItem = ({ item }) => {
    const chatName = getChatName(item);
    const isPrivate = item.type === 'private';

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          { 
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
            borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          }
        ]}
        onPress={() => handleForward(item)}
        disabled={forwarding === item.$id}>
        <ProfilePicture 
          uri={isPrivate ? item.otherUser?.profilePicture : item.groupPhoto}
          name={chatName}
          size={moderateScale(44)}
        />
        <View style={styles.chatInfo}>
          <Text style={[styles.chatName, { color: theme.text, fontSize: fontSize(15) }]} numberOfLines={1}>
            {chatName}
          </Text>
          <Text style={[styles.chatType, { color: theme.textSecondary, fontSize: fontSize(12) }]}>
            {isPrivate ? t('chats.privateChat') : t('chats.groupChat')}
          </Text>
        </View>
        {forwarding === item.$id ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Ionicons name="arrow-forward-circle" size={moderateScale(24)} color={theme.primary} />
        )}
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
              <Ionicons name="arrow-back" size={moderateScale(24)} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text, fontSize: fontSize(20) }]}>
              {t('chats.forwardTo')}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Message Preview */}
          <View style={[
            styles.messagePreview,
            { 
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            }
          ]}>
            <Ionicons name="arrow-redo" size={moderateScale(18)} color={theme.primary} />
            <Text style={[styles.previewText, { color: theme.text, fontSize: fontSize(14) }]} numberOfLines={2}>
              {message?.content || t('chats.image')}
            </Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={[
              styles.searchInput,
              { 
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
              }
            ]}>
              <Ionicons name="search" size={moderateScale(18)} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchTextInput, { color: theme.text, fontSize: fontSize(14) }]}
                placeholder={t('chats.searchChats')}
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredChats}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.$id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: fontSize(14) }]}>
                    {t('chats.noChatsFound')}
                  </Text>
                </View>
              }
            />
          )}
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
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  previewText: {
    flex: 1,
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  chatInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  chatName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  chatType: {
    fontWeight: '400',
  },
  emptyContainer: {
    paddingTop: hp(10),
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});

export default ForwardMessage;
