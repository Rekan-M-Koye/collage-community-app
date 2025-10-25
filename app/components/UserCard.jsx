import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ProfilePicture from './ProfilePicture';
import { useAppSettings } from '../context/AppSettingsContext';
import { fontSize, spacing } from '../utils/responsive';

const UserCard = ({ 
  user, 
  onPress, 
  showBio = false,
  size = 50,
  style 
}) => {
  const { theme } = useAppSettings();

  if (!user) return null;

  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <ProfilePicture
        uri={user.profilePicture}
        size={size}
        name={user.fullName || user.name}
        showBorder
      />
      
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.name, { color: theme.text, fontSize: fontSize(16) }]}
          numberOfLines={1}
        >
          {user.fullName || user.name || 'User'}
        </Text>
        
        {showBio && user.bio && (
          <Text 
            style={[styles.bio, { color: theme.textSecondary, fontSize: fontSize(13) }]}
            numberOfLines={2}
          >
            {user.bio}
          </Text>
        )}
        
        {user.university && (
          <Text 
            style={[styles.university, { color: theme.textSecondary, fontSize: fontSize(12) }]}
            numberOfLines={1}
          >
            {user.university}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
  },
  bio: {
    marginTop: 2,
  },
  university: {
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default UserCard;
