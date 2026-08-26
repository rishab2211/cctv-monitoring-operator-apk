import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActiveShift } from '../../types/shift.types';

interface HandoverBannerData {
  operatorName?: string;
  handoverNotes: string;
  timestamp: string;
}

interface ShiftState {
  isOnShift: boolean;
  currentShift: ActiveShift | null;
  startTime: string | null;
  lastShift: any | null;
  handoverBanner: HandoverBannerData | null;
  isLoading: boolean;
}

const initialState: ShiftState = {
  isOnShift: false,
  currentShift: null,
  startTime: null,
  lastShift: null,
  handoverBanner: null,
  isLoading: false,
};

export const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    setShiftLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setShiftStatus: (
      state,
      action: PayloadAction<{
        isOnShift: boolean;
        currentShift?: ActiveShift | null;
        lastShift?: any;
      }>
    ) => {
      state.isOnShift = action.payload.isOnShift;
      state.currentShift = action.payload.currentShift || null;
      state.startTime = action.payload.currentShift?.startTime || null;
      state.lastShift = action.payload.lastShift || null;
      state.isLoading = false;
    },
    clockInSuccess: (state, action: PayloadAction<ActiveShift>) => {
      state.isOnShift = true;
      state.currentShift = action.payload;
      state.startTime = action.payload.startTime;
      state.isLoading = false;
    },
    clockOutSuccess: (state, action: PayloadAction<ActiveShift | null>) => {
      state.isOnShift = false;
      state.lastShift = action.payload;
      state.currentShift = null;
      state.startTime = null;
      state.isLoading = false;
    },
    setHandoverBanner: (state, action: PayloadAction<HandoverBannerData | null>) => {
      state.handoverBanner = action.payload;
    },
    dismissHandoverBanner: (state) => {
      state.handoverBanner = null;
    },
  },
});

export const {
  setShiftLoading,
  setShiftStatus,
  clockInSuccess,
  clockOutSuccess,
  setHandoverBanner,
  dismissHandoverBanner,
} = shiftSlice.actions;

export default shiftSlice.reducer;
