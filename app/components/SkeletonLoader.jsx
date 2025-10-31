import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppSettings } from '../context/AppSettingsContext';
import { GlassContainer } from './GlassComponents';
import { wp, spacing, moderateScale } from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

export const PostCardSkeleton = () => {
  const { theme, isDarkMode } = useAppSettings();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonColor = isDarkMode 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)';

  return (
    <GlassContainer borderRadius={borderRadius.lg} style={styles.container}>
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.avatar,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
        <View style={styles.headerInfo}>
          <Animated.View
            style={[
              styles.nameSkeleton,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.timeSkeleton,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.titleSkeleton,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.textSkeleton,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.textSkeletonShort,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
      </View>

      <View style={styles.footer}>
        {[1, 2, 3].map((item) => (
          <Animated.View
            key={item}
            style={[
              styles.footerItem,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
        ))}
      </View>
    </GlassContainer>
  );
};

export const ProfileSkeleton = () => {
  const { theme, isDarkMode } = useAppSettings();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonColor = isDarkMode 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)';

  return (
    <View style={styles.profileContainer}>
      <Animated.View
        style={[
          styles.profileAvatar,
          { backgroundColor: skeletonColor, opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.profileName,
          { backgroundColor: skeletonColor, opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.profileBio,
          { backgroundColor: skeletonColor, opacity },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  nameSkeleton: {
    height: 16,
    width: '40%',
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  timeSkeleton: {
    height: 12,
    width: '25%',
    borderRadius: 4,
  },
  content: {
    marginBottom: spacing.md,
  },
  titleSkeleton: {
    height: 18,
    width: '70%',
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  textSkeleton: {
    height: 14,
    width: '100%',
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  textSkeletonShort: {
    height: 14,
    width: '60%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  footerItem: {
    height: 20,
    width: 60,
    borderRadius: 4,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  profileAvatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    marginBottom: spacing.md,
  },
  profileName: {
    height: 24,
    width: '50%',
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  profileBio: {
    height: 16,
    width: '70%',
    borderRadius: 4,
  },
});
