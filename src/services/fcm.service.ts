import { getMessaging, getToken, requestPermission, onTokenRefresh, AuthorizationStatus } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { NotificationApi } from '../api/endpoints/notification.api';

class FCMService {
  public async init() {
    try {
      const messaging = getMessaging();
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await getToken(messaging);
        console.log('[FCMService] Token:', token);
        await this.registerDevice(token);

        // Listen for token refresh
        onTokenRefresh(messaging, (newToken: string) => {
          console.log('[FCMService] Token Refreshed:', newToken);
          this.registerDevice(newToken);
        });
      } else {
        console.warn('[FCMService] User declined notifications.');
      }
    } catch (e: any) {
      if (e?.message?.includes('No Firebase App')) {
        console.log('[FCMService] FCM not initialized natively. Push notifications disabled.');
      } else {
        console.warn('[FCMService] Error initializing FCM:', e);
      }
    }
  }

  private async registerDevice(token: string) {
    try {
      await NotificationApi.registerDevice({
        token,
        deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      console.log('[FCMService] Device registered successfully.');
    } catch (e) {
      console.error('[FCMService] Failed to register device:', e);
    }
  }
}

export const fcmService = new FCMService();
