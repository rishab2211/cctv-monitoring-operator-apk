export type SOSStatus = 'active' | 'acknowledged' | 'resolved';

export interface SOSTriggeredByUser {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface SOSCameraRef {
  _id: string;
  name: string;
  serialNumber?: string;
}

export interface SOSNote {
  _id?: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface SOSTimelineEntry {
  action: string;
  description: string;
  createdAt: string;
}

export interface SOSAlert {
  _id: string;
  triggeredBy: string | SOSTriggeredByUser;
  cameraId?: string | SOSCameraRef | null;
  location?: string;
  status: SOSStatus;
  notes?: SOSNote[];
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string;
  franchiseId?: string;
  createdAt: string;
  updatedAt?: string;
}
