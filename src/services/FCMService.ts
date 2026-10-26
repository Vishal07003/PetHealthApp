import { Platform, PermissionsAndroid, Alert } from 'react-native';
import {
  getMessaging,
  getToken,
  deleteToken,
  requestPermission,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus,
  RemoteMessage,
} from '@react-native-firebase/messaging';
import { NotificationService } from './PetHealthService';

export interface PushNotificationPayload {
  notification_id?: string;
  notification_type?: string;
  pet_id?: string;
  [key: string]: any;
}

type NotificationHandler = (payload: PushNotificationPayload) => void;

class FCMManager {
  private currentToken: string | null = null;
  private onNotificationOpenedCallback: NotificationHandler | null = null;
  private unsubscribeTokenRefresh: (() => void) | null = null;
  private unsubscribeForegroundMessage: (() => void) | null = null;

  /**
   * Request notification permissions (required for Android 13+ and iOS)
   */
  async requestUserPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } else if (Platform.OS === 'ios') {
        const messaging = getMessaging();
        const authStatus = await requestPermission(messaging);
        return (
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL
        );
      }
      return false;
    } catch (error) {
      console.warn('[FCM] Permission request error:', error);
      return false;
    }
  }

  /**
   * Fetch current FCM registration token directly (with dev-only logging)
   */
  async getOrFetchToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestUserPermission();
      if (!hasPermission) {
        if (__DEV__) {
          console.warn('[FCM DEV] Notification permission was not granted. Cannot retrieve FCM token.');
        }
        return null;
      }

      const messaging = getMessaging();
      const token = await getToken(messaging);
      if (token) {
        this.currentToken = token;
        if (__DEV__) {
          console.log('[FCM DEV] Current FCM Registration Token:', token);
        }
      }
      return token;
    } catch (err) {
      if (__DEV__) {
        console.warn('[FCM DEV] Error retrieving FCM token:', err);
      }
      throw err;
    }
  }

  /**
   * Initialize FCM listeners and register token with authenticated Django backend
   */
  async initialize(onNotificationOpened?: NotificationHandler): Promise<void> {
    this.onNotificationOpenedCallback = onNotificationOpened || null;

    const hasPermission = await this.requestUserPermission();
    if (!hasPermission) {
      console.log('[FCM] Notification permission not granted');
      return;
    }

    try {
      const messaging = getMessaging();

      // 1. Fetch current FCM token
      const token = await getToken(messaging);
      if (token) {
        this.currentToken = token;
        if (__DEV__) {
          console.log('[FCM DEV] Token acquired during initialization:', token);
        }
        await this.syncTokenWithBackend(token);
      }

      // 2. Listen for token refreshes
      this.unsubscribeTokenRefresh = onTokenRefresh(messaging, async (newToken: string) => {
        console.log('[FCM] Token refreshed');
        this.currentToken = newToken;
        await this.syncTokenWithBackend(newToken);
      });

      // 3. Foreground message listener (presents in-app banner/alert)
      this.unsubscribeForegroundMessage = onMessage(messaging, async (remoteMessage: RemoteMessage) => {
        console.log('[FCM] Foreground message received:', remoteMessage.notification);
        if (remoteMessage.notification) {
          Alert.alert(
            remoteMessage.notification.title || 'Pet Health Alert',
            remoteMessage.notification.body || '',
            [
              { text: 'Dismiss', style: 'cancel' },
              {
                text: 'View Alert',
                onPress: () => {
                  if (this.onNotificationOpenedCallback && remoteMessage.data) {
                    this.onNotificationOpenedCallback(remoteMessage.data);
                  }
                },
              },
            ]
          );
        }
      });

      // 4. Background notification tap (opened from background)
      onNotificationOpenedApp(messaging, (remoteMessage: RemoteMessage) => {
        console.log('[FCM] Notification opened from background:', remoteMessage.data);
        if (this.onNotificationOpenedCallback && remoteMessage.data) {
          this.onNotificationOpenedCallback(remoteMessage.data);
        }
      });

      // 5. Cold start notification tap (opened from quit state)
      const initialNotification = await getInitialNotification(messaging);
      if (initialNotification && initialNotification.data) {
        console.log('[FCM] App opened from quit state via notification:', initialNotification.data);
        if (this.onNotificationOpenedCallback) {
          this.onNotificationOpenedCallback(initialNotification.data);
        }
      }
    } catch (err) {
      console.warn('[FCM] Initialization failed:', err);
    }
  }

  /**
   * Safely registers device token with Django backend
   */
  async syncTokenWithBackend(token: string): Promise<void> {
    try {
      await NotificationService.registerDeviceToken(
        token,
        Platform.OS === 'ios' ? 'ios' : 'android',
        `${Platform.OS.toUpperCase()} Mobile Client`
      );
      console.log('[FCM] Token successfully registered with Django backend');
    } catch (e) {
      // Network failure or unauthenticated state (will sync on next login)
      console.log('[FCM] Token sync with backend deferred (user not logged in or offline)');
    }
  }

  /**
   * Unregister token on user logout
   */
  async unregister(): Promise<void> {
    try {
      if (this.currentToken) {
        await NotificationService.unregisterDeviceToken(this.currentToken);
        this.currentToken = null;
      }
      if (this.unsubscribeTokenRefresh) {
        this.unsubscribeTokenRefresh();
        this.unsubscribeTokenRefresh = null;
      }
      if (this.unsubscribeForegroundMessage) {
        this.unsubscribeForegroundMessage();
        this.unsubscribeForegroundMessage = null;
      }
      const messaging = getMessaging();
      await deleteToken(messaging);
    } catch (err) {
      console.warn('[FCM] Error unregistering token on logout:', err);
    }
  }
}

export const fcmManager = new FCMManager();
