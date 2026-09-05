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

jest.mock('react-native-screens', () => {
  const React = require('react');
  const View = require('react-native').View;
  return {
    enableScreens: jest.fn(),
    Screen: (props) => React.createElement(View, props, props.children),
    ScreenContainer: (props) => React.createElement(View, props, props.children),
    NativeScreen: (props) => React.createElement(View, props, props.children),
    NativeScreenContainer: (props) => React.createElement(View, props, props.children),
    ScreenStack: (props) => React.createElement(View, props, props.children),
    ScreenStackHeaderConfig: (props) => React.createElement(View, props, props.children),
    ScreenStackHeaderSubview: (props) => React.createElement(View, props, props.children),
    SearchBar: (props) => React.createElement(View, props, props.children),
    FullWindowOverlay: (props) => React.createElement(View, props, props.children),
  };
});

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(null),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
    WHEN_UNLOCKED: 'WhenUnlocked',
    AFTER_FIRST_UNLOCK: 'AfterFirstUnlock',
  },
  ACCESS_CONTROL: {
    BIOMETRY_ANY: 'BiometryAny',
  },
}));

jest.mock('redux-persist', () => {
  const actual = jest.requireActual('redux-persist');
  return {
    ...actual,
    persistStore: jest.fn(() => ({
      persist: jest.fn(),
      pause: jest.fn(),
      flush: jest.fn().mockResolvedValue(undefined),
      purge: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      getState: jest.fn(() => ({ bootstrapped: true })),
    })),
    persistReducer: jest.fn((_config, reducer) => reducer),
  };
});

jest.mock('redux-persist/integration/react', () => ({
  PersistGate: ({ children }) => children,
}));

jest.mock('@react-native-firebase/messaging', () => {
  const messagingInstance = {
    requestPermission: jest.fn().mockResolvedValue(1),
    getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
    onMessage: jest.fn().mockReturnValue(jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
    onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
  };
  const defaultFn = jest.fn(() => messagingInstance);
  return {
    __esModule: true,
    default: defaultFn,
    getMessaging: jest.fn(() => messagingInstance),
    getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
    requestPermission: jest.fn().mockResolvedValue(1),
    onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
    onMessage: jest.fn().mockReturnValue(jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
    AuthorizationStatus: {
      NOT_DETERMINED: -1,
      DENIED: 0,
      AUTHORIZED: 1,
      PROVISIONAL: 2,
    },
  };
});

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn().mockResolvedValue([]),
  types: {
    allFiles: '*/*',
    images: 'image/*',
    pdf: 'application/pdf',
  },
  isErrorWithCode: jest.fn().mockReturnValue(false),
  errorCodes: {
    OPERATION_CANCELED: 'OPERATION_CANCELED',
  },
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

jest.mock('./src/services/socket.service', () => ({
  socketService: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    joinCamera: jest.fn(),
    leaveCamera: jest.fn(),
    on: jest.fn().mockReturnValue(() => {}),
    isConnected: jest.fn().mockReturnValue(true),
  },
}));

jest.mock('./src/api/endpoints/auth.api', () => ({
  AuthApi: {
    login: jest.fn().mockResolvedValue({ user: {}, tokens: {} }),
    getMe: jest.fn().mockResolvedValue(null),
    logout: jest.fn().mockResolvedValue(undefined),
    getFranchiseDetails: jest.fn().mockResolvedValue({ _id: '123', name: 'Test Franchise' }),
  },
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  openURL: jest.fn().mockResolvedValue(true),
  canOpenURL: jest.fn().mockResolvedValue(true),
  getInitialURL: jest.fn().mockResolvedValue(null),
}));

jest.mock('./src/api/client', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    post: jest.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    put: jest.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    patch: jest.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  setOnUnauthorizedCallback: jest.fn(),
}));
