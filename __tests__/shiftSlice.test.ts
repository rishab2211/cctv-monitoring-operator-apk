import shiftReducer, {
  setShiftStatus,
  clockInSuccess,
  clockOutSuccess,
  setHandoverBanner,
  dismissHandoverBanner,
  setShiftLoading,
  setShiftError,
} from '../src/store/slices/shiftSlice';
import { ActiveShift, HandoverBannerData, LastShiftInfo } from '../src/types/shift.types';

describe('shiftSlice reducer', () => {
  const initialState = {
    isOnShift: false,
    currentShift: null,
    startTime: null,
    lastShift: null,
    handoverBanner: null,
    isLoading: false,
    error: null,
  };

  it('should return initial state when passed empty action', () => {
    expect(shiftReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setShiftLoading', () => {
    const state = shiftReducer(initialState, setShiftLoading(true));
    expect(state.isLoading).toBe(true);
  });

  it('should handle setShiftError', () => {
    const state = shiftReducer(
      { ...initialState, isLoading: true },
      setShiftError('Network error')
    );
    expect(state.error).toBe('Network error');
    expect(state.isLoading).toBe(false);
  });

  it('should handle setShiftStatus when ON shift', () => {
    const mockShift: ActiveShift = {
      _id: 'shift-123',
      startTime: '2026-08-26T10:00:00.000Z',
      status: 'active',
    };

    const state = shiftReducer(
      initialState,
      setShiftStatus({
        isOnShift: true,
        currentShift: mockShift,
        lastShift: null,
      })
    );

    expect(state.isOnShift).toBe(true);
    expect(state.currentShift).toEqual(mockShift);
    expect(state.startTime).toBe(mockShift.startTime);
    expect(state.isLoading).toBe(false);
  });

  it('should handle setShiftStatus when OFF shift', () => {
    const mockLastShift: LastShiftInfo = {
      _id: 'shift-000',
      startTime: '2026-08-25T10:00:00.000Z',
      endTime: '2026-08-25T18:00:00.000Z',
      durationSeconds: 28800,
      handoverNotes: 'Shift complete. All clear.',
    };

    const state = shiftReducer(
      initialState,
      setShiftStatus({
        isOnShift: false,
        currentShift: null,
        lastShift: mockLastShift,
      })
    );

    expect(state.isOnShift).toBe(false);
    expect(state.currentShift).toBeNull();
    expect(state.startTime).toBeNull();
    expect(state.lastShift).toEqual(mockLastShift);
  });

  it('should handle clockInSuccess', () => {
    const newShift: ActiveShift = {
      _id: 'shift-456',
      operatorId: 'op-1',
      startTime: '2026-08-26T14:00:00.000Z',
      status: 'active',
    };

    const state = shiftReducer(initialState, clockInSuccess(newShift));
    expect(state.isOnShift).toBe(true);
    expect(state.currentShift).toEqual(newShift);
    expect(state.startTime).toBe('2026-08-26T14:00:00.000Z');
    expect(state.isLoading).toBe(false);
  });

  it('should handle clockOutSuccess', () => {
    const onShiftState = {
      isOnShift: true,
      currentShift: {
        _id: 'shift-456',
        startTime: '2026-08-26T14:00:00.000Z',
        status: 'active' as const,
      },
      startTime: '2026-08-26T14:00:00.000Z',
      lastShift: null,
      handoverBanner: null,
      isLoading: false,
      error: null,
    };

    const endedShift: ActiveShift = {
      _id: 'shift-456',
      operatorId: 'op-1',
      startTime: '2026-08-26T14:00:00.000Z',
      endTime: '2026-08-26T22:00:00.000Z',
      durationSeconds: 28800,
      status: 'completed',
      handoverNotes: 'Handing over to night operator.',
    };

    const state = shiftReducer(onShiftState, clockOutSuccess(endedShift));
    expect(state.isOnShift).toBe(false);
    expect(state.currentShift).toBeNull();
    expect(state.startTime).toBeNull();
    expect(state.lastShift).toEqual(endedShift);
  });

  it('should handle setHandoverBanner and dismissHandoverBanner', () => {
    const bannerData: HandoverBannerData = {
      operatorId: 'op-2',
      operatorName: 'Sarah Jenkins',
      shiftId: 'shift-999',
      handoverNotes: 'Gate 2 camera undergoing lens cleaning at 11 PM.',
      timestamp: '2026-08-26T18:00:00.000Z',
    };

    const stateWithBanner = shiftReducer(initialState, setHandoverBanner(bannerData));
    expect(stateWithBanner.handoverBanner).toEqual(bannerData);

    const dismissedState = shiftReducer(stateWithBanner, dismissHandoverBanner());
    expect(dismissedState.handoverBanner).toBeNull();
  });
});
