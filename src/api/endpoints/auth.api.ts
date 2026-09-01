import { apiClient } from '../client';
import {
  DeviceSession,
  ForgotPasswordResponse,
  LoginResponse,
  UserProfile,
  VerifyOTPResponse,
} from '../../types/auth.types';

export const AuthApi = {
  login: async (payload: { email?: string; phone?: string; password: string }): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', payload);
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data.data;
  },

  verifyOtp: async (payload: { email: string; otp: string }): Promise<VerifyOTPResponse> => {
    const response = await apiClient.post('/auth/verify-otp', payload);
    return response.data.data;
  },

  resetPassword: async (payload: {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    await apiClient.post('/auth/reset-password', payload);
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('[AuthApi] Logout request ignored or failed:', e);
    }
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/auth/me');
    return response.data.data.user;
  },

  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    await apiClient.put('/auth/change-password', payload);
  },

  getSessions: async (): Promise<{ currentSessionId: string; sessions: DeviceSession[] }> => {
    const response = await apiClient.get('/auth/sessions');
    return response.data.data;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  revokeAllOtherSessions: async (): Promise<number> => {
    const response = await apiClient.delete('/auth/sessions');
    return response.data.data?.revokedCount || 0;
  },

  updateProfile: async (payload: { name?: string; phone?: string; address?: any }): Promise<UserProfile> => {
    const response = await apiClient.put('/users/profile', payload);
    return response.data.data.user;
  },

  uploadAvatar: async (formData: FormData): Promise<string> => {
    const response = await apiClient.put('/users/profile/avatar', formData);
    return response.data.data.user?.avatar || response.data.data.avatar || response.data.data;
  },

  getFranchiseDetails: async (franchiseId: string): Promise<{ _id: string; name: string }> => {
    const response = await apiClient.get(`/franchises/${franchiseId}`);
    return response.data.data.franchise;
  },
};
