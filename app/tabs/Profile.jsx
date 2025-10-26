import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../components/GlassComponents';
import { getCompleteUserData } from '../../database/auth';
import { wp, hp, fontSize, spacing, moderateScale } from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const Profile = ({ navigation }) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const { user, isLoading, refreshUser } = useUser();
  const [activeTab, setActiveTab] = useState('about');
  const [imageKey, setImageKey] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshUser();
      setImageKey(Date.now());
    });
    return unsubscribe;
  }, [navigation, refreshUser]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: spacing.md }]}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <LinearGradient 
          colors={isDarkMode ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#e3f2fd', '#bbdefb', '#90caf9']} 
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <GlassContainer borderRadius={borderRadius.xl} style={styles.notSignedInCard}>
              <Ionicons name="person-circle-outline" size={moderateScale(60)} color={theme.primary} />
              <Text style={[styles.notSignedInTitle, { color: theme.text, marginTop: spacing.md }]}>
                {t('profile.notSignedIn') || 'Not Signed In'}
              </Text>
              <Text style={[styles.notSignedInText, { color: theme.textSecondary, marginTop: spacing.xs }]}>
                {t('profile.pleaseSignIn') || 'Please sign in to view your profile'}
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('SignIn')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={theme.gradient}
                  style={styles.signInButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.signInButtonText}>{t('auth.signIn')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassContainer>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullName || 'User') + '&size=400&background=667eea&color=fff&bold=true';
  
  const avatarUri = user.profilePicture ? user.profilePicture : defaultAvatar;
  
  const userProfile = {
    name: user.fullName || 'User',
    email: user.email || '',
    bio: user.bio || t('profile.defaultBio'),
    avatar: avatarUri,
    university: user.university ? t(`universities.${user.university}`) : '',
    college: user.college ? t(`colleges.${user.college}`) : '',
    stage: user.stage ? t(`stages.${user.stage}`) : '',
    department: user.department ? t(`departments.${user.department}`) : '',
    stats: {
      posts: user.postsCount || 0,
      followers: user.followersCount || 0,
      following: user.followingCount || 0
    }
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      <GlassContainer borderRadius={borderRadius.lg} style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={moderateScale(20)} color={theme.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('profile.email')}</Text>
            <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]} numberOfLines={1}>{userProfile.email}</Text>
          </View>
        </View>
        
        {userProfile.university && (
          <>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={moderateScale(20)} color={theme.success} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('profile.university')}</Text>
                <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]} numberOfLines={1}>{userProfile.university}</Text>
              </View>
            </View>
          </>
        )}
        
        {userProfile.college && (
          <>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="library-outline" size={moderateScale(20)} color={theme.warning} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('profile.college')}</Text>
                <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]} numberOfLines={1}>{userProfile.college}</Text>
              </View>
            </View>
          </>
        )}
        
        {userProfile.stage && (
          <>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="stats-chart-outline" size={moderateScale(20)} color={theme.secondary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('profile.stage')}</Text>
                <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]}>{userProfile.stage}</Text>
              </View>
            </View>
          </>
        )}
        
        {userProfile.department && (
          <>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={moderateScale(20)} color={theme.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: fontSize(10), color: theme.textSecondary }]}>{t('auth.selectDepartment')}</Text>
                <Text style={[styles.infoValue, { fontSize: fontSize(13), color: theme.text }]} numberOfLines={1}>{userProfile.department}</Text>
              </View>
            </View>
          </>
        )}
      </GlassContainer>
    </View>
  );

  const renderPostsTab = () => (
    <View style={styles.tabContent}>
      <GlassContainer borderRadius={borderRadius.lg} style={styles.emptyCard}>
        <Ionicons name="document-text-outline" size={moderateScale(40)} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { fontSize: fontSize(14), color: theme.textSecondary, marginTop: spacing.sm }]}>{t('profile.noPosts')}</Text>
      </GlassContainer>
    </View>
  );

  const renderActivityTab = () => (
    <View style={styles.tabContent}>
      <GlassContainer borderRadius={borderRadius.lg} style={styles.emptyCard}>
        <Ionicons name="pulse-outline" size={moderateScale(40)} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { fontSize: fontSize(14), color: theme.textSecondary, marginTop: spacing.sm }]}>{t('profile.noActivity')}</Text>
      </GlassContainer>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <LinearGradient colors={isDarkMode ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#e3f2fd', '#bbdefb', '#90caf9']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
              <GlassContainer borderRadius={borderRadius.round} style={styles.settingsButtonInner}>
                <Ionicons name="settings-outline" size={moderateScale(24)} color="#FFFFFF" />
              </GlassContainer>
            </TouchableOpacity>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={theme.gradient} style={styles.avatarBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={[styles.avatarInner, { backgroundColor: theme.background }]}>
                  <Image 
                    source={{ uri: userProfile.avatar, cache: 'reload' }} 
                    style={styles.avatar}
                    key={`${userProfile.avatar}-${imageKey}`}
                  />
                </View>
              </LinearGradient>
            </View>
            <Text style={[styles.name, { fontSize: fontSize(22), color: '#FFFFFF' }]}>{userProfile.name}</Text>
            {userProfile.bio && <Text style={[styles.bio, { fontSize: fontSize(13), color: 'rgba(255,255,255,0.8)' }]} numberOfLines={2}>{userProfile.bio}</Text>}
            <View style={[styles.statsContainer, { backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={[styles.statNumber, { fontSize: fontSize(18), color: theme.text }]}>{userProfile.stats.posts}</Text>
                <Text style={[styles.statLabel, { fontSize: fontSize(11), color: theme.textSecondary }]}>{t('profile.posts')}</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={[styles.statNumber, { fontSize: fontSize(18), color: theme.text }]}>{userProfile.stats.followers}</Text>
                <Text style={[styles.statLabel, { fontSize: fontSize(11), color: theme.textSecondary }]}>{t('profile.followers')}</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={[styles.statNumber, { fontSize: fontSize(18), color: theme.text }]}>{userProfile.stats.following}</Text>
                <Text style={[styles.statLabel, { fontSize: fontSize(11), color: theme.textSecondary }]}>{t('profile.following')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.tabsSection}>
            <View style={[styles.tabsContainer, { backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
              <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('about')} activeOpacity={0.7}>
                <Text style={[styles.tabText, { fontSize: fontSize(13), color: activeTab === 'about' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'about' ? '700' : '500' }]}>{t('profile.about')}</Text>
                {activeTab === 'about' && <LinearGradient colors={theme.gradient} style={styles.tabIndicator} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('posts')} activeOpacity={0.7}>
                <Text style={[styles.tabText, { fontSize: fontSize(13), color: activeTab === 'posts' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'posts' ? '700' : '500' }]}>{t('profile.myPosts')}</Text>
                {activeTab === 'posts' && <LinearGradient colors={theme.gradient} style={styles.tabIndicator} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('activity')} activeOpacity={0.7}>
                <Text style={[styles.tabText, { fontSize: fontSize(13), color: activeTab === 'activity' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'activity' ? '700' : '500' }]}>{t('profile.activity')}</Text>
                {activeTab === 'activity' && <LinearGradient colors={theme.gradient} style={styles.tabIndicator} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
              </TouchableOpacity>
            </View>
            {activeTab === 'about' && renderAboutTab()}
            {activeTab === 'posts' && renderPostsTab()}
            {activeTab === 'activity' && renderActivityTab()}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({ 
  container: { flex: 1 }, 
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  loadingText: {
    fontSize: fontSize(16),
    fontWeight: '500',
  },
  errorText: { 
    fontSize: fontSize(18), 
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  notSignedInCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: wp(8),
    maxWidth: wp(85),
  },
  notSignedInTitle: {
    fontSize: fontSize(18),
    fontWeight: '700',
    textAlign: 'center',
  },
  notSignedInText: {
    fontSize: fontSize(14),
    textAlign: 'center',
    lineHeight: fontSize(20),
  },
  signInButton: {
    paddingHorizontal: spacing.xl * 1.5,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize(15),
    fontWeight: '700',
  },
  gradient: { flex: 1 }, 
  scrollView: { flex: 1 }, 
  scrollContent: { paddingTop: Platform.OS === 'ios' ? hp(5) : hp(3), paddingBottom: hp(10) }, 
  profileHeader: { alignItems: 'center', paddingHorizontal: wp(5), marginBottom: spacing.md, position: 'relative' }, 
  settingsButton: { position: 'absolute', top: spacing.md, right: wp(5), zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }, 
  settingsButtonInner: { width: moderateScale(44), height: moderateScale(44), justifyContent: 'center', alignItems: 'center' }, 
  avatarContainer: { marginBottom: spacing.sm }, 
  avatarBorder: { width: moderateScale(110), height: moderateScale(110), borderRadius: moderateScale(55), padding: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }, 
  avatarInner: { width: moderateScale(104), height: moderateScale(104), borderRadius: moderateScale(52), padding: 3 }, 
  avatar: { width: moderateScale(98), height: moderateScale(98), borderRadius: moderateScale(49) }, 
  name: { fontWeight: '700', marginBottom: spacing.xs / 2, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }, 
  bio: { textAlign: 'center', marginBottom: spacing.md, lineHeight: fontSize(18), paddingHorizontal: wp(5) }, 
  statsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%', 
    paddingVertical: spacing.md, 
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  }, 
  statItem: { alignItems: 'center', flex: 1 }, 
  statNumber: { fontWeight: '700', marginBottom: 2 }, 
  statLabel: { fontWeight: '500' }, 
  statDivider: { width: 1, height: moderateScale(30), opacity: 0.2 }, 
  tabsSection: { paddingHorizontal: wp(5) }, 
  tabsContainer: { 
    flexDirection: 'row', 
    padding: 3, 
    marginBottom: spacing.md,
    overflow: 'hidden',
  }, 
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, position: 'relative' }, 
  tabText: { marginBottom: 2 }, 
  tabIndicator: { position: 'absolute', bottom: 0, height: 2.5, width: '80%', borderRadius: borderRadius.xs }, 
  tabContent: {}, 
  infoCard: { 
    padding: spacing.md,
    overflow: 'hidden',
  }, 
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }, 
  infoDivider: { height: 1, opacity: 0.1, marginVertical: spacing.xs / 2 },
  infoTextContainer: { flex: 1 }, 
  infoLabel: { fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 }, 
  infoValue: { fontWeight: '500' }, 
  emptyCard: { 
    padding: spacing.lg, 
    alignItems: 'center',
    overflow: 'hidden',
  }, 
  emptyText: { fontWeight: '500', textAlign: 'center' },
});

export default Profile;
