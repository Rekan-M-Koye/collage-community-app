import { databases, config } from './config';
import { ID, Query } from 'appwrite';

export const createReply = async (replyData) => {
    console.log('[DEBUG createReply] called with:', JSON.stringify(replyData, null, 2));
    try {
        if (!replyData || typeof replyData !== 'object') {
            console.log('[DEBUG createReply] Invalid reply data');
            throw new Error('Invalid reply data');
        }
        
        if (!replyData.postId || !replyData.userId) {
            console.log('[DEBUG createReply] Missing required fields - postId:', replyData.postId, 'userId:', replyData.userId);
            throw new Error('Missing required fields');
        }
        
        console.log('[DEBUG createReply] Creating document in database...');
        console.log('[DEBUG createReply] databaseId:', config.databaseId);
        console.log('[DEBUG createReply] repliesCollectionId:', config.repliesCollectionId);
        
        const reply = await databases.createDocument(
            config.databaseId,
            config.repliesCollectionId,
            ID.unique(),
            replyData
        );
        console.log('[DEBUG createReply] Document created:', reply?.$id);

        console.log('[DEBUG createReply] Incrementing post reply count...');
        await incrementPostReplyCount(replyData.postId);
        console.log('[DEBUG createReply] Post reply count incremented');

        return reply;
    } catch (error) {
        console.log('[DEBUG createReply] ERROR:', error);
        console.log('[DEBUG createReply] Error message:', error?.message);
        console.log('[DEBUG createReply] Error code:', error?.code);
        throw error;
    }
};

export const getReply = async (replyId) => {
    try {
        if (!replyId || typeof replyId !== 'string') {
            throw new Error('Invalid reply ID');
        }
        
        const reply = await databases.getDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId
        );
        return reply;
    } catch (error) {
        throw error;
    }
};

export const getRepliesByPost = async (postId, limit = 50, offset = 0) => {
    try {
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
        const replies = await databases.listDocuments(
            config.databaseId,
            config.repliesCollectionId,
            [
                Query.equal('postId', postId),
                Query.orderDesc('upCount'),
                Query.limit(Math.min(limit, 100)),
                Query.offset(offset)
            ]
        );
        return replies.documents;
    } catch (error) {
        throw error;
    }
};

export const getRepliesByUser = async (userId, limit = 20, offset = 0) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        
        const replies = await databases.listDocuments(
            config.databaseId,
            config.repliesCollectionId,
            [
                Query.equal('userId', userId),
                Query.orderDesc('$createdAt'),
                Query.limit(Math.min(limit, 100)),
                Query.offset(offset)
            ]
        );
        return replies.documents;
    } catch (error) {
        throw error;
    }
};

export const updateReply = async (replyId, replyData) => {
    try {
        if (!replyId || typeof replyId !== 'string') {
            throw new Error('Invalid reply ID');
        }
        
        if (!replyData || typeof replyData !== 'object') {
            throw new Error('Invalid reply data');
        }
        
        const updateData = {
            ...replyData,
            isEdited: true
        };

        const reply = await databases.updateDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId,
            updateData
        );
        return reply;
    } catch (error) {
        throw error;
    }
};

export const deleteReply = async (replyId, postId, imageDeleteUrls = []) => {
    try {
        if (!replyId || typeof replyId !== 'string') {
            throw new Error('Invalid reply ID');
        }
        
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
        await databases.deleteDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId
        );

        await decrementPostReplyCount(postId);

        if (imageDeleteUrls && imageDeleteUrls.length > 0) {
        }
    } catch (error) {
        throw error;
    }
};

export const deleteRepliesByPost = async (postId) => {
    try {
        if (!postId || typeof postId !== 'string') {
            throw new Error('Invalid post ID');
        }
        
        const replies = await getRepliesByPost(postId, 1000, 0);
        
        for (const reply of replies) {
            await databases.deleteDocument(
                config.databaseId,
                config.repliesCollectionId,
                reply.$id
            );

            if (reply.imageDeleteUrls && reply.imageDeleteUrls.length > 0) {
            }
        }
    } catch (error) {
        throw error;
    }
};

export const markReplyAsAccepted = async (replyId) => {
    try {
        if (!replyId || typeof replyId !== 'string') {
            throw new Error('Invalid reply ID');
        }
        
        await databases.updateDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId,
            { isAccepted: true }
        );
    } catch (error) {
        throw error;
    }
};

export const unmarkReplyAsAccepted = async (replyId) => {
    try {
        if (!replyId || typeof replyId !== 'string') {
            throw new Error('Invalid reply ID');
        }
        
        await databases.updateDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId,
            { isAccepted: false }
        );
    } catch (error) {
        throw error;
    }
};

const incrementPostReplyCount = async (postId) => {
    try {
        const { getPost } = require('./posts');
        const post = await getPost(postId);
        await databases.updateDocument(
            config.databaseId,
            config.postsCollectionId,
            postId,
            { replyCount: (post.replyCount || 0) + 1 }
        );
    } catch (error) {
    }
};

const decrementPostReplyCount = async (postId) => {
    try {
        const { getPost } = require('./posts');
        const post = await getPost(postId);
        await databases.updateDocument(
            config.databaseId,
            config.postsCollectionId,
            postId,
            { replyCount: Math.max(0, (post.replyCount || 0) - 1) }
        );
    } catch (error) {
    }
};
