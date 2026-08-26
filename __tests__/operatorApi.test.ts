import { OperatorApi } from '../src/api/endpoints/operator.api';
import { apiClient } from '../src/api/client';

jest.mock('../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('OperatorApi Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getDashboard calls /operator/dashboard and returns data', async () => {
    const mockDashboardData = {
      stats: { assignedCameras: 4, openIncidents: 1, activeSos: 0 },
      operator: { _id: 'op-1', name: 'John Doe' },
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: mockDashboardData },
    });

    const result = await OperatorApi.getDashboard();
    expect(apiClient.get).toHaveBeenCalledWith('/operator/dashboard');
    expect(result).toEqual(mockDashboardData);
  });

  it('getShiftStatus calls /operator/shift/status and returns status', async () => {
    const mockStatus = {
      isOnShift: true,
      currentShift: { _id: 'shift-1', startTime: '2026-08-26T10:00:00.000Z' },
      durationMs: 3600000,
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: mockStatus },
    });

    const result = await OperatorApi.getShiftStatus();
    expect(apiClient.get).toHaveBeenCalledWith('/operator/shift/status');
    expect(result).toEqual(mockStatus);
  });

  it('startShift calls PATCH /operator/shift/start', async () => {
    const mockShift = {
      _id: 'shift-2',
      operatorId: 'op-1',
      startTime: '2026-08-26T10:00:00.000Z',
      status: 'active',
    };

    (apiClient.patch as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: { shift: mockShift } },
    });

    const result = await OperatorApi.startShift();
    expect(apiClient.patch).toHaveBeenCalledWith('/operator/shift/start');
    expect(result).toEqual(mockShift);
  });

  it('endShift calls PATCH /operator/shift/end with handover notes', async () => {
    const mockEndedShift = {
      _id: 'shift-2',
      endTime: '2026-08-26T18:00:00.000Z',
      handoverNotes: 'Shift complete without issues',
      status: 'completed',
    };

    (apiClient.patch as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: { shift: mockEndedShift } },
    });

    const result = await OperatorApi.endShift('Shift complete without issues');
    expect(apiClient.patch).toHaveBeenCalledWith('/operator/shift/end', {
      handoverNotes: 'Shift complete without issues',
    });
    expect(result).toEqual(mockEndedShift);
  });

  it('getShiftsHistory calls GET /operators/shifts with page and limit parameters', async () => {
    const mockShifts = [
      {
        _id: 'shift-1',
        startTime: '2026-08-25T10:00:00.000Z',
        endTime: '2026-08-25T18:00:00.000Z',
      },
    ];

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: { shifts: mockShifts, total: 1 } },
    });

    const result = await OperatorApi.getShiftsHistory(2, 20);
    expect(apiClient.get).toHaveBeenCalledWith('/operators/shifts?page=2&limit=20');
    expect(result).toEqual({ shifts: mockShifts, total: 1 });
  });
});
