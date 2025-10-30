import { databases, config } from './config';
import { Query } from 'appwrite';

const USERS_COLLECTION_ID = '68fc7b42001bf7efbba3';

export const searchUsers = async (searchQuery, limit = 10) => {
    try {
        if (!searchQuery || searchQuery.trim().length === 0) {
            return [];
        }

        const users = await databases.listDocuments(
            config.databaseId,
            USERS_COLLECTION_ID,
            [
                Query.limit(100),
                Query.orderDesc('$createdAt')
            ]
        );
        
        const searchLower = searchQuery.toLowerCase();
        const filtered = users.documents.filter(user => 
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.department?.toLowerCase().includes(searchLower)
        ).slice(0, limit);
        
        return filtered;
    } catch (error) {
        console.error('Search users error:', error);
        return [];
    }
};

export const getUserById = async (userId) => {
    try {
        const user = await databases.getDocument(
            config.databaseId,
            USERS_COLLECTION_ID,
            userId
        );
        return user;
    } catch (error) {
        console.error('Get user by ID error:', error);
        throw error;
    }
};

export const getUsersByDepartment = async (department, limit = 20, offset = 0) => {
    try {
        const queries = [
            Query.equal('department', department),
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('$createdAt')
        ];

        const users = await databases.listDocuments(
            config.databaseId,
            USERS_COLLECTION_ID,
            queries
        );
        
        return users.documents;
    } catch (error) {
        console.error('Get users by department error:', error);
        return [];
    }
};
