import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = 'expoPushToken';
const PERMISSION_STATUS_KEY = 'notificationPermissionStatus';

// Configure how notifications should be displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestNotificationPermissions = async () => {
  try {
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Store the permission status
    await AsyncStorage.setItem(PERMISSION_STATUS_KEY, finalStatus);

    return finalStatus === 'granted';
  } catch (error) {
    return false;
  }
};

/**
 * Check if notifications are currently permitted
 * @returns {Promise<boolean>} Whether notifications are permitted
 */
export const checkNotificationPermissions = async () => {
  try {
    if (!Device.isDevice) {
      return false;
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

/**
 * Register for push notifications and get the Expo push token
 * @returns {Promise<string|null>} The Expo push token or null if failed
 */
export const registerForPushNotifications = async () => {
  try {
    if (!Device.isDevice) {
      return null;
    }

    // Check/request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenData.data;

    // Store token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await setupAndroidNotificationChannels();
    }

    return token;
  } catch (error) {
    return null;
  }
};

/**
 * Get the stored push token
 * @returns {Promise<string|null>} The stored push token or null
 */
export const getStoredPushToken = async () => {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch (error) {
    return null;
  }
};

/**
 * Set up Android notification channels for different notification types
 */
const setupAndroidNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;

  // Default channel for general notifications
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#007AFF',
    sound: 'default',
  });

  // Channel for chat messages
  await Notifications.setNotificationChannelAsync('chat', {
    name: 'Chat Messages',
    description: 'Notifications for new chat messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#007AFF',
    sound: 'default',
  });

  // Channel for post interactions
  await Notifications.setNotificationChannelAsync('posts', {
    name: 'Post Interactions',
    description: 'Notifications for likes, replies, and mentions',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#34C759',
  });

  // Channel for follows
  await Notifications.setNotificationChannelAsync('social', {
    name: 'Social',
    description: 'Notifications for new followers and friend activity',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#FF9500',
  });
};

/**
 * Schedule a local notification
 * @param {Object} options Notification options
 * @param {string} options.title The notification title
 * @param {string} options.body The notification body
 * @param {Object} options.data Additional data to include
 * @param {string} options.channelId Android channel ID
 * @param {number} options.seconds Seconds to wait before showing (0 for immediate)
 * @returns {Promise<string>} The notification identifier
 */
export const scheduleLocalNotification = async ({
  title,
  body,
  data = {},
  channelId = 'default',
  seconds = 0,
}) => {
  try {
    const content = {
      title,
      body,
      data,
      sound: 'default',
    };

    if (Platform.OS === 'android') {
      content.channelId = channelId;
    }

    const trigger = seconds > 0 ? { seconds } : null;

    const identifier = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });

    return identifier;
  } catch (error) {
    return null;
  }
};

/**
 * Cancel a scheduled notification
 * @param {string} identifier The notification identifier to cancel
 */
export const cancelNotification = async (identifier) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    // Silent fail
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    // Silent fail
  }
};

/**
 * Get the current badge count
 * @returns {Promise<number>} The current badge count
 */
export const getBadgeCount = async () => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    return 0;
  }
};

/**
 * Set the badge count
 * @param {number} count The badge count to set
 */
export const setBadgeCount = async (count) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    // Silent fail
  }
};

/**
 * Clear all delivered notifications
 */
export const clearAllNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
  } catch (error) {
    // Silent fail
  }
};

/**
 * Add a listener for received notifications (when app is in foreground)
 * @param {Function} callback Function to call when notification is received
 * @returns {Object} Subscription that can be removed
 */
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add a listener for notification responses (when user taps notification)
 * @param {Function} callback Function to call when notification is tapped
 * @returns {Object} Subscription that can be removed
 */
export const addNotificationResponseListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Get the last notification response (if app was opened via notification)
 * @returns {Promise<Object|null>} The last notification response or null
 */
export const getLastNotificationResponse = async () => {
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch (error) {
    return null;
  }
};

/**
 * Check if the app was opened from a notification
 * @returns {Promise<Object|null>} The notification data if app was opened from notification
 */
export const checkInitialNotification = async () => {
  try {
    const response = await getLastNotificationResponse();
    if (response) {
      return response.notification.request.content.data;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Send push notification for a new chat message
 * This function sends push notifications to all participants except the sender
 * @param {Object} options Message and chat details
 * @param {string} options.chatId The chat ID
 * @param {string} options.messageId The message ID
 * @param {string} options.senderId The sender's user ID
 * @param {string} options.senderName The sender's name
 * @param {string} options.content The message content preview
 * @param {string} options.chatName The chat name
 * @param {string} options.chatType The type of chat (private, group, etc.)
 */
export const sendChatPushNotification = async ({
  chatId,
  messageId,
  senderId,
  senderName,
  content,
  chatName,
  chatType,
}) => {
  try {
    // Import database functions here to avoid circular dependencies
    const { databases, config } = require('../database/config');
    const { Query } = require('appwrite');
    
    // Get chat to find participants
    const chat = await databases.getDocument(
      config.databaseId,
      config.chatsCollectionId,
      chatId
    );
    
    const participants = chat.participants || [];
    const recipientIds = participants.filter(id => id !== senderId);
    
    if (recipientIds.length === 0) {
      return;
    }
    
    // Get push tokens for recipients
    const pushTokens = await databases.listDocuments(
      config.databaseId,
      config.pushTokensCollectionId,
      [
        Query.equal('userId', recipientIds),
        Query.limit(100)
      ]
    );
    
    if (!pushTokens.documents || pushTokens.documents.length === 0) {
      return;
    }
    
    // Prepare notification content
    const title = chatType === 'private' ? senderName : `${senderName} in ${chatName}`;
    const body = content || '📷 Image';
    
    // Send notifications using Expo Push API
    const messages = pushTokens.documents.map(tokenDoc => ({
      to: tokenDoc.token,
      sound: 'default',
      title,
      body,
      data: {
        type: 'chat_message',
        chatId,
        messageId,
        senderId,
        senderName,
        chatType,
      },
      channelId: 'chat',
    }));
    
    // Use Expo Push API to send notifications
    const expoPushUrl = 'https://exp.host/--/api/v2/push/send';
    
    const response = await fetch(expoPushUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    
    const result = await response.json();
    
    // Mark message as delivered for recipients who received notification
    if (result.data) {
      const { markMessageAsDelivered } = require('../database/chats');
      const deliveryPromises = result.data.map(async (ticket, index) => {
        if (ticket.status === 'ok' && pushTokens.documents[index]) {
          await markMessageAsDelivered(messageId, pushTokens.documents[index].userId);
        }
      });
      await Promise.all(deliveryPromises);
    }
    
    return result;
  } catch (error) {
    // Silent fail - push notification is not critical
    return null;
  }
};

export default {
  requestNotificationPermissions,
  checkNotificationPermissions,
  registerForPushNotifications,
  getStoredPushToken,
  scheduleLocalNotification,
  cancelNotification,
  cancelAllNotifications,
  getBadgeCount,
  setBadgeCount,
  clearAllNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  checkInitialNotification,
  sendChatPushNotification,
};
