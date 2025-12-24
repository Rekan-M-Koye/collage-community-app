import { account, databases, config } from './config';
import { ID, Permission, Role, Query } from 'appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_VERIFICATION_KEY = 'pending_verification';

export const initiateSignup = async (email, password, name, additionalData = {}) => {
    try {
        console.log('[Auth] initiateSignup: Starting signup for', email);
        
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        const sanitizedName = sanitizeInput(name);
        
        if (!sanitizedEmail || !sanitizedName) {
            throw new Error('Invalid input data');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            throw new Error('Invalid email format');
        }
        
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        
        const userId = ID.unique();
        
        console.log('[Auth] initiateSignup: Creating account with userId:', userId);
        
        await account.create(
            userId,
            sanitizedEmail,
            password,
            sanitizedName
        );
        
        console.log('[Auth] initiateSignup: Account created, creating session');
        
        await account.createEmailPasswordSession(sanitizedEmail, password);
        
        console.log('[Auth] initiateSignup: Session created, sending verification email');
        console.log('[Auth] NOTE: Verification URL is cloud.appwrite.io - user must click link in email then return to app');
        
        await account.createVerification(
            'https://cloud.appwrite.io'
        );
        
        const pendingData = {
            userId,
            email: sanitizedEmail,
            name: sanitizedName,
            additionalData,
            timestamp: Date.now()
        };
        
        await AsyncStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(pendingData));
        
        return {
            userId,
            email: sanitizedEmail,
            name: sanitizedName
        };
    } catch (error) {
        throw error;
    }
};

export const checkAndCompleteVerification = async () => {
    try {
        console.log('[Auth] checkAndCompleteVerification: Checking verification status');
        
        const user = await account.get();
        
        console.log('[Auth] checkAndCompleteVerification: User emailVerification status:', user.emailVerification);
        
        if (!user.emailVerification) {
            console.log('[Auth] checkAndCompleteVerification: Email not verified yet');
            throw new Error('Email not verified yet');
        }
        
        console.log('[Auth] checkAndCompleteVerification: Email verified, checking for pending data');
        
        const storedData = await AsyncStorage.getItem(PENDING_VERIFICATION_KEY);
        
        if (!storedData) {
            console.warn('[Auth] checkAndCompleteVerification: No pending verification data found');
            throw new Error('No pending verification found');
        }
        
        console.log('[Auth] checkAndCompleteVerification: Found pending data, parsing');
        
        const pendingData = JSON.parse(storedData);
        
        try {
            console.log('[Auth] checkAndCompleteVerification: Checking if user document exists');
            await getUserDocument(user.$id);
            console.log('[Auth] checkAndCompleteVerification: User document exists, cleaning up');
            await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
            return true;
        } catch (error) {
            console.log('[Auth] checkAndCompleteVerification: User document not found, creating new one');
        }
        
        await createUserDocument(
            user.$id,
            pendingData.name,
            pendingData.email,
            pendingData.additionalData
        );
        
        await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
        
        return true;
    } catch (error) {
        throw error;
    }
};

export const resendVerificationEmail = async () => {
    try {
        console.log('[Auth] resendVerificationEmail: Resending verification email');
        
        await account.createVerification(
            'https://cloud.appwrite.io'
        );
        
        console.log('[Auth] resendVerificationEmail: Email sent successfully');
        return true;
    } catch (error) {
        console.error('[Auth] resendVerificationEmail error:', error.message);
        throw error;
    }
};

export const cancelPendingVerification = async () => {
    try {
        await account.deleteSession('current');
        await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
        return true;
    } catch (error) {
        throw error;
    }
};

export const signUp = async (email, password, name, additionalData = {}) => {
    let userId = null;
    let userCreated = false;
    
    try {
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        const sanitizedName = sanitizeInput(name);
        
        if (!sanitizedEmail || !sanitizedName) {
            throw new Error('Invalid input data');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            throw new Error('Invalid email format');
        }
        
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        
        userId = ID.unique();
        
        const user = await account.create(
            userId,
            sanitizedEmail,
            password,
            sanitizedName
        );
        userCreated = true;
        
        await signIn(sanitizedEmail, password);
        
        await createUserDocument(userId, name, email, additionalData);
        
        return user;
    } catch (error) {
        
        if (userCreated && userId) {
            try {
                await account.deleteSession('current');
            } catch (sessionError) {
            }
            
            try {
                await databases.deleteDocument(
                    config.databaseId,
                    config.usersCollectionId || '68fc7b42001bf7efbba3',
                    userId
                );
            } catch (cleanupError) {
            }
        }
        
        throw error;
    }
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>"']/g, '');
};

const createUserDocument = async (userId, name, email, additionalData = {}) => {
    try {
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);
        
        if (!sanitizedName || !sanitizedEmail) {
            throw new Error('Invalid user data');
        }
        
        const userDoc = await databases.createDocument(
            config.databaseId,
            config.usersCollectionId || '68fc7b42001bf7efbba3',
            userId,
            {
                userID: userId,
                name: sanitizedName,
                email: sanitizedEmail,
                bio: '',
                profilePicture: '',
                isEmailVerified: true,
                university: sanitizeInput(additionalData.university || ''),
                major: sanitizeInput(additionalData.college || ''),
                department: sanitizeInput(additionalData.department || ''),
                year: parseInt(additionalData.stage) || 1,
                followersCount: 0,
                followingCount: 0,
                postsCount: 0
            },
            [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );
        return userDoc;
    } catch (error) {
        throw error;
    }
};

export const signIn = async (email, password) => {
    try {
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        
        if (!sanitizedEmail || !password) {
            throw new Error('Email and password are required');
        }
        
        const session = await account.createEmailPasswordSession(sanitizedEmail, password);
        return session;
    } catch (error) {
        throw error;
    }
};

export const signOut = async () => {
    try {
        await account.deleteSession('current');
    } catch (error) {
        throw error;
    }
};

export const getCurrentUser = async () => {
    try {
        const user = await account.get();
        console.log('[Auth] getCurrentUser: User found:', user.$id, 'verified:', user.emailVerification);
        return user;
    } catch (error) {
        console.log('[Auth] getCurrentUser: No user session found');
        if (error.message?.includes('missing scopes') || error.code === 401) {
            return null;
        }
        return null;
    }
};

export const getCompleteUserData = async () => {
    try {
        const authUser = await account.get();
        if (!authUser) return null;
        
        const userDoc = await getUserDocument(authUser.$id);
        
        return {
            ...authUser,
            ...userDoc
        };
    } catch (error) {
        if (error.message?.includes('missing scopes') || error.code === 401) {
            return null;
        }
        return null;
    }
};

export const getUserDocument = async (userId) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        
        const userDoc = await databases.getDocument(
            config.databaseId,
            config.usersCollectionId || '68fc7b42001bf7efbba3',
            userId
        );
        return userDoc;
    } catch (error) {
        throw error;
    }
};

export const updateUserDocument = async (userId, data) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        
        if (data.name) {
            data.name = sanitizeInput(data.name);
        }
        if (data.bio) {
            data.bio = sanitizeInput(data.bio);
        }
        if (data.university) {
            data.university = sanitizeInput(data.university);
        }
        if (data.major) {
            data.major = sanitizeInput(data.major);
        }
        if (data.department) {
            data.department = sanitizeInput(data.department);
        }
        
        const userDoc = await databases.updateDocument(
            config.databaseId,
            config.usersCollectionId || '68fc7b42001bf7efbba3',
            userId,
            data
        );
        return userDoc;
    } catch (error) {
        throw error;
    }
};

export const updateUserName = async (name) => {
    try {
        const user = await account.updateName(name);
        return user;
    } catch (error) {
        throw error;
    }
};

export const updateUserPassword = async (newPassword, oldPassword) => {
    try {
        const user = await account.updatePassword(newPassword, oldPassword);
        return user;
    } catch (error) {
        throw error;
    }
};

export const sendEmailVerification = async () => {
    try {
        const verification = await account.createVerification(
            `${config.endpoint}/verify`
        );
        return verification;
    } catch (error) {
        throw error;
    }
};

export const confirmEmailVerification = async (userId, secret) => {
    try {
        await account.updateVerification(userId, secret);
        
        const user = await getCurrentUser();
        if (user) {
            await updateUserDocument(user.$id, { isEmailVerified: true });
        }
        
        return true;
    } catch (error) {
        throw error;
    }
};

export const checkEmailVerification = async () => {
    try {
        const user = await account.get();
        return user.emailVerification;
    } catch (error) {
        return false;
    }
};

export const resendEmailVerification = async () => {
    try {
        const verification = await account.createVerification(
            `${config.endpoint}/verify`
        );
        return verification;
    } catch (error) {
        throw error;
    }
};

export const deleteAccount = async () => {
    try {
        const user = await getCurrentUser();
        if (user) {
            await databases.deleteDocument(
                config.databaseId,
                config.usersCollectionId || '68fc7b42001bf7efbba3',
                user.$id
            );
            
            await account.deleteSessions();
        }
    } catch (error) {
        throw error;
    }
};
