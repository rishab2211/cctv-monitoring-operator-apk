export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'acknowledged' | 'escalated' | 'resolved';
export type AlertType = 'motion' | 'fire' | 'hazard' | 'tampering' | 'offline' | 'ai_detected' | 'manual';

export interface AlertCameraRef {
  _id: string;
  name: string;
  serialNumber?: string;
}

export interface Alert {
  _id: string;
  cameraId: string | AlertCameraRef;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  description: string;
  isVerified?: boolean;
  assignedTo?: string | null;
  resolutionNotes?: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AlertStats {
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
}
