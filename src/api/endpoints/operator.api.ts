import { apiClient } from '../client';
import {
  ActiveShift,
  OperatorDashboardResponse,
  ShiftHistoryItem,
  ShiftStatusResponse,
} from '../../types/shift.types';
import { Camera } from '../../types/camera.types';
import { Alert } from '../../types/alert.types';
import { OperatorReportsResponse, OperatorTimelineItem } from '../../types/reports.types';
import { buildQueryString } from '../../utils/query';

export const OperatorApi = {
  getDashboard: async (): Promise<OperatorDashboardResponse> => {
    const response = await apiClient.get('/operator/dashboard');
    return response.data.data;
  },

  getAssignedCameras: async (): Promise<Camera[]> => {
    const response = await apiClient.get('/operator/cameras');
    return response.data.data.cameras || response.data.data || [];
  },

  getPendingAlerts: async (): Promise<Alert[]> => {
    const response = await apiClient.get('/operator/alerts/pending');
    return response.data.data.alerts || response.data.data || [];
  },

  getActiveAlerts: async (): Promise<Alert[]> => {
    const response = await apiClient.get('/operator/alerts/active');
    return response.data.data.alerts || response.data.data || [];
  },

  getShiftStatus: async (): Promise<ShiftStatusResponse> => {
    const response = await apiClient.get('/operator/shift/status');
    return response.data.data;
  },

  startShift: async (): Promise<ActiveShift> => {
    const response = await apiClient.patch('/operator/shift/start');
    return response.data.data.shift;
  },

  endShift: async (handoverNotes?: string): Promise<ActiveShift> => {
    const response = await apiClient.patch('/operator/shift/end', { handoverNotes });
    return response.data.data.shift;
  },

  getTimeline: async (): Promise<OperatorTimelineItem[]> => {
    const response = await apiClient.get('/operator/timeline');
    return response.data.data.timeline || response.data.data || [];
  },

  getReports: async (): Promise<OperatorReportsResponse> => {
    const response = await apiClient.get('/operator/reports');
    return response.data.data;
  },

  getShiftsHistory: async (page = 1, limit = 20): Promise<{ shifts: ShiftHistoryItem[]; total: number }> => {
    const response = await apiClient.get(`/operators/shifts${buildQueryString({ page, limit })}`);
    return {
      shifts: response.data.data.shifts || response.data.data || [],
      total: response.data.data.total || 0,
    };
  },

  getPerformanceKpis: async (operatorId: string): Promise<any> => {
    const response = await apiClient.get(`/operators/${operatorId}/performance`);
    return response.data.data;
  },
};
