import { apiClient } from '../client';
import { SOSAlert, SOSNote, SOSTimelineEntry } from '../../types/sos.types';

export const SOSApi = {
  getSosAlerts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ alerts: SOSAlert[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await apiClient.get(`/sos${query ? `?${query}` : ''}`);
    return {
      alerts: response.data.data.alerts || response.data.data || [],
      total: response.data.data.total || 0,
    };
  },

  getActiveSosAlerts: async (): Promise<SOSAlert[]> => {
    const response = await apiClient.get('/sos/active');
    return response.data.data.alerts || response.data.data || [];
  },

  getSosById: async (sosId: string): Promise<SOSAlert> => {
    const response = await apiClient.get(`/sos/${sosId}`);
    return response.data.data.sos;
  },

  acknowledgeSos: async (sosId: string): Promise<SOSAlert> => {
    const response = await apiClient.post(`/sos/${sosId}/acknowledge`);
    return response.data.data.sos;
  },

  addNote: async (sosId: string, text: string): Promise<SOSNote[]> => {
    const response = await apiClient.post(`/sos/${sosId}/notes`, { text });
    return response.data.data.sos.notes;
  },

  getTimeline: async (sosId: string): Promise<SOSTimelineEntry[]> => {
    const response = await apiClient.get(`/sos/${sosId}/timeline`);
    return response.data.data.timeline || [];
  },

  resolveSos: async (sosId: string, resolutionNotes: string): Promise<SOSAlert> => {
    const response = await apiClient.post(`/sos/${sosId}/resolve`, { resolutionNotes });
    return response.data.data.sos;
  },
};
