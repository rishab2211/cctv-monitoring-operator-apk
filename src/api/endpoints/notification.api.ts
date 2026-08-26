import { apiClient } from '../client';
import {
  NotificationItem,
  NotificationPreferences,
  RegisterDevicePayload,
} from '../../types/notification.types';

export const NotificationApi = {
  registerDevice: async (payload: RegisterDevicePayload): Promise<void> => {
    await apiClient.post('/notifications/register-device', payload);
  },

  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<{ notifications: NotificationItem[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await apiClient.get(`/notifications${query ? `?${query}` : ''}`);
    return {
      notifications: response.data.data.notifications || response.data.data || [],
      total: response.data.data.total || 0,
    };
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get('/notifications/preferences');
    return response.data.data;
  },

  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await apiClient.put('/notifications/preferences', preferences);
    return response.data.data;
  },
};
