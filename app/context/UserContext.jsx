import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, getCompleteUserData } from '../../database/auth';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  console.log('=== UserProvider rendering ===');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    console.log('=== UserProvider useEffect - initializing user ===');
    initializeUser();
  }, []);

  const initializeUser = async () => {
    console.log('=== UserProvider initializeUser START ===');
    try {
      setIsLoading(true);
      console.log('=== Getting cached data ===');
      
      const cachedData = await AsyncStorage.getItem('userData');
      const cached = cachedData ? JSON.parse(cachedData) : null;
      console.log('=== Cached data:', cached ? 'Found' : 'Not found');
      
      console.log('=== Getting current user from Appwrite ===');
      const appwriteUser = await getCurrentUser();
      console.log('=== Appwrite user:', appwriteUser ? 'Found' : 'Not found');
      
      if (appwriteUser) {
        console.log('=== Getting complete user data ===');
        const completeUserData = await getCompleteUserData();
        console.log('=== Complete user data:', completeUserData ? 'Found' : 'Not found');
        
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
            stage: yearToStage(completeUserData.year),
            postsCount: completeUserData.postsCount || 0,
            followersCount: completeUserData.followersCount || 0,
            followingCount: completeUserData.followingCount || 0,
            isEmailVerified: completeUserData.emailVerification || false,
            lastAcademicUpdate: completeUserData.lastAcademicUpdate || null,
          };
          
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          setUser(userData);
        }
      } else {
        if (cached) {
          setUser(cached);
        } else {
          await AsyncStorage.removeItem('userData');
          setUser(null);
        }
      }
    } catch (error) {
      try {
        const cachedData = await AsyncStorage.getItem('userData');
        if (cachedData) {
          setUser(JSON.parse(cachedData));
        }
      } catch (cacheError) {
        // Failed to load cached data
      }
    } finally {
      setIsLoading(false);
      setSessionChecked(true);
    }
  };

  const loadUserData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('userData');
      const cached = cachedData ? JSON.parse(cachedData) : null;
      
      const appwriteUser = await getCurrentUser();
      
      if (appwriteUser) {
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
            stage: yearToStage(completeUserData.year),
            postsCount: completeUserData.postsCount || 0,
            followersCount: completeUserData.followersCount || 0,
            followingCount: completeUserData.followingCount || 0,
            isEmailVerified: completeUserData.emailVerification || false,
            lastAcademicUpdate: completeUserData.lastAcademicUpdate || null,
          };
          
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          setUser(userData);
        }
      } else {
        if (cached) {
          setUser(cached);
        }
      }
    } catch (error) {
      const cachedData = await AsyncStorage.getItem('userData');
      if (cachedData) {
        setUser(JSON.parse(cachedData));
      }
    }
  };

  const stageToYear = (stage) => {
    const stageMap = {
      'firstYear': 1,
      'secondYear': 2,
      'thirdYear': 3,
      'fourthYear': 4,
      'fifthYear': 5,
      'sixthYear': 6,
      'First Year': 1,
      'Second Year': 2,
      'Third Year': 3,
      'Fourth Year': 4,
      'Fifth Year': 5,
      'Sixth Year': 6
    };
    return stageMap[stage] || parseInt(stage) || null;
  };

  const yearToStage = (year) => {
    const yearMap = {
      1: 'firstYear',
      2: 'secondYear',
      3: 'thirdYear',
      4: 'fourthYear',
      5: 'fifthYear',
      6: 'sixthYear'
    };
    return yearMap[year] || year?.toString() || '';
  };

  const updateUser = async (updates) => {
    try {
      const currentData = await AsyncStorage.getItem('userData');
      const parsedData = currentData ? JSON.parse(currentData) : {};
      
      const updatedData = {
        ...parsedData,
        ...updates,
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      setUser(updatedData);
      
      const appwriteUser = await getCurrentUser();
      if (appwriteUser) {
        const { updateUserDocument } = require('../../database/auth');
        
        const appwriteUpdates = {};
        if (updates.fullName !== undefined) appwriteUpdates.name = updates.fullName;
        if (updates.bio !== undefined) appwriteUpdates.bio = updates.bio;
        if (updates.profilePicture !== undefined) appwriteUpdates.profilePicture = updates.profilePicture;
        if (updates.university !== undefined) appwriteUpdates.university = updates.university;
        if (updates.college !== undefined) appwriteUpdates.major = updates.college;
        if (updates.department !== undefined) appwriteUpdates.department = updates.department;
        if (updates.stage !== undefined) {
          appwriteUpdates.year = stageToYear(updates.stage);
        }
        if (updates.lastAcademicUpdate !== undefined) appwriteUpdates.lastAcademicUpdate = updates.lastAcademicUpdate;
        
        await updateUserDocument(appwriteUser.$id, appwriteUpdates);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateProfilePicture = async (imageUrl, deleteUrl = null) => {
    try {
      // Delete old profile picture if exists
      const oldDeleteUrl = await AsyncStorage.getItem('profilePictureDeleteUrl');
      if (oldDeleteUrl) {
        try {
          const { deleteImageFromImgbb } = require('../../services/imgbbService');
          await deleteImageFromImgbb(oldDeleteUrl);
        } catch (deleteError) {
          // Ignore delete errors, proceed with update
        }
      }
      
      // Store new delete URL if provided
      if (deleteUrl) {
        await AsyncStorage.setItem('profilePictureDeleteUrl', deleteUrl);
      }
      
      const appwriteUser = await getCurrentUser();
      if (appwriteUser) {
        const { updateUserDocument } = require('../../database/auth');
        await updateUserDocument(appwriteUser.$id, { profilePicture: imageUrl });
      }
      return await updateUser({ profilePicture: imageUrl });
    } catch (error) {
      return false;
    }
  };

  const clearUser = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      // Failed to clear user data from storage
    }
  };

  const setUserData = async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      // Failed to store user data
    }
  };

  const value = {
    user,
    isLoading,
    sessionChecked,
    updateUser,
    updateProfilePicture,
    clearUser,
    refreshUser: loadUserData,
    setUserData,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
