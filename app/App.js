import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, ActivityIndicator, View, Animated } from 'react-native';
import { AppSettingsProvider, useAppSettings } from './context/AppSettingsContext';
import { UserProvider } from './context/UserContext';
import ErrorBoundary from './components/ErrorBoundary';
import { getCurrentUser } from '../database/auth';

import SignIn from './auth/SignIn';
import SignUp from './auth/SignUp';
import VerifyEmail from './auth/VerifyEmail';

import Home from './tabs/Home';
import Chats from './tabs/Chats';
import Post from './tabs/Post';
import Lecture from './tabs/Lecture';
import Profile from './tabs/Profile';

import Settings from './screens/Settings';
import ChangePassword from './screens/ChangePassword';
import ProfileSettings from './screens/settings/ProfileSettings';
import PersonalizationSettings from './screens/settings/PersonalizationSettings';
import NotificationSettings from './screens/settings/NotificationSettings';
import AccountSettings from './screens/settings/AccountSettings';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AnimatedTabIcon = ({ focused, iconName, color, size }) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1.2 : 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Ionicons name={iconName} size={size} color={color} />
    </Animated.View>
  );
};

const TabNavigator = () => {
  const { t, theme, isDarkMode } = useAppSettings();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Post') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Lecture') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <AnimatedTabIcon focused={focused} iconName={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{ title: t('tabs.home') }}
      />
      <Tab.Screen 
        name="Chats" 
        component={Chats} 
        options={{ title: t('tabs.chats') }}
      />
      <Tab.Screen 
        name="Post" 
        component={Post} 
        options={{ 
          title: t('tabs.post'),
          tabBarIconStyle: { marginTop: -4 }
        }}
      />
      <Tab.Screen 
        name="Lecture" 
        component={Lecture} 
        options={{ title: t('tabs.lecture') }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile} 
        options={{ title: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
};

const MainStack = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('Session check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthenticated ? 'MainTabs' : 'SignIn'}
    >
      <Stack.Screen 
        name="SignIn" 
        component={SignIn}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUp}
      />
      <Stack.Screen 
        name="VerifyEmail" 
        component={VerifyEmail}
      />
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
      />
      <Stack.Screen 
        name="Settings" 
        component={Settings}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProfileSettings" 
        component={ProfileSettings}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PersonalizationSettings" 
        component={PersonalizationSettings}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettings}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AccountSettings" 
        component={AccountSettings}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePassword}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppSettingsProvider>
        <UserProvider>
          <NavigationContainer>
            <MainStack />
          </NavigationContainer>
        </UserProvider>
      </AppSettingsProvider>
    </ErrorBoundary>
  );
}