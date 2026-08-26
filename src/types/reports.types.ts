export interface ReportShiftItem {
  _id: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  incidentsResolved: number;
  sosAcknowledged: number;
  handoverNotes?: string;
}

export interface ReportsSummary {
  totalShifts: number;
  totalIncidentsResolved: number;
  totalSosAcknowledged: number;
  avgIncidentsPerShift: string | number;
}

export interface OperatorReportsResponse {
  operatorName: string;
  summary: ReportsSummary;
  shifts: ReportShiftItem[];
}

export interface OperatorTimelineItem {
  _id: string;
  action: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, any>;
}
