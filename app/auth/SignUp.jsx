import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import LanguageDropdown from '../components/LanguageDropdown';
import SearchableDropdown from '../components/SearchableDropdownNew';
import AnimatedBackground from '../components/AnimatedBackground';
import { GlassContainer, GlassInput } from '../components/GlassComponents';
import { getUniversityKeys, getCollegesForUniversity, getDepartmentsForCollege } from '../data/universitiesData';
import { signUp, getCompleteUserData } from '../../database/auth';
import { 
  wp, 
  hp, 
  fontSize, 
  spacing, 
  isTablet,
  moderateScale,
} from '../utils/responsive';
import { borderRadius, shadows } from '../theme/designTokens';

const SignUp = ({ navigation }) => {
  const { setUserData } = useUser();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [stage, setStage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  
  const { t, theme, isDarkMode } = useAppSettings();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (university) {
      setCollege('');
      setDepartment('');
    }
  }, [university]);

  useEffect(() => {
    if (college) {
      setDepartment('');
    }
  }, [college]);

  const getPasswordStrength = (pwd) => {
    if (!pwd || pwd.length < 8) return 'weak';
    
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    const criteriasMet = [hasLetters, hasNumbers, hasSymbols].filter(Boolean).length;
    
    if (criteriasMet === 3 && pwd.length >= 8) return 'strong';
    if (criteriasMet >= 2 || pwd.length >= 10) return 'medium';
    return 'weak';
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return theme.danger;
      case 'medium': return theme.warning;
      case 'strong': return theme.success;
      default: return theme.textSecondary;
    }
  };

  const getStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak': return '33%';
      case 'medium': return '66%';
      case 'strong': return '100%';
      default: return '0%';
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('auth.fullNameRequired') || 'Full name is required');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert(t('common.error'), t('auth.validEmailRequired') || 'Valid email is required');
      return false;
    }
    if (!age || parseInt(age) < 16 || parseInt(age) > 100) {
      Alert.alert(t('common.error'), t('auth.validAgeRequired') || 'Valid age is required');
      return false;
    }
    if (!university) {
      Alert.alert(t('common.error'), t('auth.universityRequired') || 'Please select a university');
      return false;
    }
    if (!college) {
      Alert.alert(t('common.error'), t('auth.collegeRequired') || 'Please select a college');
      return false;
    }
    if (!department) {
      Alert.alert(t('common.error'), t('auth.departmentRequired') || 'Please select a department');
      return false;
    }
    if (!stage) {
      Alert.alert(t('common.error'), t('auth.stageRequired') || 'Please select your stage');
      return false;
    }
    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort') || 'Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordMismatch'));
      return false;
    }
    return true;
  };

  const isFormValid = () => {
    return (
      fullName.trim() !== '' &&
      email.trim() !== '' &&
      email.includes('@') &&
      age !== '' &&
      parseInt(age) >= 16 &&
      parseInt(age) <= 100 &&
      university !== '' &&
      college !== '' &&
      department !== '' &&
      stage !== '' &&
      password.length >= 8 &&
      password === confirmPassword &&
      confirmPassword.length > 0
    );
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const stageNumber = stage.replace(/\D/g, '');
      
      const additionalData = {
        university,
        college,
        department,
        stage: parseInt(stageNumber) || 1,
      };

      await signUp(email, password, fullName, additionalData);
      
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
          isEmailVerified: completeUserData.emailVerification || false,
          lastAcademicUpdate: completeUserData.lastAcademicUpdate || null,
        };
        
        await setUserData(userData);
      }
      
      setIsLoading(false);
      
      Alert.alert(
        t('common.success'),
        t('auth.accountCreated') || 'Account created successfully!',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => navigation.replace('MainTabs'),
          }
        ]
      );
      
    } catch (error) {
      setIsLoading(false);
      console.error('Signup error:', error);
      
      let errorMessage = t('auth.signUpError') || 'Failed to create account. Please try again.';
      
      if (error.message?.includes('user with the same email')) {
        errorMessage = t('auth.emailAlreadyExists') || 'An account with this email already exists.';
      } else if (error.message?.includes('Password')) {
        errorMessage = t('auth.passwordRequirements') || 'Password must be at least 8 characters.';
      }
      
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const universities = getUniversityKeys().map(key => ({
    key,
    label: t(`universities.${key}`)
  }));

  const getAvailableColleges = () => {
    if (!university) return [];
    
    const collegeKeys = getCollegesForUniversity(university);
    return collegeKeys.map(key => ({
      key,
      label: t(`colleges.${key}`)
    }));
  };

  const colleges = getAvailableColleges();

  const getAvailableDepartments = () => {
    if (!college || !university) return [];
    
    const departmentKeys = getDepartmentsForCollege(university, college);
    return departmentKeys.map(key => ({
      key,
      label: t(`departments.${key}`)
    }));
  };

  const departments = getAvailableDepartments();

  const stages = [
    { key: 'firstYear', label: t('stages.firstYear') },
    { key: 'secondYear', label: t('stages.secondYear') },
    { key: 'thirdYear', label: t('stages.thirdYear') },
    { key: 'fourthYear', label: t('stages.fourthYear') },
    { key: 'fifthYear', label: t('stages.fifthYear') },
    { key: 'sixthYear', label: t('stages.sixthYear') },
  ];

  const ageOptions = Array.from({ length: 28 }, (_, i) => ({
    key: String(17 + i),
    label: String(17 + i),
  }));

  const renderInput = (props) => {
    const { icon, placeholder, value, onChangeText, field, keyboardType, secureTextEntry, showToggle } = props;
    const isFocused = focusedField === field;

    return (
      <GlassInput focused={isFocused} style={{ marginTop: spacing.md }}>
        <View style={styles.inputWrapper}>
          <Ionicons 
            name={icon} 
            size={moderateScale(20)} 
            color={isFocused ? theme.primary : theme.textSecondary} 
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { 
              color: theme.text,
              fontSize: fontSize(16),
            }]}
            placeholder={placeholder}
            placeholderTextColor={theme.input.placeholder}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            keyboardType={keyboardType || 'default'}
            autoCapitalize={field === 'email' ? 'none' : 'words'}
            autoCorrect={false}
            secureTextEntry={secureTextEntry}
          />
          {showToggle && (
            <TouchableOpacity 
              onPress={showToggle}
              style={styles.eyeIcon}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                size={moderateScale(20)} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
          )}
          {field === 'confirmPassword' && passwordsMatch && (
            <Ionicons 
              name="checkmark-circle" 
              size={moderateScale(20)} 
              color={theme.success} 
              style={styles.checkIcon}
            />
          )}
        </View>
      </GlassInput>
    );
  };

  const isTabletDevice = isTablet();

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
      
      <AnimatedBackground particleCount={35} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          <View style={styles.languageContainer}>
            <LanguageDropdown />
          </View>
          
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}>
            
            <View style={styles.headerContainer}>
              <Text style={[styles.headerText, { fontSize: fontSize(isTabletDevice ? 32 : 24) }]}>
                {t('auth.createAccount')}
              </Text>
              <Text style={[styles.subHeaderText, { fontSize: fontSize(14) }]}>
                {t('auth.joinCommunity')}
              </Text>
            </View>

            <GlassContainer 
              style={styles.formContainer}
              intensity={isTablet() ? 30 : 25}
              borderRadius={borderRadius.xl}
            >
              <GlassInput focused={nameFocused}>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="person-outline" 
                    size={moderateScale(20)} 
                    color={nameFocused ? theme.primary : theme.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { 
                      color: theme.text,
                      fontSize: fontSize(15),
                    }]}
                    placeholder={t('auth.fullName')}
                    placeholderTextColor={theme.input.placeholder}
                    value={fullName}
                    onChangeText={setFullName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    autoCorrect={false}
                  />
                </View>
              </GlassInput>

              <GlassInput focused={emailFocused} style={{ marginTop: spacing.md }}>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="mail-outline" 
                    size={moderateScale(20)} 
                    color={emailFocused ? theme.primary : theme.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { 
                      color: theme.text,
                      fontSize: fontSize(15),
                    }]}
                    placeholder={t('auth.collegeEmail')}
                    placeholderTextColor={theme.input.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </GlassInput>

              <SearchableDropdown
                items={ageOptions}
                value={age}
                onSelect={setAge}
                placeholder={t('auth.age')}
                icon="calendar-outline"
                style={{ marginTop: spacing.md }}
              />

              <SearchableDropdown
                items={universities}
                value={university}
                onSelect={setUniversity}
                placeholder={t('auth.selectUniversity')}
                icon="school-outline"
                style={{ marginTop: spacing.md }}
              />

              <SearchableDropdown
                items={colleges}
                value={college}
                onSelect={setCollege}
                placeholder={t('auth.selectCollege')}
                icon="book-outline"
                disabled={!university}
                style={{ marginTop: spacing.md }}
              />

              <SearchableDropdown
                items={departments}
                value={department}
                onSelect={setDepartment}
                placeholder={t('auth.selectDepartment')}
                icon="school-outline"
                disabled={!college}
                style={{ marginTop: spacing.md }}
              />

              <SearchableDropdown
                items={stages}
                value={stage}
                onSelect={setStage}
                placeholder={t('auth.selectStage')}
                icon="library-outline"
                style={{ marginTop: spacing.md }}
              />

              <GlassInput focused={passwordFocused} style={{ marginTop: spacing.md }}>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={moderateScale(20)} 
                    color={passwordFocused ? theme.primary : theme.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { 
                      color: theme.text,
                      fontSize: fontSize(15),
                    }]}
                    placeholder={t('auth.password')}
                    placeholderTextColor={theme.input.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={moderateScale(20)} 
                      color={theme.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </GlassInput>

              {password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.strengthBarContainer}>
                    <View 
                      style={[
                        styles.strengthBar,
                        { 
                          width: getStrengthWidth(),
                          backgroundColor: getStrengthColor(),
                        }
                      ]} 
                    />
                  </View>
                  <Text 
                    style={[
                      styles.strengthText,
                      { 
                        color: getStrengthColor(),
                        fontSize: fontSize(12),
                      }
                    ]}>
                    {t('auth.passwordStrength')}: {t(`auth.${passwordStrength}`)}
                  </Text>
                </View>
              )}

              <GlassInput focused={confirmPasswordFocused} style={{ marginTop: spacing.md }}>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={moderateScale(20)} 
                    color={confirmPasswordFocused ? theme.primary : theme.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { 
                      color: theme.text,
                      fontSize: fontSize(15),
                    }]}
                    placeholder={t('auth.confirmPassword')}
                    placeholderTextColor={theme.input.placeholder}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={moderateScale(20)} 
                      color={theme.textSecondary} 
                    />
                  </TouchableOpacity>
                  {confirmPassword.length > 0 && passwordsMatch && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={moderateScale(20)} 
                      color={theme.success} 
                      style={styles.checkIcon}
                    />
                  )}
                </View>
              </GlassInput>

              {confirmPassword.length > 0 && !passwordsMatch && (
                <Text style={[
                  styles.errorText, 
                  { 
                    color: theme.danger,
                    fontSize: fontSize(12),
                  }
                ]}>
                  {t('auth.passwordMismatch')}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.signUpButton, shadows.large]}
                onPress={handleSignUp}
                disabled={isLoading || !isFormValid()}
                activeOpacity={0.85}>
                <LinearGradient
                  colors={!isFormValid() ? ['#999', '#666'] : theme.gradient}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={[
                        styles.signUpButtonText,
                        { fontSize: fontSize(17), opacity: !isFormValid() ? 0.6 : 1 }
                      ]}>
                        {t('auth.createAccount')}
                      </Text>
                      <Ionicons 
                        name="arrow-forward" 
                        size={moderateScale(20)} 
                        color="#FFFFFF" 
                        style={[styles.buttonIcon, { opacity: !isFormValid() ? 0.6 : 1 }]}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </GlassContainer>

            <View style={styles.footer}>
              <Text style={[
                styles.footerText, 
                { fontSize: fontSize(15) }
              ]}>
                {t('auth.alreadyHaveAccount')}
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('SignIn')} 
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.signInText, 
                  { 
                    color: '#FFFFFF',
                    fontSize: fontSize(15),
                  }
                ]}>
                  {t('auth.signIn')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{ height: hp(10) }} />
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
  keyboardAvoidingView: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? hp(8) : hp(6),
    paddingHorizontal: wp(3),
    paddingBottom: hp(4),
  },
  languageContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(5.5) : hp(4.5),
    right: wp(5),
    zIndex: 1000,
  },
  headerContainer: {
    marginBottom: spacing.lg,
    maxWidth: isTablet() ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  headerText: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subHeaderText: {
    opacity: 0.9,
    color: '#FFFFFF',
  },
  formContainer: {
    padding: isTablet() ? spacing.xxl : spacing.lg,
    maxWidth: isTablet() ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
  passwordStrengthContainer: {
    marginTop: spacing.sm,
  },
  strengthBarContainer: {
    height: moderateScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  strengthBar: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },
  strengthText: {
    fontWeight: '600',
  },
  errorText: {
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  signUpButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  buttonGradient: {
    paddingVertical: spacing.md + spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signInText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignUp;
