import { apiClient } from '../client';
import {
  Camera,
  RecordingChunk,
  RecordingTimelineItem,
  StreamStartResponse,
  StreamTokenResponse,
  WebRTCOfferResponse,
} from '../../types/camera.types';

export const CameraApi = {
  getCameraById: async (cameraId: string): Promise<Camera> => {
    const response = await apiClient.get(`/cameras/${cameraId}`);
    return response.data.data.camera;
  },

  startStream: async (cameraId: string): Promise<StreamStartResponse> => {
    const response = await apiClient.post('/streams/start', { cameraId });
    return response.data.data;
  },

  getStreamToken: async (cameraId: string): Promise<StreamTokenResponse> => {
    const response = await apiClient.get(`/streams/${cameraId}/token`);
    return response.data.data;
  },

  relayWebRTCOffer: async (cameraId: string, sdp: string): Promise<WebRTCOfferResponse> => {
    const response = await apiClient.post(`/streams/${cameraId}/webrtc/offer`, {
      type: 'offer',
      sdp,
    });
    return response.data.data;
  },

  stopStream: async (cameraId: string, sessionId: string): Promise<void> => {
    try {
      await apiClient.post('/streams/stop', { cameraId, sessionId });
    } catch (e) {
      console.warn('[CameraApi] Error stopping stream:', e);
    }
  },

  getRecordingTimeline: async (cameraId: string, date: string): Promise<RecordingTimelineItem[]> => {
    const response = await apiClient.get(`/recordings/${cameraId}/timeline?date=${date}`);
    return response.data.data.timeline || [];
  },

  getRecordingPlayback: async (
    cameraId: string,
    startTime: string,
    endTime: string
  ): Promise<RecordingChunk[]> => {
    const response = await apiClient.get(
      `/recordings/${cameraId}/playback?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`
    );
    return response.data.data.chunks || [];
  },

  getRecordingDownloadUrl: async (recordingId: string): Promise<{ downloadUrl: string; expiresAt: string }> => {
    const response = await apiClient.post(`/recordings/${recordingId}/download`);
    return response.data.data;
  },
};
