import { databases, storage, config } from './config';
import { ID, Query } from 'appwrite';
import { handleNetworkError } from '../app/utils/networkErrorHandler';

export const createPost = async (postData) => {
    try {
        if (!postData || typeof postData !== 'object') {
            throw new Error('Invalid post data');
        }
        
        if (!postData.userId || !postData.topic) {
            throw new Error('Missing required fields');
        }
        
        const post = await databases.createDocument(
            config.databaseId,
            config.postsCollectionId,
            ID.unique(),
            postData
        );
        return post;
    } catch (error) {
        throw error;
    }
};

export const getPost = async (postId) => {
    try {
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
        const post = await databases.getDocument(
            config.databaseId,
            config.postsCollectionId,
            postId
        );
        return post;
    } catch (error) {
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
        throw error;
    }
};

export const getAllPublicPosts = async (stage = 'all', limit = 20, offset = 0) => {
    try {
        const queries = [
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
        
        const sanitizedQuery = searchQuery.trim().replace(/[<>"']/g, '').substring(0, 100);
        if (sanitizedQuery.length < 2) {
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
        
        const searchLower = sanitizedQuery.toLowerCase();
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
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
        if (!postData || typeof postData !== 'object') {
            throw new Error('Invalid post data');
        }
        
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
        throw error;
    }
};

export const deletePost = async (postId, imageDeleteUrls = []) => {
    try {
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
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
        throw error;
    }
};

export const incrementPostViewCount = async (postId, userId = null) => {
    try {
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
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
        throw error;
    }
};

export const togglePostLike = async (postId, userId) => {
    try {
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        
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
        throw error;
    }
};

export const markQuestionAsResolved = async (postId) => {
    try {
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
        await databases.updateDocument(
            config.databaseId,
            config.postsCollectionId,
            postId,
            { isResolved: true }
        );
    } catch (error) {
        throw error;
    }
};

export const createReply = async (postId, replyData) => {
    try {
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
        const reply = await databases.createDocument(
            config.databaseId,
            config.repliesCollectionId,
            ID.unique(),
            {
                ...replyData,
                postId
            }
        );
        return reply;
    } catch (error) {
        throw error;
    }
};

export const getReplies = async (postId) => {
    try {
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
        const replies = await databases.listDocuments(
            config.databaseId,
            config.repliesCollectionId,
            [
                Query.equal('postId', postId),
                Query.orderAsc('$createdAt')
            ]
        );
        return replies.documents;
    } catch (error) {
        throw error;
    }
};

export const deleteReply = async (replyId) => {
    try {
        if (!replyId || typeof replyId !== 'string') {
            throw new Error('Invalid reply ID');
        }
        
        await databases.deleteDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId
        );
    } catch (error) {
        throw error;
    }
};

export const uploadImage = async (file) => {
    try {
        if (!file) {
            throw new Error('File is required');
        }
        
        const uploadedFile = await storage.createFile(
            config.bucketId,
            ID.unique(),
            file
        );
        return uploadedFile;
    } catch (error) {
        throw error;
    }
};

export const getImageUrl = (fileId) => {
    return storage.getFileView(config.bucketId, fileId);
};

export const deleteImage = async (fileId) => {
    try {
        if (!fileId || typeof fileId !== 'string') {
            throw new Error('Invalid file ID');
        }
        
        await storage.deleteFile(config.bucketId, fileId);
    } catch (error) {
        throw error;
    }
};

/**
 * Enriches posts with user data for posts that are missing userName
 * @param {Array} posts - Array of post documents
 * @returns {Array} - Posts with enriched user data
 */
export const enrichPostsWithUserData = async (posts) => {
    if (!posts || posts.length === 0) return posts;
    
    // Find posts missing userName
    const postsNeedingUserData = posts.filter(post => !post.userName && post.userId);
    
    if (postsNeedingUserData.length === 0) return posts;
    
    // Get unique user IDs
    const userIds = [...new Set(postsNeedingUserData.map(post => post.userId))];
    
    // Fetch user data for all unique users
    const userDataMap = {};
    await Promise.all(
        userIds.map(async (userId) => {
            try {
                const user = await databases.getDocument(
                    config.databaseId,
                    config.usersCollectionId || '68fc7b42001bf7efbba3',
                    userId
                );
                userDataMap[userId] = {
                    name: user.name || user.fullName,
                    profilePicture: user.profilePicture || null,
                };
            } catch (error) {
                // User not found, skip
            }
        })
    );
    
    // Enrich posts with user data
    return posts.map(post => {
        if (!post.userName && post.userId && userDataMap[post.userId]) {
            return {
                ...post,
                userName: userDataMap[post.userId].name,
                userProfilePicture: post.userProfilePicture || userDataMap[post.userId].profilePicture,
            };
        }
        return post;
    });
};

