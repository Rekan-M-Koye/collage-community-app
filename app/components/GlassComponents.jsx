import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppSettingsSafe } from '../context/AppSettingsContext';

export const GlassContainer = ({ 
  children, 
  style, 
  intensity,
  borderRadius = 16,
  borderWidth = 1,
}) => {
  const context = useAppSettingsSafe();
  const theme = context?.theme || {};
  const isDarkMode = context?.isDarkMode || false;
  
  const isAndroid = Platform.OS === 'android';
  
  const glassBackground = theme.glass?.background || (
    isDarkMode 
      ? (isAndroid ? 'rgba(28, 28, 30, 0.92)' : 'rgba(28, 28, 30, 0.7)') 
      : (isAndroid ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.7)')
  );
  const glassIntensity = intensity || (isAndroid ? 50 : 20);
  const glassTint = theme.glass?.tint || (isDarkMode ? 'dark' : 'light');
  
  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={glassIntensity}
          tint={glassTint}
          style={[
            StyleSheet.absoluteFill,
            { 
              borderRadius,
              overflow: 'hidden',
            }
          ]}
        />
      )}
      {isAndroid && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius,
              overflow: 'hidden',
            }
          ]}
        />
      )}
      <View 
        style={[
          StyleSheet.absoluteFill,
          { 
            backgroundColor: glassBackground,
            borderRadius,
            shadowColor: isDarkMode ? '#000' : '#999',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isAndroid ? 0.15 : 0.1,
            shadowRadius: 12,
            elevation: isAndroid ? 6 : 0,
          }
        ]} 
      />
      <View 
        style={[
          StyleSheet.absoluteFill,
          { 
            borderRadius,
            borderTopWidth: borderWidth,
            borderLeftWidth: borderWidth,
            borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
            borderLeftColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
          }
        ]} 
      />
      <View 
        style={[
          StyleSheet.absoluteFill,
          { 
            borderRadius,
            borderBottomWidth: borderWidth,
            borderRightWidth: borderWidth,
            borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
            borderRightColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
          }
        ]} 
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

export const GlassCard = ({ 
  children, 
  style,
  intensity,
  padding = 16,
}) => {
  return (
    <GlassContainer 
      style={[{ padding }, style]}
      intensity={intensity}
    >
      {children}
    </GlassContainer>
  );
};

export const GlassInput = ({ 
  children, 
  style,
  focused = false,
}) => {
  const context = useAppSettingsSafe();
  const theme = context?.theme || {};
  const isDarkMode = context?.isDarkMode || false;
  
  const isAndroid = Platform.OS === 'android';
  
  const inputBackground = theme.input?.background || (
    isDarkMode 
      ? (isAndroid ? 'rgba(28, 28, 30, 0.95)' : 'rgba(28, 28, 30, 0.7)') 
      : (isAndroid ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)')
  );
  const glassTint = theme.glass?.tint || (isDarkMode ? 'dark' : 'light');
  const primaryColor = theme.primary || '#007AFF';
  
  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={15}
          tint={glassTint}
          style={[
            StyleSheet.absoluteFill,
            styles.inputBlur,
          ]}
        />
      )}
      <View 
        style={[
          StyleSheet.absoluteFill,
          { 
            backgroundColor: inputBackground,
            borderRadius: 16,
            shadowColor: focused ? primaryColor : (isDarkMode ? '#000' : '#999'),
            shadowOffset: { width: 0, height: focused ? 4 : 2 },
            shadowOpacity: focused ? 0.3 : 0.1,
            shadowRadius: focused ? 8 : 4,
            elevation: focused ? 4 : 2,
          }
        ]} 
      />
      <View 
        style={[
          StyleSheet.absoluteFill,
          { 
            borderRadius: 16,
            borderTopWidth: focused ? 2 : 1.5,
            borderLeftWidth: focused ? 2 : 1.5,
            borderTopColor: focused 
              ? primaryColor 
              : (isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)'),
            borderLeftColor: focused 
              ? primaryColor 
              : (isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)'),
          }
        ]} 
      />
      <View 
        style={[
          StyleSheet.absoluteFill,
          { 
            borderRadius: 16,
            borderBottomWidth: focused ? 2 : 1.5,
            borderRightWidth: focused ? 2 : 1.5,
            borderBottomColor: focused 
              ? primaryColor 
              : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'),
            borderRightColor: focused 
              ? primaryColor 
              : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'),
          }
        ]} 
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

export const GlassButton = ({ 
  children, 
  style,
  onPress,
  variant = 'primary',
}) => {
  const context = useAppSettingsSafe();
  const theme = context?.theme || {};
  const isDarkMode = context?.isDarkMode || false;
  
  const isAndroid = Platform.OS === 'android';
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return theme.primary || '#007AFF';
      case 'secondary':
        return isDarkMode 
          ? (isAndroid ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)') 
          : (isAndroid ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.05)');
      case 'danger':
        return theme.danger || '#FF3B30';
      default:
        return theme.primary || '#007AFF';
    }
  };
  
  const glassTint = theme.glass?.tint || (isDarkMode ? 'dark' : 'light');
  
  return (
    <View style={[styles.container, style]}>
      {variant === 'secondary' && Platform.OS === 'ios' && (
        <BlurView
          intensity={20}
          tint={glassTint}
          style={[StyleSheet.absoluteFill, styles.buttonBlur]}
        />
      )}
      <View 
        style={[
          StyleSheet.absoluteFill,
          { 
            backgroundColor: getBackgroundColor(),
            borderRadius: 16,
            shadowColor: variant === 'primary' ? theme.primary : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: variant === 'primary' ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: variant === 'primary' ? 4 : 2,
          }
        ]} 
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  inputBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
