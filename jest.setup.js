// jest.setup.js
jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
}));
jest.mock('@react-native-firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));
jest.mock('react-native-permissions', () => ({
  request: jest.fn(),
  PERMISSIONS: {},
  RESULTS: {},
}));
jest.mock('react-native-push-notification', () => ({
  localNotificationSchedule: jest.fn(),
}));
