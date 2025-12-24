import { databases, config } from './config';
import { Query } from 'appwrite';

const sanitizeSearchQuery = (query) => {
    if (typeof query !== 'string') return '';
    return query.trim().replace(/[<>"']/g, '').substring(0, 100);
};

export const searchUsers = async (searchQuery, limit = 10) => {
    try {
        if (!searchQuery || searchQuery.trim().length === 0) {
            return [];
        }
        
        const sanitizedQuery = sanitizeSearchQuery(searchQuery);
        if (sanitizedQuery.length < 2) {
            return [];
        }

        const users = await databases.listDocuments(
            config.databaseId,
            config.usersCollectionId || '68fc7b42001bf7efbba3',
            [
                Query.limit(100),
                Query.orderDesc('$createdAt')
            ]
        );
        
        const searchLower = sanitizedQuery.toLowerCase();
        const filtered = users.documents.filter(user => 
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.department?.toLowerCase().includes(searchLower)
        ).slice(0, limit);
        
        return filtered;
    } catch (error) {
        return [];
    }
};

export const getUserById = async (userId) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        
        const user = await databases.getDocument(
            config.databaseId,
            config.usersCollectionId || '68fc7b42001bf7efbba3',
            userId
        );
        return user;
    } catch (error) {
        throw error;
    }
};

export const getUsersByDepartment = async (department, limit = 20, offset = 0) => {
    try {
        if (!department || typeof department !== 'string') {
            return [];
        }
        
        const queries = [
            Query.equal('department', department),
            Query.limit(Math.min(limit, 100)),
            Query.offset(offset),
            Query.orderDesc('$createdAt')
        ];

        const users = await databases.listDocuments(
            config.databaseId,
            config.usersCollectionId || '68fc7b42001bf7efbba3',
            queries
        );
        
        return users.documents;
    } catch (error) {
        return [];
    }
};
