export interface ActiveShift {
  _id: string;
  operatorId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed';
  handoverNotes?: string;
  incidentsResolved?: number;
  sosAcknowledged?: number;
}

export interface ShiftStatusResponse {
  isOnShift: boolean;
  currentShift?: {
    _id: string;
    startTime: string;
  } | null;
  durationMs?: number;
  lastShift?: {
    _id: string;
    startTime: string;
    endTime: string;
    durationSeconds: number;
    handoverNotes?: string;
  } | null;
}

export interface ShiftHistoryItem {
  _id: string;
  operatorId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  incidentsResolved?: number;
  sosAcknowledged?: number;
  handoverNotes?: string;
  createdAt: string;
}

export interface OperatorDashboardStats {
  assignedCameras: number;
  openIncidents: number; // Operator-scoped
  activeSos: number; // Franchise-scoped
}

export interface OperatorDashboardResponse {
  operatorName: string;
  stats: OperatorDashboardStats;
  currentShift?: ActiveShift | null;
}
