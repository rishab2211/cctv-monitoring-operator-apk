export type CameraStatus = 'online' | 'offline' | 'maintenance';

export interface CameraLocation {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface CameraHealth {
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
  storageUsage: number;
  lastPing?: string | null;
}

export interface CameraSettings {
  recordingEnabled: boolean;
  motionDetectionEnabled: boolean;
  aiFeaturesEnabled: boolean;
  recordingRetentionDays: number;
  talkbackEnabled?: boolean;
}

export interface Camera {
  _id: string;
  name: string;
  serialNumber: string;
  rtspUrl?: string;
  status: CameraStatus;
  customerId?: string | null;
  operatorIds?: string[];
  franchiseId?: string | null;
  location?: CameraLocation;
  health?: CameraHealth;
  settings: CameraSettings;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StreamStartResponse {
  sessionId: string;
  streamToken: string;
  pathName: string;
  webrtcUrl: string;
  hlsUrl?: string;
  tokenExpiresIn: string;
}

export interface StreamTokenResponse {
  streamToken: string;
  pathName: string;
  webrtcUrl: string;
  tokenExpiresIn: string;
}

export interface WebRTCOfferResponse {
  type: 'answer';
  sdp: string;
  sessionUrl?: string;
}

export interface RecordingChunk {
  _id: string;
  cameraId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  url: string;
  type: 'continuous' | 'motion';
  sizeBytes?: number;
  status?: string;
}

export interface RecordingTimelineItem {
  startTime: string;
  endTime: string;
  durationSeconds: number;
  type: 'continuous' | 'motion';
  url: string;
}
