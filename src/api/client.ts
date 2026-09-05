import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../config/env';
import { StorageService } from '../services/storage.service';
import { socketService } from '../services/socket.service';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Access Token & Dynamic Content-Type
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken } = await StorageService.getTokens();
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // When sending FormData, let the runtime set multipart/form-data with boundary
    if (config.data instanceof FormData) {
      if (typeof (config.headers as any)?.delete === 'function') {
        (config.headers as any).delete('Content-Type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Silent Token Rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is not 401 or request was already retried, reject
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Prevent loop on refresh token endpoint itself
    if (originalRequest.url?.includes('/auth/refresh-token') || originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = await StorageService.getTokens();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh-token endpoint (uses raw axios instance to bypass interceptor)
      const response = await axios.post(`${ENV.API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
      });

      const responseData = response.data?.data || response.data;
      const newAccessToken = responseData?.accessToken;
      const newRefreshToken = responseData?.refreshToken || refreshToken;

      if (!newAccessToken) {
        throw new Error('Invalid token refresh response structure');
      }

      // Save rotated tokens securely in Keychain
      await StorageService.saveTokens(newAccessToken, newRefreshToken);
      socketService.updateAuthToken(newAccessToken);

      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await StorageService.clearTokens();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

