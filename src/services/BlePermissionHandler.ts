import { PermissionsAndroid, Platform } from 'react-native';

export interface BLEPermissionResult {
  granted: boolean;
  message?: string;
}

export const BlePermissionHandler = {
  /**
   * Request Bluetooth & Location permissions required for BLE on Android.
   * Android 12+ (API 31+) requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT.
   * Android 11 and lower requires ACCESS_FINE_LOCATION.
   */
  async requestBlePermissions(): Promise<BLEPermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    try {
      if (Platform.Version >= 31) {
        const statuses = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        const scanGranted =
          statuses[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED;
        const connectGranted =
          statuses[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;

        if (scanGranted && connectGranted) {
          return { granted: true };
        }
        return {
          granted: false,
          message: 'Bluetooth Scan and Connect permissions are required to discover nearby pet collars.',
        };
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission for Bluetooth LE',
            message: 'Android requires location access to discover nearby Bluetooth Low Energy devices.',
            buttonPositive: 'Grant Permission',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return { granted: true };
        }
        return {
          granted: false,
          message: 'Location permission was denied. BLE scanning is unavailable on Android 11 and below without location.',
        };
      }
    } catch (err: any) {
      return {
        granted: false,
        message: err.message || 'Error requesting Bluetooth permissions.',
      };
    }
  },
};
