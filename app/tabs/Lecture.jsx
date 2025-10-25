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
import { useAppSettings } from '../context/AppSettingsContext';
import { GlassContainer } from '../components/GlassComponents';
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
        
        <View style={styles.content}>
          <GlassContainer 
            borderRadius={borderRadius.xl}
            style={styles.emptyStateCard}>
            <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="book-outline" size={moderateScale(64)} color="rgba(255,255,255,0.6)" />
            </View>
            <Text style={[styles.emptyTitle, { fontSize: fontSize(24), color: '#FFFFFF' }]}>
              {t('lecture.emptyTitle')}
            </Text>
            <Text style={[styles.emptyMessage, { fontSize: fontSize(15), color: 'rgba(255,255,255,0.7)' }]}>
              {t('lecture.emptyMessage')}
            </Text>
          </GlassContainer>
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
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(5),
    paddingBottom: hp(12),
  },
  emptyStateCard: {
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: moderateScale(400),
  },
  emptyIconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: fontSize(22),
  },
});

export default Lecture;
