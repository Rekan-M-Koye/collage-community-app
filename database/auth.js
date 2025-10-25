import { account, databases, config } from './config';
import { ID, Permission, Role } from 'appwrite';

export const signUp = async (email, password, name, additionalData = {}) => {
    let userId = null;
    let userCreated = false;
    
    try {
        userId = ID.unique();
        
        const user = await account.create(
            userId,
            email,
            password,
            name
        );
        userCreated = true;
        
        await signIn(email, password);
        
        await createUserDocument(userId, name, email, additionalData);
        
        return user;
    } catch (error) {
        console.error('Sign up error:', error);
        
        if (userCreated && userId) {
            try {
                await account.deleteSession('current');
            } catch (sessionError) {
                console.error('Session cleanup error:', sessionError);
            }
            
            try {
                await databases.deleteDocument(
                    config.databaseId,
                    '68fc7b42001bf7efbba3',
                    userId
                );
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }
        
        throw error;
    }
};

const createUserDocument = async (userId, name, email, additionalData = {}) => {
    try {
        const userDoc = await databases.createDocument(
            config.databaseId,
            '68fc7b42001bf7efbba3',
            userId,
            {
                userID: userId,
                name,
                email,
                bio: '',
                profilePicture: '',
                isEmailVerified: false,
                university: additionalData.university || '',
                major: additionalData.college || '',
                department: additionalData.department || '',
                year: additionalData.stage || 1,
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
        console.error('Create user document error:', error);
        throw error;
    }
};

export const signIn = async (email, password) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await account.deleteSession('current');
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

export const getCurrentUser = async () => {
    try {
        const user = await account.get();
        return user;
    } catch (error) {
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
        console.error('Get complete user data error:', error);
        return null;
    }
};

export const getUserDocument = async (userId) => {
    try {
        const userDoc = await databases.getDocument(
            config.databaseId,
            '68fc7b42001bf7efbba3',
            userId
        );
        return userDoc;
    } catch (error) {
        console.error('Get user document error:', error);
        throw error;
    }
};

export const updateUserDocument = async (userId, data) => {
    try {
        const userDoc = await databases.updateDocument(
            config.databaseId,
            '68fc7b42001bf7efbba3',
            userId,
            data
        );
        return userDoc;
    } catch (error) {
        console.error('Update user document error:', error);
        throw error;
    }
};

export const updateUserName = async (name) => {
    try {
        const user = await account.updateName(name);
        return user;
    } catch (error) {
        console.error('Update name error:', error);
        throw error;
    }
};

export const updateUserPassword = async (newPassword, oldPassword) => {
    try {
        const user = await account.updatePassword(newPassword, oldPassword);
        return user;
    } catch (error) {
        console.error('Update password error:', error);
        throw error;
    }
};

export const sendEmailVerification = async () => {
    try {
        const verification = await account.createVerification();
        return verification;
    } catch (error) {
        console.error('Send email verification error:', error);
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
        console.error('Confirm email verification error:', error);
        throw error;
    }
};

export const checkEmailVerification = async () => {
    try {
        const user = await account.get();
        return user.emailVerification;
    } catch (error) {
        console.error('Check email verification error:', error);
        return false;
    }
};

export const resendEmailVerification = async () => {
    try {
        return await sendEmailVerification();
    } catch (error) {
        console.error('Resend email verification error:', error);
        throw error;
    }
};

export const deleteAccount = async () => {
    try {
        const user = await getCurrentUser();
        if (user) {
            await databases.deleteDocument(
                config.databaseId,
                '68fc7b42001bf7efbba3',
                user.$id
            );
            
            await account.deleteSessions();
        }
    } catch (error) {
        console.error('Delete account error:', error);
        throw error;
    }
};
