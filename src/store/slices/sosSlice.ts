import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SOSAlert } from '../../types/sos.types';

interface SOSState {
  activeSosAlerts: SOSAlert[];
  urgentBannerAlert: SOSAlert | null;
  selectedSos: SOSAlert | null;
  isLoading: boolean;
}

const initialState: SOSState = {
  activeSosAlerts: [],
  urgentBannerAlert: null,
  selectedSos: null,
  isLoading: false,
};

export const sosSlice = createSlice({
  name: 'sos',
  initialState,
  reducers: {
    setSosLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setActiveSosAlerts: (state, action: PayloadAction<SOSAlert[]>) => {
      state.activeSosAlerts = action.payload;
      state.urgentBannerAlert = action.payload.length > 0 ? action.payload[0] : null;
      state.isLoading = false;
    },
    setSelectedSos: (state, action: PayloadAction<SOSAlert | null>) => {
      state.selectedSos = action.payload;
    },
    sosTriggeredRealtime: (state, action: PayloadAction<SOSAlert>) => {
      const exists = state.activeSosAlerts.some((a) => a._id === action.payload._id);
      if (!exists) {
        state.activeSosAlerts = [action.payload, ...state.activeSosAlerts];
      }
      state.urgentBannerAlert = action.payload;
    },
    sosAcknowledgedRealtime: (state, action: PayloadAction<SOSAlert>) => {
      state.activeSosAlerts = state.activeSosAlerts.map((a) =>
        a._id === action.payload._id ? { ...a, ...action.payload } : a
      );
      if (state.selectedSos?._id === action.payload._id) {
        state.selectedSos = { ...state.selectedSos, ...action.payload };
      }
    },
    sosResolvedRealtime: (state, action: PayloadAction<{ sosId: string }>) => {
      state.activeSosAlerts = state.activeSosAlerts.filter((a) => a._id !== action.payload.sosId);
      if (state.urgentBannerAlert?._id === action.payload.sosId) {
        state.urgentBannerAlert = state.activeSosAlerts.length > 0 ? state.activeSosAlerts[0] : null;
      }
      if (state.selectedSos?._id === action.payload.sosId) {
        state.selectedSos = { ...state.selectedSos, status: 'resolved' };
      }
    },
    dismissUrgentBanner: (state) => {
      state.urgentBannerAlert = null;
    },
  },
});

export const {
  setSosLoading,
  setActiveSosAlerts,
  setSelectedSos,
  sosTriggeredRealtime,
  sosAcknowledgedRealtime,
  sosResolvedRealtime,
  dismissUrgentBanner,
} = sosSlice.actions;

export default sosSlice.reducer;
