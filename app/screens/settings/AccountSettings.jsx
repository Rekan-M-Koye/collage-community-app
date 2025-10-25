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
import { useUser } from '../../context/UserContext';
import { signOut } from '../../../database/auth';
import { borderRadius, shadows } from '../../theme/designTokens';
import { wp, hp, fontSize as responsiveFontSize, spacing } from '../../utils/responsive';

const AccountSettings = ({ navigation }) => {
  const { t, theme, isDarkMode, resetSettings } = useAppSettings();
  const { clearUser } = useUser();

  const handleResetSettings = () => {
    Alert.alert(
      t('settings.resetSettings'),
      t('settings.resetConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: resetSettings,
          style: 'destructive',
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: async () => {
            try {
              await signOut();
              await clearUser();
              navigation.replace('SignIn');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(
                t('common.error'),
                t('settings.logoutError')
              );
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

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

  const SettingItem = ({ icon, title, description, onPress, danger, iconColor }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: danger
            ? isDarkMode ? 'rgba(255, 69, 58, 0.15)' : 'rgba(255, 59, 48, 0.1)'
            : isDarkMode ? `${iconColor}20` : `${iconColor}15`,
        },
      ]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? theme.danger : iconColor}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: danger ? theme.danger : theme.text }]}>
          {title}
        </Text>
        {description && (
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDarkMode
          ? ['rgba(255, 59, 48, 0.15)', 'transparent']
          : ['rgba(255, 59, 48, 0.1)', 'transparent']
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
            {t('settings.accountSettings')}
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
            {t('settings.security') || 'Security'}
          </Text>
          <GlassCard>
            <SettingItem
              icon="key-outline"
              iconColor={theme.primary}
              title={t('settings.changePassword')}
              description={t('settings.changePasswordDesc')}
              onPress={() => navigation.navigate('ChangePassword')}
            />
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t('settings.dangerZone') || 'Danger Zone'}
          </Text>
          <GlassCard>
            <SettingItem
              icon="refresh-outline"
              iconColor="#FF9500"
              title={t('settings.resetSettings')}
              description={t('settings.resetDesc')}
              onPress={handleResetSettings}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SettingItem
              icon="log-out-outline"
              title={t('settings.logout')}
              description={t('settings.logoutDesc')}
              onPress={handleLogout}
              danger
            />
          </GlassCard>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={20} color="#FF9500" />
          <Text style={[styles.warningText, { color: theme.textSecondary }]}>
            {t('settings.warningText') || 'Resetting settings will restore all preferences to default. Logging out will sign you out of your account.'}
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
  divider: {
    height: 1,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  warningText: {
    flex: 1,
    fontSize: responsiveFontSize(13),
    lineHeight: responsiveFontSize(18),
  },
  bottomPadding: {
    height: hp(5),
  },
});

export default AccountSettings;
