import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from '../../locales/i18n';
import { I18nManager, Appearance, View, ActivityIndicator, StyleSheet } from 'react-native';

const AppSettingsContext = createContext();

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};

export const useAppSettingsSafe = () => {
  const context = useContext(AppSettingsContext);
  return context;
};

// Color themes
export const lightTheme = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6C757D',
  textTertiary: '#98989D',
  primary: '#007AFF',
  primaryDark: '#0051D5',
  secondary: '#5856D6',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  border: '#E5E5EA',
  borderSecondary: '#F0F0F0',
  inputBackground: '#F5F5F5',
  shadow: 'rgba(0, 0, 0, 0.1)',
  gradient: ['#007AFF', '#5856D6'],
  gradientLight: ['rgba(0, 122, 255, 0.1)', 'rgba(88, 86, 214, 0.1)'],
  glass: {
    background: 'rgba(248, 250, 255, 0.85)',
    border: 'rgba(200, 210, 225, 0.4)',
    tint: 'light',
    intensity: 20,
  },
  input: {
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(0, 0, 0, 0.08)',
    placeholder: '#8E8E93',
  },
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export const darkTheme = {
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#98989D',
  textTertiary: '#48484A',
  primary: '#0A84FF',
  primaryDark: '#0066CC',
  secondary: '#5E5CE6',
  success: '#32D74B',
  danger: '#FF453A',
  warning: '#FF9F0A',
  border: '#38383A',
  borderSecondary: '#2C2C2E',
  inputBackground: '#2C2C2E',
  shadow: 'rgba(255, 255, 255, 0.1)',
  gradient: ['#0A84FF', '#5E5CE6'],
  gradientLight: ['rgba(10, 132, 255, 0.15)', 'rgba(94, 92, 230, 0.15)'],
  glass: {
    background: 'rgba(28, 28, 30, 0.7)',
    border: 'rgba(255, 255, 255, 0.12)',
    tint: 'dark',
    intensity: 20,
  },
  input: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.12)',
    placeholder: '#8E8E93',
  },
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const AppSettingsProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themePreference, setThemePreference] = useState('system');
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Granular notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    directChats: true,
    groupChats: true,
    friendPosts: true,
  });
  
  // Chat customization settings
  const [chatSettings, setChatSettings] = useState({
    bubbleStyle: 'modern', // 'modern', 'classic', 'minimal'
    bubbleColor: '#667eea', // Primary bubble color for sent messages
    backgroundImage: null, // URL or null for default
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themePreference === 'system') {
        setIsDarkMode(colorScheme === 'dark');
      }
    });

    return () => subscription.remove();
  }, [themePreference]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedLanguage, savedThemePreference, savedNotifications, savedNotificationSettings, savedChatSettings] = await Promise.all([
        AsyncStorage.getItem('appLanguage'),
        AsyncStorage.getItem('themePreference'),
        AsyncStorage.getItem('notificationsEnabled'),
        AsyncStorage.getItem('notificationSettings'),
        AsyncStorage.getItem('chatSettings'),
      ]);

      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
        i18n.locale = savedLanguage;
        if (savedLanguage === 'ar') {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(true);
        }
      } else {
        try {
          const locales = getLocales();
          const deviceLocale = locales && locales[0] ? locales[0].languageCode : 'en';
          const supportedLanguages = ['en', 'ar', 'ku'];
          const defaultLang = supportedLanguages.includes(deviceLocale) ? deviceLocale : 'en';
          setCurrentLanguage(defaultLang);
          i18n.locale = defaultLang;
        } catch (error) {
          setCurrentLanguage('en');
          i18n.locale = 'en';
        }
      }

      const preference = savedThemePreference || 'system';
      setThemePreference(preference);
      
      if (preference === 'system') {
        const systemColorScheme = Appearance.getColorScheme();
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(preference === 'dark');
      }

      if (savedNotifications !== null) {
        setNotificationsEnabled(savedNotifications === 'true');
      }
      
      if (savedNotificationSettings) {
        try {
          const parsed = JSON.parse(savedNotificationSettings);
          setNotificationSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }
      
      if (savedChatSettings) {
        try {
          const parsed = JSON.parse(savedChatSettings);
          setChatSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }
    } catch (error) {
      // Failed to load settings, using defaults
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      setCurrentLanguage(languageCode);
      i18n.locale = languageCode;
      await AsyncStorage.setItem('appLanguage', languageCode);

      // Enable RTL for Arabic
      if (languageCode === 'ar') {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      } else {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
      }
    } catch (error) {
      // Failed to save language preference
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      setThemePreference(newMode ? 'dark' : 'light');
      await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
    } catch (error) {
      // Failed to save theme preference
    }
  };

  const setThemeMode = async (mode) => {
    try {
      setThemePreference(mode);
      await AsyncStorage.setItem('themePreference', mode);
      
      if (mode === 'system') {
        const systemColorScheme = Appearance.getColorScheme();
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(mode === 'dark');
      }
    } catch (error) {
      // Failed to save theme preference
    }
  };

  const toggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await AsyncStorage.setItem('notificationsEnabled', newValue.toString());
    } catch (error) {
      // Failed to save notification preference
    }
  };

  const updateNotificationSetting = async (key, value) => {
    try {
      const newSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(newSettings);
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      // Failed to save notification setting
    }
  };

  const updateChatSetting = async (key, value) => {
    try {
      const newSettings = { ...chatSettings, [key]: value };
      setChatSettings(newSettings);
      await AsyncStorage.setItem('chatSettings', JSON.stringify(newSettings));
    } catch (error) {
      // Failed to save chat setting
    }
  };

  const resetSettings = async () => {
    try {
      await AsyncStorage.multiRemove([
        'appLanguage',
        'themePreference',
        'notificationsEnabled',
        'notificationSettings',
        'chatSettings',
      ]);
      setCurrentLanguage('en');
      i18n.locale = 'en';
      setThemePreference('system');
      const systemColorScheme = Appearance.getColorScheme();
      setIsDarkMode(systemColorScheme === 'dark');
      setNotificationsEnabled(true);
      setNotificationSettings({
        directChats: true,
        groupChats: true,
        friendPosts: true,
      });
      setChatSettings({
        bubbleStyle: 'modern',
        bubbleColor: '#667eea',
        backgroundImage: null,
      });
    } catch (error) {
      // Failed to reset settings
    }
  };

  const t = (key, config) => {
    return i18n.t(key, config);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    isRTL: currentLanguage === 'ar',
    t,

    isDarkMode,
    toggleDarkMode,
    themePreference,
    setThemeMode,
    theme,

    notificationsEnabled,
    toggleNotifications,
    notificationSettings,
    updateNotificationSetting,
    
    chatSettings,
    updateChatSetting,

    isLoading,
    resetSettings,
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
