import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alert, AlertStats } from '../../types/alert.types';

interface AlertState {
  pendingAlerts: Alert[];
  activeAlerts: Alert[];
  stats: AlertStats | null;
  isLoading: boolean;
}

const initialState: AlertState = {
  pendingAlerts: [],
  activeAlerts: [],
  stats: null,
  isLoading: false,
};

export const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    setAlertLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPendingAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.pendingAlerts = action.payload;
      state.isLoading = false;
    },
    setActiveAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.activeAlerts = action.payload;
      state.isLoading = false;
    },
    setAlertStats: (state, action: PayloadAction<AlertStats>) => {
      state.stats = action.payload;
    },
    addNewAlertRealtime: (state, action: PayloadAction<Alert>) => {
      // Prepend incoming alert at the top of pending alerts
      const exists = state.pendingAlerts.some((a) => a._id === action.payload._id);
      if (!exists) {
        state.pendingAlerts = [action.payload, ...state.pendingAlerts];
        if (state.stats) {
          state.stats.pending += 1;
          state.stats.total += 1;
        }
      }
    },
    alertAcknowledgedSuccess: (state, action: PayloadAction<Alert>) => {
      // Remove from pending and add to active
      state.pendingAlerts = state.pendingAlerts.filter((a) => a._id !== action.payload._id);
      state.activeAlerts = [action.payload, ...state.activeAlerts.filter((a) => a._id !== action.payload._id)];
      if (state.stats) {
        state.stats.pending = Math.max(0, state.stats.pending - 1);
        state.stats.acknowledged += 1;
      }
    },
    alertEscalatedSuccess: (state, action: PayloadAction<Alert>) => {
      state.pendingAlerts = state.pendingAlerts.filter((a) => a._id !== action.payload._id);
      state.activeAlerts = [action.payload, ...state.activeAlerts.filter((a) => a._id !== action.payload._id)];
      if (state.stats) {
        state.stats.pending = Math.max(0, state.stats.pending - 1);
        if (state.stats.escalated !== undefined) {
          state.stats.escalated += 1;
        }
      }
    },
    alertResolvedSuccess: (state, action: PayloadAction<string>) => {
      state.pendingAlerts = state.pendingAlerts.filter((a) => a._id !== action.payload);
      state.activeAlerts = state.activeAlerts.filter((a) => a._id !== action.payload);
      if (state.stats) {
        state.stats.resolved += 1;
      }
    },
  },
});

export const {
  setAlertLoading,
  setPendingAlerts,
  setActiveAlerts,
  setAlertStats,
  addNewAlertRealtime,
  alertAcknowledgedSuccess,
  alertEscalatedSuccess,
  alertResolvedSuccess,
} = alertSlice.actions;

export default alertSlice.reducer;
