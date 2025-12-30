import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSettings } from '../context/AppSettingsContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { 
  wp, 
  hp, 
  fontSize, 
  spacing, 
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const Lecture = () => {
  const { t, theme, isDarkMode } = useAppSettings();
  const insets = useSafeAreaInsets();

  const cardBackground = isDarkMode 
    ? 'rgba(255, 255, 255, 0.08)' 
    : 'rgba(255, 255, 255, 0.6)';

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
          : ['#fef6e4', '#f3d2c1', '#ffa69e']
        }
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <AnimatedBackground particleCount={18} />
        
        <View style={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
          <View 
            style={[
              styles.emptyStateCard,
              { 
                backgroundColor: cardBackground,
                borderRadius: borderRadius.xl,
                borderWidth: isDarkMode ? 0 : 1,
                borderColor: 'rgba(0, 0, 0, 0.04)',
              }
            ]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 122, 255, 0.08)' }]}>
              <Ionicons name="book-outline" size={moderateScale(56)} color={isDarkMode ? 'rgba(255,255,255,0.6)' : theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { fontSize: fontSize(22), color: theme.text }]}>
              {t('lecture.emptyTitle')}
            </Text>
            <Text style={[styles.emptyMessage, { fontSize: fontSize(14), color: theme.textSecondary }]}>
              {t('lecture.emptyMessage')}
            </Text>
          </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingBottom: hp(12),
  },
  emptyStateCard: {
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: moderateScale(380),
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
  },
});

export default Lecture;
