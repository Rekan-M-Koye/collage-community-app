import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../../context/AppSettingsContext';
import { borderRadius, shadows } from '../../theme/designTokens';
import { wp, hp, fontSize as responsiveFontSize, spacing } from '../../utils/responsive';

const PersonalizationSettings = ({ navigation }) => {
  const {
    t,
    theme,
    isDarkMode,
    themePreference,
    setThemeMode,
    currentLanguage,
    changeLanguage,
  } = useAppSettings();

  const themeOptions = [
    { value: 'light', label: t('settings.lightMode'), icon: 'sunny-outline' },
    { value: 'dark', label: t('settings.darkMode'), icon: 'moon-outline' },
    { value: 'system', label: t('settings.systemDefault'), icon: 'phone-portrait-outline' },
  ];

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'ku', name: 'Kurdish', nativeName: 'کوردی' },
  ];

  const handleLanguageChange = (languageCode) => {
    if (languageCode === 'ar' && currentLanguage !== 'ar') {
      Alert.alert(
        t('settings.language'),
        'Arabic requires app restart for full RTL support. Please restart the app.',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.yes'),
            onPress: () => changeLanguage(languageCode),
          },
        ]
      );
    } else {
      changeLanguage(languageCode);
    }
  };

  const GlassCard = ({ children, style }) => (
    <BlurView
      intensity={isDarkMode ? 30 : 0}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[
        styles.glassCard,
        {
          backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.6)' : '#FFFFFF',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
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
          ? ['rgba(255, 149, 0, 0.15)', 'transparent']
          : ['rgba(255, 149, 0, 0.1)', 'transparent']
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
            {t('settings.personalization') || 'Personalization'}
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
            {t('settings.appearance')}
          </Text>
          <GlassCard>
            {themeOptions.map((option, index) => (
              <View key={option.value}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => setThemeMode(option.value)}
                  activeOpacity={0.7}>
                  <View style={[
                    styles.iconContainer,
                    {
                      backgroundColor: themePreference === option.value
                        ? isDarkMode ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.15)'
                        : isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    },
                  ]}>
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={themePreference === option.value ? theme.primary : theme.textSecondary}
                    />
                  </View>
                  <Text style={[
                    styles.optionLabel,
                    { color: themePreference === option.value ? theme.text : theme.textSecondary },
                  ]}>
                    {option.label}
                  </Text>
                  {themePreference === option.value && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  )}
                </TouchableOpacity>
                {index < themeOptions.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t('settings.language')}
          </Text>
          <GlassCard>
            {languages.map((lang, index) => (
              <View key={lang.code}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.7}>
                  <View style={styles.languageInfo}>
                    <Text style={[styles.languageNative, { color: theme.text }]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={[styles.languageName, { color: theme.textSecondary }]}>
                      {lang.name}
                    </Text>
                  </View>
                  {currentLanguage === lang.code && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  )}
                </TouchableOpacity>
                {index < languages.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </GlassCard>
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
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: responsiveFontSize(13),
    marginBottom: spacing.md,
  },
  glassCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.small,
  },
  optionItem: {
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
  optionLabel: {
    flex: 1,
    fontSize: responsiveFontSize(16),
    fontWeight: '500',
  },
  languageInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  languageNative: {
    fontSize: responsiveFontSize(16),
    fontWeight: '500',
    marginBottom: 2,
  },
  languageName: {
    fontSize: responsiveFontSize(13),
  },
  divider: {
    height: 1,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  bottomPadding: {
    height: hp(5),
  },
});

export default PersonalizationSettings;
