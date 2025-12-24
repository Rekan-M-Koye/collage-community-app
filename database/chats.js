import { databases, config } from './config';
import { ID, Query } from 'appwrite';

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
            console.warn('[Chats] getUserGroupChats: Invalid department provided:', department);
            throw new Error('Invalid department');
        }
        
        console.log('[Chats] getUserGroupChats: Fetching chats for department:', department, 'stage:', stage);
        console.log('[Chats] Config check - chatsCollectionId:', config.chatsCollectionId ? 'SET' : 'MISSING');
        
        if (!config.chatsCollectionId) {
            console.error('[Chats] CRITICAL: chatsCollectionId is not configured in .env');
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
        
        console.log('[Chats] getUserGroupChats: Found', allChats.length, 'chats');
        return allChats.sort((a, b) => {
            const dateA = new Date(a.lastMessageAt || a.createdAt);
            const dateB = new Date(b.lastMessageAt || b.createdAt);
            return dateB - dateA;
        });
    } catch (error) {
        console.error('[Chats] getUserGroupChats error:', error.message);
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
            return chat.participants?.includes(userId) || false;
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
        console.log('[Chats] sendMessage: Sending message to chat:', chatId);
        
        if (!chatId || typeof chatId !== 'string') {
            console.warn('[Chats] sendMessage: Invalid chatId:', chatId);
            throw new Error('Invalid chat ID');
        }
        
        if (!messageData || typeof messageData !== 'object') {
            console.warn('[Chats] sendMessage: Invalid messageData');
            throw new Error('Invalid message data');
        }
        
        if (!messageData.senderId) {
            console.warn('[Chats] sendMessage: Missing senderId');
            throw new Error('Missing required message fields');
        }

        const hasContent = messageData.content && messageData.content.trim().length > 0;
        const hasImages = messageData.images && messageData.images.length > 0;

        if (!hasContent && !hasImages) {
            console.warn('[Chats] sendMessage: No content or images');
            throw new Error('Message must have either content or an image');
        }
        
        const canSend = await canUserSendMessage(chatId, messageData.senderId);
        if (!canSend) {
            throw new Error('User does not have permission to send messages in this chat');
        }
        
        // Build document with only valid fields matching Appwrite schema
        const documentData = {
            chatId,
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            content: messageData.content || '',
        };
        
        // Only add images if provided (matches images[] field in Appwrite)
        if (hasImages) {
            documentData.images = messageData.images;
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
        
        return message;
    } catch (error) {
        throw error;
    }
};

export const getMessages = async (chatId, limit = 50, offset = 0) => {
    try {
        if (!chatId || typeof chatId !== 'string') {
            console.warn('[Chats] getMessages: Invalid chatId:', chatId);
            throw new Error('Invalid chat ID');
        }
        
        console.log('[Chats] getMessages: Fetching messages for chat:', chatId);
        console.log('[Chats] Config check - messagesCollectionId:', config.messagesCollectionId ? 'SET' : 'MISSING');
        
        if (!config.messagesCollectionId) {
            console.error('[Chats] CRITICAL: messagesCollectionId is not configured in .env');
            throw new Error('Messages collection not configured. Please check your .env file.');
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
        console.log('[Chats] getMessages: Found', messages.documents.length, 'messages');
        return messages.documents;
    } catch (error) {
        console.error('[Chats] getMessages error:', error.message);
        throw error;
    }
};

export const deleteMessage = async (messageId) => {
    try {
        if (!messageId || typeof messageId !== 'string') {
            throw new Error('Invalid message ID');
        }
        
        await databases.deleteDocument(
            config.databaseId,
            config.messagesCollectionId,
            messageId
        );
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
