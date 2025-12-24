import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

// Log config for debugging (will be removed in production)
const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
    console.error('[Config] CRITICAL: Missing Appwrite endpoint or project ID!');
    console.error('[Config] EXPO_PUBLIC_APPWRITE_ENDPOINT:', endpoint ? 'SET' : 'MISSING');
    console.error('[Config] EXPO_PUBLIC_APPWRITE_PROJECT_ID:', projectId ? 'SET' : 'MISSING');
}

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const config = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
    postsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_POSTS_COLLECTION_ID,
    repliesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REPLIES_COLLECTION_ID,
    usersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
    chatsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CHATS_COLLECTION_ID,
    messagesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID,
};

// Log missing collection configs for debugging
if (!config.chatsCollectionId) {
    console.warn('[Config] EXPO_PUBLIC_APPWRITE_CHATS_COLLECTION_ID is not set - Chat features will not work');
}
if (!config.messagesCollectionId) {
    console.warn('[Config] EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID is not set - Messages will not work');
}

export default client;
