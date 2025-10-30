import { databases, storage, config } from './config';
import { ID, Query } from 'appwrite';
import { handleNetworkError } from '../app/utils/networkErrorHandler';

export const createPost = async (postData) => {
    try {
        const post = await databases.createDocument(
            config.databaseId,
            config.postsCollectionId,
            ID.unique(),
            postData
        );
        return post;
    } catch (error) {
        console.error('Create post error:', error);
        throw error;
    }
};

export const getPost = async (postId) => {
    try {
        const post = await databases.getDocument(
            config.databaseId,
            config.postsCollectionId,
            postId
        );
        return post;
    } catch (error) {
        console.error('Get post error:', error);
        throw error;
    }
};

export const getPosts = async (filters = {}, limit = 20, offset = 0) => {
    try {
        const queries = [
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('$createdAt')
        ];

        if (filters.department) {
            queries.push(Query.equal('department', filters.department));
        }
        if (filters.stage && filters.stage !== 'all') {
            queries.push(Query.equal('stage', filters.stage));
        }
        if (filters.postType) {
            queries.push(Query.equal('postType', filters.postType));
        }
        if (filters.userId) {
            queries.push(Query.equal('userId', filters.userId));
        }

        const posts = await databases.listDocuments(
            config.databaseId,
            config.postsCollectionId,
            queries
        );
        
        return posts.documents;
    } catch (error) {
        const errorInfo = handleNetworkError(error);
        console.error('Get posts error:', errorInfo.message);
        throw error;
    }
};

export const getPostsByDepartments = async (departments = [], stage = 'all', limit = 20, offset = 0) => {
    try {
        if (!departments || departments.length === 0) {
            return [];
        }

        const queries = [
            Query.equal('department', departments),
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('$createdAt')
        ];

        if (stage && stage !== 'all') {
            queries.push(Query.equal('stage', stage));
        }

        const posts = await databases.listDocuments(
            config.databaseId,
            config.postsCollectionId,
            queries
        );
        
        return posts.documents;
    } catch (error) {
        const errorInfo = handleNetworkError(error);
        console.error('Get posts by departments error:', errorInfo.message);
        throw error;
    }
};

export const getAllPublicPosts = async (limit = 20, offset = 0) => {
    try {
        const queries = [
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('$createdAt')
        ];

        const posts = await databases.listDocuments(
            config.databaseId,
            config.postsCollectionId,
            queries
        );
        
        return posts.documents;
    } catch (error) {
        const errorInfo = handleNetworkError(error);
        console.error('Get all public posts error:', errorInfo.message);
        throw error;
    }
};

export const getPostsByDepartmentAndStage = async (department, stage, limit = 20, offset = 0) => {
    return getPosts({ department, stage }, limit, offset);
};

export const getPostsByUser = async (userId, limit = 20, offset = 0) => {
    return getPosts({ userId }, limit, offset);
};

export const searchPosts = async (searchQuery, userDepartment = null, userMajor = null, limit = 20) => {
    try {
        if (!searchQuery || searchQuery.trim().length === 0) {
            return [];
        }

        const queries = [
            Query.limit(500),
            Query.orderDesc('$createdAt')
        ];

        const posts = await databases.listDocuments(
            config.databaseId,
            config.postsCollectionId,
            queries
        );
        
        const searchLower = searchQuery.toLowerCase();
        const filtered = posts.documents.filter(post => {
            const matchesSearch = 
                post.title?.toLowerCase().includes(searchLower) ||
                post.topic?.toLowerCase().includes(searchLower) ||
                post.content?.toLowerCase().includes(searchLower) ||
                post.text?.toLowerCase().includes(searchLower) ||
                post.description?.toLowerCase().includes(searchLower) ||
                post.userName?.toLowerCase().includes(searchLower);
            
            return matchesSearch;
        }).slice(0, limit);
        
        return filtered;
    } catch (error) {
        return [];
    }
};

export const updatePost = async (postId, postData) => {
    try {
        const updateData = {
            ...postData,
            isEdited: true
        };
        
        const post = await databases.updateDocument(
            config.databaseId,
            config.postsCollectionId,
            postId,
            updateData
        );
        return post;
    } catch (error) {
        console.error('Update post error:', error);
        throw error;
    }
};

export const deletePost = async (postId, imageDeleteUrls = []) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            config.postsCollectionId,
            postId
        );

        if (imageDeleteUrls && imageDeleteUrls.length > 0) {
            const { deleteMultipleImages } = require('../services/imgbbService');
            await deleteMultipleImages(imageDeleteUrls);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Delete post error:', error);
        throw error;
    }
};

export const incrementPostViewCount = async (postId, userId = null) => {
    try {
        const post = await getPost(postId);
        const viewedBy = post.viewedBy || [];
        
        if (userId && !viewedBy.includes(userId)) {
            viewedBy.push(userId);
            await databases.updateDocument(
                config.databaseId,
                config.postsCollectionId,
                postId,
                { 
                    viewedBy: viewedBy,
                    viewCount: viewedBy.length 
                }
            );
        } else if (!userId) {
            await databases.updateDocument(
                config.databaseId,
                config.postsCollectionId,
                postId,
                { viewCount: (post.viewCount || 0) + 1 }
            );
        }
    } catch (error) {
        console.error('Increment view count error:', error);
        throw error;
    }
};

export const togglePostLike = async (postId, userId) => {
    try {
        const post = await getPost(postId);
        const likedBy = post.likedBy || [];
        const isLiked = likedBy.includes(userId);
        
        let updatedLikedBy;
        if (isLiked) {
            updatedLikedBy = likedBy.filter(id => id !== userId);
        } else {
            updatedLikedBy = [...likedBy, userId];
        }
        
        await databases.updateDocument(
            config.databaseId,
            config.postsCollectionId,
            postId,
            { 
                likedBy: updatedLikedBy,
                likeCount: updatedLikedBy.length 
            }
        );
        
        return { isLiked: !isLiked, likeCount: updatedLikedBy.length };
    } catch (error) {
        console.error('Toggle like error:', error);
        throw error;
    }
};

export const markQuestionAsResolved = async (postId) => {
    try {
        await databases.updateDocument(
            config.databaseId,
            config.postsCollectionId,
            postId,
            { isResolved: true }
        );
    } catch (error) {
        console.error('Mark resolved error:', error);
        throw error;
    }
};

export const createReply = async (postId, replyData) => {
    try {
        const reply = await databases.createDocument(
            config.databaseId,
            'REPLIES_COLLECTION_ID',
            ID.unique(),
            {
                ...replyData,
                postId
            }
        );
        return reply;
    } catch (error) {
        console.error('Create reply error:', error);
        throw error;
    }
};

export const getReplies = async (postId) => {
    try {
        const replies = await databases.listDocuments(
            config.databaseId,
            'REPLIES_COLLECTION_ID',
            [
                Query.equal('postId', postId),
                Query.orderAsc('$createdAt')
            ]
        );
        return replies.documents;
    } catch (error) {
        console.error('Get replies error:', error);
        throw error;
    }
};

export const deleteReply = async (replyId) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            'REPLIES_COLLECTION_ID',
            replyId
        );
    } catch (error) {
        console.error('Delete reply error:', error);
        throw error;
    }
};

export const uploadImage = async (file) => {
    try {
        const uploadedFile = await storage.createFile(
            config.bucketId,
            ID.unique(),
            file
        );
        return uploadedFile;
    } catch (error) {
        console.error('Upload image error:', error);
        throw error;
    }
};

export const getImageUrl = (fileId) => {
    return storage.getFileView(config.bucketId, fileId);
};

export const deleteImage = async (fileId) => {
    try {
        await storage.deleteFile(config.bucketId, fileId);
    } catch (error) {
        console.error('Delete image error:', error);
        throw error;
    }
};
