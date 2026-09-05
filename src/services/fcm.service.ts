import {
  getMessaging,
  getToken,
  requestPermission,
  onTokenRefresh,
  onMessage,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { NotificationApi } from '../api/endpoints/notification.api';
import { store } from '../store';
import { addNotificationRealtime } from '../store/slices/notificationSlice';

class FCMService {
  private unsubscribeOnMessage: (() => void) | null = null;
  private unsubscribeTokenRefresh: (() => void) | null = null;

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
        if (this.unsubscribeTokenRefresh) {
          this.unsubscribeTokenRefresh();
        }
        this.unsubscribeTokenRefresh = onTokenRefresh(messaging, (newToken: string) => {
          console.log('[FCMService] Token Refreshed:', newToken);
          this.registerDevice(newToken);
        });

        // Listen for foreground push notifications
        if (this.unsubscribeOnMessage) {
          this.unsubscribeOnMessage();
        }
        this.unsubscribeOnMessage = onMessage(messaging, async (remoteMessage: any) => {
          console.log('[FCMService] Foreground message received:', remoteMessage);
          if (remoteMessage) {
            const notifItem = {
              _id: remoteMessage.messageId || Date.now().toString(),
              userId: '',
              type: (remoteMessage.data?.type as any) || 'alert',
              title: remoteMessage.notification?.title || remoteMessage.data?.title || 'New Notification',
              body: remoteMessage.notification?.body || remoteMessage.data?.body || '',
              data: remoteMessage.data || {},
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            store.dispatch(addNotificationRealtime(notifItem));
          }
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

