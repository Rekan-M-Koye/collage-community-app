import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { GlassContainer } from '../components/GlassComponents';
import { confirmEmailVerification, resendEmailVerification } from '../../database/auth';
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
  const { email, userId, secret } = route.params || {};
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const { t, theme, isDarkMode } = useAppSettings();
  const inputRefs = useRef([]);

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

  const handleCodeChange = (text, index) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode) => {
    setIsLoading(true);

    try {
      if (userId && verificationCode) {
        await confirmEmailVerification(userId, verificationCode);
        
        Alert.alert(
          t('common.success'),
          t('auth.accountCreated') || 'Email verified successfully!',
          [
            {
              text: t('common.ok') || 'OK',
              onPress: () => navigation.replace('MainTabs'),
            }
          ]
        );
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert(
        t('common.error'),
        t('auth.verificationError') || 'Invalid verification code. Please try again.'
      );
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      await resendEmailVerification();
      
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
        t('auth.codeSent') || 'Verification code sent to your email!'
      );
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert(
        t('common.error'),
        'Failed to resend verification code. Please try again.'
      );
    }
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
                    name="mail-open-outline" 
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
                  {t('auth.verificationCodeSent') || 'We sent a verification code to'}
                </Text>
                <Text style={[styles.emailText, { fontSize: fontSize(15) }]} numberOfLines={1}>
                  {email}
                </Text>
              </View>

          <GlassContainer 
            style={styles.formContainer}
            intensity={isTablet() ? 30 : 25}
            borderRadius={borderRadius.xl}
          >
            <Text style={[styles.instructionText, { 
              color: theme.textSecondary,
              fontSize: fontSize(14),
            }]}>
              {t('auth.enterCode') || 'Enter the 6-digit code'}
            </Text>

            <View style={styles.codeInputContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    {
                      borderColor: digit ? theme.primary : (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)'),
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                      color: theme.text,
                      fontSize: fontSize(24),
                    },
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isLoading}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.resendButton,
                { opacity: canResend ? 1 : 0.5 }
              ]}
              onPress={handleResendCode}
              disabled={!canResend}
              activeOpacity={0.7}>
              <Text style={[styles.resendText, { 
                color: canResend ? theme.primary : theme.textSecondary,
                fontSize: fontSize(14),
              }]}>
                {canResend 
                  ? (t('auth.resendCode') || 'Resend Code') 
                  : `${t('auth.resendIn') || 'Resend in'} ${countdown}s`
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.changeEmailButton}
              onPress={() => navigation.goBack()}
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
                {t('auth.changeEmail') || 'Change Email Address'}
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
    marginBottom: spacing.xs,
  },
  emailText: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  formContainer: {
    padding: isTablet() ? spacing.xxl : spacing.lg,
    maxWidth: isTablet() ? 500 : '100%',
    width: '100%',
    alignItems: 'center',
  },
  instructionText: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  codeInput: {
    width: moderateScale(45),
    height: moderateScale(55),
    borderRadius: borderRadius.md,
    borderWidth: 2,
    textAlign: 'center',
    fontWeight: 'bold',
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
