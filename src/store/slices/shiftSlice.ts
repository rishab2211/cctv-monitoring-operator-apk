import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActiveShift, HandoverBannerData, LastShiftInfo } from '../../types/shift.types';

interface ShiftState {
  isOnShift: boolean;
  currentShift: ActiveShift | null;
  startTime: string | null;
  lastShift: LastShiftInfo | null;
  handoverBanner: HandoverBannerData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ShiftState = {
  isOnShift: false,
  currentShift: null,
  startTime: null,
  lastShift: null,
  handoverBanner: null,
  isLoading: false,
  error: null,
};

export const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    setShiftLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setShiftError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setShiftStatus: (
      state,
      action: PayloadAction<{
        isOnShift: boolean;
        currentShift?: ActiveShift | null;
        lastShift?: LastShiftInfo | null;
      }>
    ) => {
      state.isOnShift = action.payload.isOnShift;
      state.currentShift = action.payload.currentShift || null;
      state.startTime = action.payload.currentShift?.startTime || null;
      state.lastShift = action.payload.lastShift || null;
      state.isLoading = false;
      state.error = null;
    },
    clockInSuccess: (state, action: PayloadAction<ActiveShift>) => {
      state.isOnShift = true;
      state.currentShift = action.payload;
      state.startTime = action.payload.startTime;
      state.isLoading = false;
      state.error = null;
    },
    clockOutSuccess: (state, action: PayloadAction<ActiveShift | LastShiftInfo | null>) => {
      state.isOnShift = false;
      state.lastShift = action.payload as LastShiftInfo | null;
      state.currentShift = null;
      state.startTime = null;
      state.isLoading = false;
      state.error = null;
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
  setShiftError,
  setShiftStatus,
  clockInSuccess,
  clockOutSuccess,
  setHandoverBanner,
  dismissHandoverBanner,
} = shiftSlice.actions;

export default shiftSlice.reducer;
