import { Platform } from 'react-native';

/**
 * Environment configuration for CCTV Operator Mobile App
 * Note: Android emulator uses 10.0.2.2 to reach host machine's localhost (port 5000).
 * For physical devices, set API_BASE_URL to your machine's LAN IP (e.g., http://192.168.1.100:5000/api/v1)
 */
const DEFAULT_HOST = Platform.OS === 'android' ? '192.168.29.60' : 'localhost';

export const ENV = {
  API_BASE_URL: `http://${DEFAULT_HOST}:5000/api/v1`,
  SOCKET_URL: `http://${DEFAULT_HOST}:5000`,
  MEDIAMTX_WHEP_BASE: `http://${DEFAULT_HOST}:9997`,
  MEDIAMTX_WHIP_BASE: `http://${DEFAULT_HOST}:8889`,
  APP_SCHEME: 'operator',
  TOKEN_REFRESH_INTERVAL_MS: 14 * 60 * 1000, // 14 minutes (tokens expire in 15m)
  AUTO_POLL_INTERVAL_MS: 60 * 1000, // 60 seconds dashboard auto-refresh
  OTP_RESEND_COOLDOWN_SECONDS: 60,
};
