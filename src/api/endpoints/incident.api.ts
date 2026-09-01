import { apiClient } from '../client';
import {
  Incident,
  IncidentNote,
  IncidentReportResponse,
  IncidentTimelineEntry,
} from '../../types/incident.types';
import { buildQueryString } from '../../utils/query';

export const IncidentApi = {
  getIncidents: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
  }): Promise<{ incidents: Incident[]; total: number }> => {
    const response = await apiClient.get(`/incidents${buildQueryString(params)}`);
    return {
      incidents: response.data.data.incidents || response.data.data || [],
      total: response.data.data.total || 0,
    };
  },

  getIncidentById: async (incidentId: string): Promise<Incident> => {
    const response = await apiClient.get(`/incidents/${incidentId}`);
    return response.data.data.incident;
  },

  createIncident: async (formData: FormData): Promise<Incident> => {
    const response = await apiClient.post('/incidents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.incident;
  },

  updateStatus: async (
    incidentId: string,
    payload: { status: 'investigating' | 'resolved'; resolutionNotes?: string }
  ): Promise<Incident> => {
    const response = await apiClient.patch(`/incidents/${incidentId}/status`, payload);
    return response.data.data.incident;
  },

  addNote: async (incidentId: string, text: string): Promise<IncidentNote[]> => {
    const response = await apiClient.post(`/incidents/${incidentId}/notes`, { text });
    return response.data.data.incident.notes;
  },

  uploadMedia: async (incidentId: string, formData: FormData): Promise<string[]> => {
    const response = await apiClient.post(`/incidents/${incidentId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.attachments;
  },

  verifyIncident: async (incidentId: string, notes?: string): Promise<Incident> => {
    const response = await apiClient.post(`/incidents/${incidentId}/verify`, { notes });
    return response.data.data.incident;
  },

  getTimeline: async (incidentId: string): Promise<IncidentTimelineEntry[]> => {
    const response = await apiClient.get(`/incidents/${incidentId}/timeline`);
    return response.data.data.timeline || [];
  },

  getReport: async (incidentId: string): Promise<IncidentReportResponse> => {
    const response = await apiClient.get(`/incidents/${incidentId}/report`);
    return response.data.data;
  },

  closeIncident: async (incidentId: string, resolutionNotes: string): Promise<Incident> => {
    const response = await apiClient.patch(`/incidents/${incidentId}/close`, {
      resolutionNotes,
    });
    return response.data.data.incident;
  },
};
