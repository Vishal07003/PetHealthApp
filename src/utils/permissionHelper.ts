import { Platform, PermissionsAndroid, Linking } from 'react-native';

export type PermissionCheckResult = 'granted' | 'denied' | 'never_ask_again';

/**
 * Checks and requests Camera permission on Android.
 * Returns:
 * - 'granted': Access granted by user
 * - 'denied': Denied but can be requested again
 * - 'never_ask_again': Permanently denied (should prompt to open Settings)
 */
export const requestCameraPermission = async (): Promise<PermissionCheckResult> => {
  if (Platform.OS !== 'android') return 'granted';

  try {
    const isGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (isGranted) return 'granted';

    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
      title: 'Camera Access Needed',
      message: 'Pet Health needs camera access so you can take photos of your pet directly.',
      buttonPositive: 'Grant Access',
      buttonNegative: 'Not Now',
    });

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return 'never_ask_again';
    } else {
      return 'denied';
    }
  } catch {
    return 'denied';
  }
};

/**
 * Checks if Camera permission is currently granted without prompting.
 */
export const checkCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
  } catch {
    return false;
  }
};

/**
 * Opens the application settings page in the Android system settings.
 */
export const openAppSettings = async (): Promise<void> => {
  try {
    await Linking.openSettings();
  } catch {
    // Graceful fallback
  }
};
