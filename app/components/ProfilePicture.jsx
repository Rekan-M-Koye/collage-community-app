import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';

const ProfilePicture = ({ 
  uri, 
  size = 40, 
  name = 'User',
  style,
  showBorder = false,
  borderColor,
  borderWidth = 2
}) => {
  const { theme } = useAppSettings();

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=667eea&color=fff&bold=true`;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    backgroundColor: theme.background,
    ...(showBorder && {
      borderWidth: borderWidth,
      borderColor: borderColor || theme.primary,
    }),
  };

  if (uri) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <Image
        source={{ uri: defaultAvatar }}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ProfilePicture;
