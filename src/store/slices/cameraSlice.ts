import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Camera, CameraStatus } from '../../types/camera.types';

interface CameraState {
  cameras: Camera[];
  selectedCamera: Camera | null;
  statusFilter: 'all' | CameraStatus;
  searchQuery: string;
  isLoading: boolean;
}

const initialState: CameraState = {
  cameras: [],
  selectedCamera: null,
  statusFilter: 'all',
  searchQuery: '',
  isLoading: false,
};

export const cameraSlice = createSlice({
  name: 'camera',
  initialState,
  reducers: {
    setCameraLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCameras: (state, action: PayloadAction<Camera[]>) => {
      state.cameras = action.payload;
      state.isLoading = false;
    },
    updateCameraStatus: (state, action: PayloadAction<{ cameraId: string; status: CameraStatus }>) => {
      const camera = state.cameras.find((c) => c._id === action.payload.cameraId);
      if (camera) {
        camera.status = action.payload.status;
      }
    },
    setSelectedCamera: (state, action: PayloadAction<Camera | null>) => {
      state.selectedCamera = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<'all' | CameraStatus>) => {
      state.statusFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  setCameraLoading,
  setCameras,
  updateCameraStatus,
  setSelectedCamera,
  setStatusFilter,
  setSearchQuery,
} = cameraSlice.actions;

export default cameraSlice.reducer;
