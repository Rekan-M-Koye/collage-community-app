import { databases, config } from './config';
import { ID, Query } from 'appwrite';

export const createChat = async (chatData) => {
    try {
        const chat = await databases.createDocument(
            config.databaseId,
            'CHATS_COLLECTION_ID',
            ID.unique(),
            chatData
        );
        return chat;
    } catch (error) {
        console.error('Create chat error:', error);
        throw error;
    }
};

export const getChats = async (userId) => {
    try {
        const chats = await databases.listDocuments(
            config.databaseId,
            'CHATS_COLLECTION_ID',
            [
                Query.equal('participants', userId),
                Query.orderDesc('$updatedAt')
            ]
        );
        return chats.documents;
    } catch (error) {
        console.error('Get chats error:', error);
        throw error;
    }
};

export const getChat = async (chatId) => {
    try {
        const chat = await databases.getDocument(
            config.databaseId,
            'CHATS_COLLECTION_ID',
            chatId
        );
        return chat;
    } catch (error) {
        console.error('Get chat error:', error);
        throw error;
    }
};

export const deleteChat = async (chatId) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            'CHATS_COLLECTION_ID',
            chatId
        );
    } catch (error) {
        console.error('Delete chat error:', error);
        throw error;
    }
};

export const sendMessage = async (chatId, messageData) => {
    try {
        const message = await databases.createDocument(
            config.databaseId,
            'MESSAGES_COLLECTION_ID',
            ID.unique(),
            {
                ...messageData,
                chatId
            }
        );
        
        await databases.updateDocument(
            config.databaseId,
            'CHATS_COLLECTION_ID',
            chatId,
            {
                lastMessage: messageData.content,
                $updatedAt: new Date().toISOString()
            }
        );
        
        return message;
    } catch (error) {
        console.error('Send message error:', error);
        throw error;
    }
};

export const getMessages = async (chatId, limit = 50, offset = 0) => {
    try {
        const messages = await databases.listDocuments(
            config.databaseId,
            'MESSAGES_COLLECTION_ID',
            [
                Query.equal('chatId', chatId),
                Query.orderDesc('$createdAt'),
                Query.limit(limit),
                Query.offset(offset)
            ]
        );
        return messages.documents;
    } catch (error) {
        console.error('Get messages error:', error);
        throw error;
    }
};

export const deleteMessage = async (messageId) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            'MESSAGES_COLLECTION_ID',
            messageId
        );
    } catch (error) {
        console.error('Delete message error:', error);
        throw error;
    }
};

export const updateMessage = async (messageId, messageData) => {
    try {
        const message = await databases.updateDocument(
            config.databaseId,
            'MESSAGES_COLLECTION_ID',
            messageId,
            messageData
        );
        return message;
    } catch (error) {
        console.error('Update message error:', error);
        throw error;
    }
};
