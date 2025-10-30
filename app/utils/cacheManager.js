import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_EXPIRY_TIME = 1000 * 60 * 60 * 24;

export const cacheManager = {
  async set(key, value, expiryTime = CACHE_EXPIRY_TIME) {
    try {
      const cacheData = {
        value,
        timestamp: Date.now(),
        expiryTime
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async get(key) {
    try {
      const cachedData = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cachedData) return null;

      const { value, timestamp, expiryTime } = JSON.parse(cachedData);
      
      if (Date.now() - timestamp > expiryTime) {
        await this.remove(key);
        return null;
      }

      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
};

export const imageCacheManager = {
  async cacheImage(url) {
    if (!url) return null;
    
    const cached = await cacheManager.get(`image_${url}`);
    if (cached) return cached;

    await cacheManager.set(`image_${url}`, url, CACHE_EXPIRY_TIME * 7);
    return url;
  },

  async getCachedImage(url) {
    if (!url) return null;
    return await cacheManager.get(`image_${url}`);
  }
};

export const userCacheManager = {
  async cacheUserData(userId, userData) {
    if (!userId || !userData) return;
    await cacheManager.set(`user_${userId}`, userData, CACHE_EXPIRY_TIME);
  },

  async getCachedUserData(userId) {
    if (!userId) return null;
    return await cacheManager.get(`user_${userId}`);
  }
};
