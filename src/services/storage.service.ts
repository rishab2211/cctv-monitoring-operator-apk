import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYCHAIN_SERVICE = 'com.cctv.operator.auth';
const USER_DATA_KEY = '@cctv_operator_user';
const SHIFT_CACHE_KEY = '@cctv_operator_shift';

export const StorageService = {
  /**
   * Save JWT Access Token and Refresh Token securely to Keychain/Keystore
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(accessToken, refreshToken, {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch (error) {
      console.warn('[StorageService] Error saving tokens to Keychain:', error);
      return false;
    }
  },

  /**
   * Retrieve JWT Access Token and Refresh Token
   */
  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
      if (credentials) {
        return {
          accessToken: credentials.username,
          refreshToken: credentials.password,
        };
      }
      return { accessToken: null, refreshToken: null };
    } catch (error) {
      console.warn('[StorageService] Error reading tokens from Keychain:', error);
      return { accessToken: null, refreshToken: null };
    }
  },

  /**
   * Clear all auth tokens (on logout / session revocation)
   */
  async clearTokens(): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      await AsyncStorage.removeItem(USER_DATA_KEY);
      await AsyncStorage.removeItem(SHIFT_CACHE_KEY);
      return true;
    } catch (error) {
      console.warn('[StorageService] Error clearing tokens from Keychain:', error);
      return false;
    }
  },

  /**
   * Save cached user profile
   */
  async saveCachedUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
      console.warn('[StorageService] Error caching user data:', error);
    }
  },

  /**
   * Get cached user profile
   */
  async getCachedUser(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('[StorageService] Error reading cached user data:', error);
      return null;
    }
  },
};
