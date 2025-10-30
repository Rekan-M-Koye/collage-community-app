import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { GlassContainer } from './GlassComponents';
import { wp, fontSize, spacing, moderateScale } from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';
import { FEED_TYPES } from '../constants/feedCategories';

const FeedSelector = ({ selectedFeed, onFeedChange }) => {
  const { t, theme, isDarkMode } = useAppSettings();

  const feeds = [
    {
      type: FEED_TYPES.DEPARTMENT,
      icon: 'people-outline',
      label: t('feed.department'),
    },
    {
      type: FEED_TYPES.MAJOR,
      icon: 'school-outline',
      label: t('feed.major'),
    },
    {
      type: FEED_TYPES.PUBLIC,
      icon: 'globe-outline',
      label: t('feed.public'),
    },
  ];

  return (
    <GlassContainer borderRadius={borderRadius.lg} style={styles.container}>
      <View style={styles.feedRow}>
        {feeds.map((feed, index) => {
          const isSelected = selectedFeed === feed.type;
          
          return (
            <TouchableOpacity
              key={feed.type}
              style={[
                styles.feedButton,
                isSelected && {
                  backgroundColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.15)' 
                    : 'rgba(0, 122, 255, 0.12)',
                },
              ]}
              onPress={() => onFeedChange(feed.type)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={feed.icon}
                size={moderateScale(20)}
                color={isSelected ? theme.primary : theme.subText}
              />
              <Text
                style={[
                  styles.feedLabel,
                  {
                    color: isSelected ? theme.primary : theme.subText,
                    fontSize: fontSize(13),
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {feed.label}
              </Text>
              {isSelected && (
                <View
                  style={[
                    styles.selectedIndicator,
                    { backgroundColor: theme.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feedButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  feedLabel: {
    marginTop: spacing.xxs,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 4,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 1.5,
  },
});

export default FeedSelector;
