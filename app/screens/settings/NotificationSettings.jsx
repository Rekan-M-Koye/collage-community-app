import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../../context/AppSettingsContext';
import { borderRadius, shadows } from '../../theme/designTokens';
import { wp, hp, fontSize as responsiveFontSize, spacing } from '../../utils/responsive';

const NotificationSettings = ({ navigation }) => {
  const {
    t,
    theme,
    isDarkMode,
    notificationsEnabled,
    toggleNotifications,
  } = useAppSettings();

  const GlassCard = ({ children, style }) => (
    <BlurView
      intensity={isDarkMode ? 30 : 50}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[
        styles.glassCard,
        {
          backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.6)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        style,
      ]}>
      {children}
    </BlurView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDarkMode
          ? ['rgba(52, 199, 89, 0.15)', 'transparent']
          : ['rgba(52, 199, 89, 0.1)', 'transparent']
        }
        style={styles.headerGradient}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t('settings.notifications')}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t('settings.generalNotifications') || 'General'}
          </Text>
          <GlassCard>
            <View style={styles.settingItem}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: isDarkMode ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)' },
              ]}>
                <Ionicons name="notifications-outline" size={20} color="#34C759" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {t('settings.enableNotifications')}
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {t('settings.notificationDesc')}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: theme.border, true: '#34C759' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
              />
            </View>
          </GlassCard>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {t('settings.notificationInfo') || 'More notification preferences will be available in future updates'}
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(2),
    paddingHorizontal: wp(5),
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(13),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  glassCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: responsiveFontSize(13),
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: borderRadius.md,
  },
  infoText: {
    flex: 1,
    fontSize: responsiveFontSize(13),
    lineHeight: responsiveFontSize(18),
  },
  bottomPadding: {
    height: hp(5),
  },
});

export default NotificationSettings;
