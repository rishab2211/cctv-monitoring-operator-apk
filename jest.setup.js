/* eslint-disable no-undef */
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
      return Promise.resolve(null);
    }),
    getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve(null);
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve(null);
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys) =>
      Promise.resolve(keys.map((key) => [key, store[key] || null]))
    ),
    multiSet: jest.fn((entries) => {
      entries.forEach(([key, value]) => {
        store[key] = value;
      });
      return Promise.resolve(null);
    }),
  };
});

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(null),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('@react-native-firebase/messaging', () => () => ({
  requestPermission: jest.fn().mockResolvedValue(1),
  getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
  onMessage: jest.fn(),
  setBackgroundMessageHandler: jest.fn(),
}));

jest.mock('socket.io-client', () => {
  const mSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
  return jest.fn(() => mSocket);
});

jest.mock('react-native-webrtc', () => ({
  RTCPeerConnection: jest.fn().mockImplementation(() => ({
    createOffer: jest.fn().mockResolvedValue({ sdp: 'mock-sdp', type: 'offer' }),
    createAnswer: jest.fn().mockResolvedValue({ sdp: 'mock-sdp', type: 'answer' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    addTrack: jest.fn(),
    close: jest.fn(),
    getTracks: jest.fn().mockReturnValue([]),
  })),
  RTCView: 'RTCView',
  MediaStream: jest.fn(),
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
    }),
  },
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const SvgMock = (props) => React.createElement('Svg', props, props.children);
  return {
    __esModule: true,
    default: SvgMock,
    Svg: SvgMock,
    Path: (props) => React.createElement('Path', props),
    Circle: (props) => React.createElement('Circle', props),
    Rect: (props) => React.createElement('Rect', props),
    G: (props) => React.createElement('G', props, props.children),
  };
});
