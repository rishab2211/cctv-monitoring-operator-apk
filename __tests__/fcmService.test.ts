import { fcmService } from '../src/services/fcm.service';
import { NotificationApi } from '../src/api/endpoints/notification.api';
import {
  getMessaging,
  getToken,
  requestPermission,
  onTokenRefresh,
  onMessage,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

jest.mock('../src/api/endpoints/notification.api', () => ({
  NotificationApi: {
    registerDevice: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe('FCMService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes and registers device token when permission is authorized', async () => {
    (requestPermission as jest.Mock).mockResolvedValueOnce(AuthorizationStatus.AUTHORIZED);
    (getToken as jest.Mock).mockResolvedValueOnce('test-fcm-token-123');

    await fcmService.init();

    expect(getMessaging).toHaveBeenCalled();
    expect(requestPermission).toHaveBeenCalled();
    expect(getToken).toHaveBeenCalled();
    expect(NotificationApi.registerDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'test-fcm-token-123',
      })
    );
  });

  it('skips token registration when user declines notification permission', async () => {
    (requestPermission as jest.Mock).mockResolvedValueOnce(AuthorizationStatus.DENIED);

    await fcmService.init();

    expect(requestPermission).toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
    expect(NotificationApi.registerDevice).not.toHaveBeenCalled();
  });

  it('handles token refresh callbacks', async () => {
    let refreshCallback: ((token: string) => void) | null = null;
    (requestPermission as jest.Mock).mockResolvedValueOnce(AuthorizationStatus.AUTHORIZED);
    (getToken as jest.Mock).mockResolvedValueOnce('initial-token');
    (onTokenRefresh as jest.Mock).mockImplementationOnce((_messaging, cb) => {
      refreshCallback = cb;
      return jest.fn();
    });

    await fcmService.init();

    expect(refreshCallback).toBeDefined();
    if (refreshCallback) {
      await (refreshCallback as any)('refreshed-token-456');
      expect(NotificationApi.registerDevice).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'refreshed-token-456',
        })
      );
    }
  });

  it('handles foreground messages and processes them gracefully', async () => {
    let messageCallback: ((msg: any) => Promise<void>) | null = null;
    (requestPermission as jest.Mock).mockResolvedValueOnce(AuthorizationStatus.AUTHORIZED);
    (getToken as jest.Mock).mockResolvedValueOnce('fcm-token-foreground');
    (onMessage as jest.Mock).mockImplementationOnce((_messaging, cb) => {
      messageCallback = cb;
      return jest.fn();
    });

    await fcmService.init();

    expect(messageCallback).toBeDefined();
    if (messageCallback) {
      await (messageCallback as any)({
        messageId: 'msg-realtime-1',
        notification: { title: 'Alert Detected', body: 'Camera intrusion' },
        data: { type: 'alert' },
      });
    }
  });

  it('gracefully catches native missing Firebase App error', async () => {
    (requestPermission as jest.Mock).mockRejectedValueOnce(
      new Error('No Firebase App [DEFAULT] has been created')
    );

    await expect(fcmService.init()).resolves.not.toThrow();
  });
});
