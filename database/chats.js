import { databases, config } from './config';
import { ID, Query } from 'appwrite';
import { messagesCacheManager } from '../app/utils/cacheManager';

export const CHAT_TYPES = {
    STAGE_GROUP: 'stage_group',
    DEPARTMENT_GROUP: 'department_group',
};

export const createGroupChat = async (chatData) => {
    try {
        if (!chatData || typeof chatData !== 'object') {
            throw new Error('Invalid chat data');
        }
        
        if (!chatData.type || !Object.values(CHAT_TYPES).includes(chatData.type)) {
            throw new Error('Invalid chat type');
        }
        
        if (!chatData.name || typeof chatData.name !== 'string') {
            throw new Error('Chat name is required');
        }
        
        const chat = await databases.createDocument(
            config.databaseId,
            config.chatsCollectionId,
            ID.unique(),
            {
                ...chatData,
                messageCount: 0,
            }
        );
        return chat;
    } catch (error) {
        throw error;
    }
};

export const createChat = async (chatData) => {
    try {
        if (!chatData || typeof chatData !== 'object') {
            throw new Error('Invalid chat data');
        }
        
        if (!chatData.participants || !Array.isArray(chatData.participants)) {
            throw new Error('Participants array is required');
        }
        
        const chat = await databases.createDocument(
            config.databaseId,
            config.chatsCollectionId,
            ID.unique(),
            chatData
        );
        return chat;
    } catch (error) {
        throw error;
    }
};

export const getUserGroupChats = async (department, stage) => {
    try {
        if (!department || typeof department !== 'string') {
            throw new Error('Invalid department');
        }
        
        if (!config.chatsCollectionId) {
            throw new Error('Chat collection not configured. Please check your .env file.');
        }
        
        const departmentQuery = Query.equal('department', department);
        const allChats = [];
        
        const departmentChats = await databases.listDocuments(
            config.databaseId,
            config.chatsCollectionId,
            [
                departmentQuery,
                Query.equal('type', CHAT_TYPES.DEPARTMENT_GROUP),
                Query.orderDesc('lastMessageAt')
            ]
        );
        allChats.push(...departmentChats.documents);
        
        if (stage) {
            const stageValue = typeof stage === 'number' ? String(stage) : stage;
            const stageChats = await databases.listDocuments(
                config.databaseId,
                config.chatsCollectionId,
                [
                    departmentQuery,
                    Query.equal('stage', stageValue),
                    Query.equal('type', CHAT_TYPES.STAGE_GROUP),
                    Query.orderDesc('lastMessageAt')
                ]
            );
            allChats.push(...stageChats.documents);
        }
        
        return allChats.sort((a, b) => {
            const dateA = new Date(a.lastMessageAt || a.createdAt);
            const dateB = new Date(b.lastMessageAt || b.createdAt);
            return dateB - dateA;
        });
    } catch (error) {
        throw error;
    }
};

export const getChats = async (userId) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        
        const chats = await databases.listDocuments(
            config.databaseId,
            config.chatsCollectionId,
            [
                Query.equal('participants', userId),
                Query.orderDesc('$updatedAt')
            ]
        );
        return chats.documents;
    } catch (error) {
        throw error;
    }
};

export const getChat = async (chatId) => {
    try {
        if (!chatId || typeof chatId !== 'string') {
            throw new Error('Invalid chat ID');
        }
        
        const chat = await databases.getDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );
        return chat;
    } catch (error) {
        throw error;
    }
};

export const deleteChat = async (chatId) => {
    try {
        if (!chatId || typeof chatId !== 'string') {
            throw new Error('Invalid chat ID');
        }
        
        await databases.deleteDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );
    } catch (error) {
        throw error;
    }
};

export const canUserSendMessage = async (chatId, userId) => {
    try {
        if (!chatId || !userId) {
            return false;
        }
        
        const chat = await databases.getDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );
        
        if (chat.type === 'private') {
            return chat.participants?.includes(userId) || false;
        }
        
        if (chat.type === 'custom_group') {
            // Must be a participant first
            if (!chat.participants?.includes(userId)) {
                return false;
            }
            
            // Check if onlyAdminsCanPost is enabled in settings
            let settings = {};
            try {
                settings = chat.settings ? JSON.parse(chat.settings) : {};
            } catch (e) {
                settings = {};
            }
            
            // If only admins can post, check if user is admin
            if (settings.onlyAdminsCanPost) {
                return chat.admins?.includes(userId) || 
                       chat.representatives?.includes(userId) || 
                       false;
            }
            
            return true;
        }
        
        if (!chat.requiresRepresentative) {
            return true;
        }
        
        return chat.representatives?.includes(userId) || false;
    } catch (error) {
        return false;
    }
};

export const sendMessage = async (chatId, messageData) => {
    try {
        if (!chatId || typeof chatId !== 'string') {
            throw new Error('Invalid chat ID');
        }
        
        if (!messageData || typeof messageData !== 'object') {
            throw new Error('Invalid message data');
        }
        
        if (!messageData.senderId) {
            throw new Error('Missing required message fields');
        }

        const hasContent = messageData.content && messageData.content.trim().length > 0;
        const hasImages = messageData.images && messageData.images.length > 0;

        if (!hasContent && !hasImages) {
            throw new Error('Message must have either content or an image');
        }
        
        const canSend = await canUserSendMessage(chatId, messageData.senderId);
        if (!canSend) {
            throw new Error('User does not have permission to send messages in this chat');
        }

        // Check for @everyone mention
        const mentionsAll = checkForEveryoneMention(messageData.content);
        
        // Build document with only valid fields matching Appwrite schema
        const documentData = {
            chatId,
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            content: messageData.content || '',
            mentionsAll,
        };
        
        // Handle image - use imageUrl field only (most reliable)
        if (hasImages) {
            documentData.imageUrl = messageData.images[0];
        }
        
        // Add reply fields if this is a reply
        if (messageData.replyToId) {
            documentData.replyToId = messageData.replyToId;
            documentData.replyToContent = messageData.replyToContent || '';
            documentData.replyToSender = messageData.replyToSender || '';
        }
        
        const message = await databases.createDocument(
            config.databaseId,
            config.messagesCollectionId,
            ID.unique(),
            documentData
        );
        
        const chat = await getChat(chatId);
        const currentCount = chat.messageCount || 0;
        
        let lastMessagePreview = '';
        if (hasContent) {
            lastMessagePreview = messageData.content.substring(0, 100);
        } else if (hasImages) {
            lastMessagePreview = '📷 Image';
        }
        
        await databases.updateDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId,
            {
                lastMessage: lastMessagePreview,
                lastMessageAt: new Date().toISOString(),
                messageCount: currentCount + 1,
            }
        );
        
        // Add message to cache
        await messagesCacheManager.addMessageToCache(chatId, message, 100);
        
        return message;
    } catch (error) {
        throw error;
    }
};

export const getMessages = async (chatId, limit = 50, offset = 0, useCache = true) => {
    try {
        if (!chatId || typeof chatId !== 'string') {
            throw new Error('Invalid chat ID');
        }
        
        if (!config.messagesCollectionId) {
            throw new Error('Messages collection not configured. Please check your .env file.');
        }
        
        // Try to get cached data first (only for initial load without offset)
        if (useCache && offset === 0) {
            const cached = await messagesCacheManager.getCachedMessages(chatId, limit);
            if (cached?.value && !cached.isStale) {
                return cached.value;
            }
        }
        
        const messages = await databases.listDocuments(
            config.databaseId,
            config.messagesCollectionId,
            [
                Query.equal('chatId', chatId),
                Query.orderDesc('$createdAt'),
                Query.limit(Math.min(limit, 100)),
                Query.offset(offset)
            ]
        );
        
        // Cache the messages for initial load
        if (offset === 0) {
            await messagesCacheManager.cacheMessages(chatId, messages.documents, limit);
        }
        
        return messages.documents;
    } catch (error) {
        // On network error, try to return stale cache
        if (offset === 0) {
            const cached = await messagesCacheManager.getCachedMessages(chatId, limit);
            if (cached?.value) {
                return cached.value;
            }
        }
        throw error;
    }
};

export const deleteMessage = async (messageId, imageDeleteUrl = null) => {
    try {
        if (!messageId || typeof messageId !== 'string') {
            throw new Error('Invalid message ID');
        }
        
        await databases.deleteDocument(
            config.databaseId,
            config.messagesCollectionId,
            messageId
        );
        
        // Delete image from imgbb if delete URL is provided
        if (imageDeleteUrl) {
            try {
                const { deleteImageFromImgbb } = require('../services/imgbbService');
                await deleteImageFromImgbb(imageDeleteUrl);
            } catch (imgError) {
                // Image deletion failed but message was deleted
            }
        }
    } catch (error) {
        throw error;
    }
};

export const updateMessage = async (messageId, messageData) => {
    try {
        if (!messageId || typeof messageId !== 'string') {
            throw new Error('Invalid message ID');
        }
        
        if (!messageData || typeof messageData !== 'object') {
            throw new Error('Invalid message data');
        }
        
        const message = await databases.updateDocument(
            config.databaseId,
            config.messagesCollectionId,
            messageId,
            messageData
        );
        return message;
    } catch (error) {
        throw error;
    }
};

// Mark a message as read by a user
export const markMessageAsRead = async (messageId, userId) => {
    try {
        if (!messageId || !userId) {
            return null;
        }
        
        const message = await databases.getDocument(
            config.databaseId,
            config.messagesCollectionId,
            messageId
        );
        
        const currentReadBy = message.readBy || [];
        if (currentReadBy.includes(userId)) {
            return message;
        }
        
        const updatedMessage = await databases.updateDocument(
            config.databaseId,
            config.messagesCollectionId,
            messageId,
            {
                readBy: [...currentReadBy, userId]
            }
        );
        
        return updatedMessage;
    } catch (error) {
        // Silently fail - read receipts are not critical
        return null;
    }
};

// Mark all messages in a chat as read by a user
export const markAllMessagesAsRead = async (chatId, userId) => {
    try {
        if (!chatId || !userId) {
            return;
        }
        
        // Get recent unread messages (limit to last 50 for performance)
        const messages = await databases.listDocuments(
            config.databaseId,
            config.messagesCollectionId,
            [
                Query.equal('chatId', chatId),
                Query.orderDesc('$createdAt'),
                Query.limit(50)
            ]
        );
        
        // Update each message that doesn't have this user in readBy
        const updatePromises = messages.documents
            .filter(msg => msg.senderId !== userId && !(msg.readBy || []).includes(userId))
            .map(msg => markMessageAsRead(msg.$id, userId));
        
        await Promise.all(updatePromises);
    } catch (error) {
        // Silently fail
    }
};

// Get participants who have read a message
export const getMessageReadReceipts = async (messageId) => {
    try {
        if (!messageId) {
            return [];
        }
        
        const message = await databases.getDocument(
            config.databaseId,
            config.messagesCollectionId,
            messageId
        );
        
        return message.readBy || [];
    } catch (error) {
        return [];
    }
};

export const addRepresentative = async (chatId, userId) => {
    try {
        if (!chatId || !userId) {
            throw new Error('Invalid chat ID or user ID');
        }
        
        const chat = await databases.getDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );
        
        const currentReps = chat.representatives || [];
        if (currentReps.includes(userId)) {
            return chat;
        }
        
        const updatedChat = await databases.updateDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId,
            {
                representatives: [...currentReps, userId]
            }
        );
        
        return updatedChat;
    } catch (error) {
        throw error;
    }
};

export const removeRepresentative = async (chatId, userId) => {
    try {
        if (!chatId || !userId) {
            throw new Error('Invalid chat ID or user ID');
        }
        
        const chat = await databases.getDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );
        
        const currentReps = chat.representatives || [];
        const updatedReps = currentReps.filter(id => id !== userId);
        
        const updatedChat = await databases.updateDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId,
            {
                representatives: updatedReps
            }
        );
        
        return updatedChat;
    } catch (error) {
        throw error;
    }
};

/**
 * Pin a message in a chat
 */
export const pinMessage = async (chatId, messageId, userId) => {
    try {
        if (!chatId || !messageId || !userId) {
            throw new Error('Chat ID, message ID, and user ID are required');
        }

        // Update the message to mark it as pinned
        await databases.updateDocument(
            config.databaseId,
            config.messagesCollectionId,
            messageId,
            {
                isPinned: true,
                pinnedBy: userId,
                pinnedAt: new Date().toISOString(),
            }
        );

        // Also update the chat's pinnedMessages array
        const chat = await databases.getDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );

        const pinnedMessages = chat.pinnedMessages || [];
        if (!pinnedMessages.includes(messageId)) {
            pinnedMessages.push(messageId);
            await databases.updateDocument(
                config.databaseId,
                config.chatsCollectionId,
                chatId,
                { pinnedMessages }
            );
        }

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Unpin a message in a chat
 */
export const unpinMessage = async (chatId, messageId) => {
    try {
        if (!chatId || !messageId) {
            throw new Error('Chat ID and message ID are required');
        }

        // Update the message to mark it as unpinned
        await databases.updateDocument(
            config.databaseId,
            config.messagesCollectionId,
            messageId,
            {
                isPinned: false,
                pinnedBy: null,
                pinnedAt: null,
            }
        );

        // Also update the chat's pinnedMessages array
        const chat = await databases.getDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );

        const pinnedMessages = (chat.pinnedMessages || []).filter(id => id !== messageId);
        await databases.updateDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId,
            { pinnedMessages }
        );

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all pinned messages in a chat
 */
export const getPinnedMessages = async (chatId) => {
    try {
        if (!chatId) {
            throw new Error('Chat ID is required');
        }

        const messages = await databases.listDocuments(
            config.databaseId,
            config.messagesCollectionId,
            [
                Query.equal('chatId', chatId),
                Query.equal('isPinned', true),
                Query.orderDesc('pinnedAt'),
                Query.limit(50)
            ]
        );

        return messages.documents;
    } catch (error) {
        return [];
    }
};

/**
 * Check if user can pin messages in a chat
 */
export const canUserPinMessage = async (chatId, userId) => {
    try {
        const chat = await databases.getDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );

        // In private chats, both users can pin
        if (chat.type === 'private') {
            return chat.participants?.includes(userId) || false;
        }

        // Parse settings
        let settings = {};
        try {
            settings = chat.settings ? JSON.parse(chat.settings) : {};
        } catch (e) {
            settings = {};
        }

        // If onlyAdminsCanPin is set, check if user is admin
        if (settings.onlyAdminsCanPin) {
            return chat.admins?.includes(userId) || 
                   chat.representatives?.includes(userId) || 
                   false;
        }

        // Otherwise, all participants can pin
        return chat.participants?.includes(userId) || true;
    } catch (error) {
        return false;
    }
};

/**
 * Check if message contains @everyone or @all mention
 */
export const checkForEveryoneMention = (content) => {
    if (!content) return false;
    const lowerContent = content.toLowerCase();
    return lowerContent.includes('@everyone') || lowerContent.includes('@all');
};

/**
 * Check if user can use @everyone mention
 */
export const canUserMentionEveryone = async (chatId, userId) => {
    try {
        const chat = await databases.getDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );

        // Private chats don't have @everyone
        if (chat.type === 'private') {
            return false;
        }

        // Parse settings
        let settings = {};
        try {
            settings = chat.settings ? JSON.parse(chat.settings) : {};
        } catch (e) {
            settings = {};
        }

        // Check if @everyone is allowed
        if (settings.allowEveryoneMention === false) {
            return false;
        }

        // If only admins can mention, check if user is admin
        if (settings.onlyAdminsCanMention) {
            return chat.admins?.includes(userId) || 
                   chat.representatives?.includes(userId) || 
                   false;
        }

        // Otherwise, all participants can use @everyone
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Update chat settings
 */
export const updateChatSettings = async (chatId, settings) => {
    try {
        if (!chatId) {
            throw new Error('Chat ID is required');
        }

        const settingsString = JSON.stringify(settings);
        
        const chat = await databases.updateDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId,
            { settings: settingsString }
        );

        return chat;
    } catch (error) {
        throw error;
    }
};

/**
 * Get chat settings
 */
export const getChatSettings = async (chatId) => {
    try {
        if (!chatId) {
            return {};
        }

        const chat = await databases.getDocument(
            config.databaseId,
            config.chatsCollectionId,
            chatId
        );

        try {
            return chat.settings ? JSON.parse(chat.settings) : {};
        } catch (e) {
            return {};
        }
    } catch (error) {
        return {};
    }
};

/**
 * Get unread message count for a specific chat
 */
export const getUnreadCount = async (chatId, userId) => {
    try {
        if (!chatId || !userId) {
            return 0;
        }

        // Get recent messages that the user hasn't read
        const messages = await databases.listDocuments(
            config.databaseId,
            config.messagesCollectionId,
            [
                Query.equal('chatId', chatId),
                Query.limit(100),
                Query.orderDesc('$createdAt')
            ]
        );

        // Count messages not sent by user and not in readBy array
        let unreadCount = 0;
        for (const message of messages.documents) {
            if (message.senderId !== userId) {
                const readBy = message.readBy || [];
                if (!readBy.includes(userId)) {
                    unreadCount++;
                }
            }
        }

        return unreadCount;
    } catch (error) {
        return 0;
    }
};

/**
 * Mark all messages in a chat as read by user
 */
export const markChatAsRead = async (chatId, userId) => {
    try {
        if (!chatId || !userId) {
            return;
        }

        // Get unread messages
        const messages = await databases.listDocuments(
            config.databaseId,
            config.messagesCollectionId,
            [
                Query.equal('chatId', chatId),
                Query.limit(100),
                Query.orderDesc('$createdAt')
            ]
        );

        // Update each unread message to include user in readBy
        const updatePromises = messages.documents
            .filter(msg => msg.senderId !== userId && !(msg.readBy || []).includes(userId))
            .map(msg => {
                const readBy = msg.readBy || [];
                readBy.push(userId);
                return databases.updateDocument(
                    config.databaseId,
                    config.messagesCollectionId,
                    msg.$id,
                    { readBy }
                );
            });

        await Promise.all(updatePromises);
    } catch (error) {
        // Silently fail - reading messages is not critical
    }
};

/**
 * Get total unread count across all user chats
 */
export const getTotalUnreadCount = async (userId, chatIds) => {
    try {
        if (!userId || !chatIds || chatIds.length === 0) {
            return 0;
        }

        let totalUnread = 0;
        for (const chatId of chatIds) {
            const count = await getUnreadCount(chatId, userId);
            totalUnread += count;
        }

        return totalUnread;
    } catch (error) {
        return 0;
    }
};
