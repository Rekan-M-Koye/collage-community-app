import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfilePicture from './ProfilePicture';
import { useAppSettings } from '../context/AppSettingsContext';
import { 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const CHAT_TYPES = {
  STAGE_GROUP: 'stage_group',
  DEPARTMENT_GROUP: 'department_group',
  PRIVATE: 'private',
  CUSTOM_GROUP: 'custom_group',
};

const ChatListItem = ({ chat, onPress, currentUserId }) => {
  const { theme, isDarkMode, t } = useAppSettings();

  const getChatIcon = () => {
    switch (chat.type) {
      case CHAT_TYPES.STAGE_GROUP:
        return 'people';
      case CHAT_TYPES.DEPARTMENT_GROUP:
        return 'business';
      case CHAT_TYPES.PRIVATE:
        return 'person';
      case CHAT_TYPES.CUSTOM_GROUP:
        return 'people-circle';
      default:
        return 'chatbubble';
    }
  };

  const getChatIconColor = () => {
    switch (chat.type) {
      case CHAT_TYPES.STAGE_GROUP:
        return '#3B82F6';
      case CHAT_TYPES.DEPARTMENT_GROUP:
        return '#8B5CF6';
      case CHAT_TYPES.PRIVATE:
        return '#10B981';
      case CHAT_TYPES.CUSTOM_GROUP:
        return '#F59E0B';
      default:
        return theme.primary;
    }
  };

  const getChatName = () => {
    if (chat.type === CHAT_TYPES.PRIVATE && chat.otherUser) {
      return chat.otherUser.name || chat.otherUser.fullName || chat.name;
    }
    return chat.name;
  };

  const getChatSubtitle = () => {
    if (chat.type === CHAT_TYPES.STAGE_GROUP) {
      return t('chats.stageGroup');
    }
    if (chat.type === CHAT_TYPES.DEPARTMENT_GROUP) {
      return t('chats.departmentGroup');
    }
    if (chat.type === CHAT_TYPES.CUSTOM_GROUP && chat.participants) {
      return `${chat.participants.length} ${t('chats.members')}`;
    }
    return null;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo').replace('{count}', diffMins);
    if (diffHours < 24) return t('time.hoursAgo').replace('{count}', diffHours);
    if (diffDays < 7) return t('time.daysAgo').replace('{count}', diffDays);
    
    return date.toLocaleDateString();
  };

  const isPrivateChat = chat.type === CHAT_TYPES.PRIVATE;
  const chatName = getChatName();
  const chatSubtitle = getChatSubtitle();
  const iconColor = getChatIconColor();

  const cardBackground = isDarkMode 
    ? 'rgba(255, 255, 255, 0.05)' 
    : 'rgba(255, 255, 255, 0.9)';

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      style={[
        styles.container,
        { 
          backgroundColor: cardBackground,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        }
      ]}>
      
      {isPrivateChat && chat.otherUser?.profilePicture ? (
        <ProfilePicture 
          uri={chat.otherUser.profilePicture}
          name={chatName}
          size={moderateScale(48)}
        />
      ) : chat.type === CHAT_TYPES.CUSTOM_GROUP && chat.groupPhoto ? (
        <ProfilePicture 
          uri={chat.groupPhoto}
          name={chatName}
          size={moderateScale(48)}
        />
      ) : (
        <View style={[
          styles.iconContainer, 
          { backgroundColor: `${iconColor}15` }
        ]}>
          <Ionicons 
            name={getChatIcon()} 
            size={moderateScale(22)} 
            color={iconColor} 
          />
        </View>
      )}

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text 
            style={[styles.chatName, { fontSize: fontSize(15), color: theme.text }]}
            numberOfLines={1}>
            {chatName}
          </Text>
          {chat.lastMessageAt && (
            <Text style={[styles.time, { fontSize: fontSize(11), color: theme.textSecondary }]}>
              {formatTime(chat.lastMessageAt)}
            </Text>
          )}
        </View>

        <Text 
          style={[styles.lastMessage, { fontSize: fontSize(13), color: theme.textSecondary }]}
          numberOfLines={1}>
          {chat.lastMessage || (chatSubtitle ? chatSubtitle : t('chats.noMessages'))}
        </Text>

        {chat.requiresRepresentative && (
          <View style={styles.infoRow}>
            <Ionicons 
              name="shield-checkmark" 
              size={moderateScale(12)} 
              color={theme.textSecondary} 
            />
            <Text style={[styles.infoText, { fontSize: fontSize(10), color: theme.textSecondary }]}>
              {t('chats.representativeOnly')}
            </Text>
          </View>
        )}
      </View>

      <Ionicons 
        name="chevron-forward" 
        size={moderateScale(18)} 
        color={theme.textSecondary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  iconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatName: {
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    fontWeight: '400',
  },
  lastMessage: {
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  infoText: {
    fontStyle: 'italic',
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});

export default ChatListItem;
