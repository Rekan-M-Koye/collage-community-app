import { databases, storage, config } from './config';
import { ID, Query } from 'appwrite';

export const createPost = async (postData) => {
    try {
        const post = await databases.createDocument(
            config.databaseId,
            'POSTS_COLLECTION_ID',
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
            'POSTS_COLLECTION_ID',
            postId
        );
        return post;
    } catch (error) {
        console.error('Get post error:', error);
        throw error;
    }
};

export const getPosts = async (limit = 20, offset = 0) => {
    try {
        const posts = await databases.listDocuments(
            config.databaseId,
            'POSTS_COLLECTION_ID',
            [
                Query.orderDesc('$createdAt'),
                Query.limit(limit),
                Query.offset(offset)
            ]
        );
        return posts.documents;
    } catch (error) {
        console.error('Get posts error:', error);
        throw error;
    }
};

export const updatePost = async (postId, postData) => {
    try {
        const post = await databases.updateDocument(
            config.databaseId,
            'POSTS_COLLECTION_ID',
            postId,
            postData
        );
        return post;
    } catch (error) {
        console.error('Update post error:', error);
        throw error;
    }
};

export const deletePost = async (postId) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            'POSTS_COLLECTION_ID',
            postId
        );
    } catch (error) {
        console.error('Delete post error:', error);
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
