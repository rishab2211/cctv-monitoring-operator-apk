import { Platform } from 'react-native';

/**
 * Environment configuration for CCTV Operator Mobile App.
 * In development, Android emulator connects to 10.0.2.2 or LAN IP.
 * In production or cloud deployments, configure custom domain/host endpoints.
 */
declare const global: {
  APP_CONFIG_OVERRIDE?: {
    apiBaseUrl?: string;
    socketUrl?: string;
    whepBaseUrl?: string;
    whipBaseUrl?: string;
  };
};

const DEV_LAN_HOST = '192.168.29.60';
const DEFAULT_HOST =
  Platform.OS === 'android'
    ? __DEV__
      ? DEV_LAN_HOST
      : '10.0.2.2'
    : 'localhost';

const overrides = (typeof global !== 'undefined' && global.APP_CONFIG_OVERRIDE) || {};

export const ENV = {
  API_BASE_URL: overrides.apiBaseUrl || `http://${DEFAULT_HOST}:5000/api/v1`,
  SOCKET_URL: overrides.socketUrl || `http://${DEFAULT_HOST}:5000`,
  MEDIAMTX_WHEP_BASE: overrides.whepBaseUrl || `http://${DEFAULT_HOST}:9997`,
  MEDIAMTX_WHIP_BASE: overrides.whipBaseUrl || `http://${DEFAULT_HOST}:8889`,
  APP_SCHEME: 'operator',
  TOKEN_REFRESH_INTERVAL_MS: 14 * 60 * 1000, // 14 minutes (tokens expire in 15m)
  AUTO_POLL_INTERVAL_MS: 60 * 1000, // 60 seconds dashboard auto-refresh
  OTP_RESEND_COOLDOWN_SECONDS: 60,
};

