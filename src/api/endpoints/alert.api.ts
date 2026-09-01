import { apiClient } from '../client';
import { Alert, AlertStats } from '../../types/alert.types';
import { buildQueryString } from '../../utils/query';

export const AlertApi = {
  getAlerts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    type?: string;
  }): Promise<{ alerts: Alert[]; total: number }> => {
    const response = await apiClient.get(`/alerts${buildQueryString(params)}`);
    return {
      alerts: response.data.data.alerts || response.data.data || [],
      total: response.data.data.total || 0,
    };
  },

  getAlertById: async (alertId: string): Promise<Alert> => {
    const response = await apiClient.get(`/alerts/${alertId}`);
    return response.data.data.alert;
  },

  acknowledgeAlert: async (alertId: string): Promise<Alert> => {
    const response = await apiClient.patch(`/alerts/${alertId}/acknowledge`);
    return response.data.data.alert;
  },

  escalateAlert: async (alertId: string): Promise<Alert> => {
    const response = await apiClient.patch(`/alerts/${alertId}/escalate`);
    return response.data.data.alert;
  },

  resolveAlert: async (
    alertId: string,
    payload: { resolutionNotes: string; isVerified?: boolean }
  ): Promise<Alert> => {
    const response = await apiClient.patch(`/alerts/${alertId}/resolve`, payload);
    return response.data.data.alert;
  },

  verifyAlert: async (alertId: string, payload: { isVerified: boolean; notes?: string }): Promise<Alert> => {
    const response = await apiClient.post(`/alerts/${alertId}/verify`, payload);
    return response.data.data.alert;
  },

  getAlertStats: async (): Promise<AlertStats> => {
    const response = await apiClient.get('/alerts/stats');
    return response.data.data;
  },
};
