/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background message handler for when app is backgrounded or killed
try {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log('[FCM] Headless background message handled:', remoteMessage.messageId);
  });
} catch (e) {
  console.warn('[FCM] Failed to register background handler:', e);
}

AppRegistry.registerComponent(appName, () => App);


