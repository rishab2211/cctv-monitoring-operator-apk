export interface ActiveShift {
  _id: string;
  shiftId?: string;
  operatorId?: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  durationSeconds?: number;
  status?: 'active' | 'completed';
  handoverNotes?: string;
  incidentsResolved?: number;
  sosAcknowledged?: number;
}

export interface LastShiftInfo {
  _id: string;
  startTime: string;
  endTime: string;
  durationSeconds?: number;
  durationMs?: number;
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
  lastShift?: LastShiftInfo | null;
}

export interface ShiftHistoryItem {
  _id: string;
  operatorId: string;
  startTime: string;
  endTime: string;
  durationSeconds?: number;
  durationMs?: number;
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
  operator?: {
    _id: string;
    name: string;
  };
  operatorName?: string;
  stats: OperatorDashboardStats;
  shift?: {
    shiftId: string;
    startTime: string;
    durationMs: number;
  } | null;
  currentShift?: ActiveShift | null;
}

export interface HandoverBannerData {
  operatorId?: string;
  operatorName?: string;
  shiftId?: string;
  handoverNotes: string;
  timestamp: string;
}
