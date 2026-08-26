export type IncidentType = 'theft' | 'vandalism' | 'safety' | 'maintenance' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface IncidentUserRef {
  _id: string;
  name: string;
  phone?: string;
  role?: string;
}

export interface IncidentCameraRef {
  _id: string;
  name: string;
  serialNumber?: string;
}

export interface IncidentNote {
  _id?: string;
  text: string;
  author: string | IncidentUserRef;
  createdAt: string;
}

export interface IncidentTimelineEntry {
  action: string;
  description: string;
  createdAt: string;
}

export interface Incident {
  _id: string;
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string | IncidentUserRef;
  assignedTo?: string | IncidentUserRef | null;
  cameraId?: string | IncidentCameraRef | null;
  attachments?: string[];
  notes?: IncidentNote[];
  isVerified?: boolean;
  resolutionNotes?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IncidentReportSummary {
  totalNotes: number;
  totalAttachments: number;
  isVerified: boolean;
  severity: IncidentSeverity;
  status: IncidentStatus;
}

export interface IncidentReportResponse {
  generatedAt: string;
  incident: Incident;
  timeline: IncidentTimelineEntry[];
  summary: IncidentReportSummary;
}
