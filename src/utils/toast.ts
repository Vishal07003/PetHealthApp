import { Platform, ToastAndroid, Alert } from 'react-native';

/**
 * Universal Toast notification helper for the Pet Health mobile app.
 * On Android, uses native ToastAndroid (floating, non-blocking toast at the bottom).
 * On other platforms (iOS/Web), falls back safely to native Alert or console.
 */
export const showToast = (message: string, duration: 'short' | 'long' = 'short'): void => {
  if (!message) return;
  if (Platform.OS === 'android') {
    const toastDuration = duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT;
    ToastAndroid.show(message, toastDuration);
  } else {
    Alert.alert('', message);
  }
};

export const Toast = {
  show: showToast,
  info: (msg: string) => showToast(msg, 'short'),
  success: (msg: string) => showToast(msg, 'short'),
  error: (msg: string) => showToast(msg, 'long'),
  warn: (msg: string) => showToast(msg, 'short'),
};

export * from './permissionHelper';

