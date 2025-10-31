import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../../context/AppSettingsContext';
import { borderRadius, shadows } from '../../theme/designTokens';
import { wp, hp, fontSize as responsiveFontSize, spacing } from '../../utils/responsive';

const Settings = ({ navigation }) => {
  const { t, theme, isDarkMode } = useAppSettings();

  const settingsSections = [
    {
      id: 'profile',
      title: t('settings.profileSettings'),
      description: t('settings.profileDesc') || 'Manage your profile information',
      icon: 'person-outline',
      color: theme.primary,
      screen: 'ProfileSettings',
    },
    {
      id: 'personalization',
      title: t('settings.personalization') || 'Personalization',
      description: t('settings.personalizationDesc') || 'Customize theme, language, and display',
      icon: 'color-palette-outline',
      color: '#FF9500',
      screen: 'PersonalizationSettings',
    },
    {
      id: 'notifications',
      title: t('settings.notifications'),
      description: t('settings.notificationDesc'),
      icon: 'notifications-outline',
      color: '#34C759',
      screen: 'NotificationSettings',
    },
    {
      id: 'account',
      title: t('settings.accountSettings'),
      description: t('settings.accountDesc') || 'Password, security, and account actions',
      icon: 'shield-checkmark-outline',
      color: '#FF3B30',
      screen: 'AccountSettings',
    },
  ];

  const SettingCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.7}
      style={styles.cardWrapper}>
      <BlurView
        intensity={isDarkMode ? 30 : 0}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.6)' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}>
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? `${item.color}15` : `${item.color}20` }]}>
            <Ionicons name={item.icon} size={24} color={item.color} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
              {item.description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDarkMode
          ? ['rgba(10, 132, 255, 0.15)', 'transparent']
          : ['rgba(0, 122, 255, 0.1)', 'transparent']
        }
        style={styles.headerGradient}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('settings.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        <View style={styles.cardsContainer}>
          {settingsSections.map((section) => (
            <SettingCard key={section.id} item={section} />
          ))}
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>
            {t('settings.version')} 1.0.0
          </Text>
        </View>
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
    height: hp(25),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? hp(7) : hp(3.5),
    paddingHorizontal: wp(5),
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: responsiveFontSize(20),
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  cardsContainer: {
    gap: spacing.md,
  },
  cardWrapper: {
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.small,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: responsiveFontSize(17),
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  cardDescription: {
    fontSize: responsiveFontSize(13),
    lineHeight: responsiveFontSize(18),
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  versionText: {
    fontSize: responsiveFontSize(13),
  },
});

export default Settings;
