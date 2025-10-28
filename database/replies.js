import { databases, config } from './config';
import { ID, Query } from 'appwrite';

export const createReply = async (replyData) => {
    try {
        const reply = await databases.createDocument(
            config.databaseId,
            config.repliesCollectionId,
            ID.unique(),
            replyData
        );

        await incrementPostReplyCount(replyData.postId);

        return reply;
    } catch (error) {
        console.error('Create reply error:', error);
        throw error;
    }
};

export const getReply = async (replyId) => {
    try {
        const reply = await databases.getDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId
        );
        return reply;
    } catch (error) {
        console.error('Get reply error:', error);
        throw error;
    }
};

export const getRepliesByPost = async (postId, limit = 50, offset = 0) => {
    try {
        const replies = await databases.listDocuments(
            config.databaseId,
            config.repliesCollectionId,
            [
                Query.equal('postId', postId),
                Query.orderDesc('upCount'),
                Query.limit(limit),
                Query.offset(offset)
            ]
        );
        return replies.documents;
    } catch (error) {
        console.error('Get replies by post error:', error);
        throw error;
    }
};

export const getRepliesByUser = async (userId, limit = 20, offset = 0) => {
    try {
        const replies = await databases.listDocuments(
            config.databaseId,
            config.repliesCollectionId,
            [
                Query.equal('userId', userId),
                Query.orderDesc('$createdAt'),
                Query.limit(limit),
                Query.offset(offset)
            ]
        );
        return replies.documents;
    } catch (error) {
        console.error('Get replies by user error:', error);
        throw error;
    }
};

export const updateReply = async (replyId, replyData) => {
    try {
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
        console.error('Update reply error:', error);
        throw error;
    }
};

export const deleteReply = async (replyId, postId, imageDeleteUrls = []) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId
        );

        await decrementPostReplyCount(postId);

        if (imageDeleteUrls && imageDeleteUrls.length > 0) {
            console.log('Deleting reply images from imgBB:', imageDeleteUrls);
        }
    } catch (error) {
        console.error('Delete reply error:', error);
        throw error;
    }
};

export const deleteRepliesByPost = async (postId) => {
    try {
        const replies = await getRepliesByPost(postId, 1000, 0);
        
        for (const reply of replies) {
            await databases.deleteDocument(
                config.databaseId,
                config.repliesCollectionId,
                reply.$id
            );

            if (reply.imageDeleteUrls && reply.imageDeleteUrls.length > 0) {
                console.log('Deleting reply images from imgBB:', reply.imageDeleteUrls);
            }
        }

        console.log(`Deleted ${replies.length} replies for post ${postId}`);
    } catch (error) {
        console.error('Delete replies by post error:', error);
        throw error;
    }
};

export const markReplyAsAccepted = async (replyId) => {
    try {
        await databases.updateDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId,
            { isAccepted: true }
        );
    } catch (error) {
        console.error('Mark reply as accepted error:', error);
        throw error;
    }
};

export const unmarkReplyAsAccepted = async (replyId) => {
    try {
        await databases.updateDocument(
            config.databaseId,
            config.repliesCollectionId,
            replyId,
            { isAccepted: false }
        );
    } catch (error) {
        console.error('Unmark reply as accepted error:', error);
        throw error;
    }
};

export const toggleReplyLike = async (replyId, userId) => {
    try {
        console.log('Toggle like for reply:', replyId, userId);
        
    } catch (error) {
        console.error('Toggle reply like error:', error);
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
        console.error('Increment reply count error:', error);
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
        console.error('Decrement reply count error:', error);
    }
};
