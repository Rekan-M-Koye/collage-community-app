import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import { GlassContainer } from '../components/GlassComponents';
import { checkAndCompleteVerification, resendVerificationEmail, cancelPendingVerification, getCompleteUserData } from '../../database/auth';
import { 
  wp, 
  hp, 
  fontSize, 
  spacing, 
  isTablet,
  moderateScale,
} from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const VerifyEmail = ({ route, navigation }) => {
  const { email, userId, name } = route.params || {};
  const [isChecking, setIsChecking] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const { t, theme, isDarkMode } = useAppSettings();
  const { setUserData } = useUser();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckVerification = async () => {
    setIsChecking(true);

    try {
      await checkAndCompleteVerification();
      
      const completeUserData = await getCompleteUserData();
      
      if (completeUserData) {
        const userData = {
          $id: completeUserData.$id,
          email: completeUserData.email,
          fullName: completeUserData.name,
          bio: completeUserData.bio || '',
          profilePicture: completeUserData.profilePicture || '',
          university: completeUserData.university || '',
          college: completeUserData.major || '',
          department: completeUserData.department || '',
          stage: completeUserData.year || '',
          postsCount: completeUserData.postsCount || 0,
          followersCount: completeUserData.followersCount || 0,
          followingCount: completeUserData.followingCount || 0,
          isEmailVerified: true,
          lastAcademicUpdate: completeUserData.lastAcademicUpdate || null,
        };
        
        await setUserData(userData);
      }
      
      navigation.replace('MainTabs');
    } catch (error) {
      setIsChecking(false);
      Alert.alert(
        t('common.error'),
        error.message || t('auth.emailNotVerifiedYet') || 'Email not verified yet. Please check your email and click the verification link.'
      );
    }
  };

  const handleResendEmail = async () => {
    if (!canResend) return;

    try {
      await resendVerificationEmail();
      
      setCanResend(false);
      setCountdown(60);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert(
        t('common.success'),
        t('auth.verificationEmailSent') || 'Verification email sent! Please check your inbox.'
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.message || t('auth.resendError') || 'Failed to resend verification email. Please try again.'
      );
    }
  };

  const handleGoBack = async () => {
    Alert.alert(
      t('auth.cancelVerification') || 'Cancel Verification',
      t('auth.cancelVerificationMessage') || 'Your signup data will be deleted. You will need to sign up again.',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel'
        },
        {
          text: t('common.ok') || 'OK',
          onPress: async () => {
            try {
              await cancelPendingVerification();
              navigation.replace('SignUp');
            } catch (error) {
              navigation.replace('SignUp');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      <LinearGradient
        colors={isDarkMode 
          ? ['#1a1a2e', '#16213e', '#0f3460'] 
          : ['#667eea', '#764ba2', '#f093fb']
        }
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}>
          
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}>
              
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons 
                    name="mail-outline" 
                    size={moderateScale(60)} 
                    color="#FFFFFF" 
                  />
                </View>
              </View>

              <View style={styles.headerContainer}>
                <Text style={[styles.headerText, { fontSize: fontSize(26) }]}>
                  {t('auth.verifyEmail') || 'Verify Your Email'}
                </Text>
                <Text style={[styles.subHeaderText, { fontSize: fontSize(14) }]}>
                  {t('auth.verificationEmailSent') || 'We sent a verification email to'}
                </Text>
                <View style={styles.emailBox}>
                  <Text style={[styles.emailText, { fontSize: fontSize(15) }]} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              </View>

          <GlassContainer 
            style={styles.formContainer}
            intensity={isTablet() ? 30 : 25}
            borderRadius={borderRadius.xl}
          >
            <Text style={[styles.instructionText, { 
              color: theme.textSecondary,
              fontSize: fontSize(14),
              textAlign: 'center',
            }]}>
              {t('auth.clickVerificationLink') || 'Click the verification link in your email, then return here and click the button below.'}
            </Text>

            <TouchableOpacity 
              style={[
                styles.checkButton,
                { 
                  backgroundColor: theme.primary,
                  opacity: isChecking ? 0.7 : 1,
                }
              ]}
              onPress={handleCheckVerification}
              disabled={isChecking}
              activeOpacity={0.8}>
              {isChecking ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={moderateScale(22)} 
                  color="#FFFFFF" 
                />
              )}
              <Text style={[styles.checkButtonText, { fontSize: fontSize(16) }]}>
                {isChecking 
                  ? (t('auth.verifying') || 'Verifying...') 
                  : (t('auth.iHaveVerified') || 'I Have Verified')
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.resendButton,
                { opacity: canResend ? 1 : 0.5 }
              ]}
              onPress={handleResendEmail}
              disabled={!canResend}
              activeOpacity={0.7}>
              <Text style={[styles.resendText, { 
                color: canResend ? theme.primary : theme.textSecondary,
                fontSize: fontSize(14),
              }]}>
                {canResend 
                  ? (t('auth.resendVerificationEmail') || 'Resend Verification Email') 
                  : `${t('auth.resendIn') || 'Resend in'} ${countdown}s`
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.changeEmailButton}
              onPress={handleGoBack}
              activeOpacity={0.7}>
              <Ionicons 
                name="arrow-back-outline" 
                size={moderateScale(18)} 
                color={theme.textSecondary} 
              />
              <Text style={[styles.changeEmailText, { 
                color: theme.textSecondary,
                fontSize: fontSize(14),
              }]}>
                {t('auth.goBack') || 'Go Back'}
              </Text>
            </TouchableOpacity>
          </GlassContainer>
        </Animated.View>
          
          <View style={{ height: hp(5) }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(6),
    paddingTop: Platform.OS === 'ios' ? hp(10) : hp(8),
    paddingBottom: hp(4),
  },
  content: {
    alignItems: 'center',
    maxWidth: isTablet() ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  iconCircle: {
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  headerText: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subHeaderText: {
    opacity: 0.9,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emailBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emailText: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  formContainer: {
    padding: isTablet() ? spacing.xxl : spacing.lg,
    maxWidth: isTablet() ? 500 : '100%',
    width: '100%',
    alignItems: 'center',
  },
  instructionText: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: '500',
    lineHeight: fontSize(14) * 1.5,
    paddingHorizontal: spacing.md,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resendButton: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  resendText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  changeEmailText: {
    fontWeight: '500',
  },
});

export default VerifyEmail;
