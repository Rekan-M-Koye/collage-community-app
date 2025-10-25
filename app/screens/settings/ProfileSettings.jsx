import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useUser } from '../../context/UserContext';
import { borderRadius, shadows } from '../../theme/designTokens';
import { wp, hp, fontSize as responsiveFontSize, spacing } from '../../utils/responsive';
import { uploadProfilePicture } from '../../../services/imgbbService';

const ProfileSettings = ({ navigation }) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const { user, updateUser, updateProfilePicture, refreshUser } = useUser();

  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    university: '',
    college: '',
    stage: '',
    bio: '',
    profilePicture: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      if (user) {
        setProfileData({
          fullName: user.fullName || '',
          email: user.email || '',
          university: user.university || '',
          college: user.college || '',
          stage: user.stage || '',
          bio: user.bio || '',
          profilePicture: user.profilePicture || '',
        });
      } else {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          setProfileData({
            fullName: parsedData.fullName || '',
            email: parsedData.email || '',
            university: parsedData.university || '',
            college: parsedData.college || '',
            stage: parsedData.stage || '',
            bio: parsedData.bio || '',
            profilePicture: parsedData.profilePicture || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfileChanges = async () => {
    setIsSaving(true);
    try {
      const success = await updateUser(profileData);
      
      if (success) {
        Alert.alert(
          t('common.success'),
          t('settings.profileUpdated')
        );
        setEditMode(false);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        t('common.error'),
        t('settings.profileUpdateError')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadProfilePicture = async () => {
    try {
      setIsUploadingImage(true);
      const result = await uploadProfilePicture();
      
      if (result) {
        const success = await updateProfilePicture(result.displayUrl);
        
        if (success) {
          setProfileData({ ...profileData, profilePicture: result.displayUrl });
          await refreshUser();
          Alert.alert(
            t('common.success'),
            t('settings.profilePictureUploaded')
          );
        }
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert(
        t('common.error'),
        error.message === 'Permission to access camera roll is required!' 
          ? t('settings.cameraPermissionRequired')
          : t('settings.profilePictureUploadError')
      );
    } finally {
      setIsUploadingImage(false);
    }
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDarkMode
          ? ['rgba(10, 132, 255, 0.15)', 'transparent']
          : ['rgba(0, 122, 255, 0.1)', 'transparent']
        }
        style={styles.headerGradient}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {t('settings.profileSettings')}
            </Text>
          </View>
          {!editMode ? (
            <TouchableOpacity
              onPress={() => setEditMode(true)}
              style={styles.editButton}>
              <Ionicons name="create-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>

          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePictureWrapper}>
              {profileData.profilePicture ? (
                <Image
                  source={{ uri: profileData.profilePicture }}
                  style={styles.profilePicture}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.profilePicturePlaceholder, { backgroundColor: isDarkMode ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.15)' }]}>
                  <Ionicons name="person" size={60} color={theme.primary} />
                </View>
              )}
              
              <TouchableOpacity
                onPress={handleUploadProfilePicture}
                disabled={isUploadingImage}
                style={[styles.uploadButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.7}>
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.uploadHint, { color: theme.textSecondary }]}>
              {t('settings.tapToUpload') || 'Tap to upload profile picture'}
            </Text>
          </View>

          <GlassCard>
            <View style={styles.profileCard}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  {t('auth.fullName')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                  value={profileData.fullName}
                  onChangeText={(text) => setProfileData({ ...profileData, fullName: text })}
                  editable={editMode}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  {t('auth.collegeEmail')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.textSecondary,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  value={profileData.email}
                  editable={false}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  {t('settings.bio')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.bioInput,
                    {
                      color: theme.text,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                  value={profileData.bio}
                  onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
                  editable={editMode}
                  multiline
                  numberOfLines={4}
                  placeholder={t('settings.bioPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.divider} />

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                {t('settings.academicInfo') || 'Academic Information'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  {t('auth.selectUniversity')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.textSecondary,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  value={profileData.university}
                  editable={false}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  {t('auth.selectCollege')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.textSecondary,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  value={profileData.college}
                  editable={false}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  {t('auth.selectStage')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.textSecondary,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  value={profileData.stage}
                  editable={false}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>
          </GlassCard>

          {editMode && (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => {
                  setEditMode(false);
                  loadUserProfile();
                }}
                style={[styles.cancelButton, { borderColor: theme.border }]}>
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveProfileChanges}
                disabled={isSaving}
                style={[styles.saveButton, { backgroundColor: theme.primary }]}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {t('common.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp(20),
  },
  keyboardView: {
    flex: 1,
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
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
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
  profilePictureContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  profilePictureWrapper: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  uploadButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  uploadHint: {
    fontSize: responsiveFontSize(12),
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  glassCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.small,
  },
  profileCard: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: responsiveFontSize(13),
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: responsiveFontSize(16),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: spacing.lg,
  },
  sectionLabel: {
    fontSize: responsiveFontSize(13),
    fontWeight: '600',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.medium,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
  },
  bottomPadding: {
    height: hp(5),
  },
});

export default ProfileSettings;
