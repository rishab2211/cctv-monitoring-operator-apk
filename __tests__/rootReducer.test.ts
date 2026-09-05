import { rootReducer } from '../src/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginSuccess, logout } from '../src/store/slices/authSlice';
import { setCameras } from '../src/store/slices/cameraSlice';
import { setShiftStatus } from '../src/store/slices/shiftSlice';
import { Camera } from '../src/types/camera.types';

describe('Root Reducer & Session Reset', () => {
  it('handles slice actions and updates state correctly', () => {
    const initialState = rootReducer(undefined, { type: '@@INIT' });

    const user = {
      _id: 'op-1',
      name: 'Rishab Operator',
      email: 'op@example.com',
      role: 'operator' as const,
      status: 'active' as const,
      avatar: 'https://example.com/avatar.jpg',
      phone: '1234567890',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const loggedInState = rootReducer(
      initialState,
      loginSuccess({
        user: user as any,
      })
    );

    expect(loggedInState.auth.isAuthenticated).toBe(true);
    expect(loggedInState.auth.user?.name).toBe('Rishab Operator');

    const sampleCamera: Camera = {
      _id: 'cam-101',
      name: 'Main Entrance Gate',
      serialNumber: 'SN-001',
      rtspUrl: 'rtsp://10.0.0.1/live',
      status: 'online',
      location: { city: 'Mumbai', state: 'Maharashtra' },
      settings: {
        recordingEnabled: true,
        motionDetectionEnabled: true,
        aiFeaturesEnabled: true,
        recordingRetentionDays: 30,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stateWithCameras = rootReducer(loggedInState, setCameras([sampleCamera]));
    expect(stateWithCameras.camera.cameras).toHaveLength(1);
    expect(stateWithCameras.camera.cameras[0].name).toBe('Main Entrance Gate');

    const stateWithShift = rootReducer(
      stateWithCameras,
      setShiftStatus({
        isOnShift: true,
        currentShift: {
          _id: 'shift-1',
          operatorId: 'op-1',
          startTime: new Date().toISOString(),
          status: 'active',
          alertCount: 5,
          incidentCount: 1,
          talkbackCount: 0,
        } as any,
        lastShift: null,
      })
    );
    expect(stateWithShift.shift.isOnShift).toBe(true);
  });

  it('resets all slice states and removes persisted root state on auth/logout', () => {
    // Start with populated state
    const initialState = rootReducer(undefined, { type: '@@INIT' });
    const user = {
      _id: 'op-2',
      name: 'Logged-in Operator',
      email: 'logged@example.com',
      role: 'operator' as const,
      status: 'active' as const,
      phone: '1234567890',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stateWithUser = rootReducer(
      initialState,
      loginSuccess({
        user: user as any,
      })
    );

    const populatedState = rootReducer(
      stateWithUser,
      setShiftStatus({
        isOnShift: true,
        currentShift: { _id: 's-2', operatorId: 'op-2', status: 'active' } as any,
        lastShift: null,
      })
    );

    expect(populatedState.auth.isAuthenticated).toBe(true);
    expect(populatedState.shift.isOnShift).toBe(true);

    // Dispatch logout
    const resetState = rootReducer(populatedState, logout());

    // Verify all slices returned to initial states
    expect(resetState.auth.isAuthenticated).toBe(false);
    expect(resetState.auth.user).toBeNull();
    expect(resetState.shift.isOnShift).toBe(false);
    expect(resetState.shift.currentShift).toBeNull();
    expect(resetState.camera.cameras).toEqual([]);
    expect(resetState.alert.pendingAlerts).toEqual([]);
    expect(resetState.alert.activeAlerts).toEqual([]);
    expect(resetState.notification.notifications).toEqual([]);

    // Verify AsyncStorage removeItem was called for 'persist:root'
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('persist:root');
  });
});
