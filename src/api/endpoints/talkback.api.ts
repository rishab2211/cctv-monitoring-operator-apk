import { apiClient } from '../client';
import {
  TalkbackCapabilities,
  TalkbackSession,
  TalkbackStartResponse,
  TalkbackStatusResponse,
} from '../../types/talkback.types';

export const TalkbackApi = {
  getCapabilities: async (cameraId: string): Promise<TalkbackCapabilities> => {
    const response = await apiClient.get(`/talkback/${cameraId}/capabilities`);
    return response.data.data;
  },

  getStatus: async (cameraId: string): Promise<TalkbackStatusResponse> => {
    const response = await apiClient.get(`/talkback/${cameraId}/status`);
    return response.data.data;
  },

  startSession: async (cameraId: string): Promise<TalkbackStartResponse> => {
    const response = await apiClient.post(`/talkback/${cameraId}/start`);
    return response.data.data;
  },

  stopSession: async (cameraId: string): Promise<TalkbackSession> => {
    const response = await apiClient.post(`/talkback/${cameraId}/stop`);
    return response.data.data.session;
  },

  getCallsLog: async (page = 1, limit = 20): Promise<{ logs: TalkbackSession[]; total: number }> => {
    const response = await apiClient.get(`/operator/calls?page=${page}&limit=${limit}`);
    return {
      logs: response.data.data.logs || response.data.data || [],
      total: response.data.data.total || 0,
    };
  },
};
