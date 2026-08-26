import cameraReducer, {
  setCameraLoading,
  setCameras,
  updateCameraStatus,
  setSelectedCamera,
  setStatusFilter,
  setSearchQuery,
} from '../src/store/slices/cameraSlice';
import { Camera } from '../src/types/camera.types';

describe('cameraSlice reducer', () => {
  const mockCamera: Camera = {
    _id: 'cam_123',
    name: 'Front Gate Camera',
    serialNumber: 'CAM-FG-001',
    status: 'online',
    location: {
      street: '123 Main Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
    },
    settings: {
      recordingEnabled: true,
      motionDetectionEnabled: true,
      aiFeaturesEnabled: true,
      recordingRetentionDays: 30,
      talkbackEnabled: true,
    },
    health: {
      cpuUsage: 45,
      memoryUsage: 60,
      temperature: 55,
      storageUsage: 70,
      lastPing: '2026-08-26T12:00:00.000Z',
    },
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  const initialState = {
    cameras: [],
    selectedCamera: null,
    statusFilter: 'all' as const,
    searchQuery: '',
    isLoading: false,
  };

  it('should return the initial state', () => {
    expect(cameraReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCameraLoading', () => {
    const state = cameraReducer(initialState, setCameraLoading(true));
    expect(state.isLoading).toBe(true);
  });

  it('should handle setCameras', () => {
    const state = cameraReducer(
      { ...initialState, isLoading: true },
      setCameras([mockCamera])
    );
    expect(state.cameras).toHaveLength(1);
    expect(state.cameras[0]._id).toBe('cam_123');
    expect(state.isLoading).toBe(false);
  });

  it('should handle updateCameraStatus', () => {
    const startState = {
      ...initialState,
      cameras: [mockCamera],
    };

    const state = cameraReducer(
      startState,
      updateCameraStatus({ cameraId: 'cam_123', status: 'offline' })
    );

    expect(state.cameras[0].status).toBe('offline');
  });

  it('should handle setSelectedCamera', () => {
    const state = cameraReducer(initialState, setSelectedCamera(mockCamera));
    expect(state.selectedCamera).toEqual(mockCamera);

    const clearedState = cameraReducer(state, setSelectedCamera(null));
    expect(clearedState.selectedCamera).toBeNull();
  });

  it('should handle setStatusFilter', () => {
    const state = cameraReducer(initialState, setStatusFilter('maintenance'));
    expect(state.statusFilter).toBe('maintenance');
  });

  it('should handle setSearchQuery', () => {
    const state = cameraReducer(initialState, setSearchQuery('front gate'));
    expect(state.searchQuery).toBe('front gate');
  });
});
