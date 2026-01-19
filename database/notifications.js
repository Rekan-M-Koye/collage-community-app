import { databases, config } from './config';
import { ID, Query } from 'appwrite';

/**
 * Notification Types:
 * - post_like: Someone liked the user's post
 * - post_reply: Someone replied to the user's post
 * - mention: Someone mentioned the user in a post or reply
 * - friend_post: A friend/followed user created a new post
 * - follow: Someone started following the user
 */

export const NOTIFICATION_TYPES = {
    POST_LIKE: 'post_like',
    POST_REPLY: 'post_reply',
    MENTION: 'mention',
    FRIEND_POST: 'friend_post',
    FOLLOW: 'follow',
};

/**
 * Create a new notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (notificationData) => {
    try {
        if (!notificationData || typeof notificationData !== 'object') {
            throw new Error('Invalid notification data');
        }

        if (!notificationData.userId || !notificationData.type) {
            throw new Error('userId and type are required');
        }

        // Don't create notification if user is notifying themselves
        if (notificationData.userId === notificationData.senderId) {
            return null;
        }

        const notification = await databases.createDocument(
            config.databaseId,
            config.notificationsCollectionId,
            ID.unique(),
            {
                ...notificationData,
                isRead: false,
            }
        );

        return notification;
    } catch (error) {
        // If collection doesn't exist, fail silently
        if (error.code === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of notifications to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} List of notifications
 */
export const getNotifications = async (userId, limit = 20, offset = 0) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }

        if (!config.notificationsCollectionId) {
            return [];
        }

        const notifications = await databases.listDocuments(
            config.databaseId,
            config.notificationsCollectionId,
            [
                Query.equal('userId', userId),
                Query.orderDesc('$createdAt'),
                Query.limit(limit),
                Query.offset(offset),
            ]
        );

        return notifications.documents;
    } catch (error) {
        // If collection doesn't exist, return empty array
        if (error.code === 404) {
            return [];
        }
        throw error;
    }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export const getUnreadNotificationCount = async (userId) => {
    try {
        if (!userId || typeof userId !== 'string') {
            return 0;
        }

        if (!config.notificationsCollectionId) {
            return 0;
        }

        const notifications = await databases.listDocuments(
            config.databaseId,
            config.notificationsCollectionId,
            [
                Query.equal('userId', userId),
                Query.equal('isRead', false),
                Query.limit(100),
            ]
        );

        return notifications.total;
    } catch (error) {
        return 0;
    }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        if (!notificationId || typeof notificationId !== 'string') {
            throw new Error('Invalid notification ID');
        }

        const notification = await databases.updateDocument(
            config.databaseId,
            config.notificationsCollectionId,
            notificationId,
            { isRead: true }
        );

        return notification;
    } catch (error) {
        throw error;
    }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const markAllNotificationsAsRead = async (userId) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }

        if (!config.notificationsCollectionId) {
            return true;
        }

        // Get all unread notifications
        const unreadNotifications = await databases.listDocuments(
            config.databaseId,
            config.notificationsCollectionId,
            [
                Query.equal('userId', userId),
                Query.equal('isRead', false),
                Query.limit(100),
            ]
        );

        // Mark each as read
        const updatePromises = unreadNotifications.documents.map(notification =>
            databases.updateDocument(
                config.databaseId,
                config.notificationsCollectionId,
                notification.$id,
                { isRead: true }
            )
        );

        await Promise.all(updatePromises);

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteNotification = async (notificationId) => {
    try {
        if (!notificationId || typeof notificationId !== 'string') {
            throw new Error('Invalid notification ID');
        }

        await databases.deleteDocument(
            config.databaseId,
            config.notificationsCollectionId,
            notificationId
        );

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete all notifications for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAllNotifications = async (userId) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }

        if (!config.notificationsCollectionId) {
            return true;
        }

        // Get all notifications for user
        const notifications = await databases.listDocuments(
            config.databaseId,
            config.notificationsCollectionId,
            [
                Query.equal('userId', userId),
                Query.limit(100),
            ]
        );

        // Delete each notification
        const deletePromises = notifications.documents.map(notification =>
            databases.deleteDocument(
                config.databaseId,
                config.notificationsCollectionId,
                notification.$id
            )
        );

        await Promise.all(deletePromises);

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Create notification for post like
 * @param {string} postOwnerId - Post owner's user ID
 * @param {string} likerId - User who liked the post
 * @param {string} likerName - Name of user who liked
 * @param {string} likerPhoto - Profile picture of liker
 * @param {string} postId - Post ID
 * @param {string} postPreview - Preview of post content
 */
export const notifyPostLike = async (postOwnerId, likerId, likerName, likerPhoto, postId, postPreview) => {
    return createNotification({
        userId: postOwnerId,
        senderId: likerId,
        senderName: likerName,
        senderProfilePicture: likerPhoto,
        type: NOTIFICATION_TYPES.POST_LIKE,
        postId,
        postPreview: postPreview?.substring(0, 50),
    });
};

/**
 * Create notification for post reply
 * @param {string} postOwnerId - Post owner's user ID
 * @param {string} replierId - User who replied
 * @param {string} replierName - Name of user who replied
 * @param {string} replierPhoto - Profile picture of replier
 * @param {string} postId - Post ID
 * @param {string} replyPreview - Preview of reply content
 */
export const notifyPostReply = async (postOwnerId, replierId, replierName, replierPhoto, postId, replyPreview) => {
    return createNotification({
        userId: postOwnerId,
        senderId: replierId,
        senderName: replierName,
        senderProfilePicture: replierPhoto,
        type: NOTIFICATION_TYPES.POST_REPLY,
        postId,
        postPreview: replyPreview?.substring(0, 50),
    });
};

/**
 * Create notification for mention
 * @param {string} mentionedUserId - User who was mentioned
 * @param {string} mentionerId - User who made the mention
 * @param {string} mentionerName - Name of user who made mention
 * @param {string} mentionerPhoto - Profile picture of mentioner
 * @param {string} postId - Post ID where mention occurred
 * @param {string} contextPreview - Preview of the context
 */
export const notifyMention = async (mentionedUserId, mentionerId, mentionerName, mentionerPhoto, postId, contextPreview) => {
    return createNotification({
        userId: mentionedUserId,
        senderId: mentionerId,
        senderName: mentionerName,
        senderProfilePicture: mentionerPhoto,
        type: NOTIFICATION_TYPES.MENTION,
        postId,
        postPreview: contextPreview?.substring(0, 50),
    });
};

/**
 * Create notification for new friend post
 * @param {string} followerId - User who follows
 * @param {string} posterId - User who posted
 * @param {string} posterName - Name of user who posted
 * @param {string} posterPhoto - Profile picture of poster
 * @param {string} postId - Post ID
 * @param {string} postPreview - Preview of post content
 */
export const notifyFriendPost = async (followerId, posterId, posterName, posterPhoto, postId, postPreview) => {
    return createNotification({
        userId: followerId,
        senderId: posterId,
        senderName: posterName,
        senderProfilePicture: posterPhoto,
        type: NOTIFICATION_TYPES.FRIEND_POST,
        postId,
        postPreview: postPreview?.substring(0, 50),
    });
};

/**
 * Create notification for new follower
 * @param {string} followedUserId - User who was followed
 * @param {string} followerId - User who followed
 * @param {string} followerName - Name of user who followed
 * @param {string} followerPhoto - Profile picture of follower
 */
export const notifyFollow = async (followedUserId, followerId, followerName, followerPhoto) => {
    return createNotification({
        userId: followedUserId,
        senderId: followerId,
        senderName: followerName,
        senderProfilePicture: followerPhoto,
        type: NOTIFICATION_TYPES.FOLLOW,
    });
};
