/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Register background push notification handler outside component tree
try {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log('[FCM] Background message handled:', remoteMessage?.messageId);
  });
} catch (e) {
  // Graceful fallback when running in environments without native Firebase setup
}

AppRegistry.registerComponent(appName, () => App);

