export type NotificationType = 'alert' | 'system' | 'message';

export interface NotificationItem {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface ChannelPreference {
  push: boolean;
  inApp: boolean;
  email: boolean;
}

export interface NotificationPreferences {
  alerts: ChannelPreference;
  system: ChannelPreference;
}

export interface RegisterDevicePayload {
  token: string;
  deviceType: 'android' | 'ios' | 'web';
}
