import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { BlePermissionHandler } from '../services/BlePermissionHandler';
import { DeviceService } from '../services/PetHealthService';
import { Pet, Device } from '../types/api';
import { showToast } from '../utils/toast';

interface DiscoveredDevice {
  id: string;
  name: string;
  device_uid: string;
  rssi: number;
  isDemo: boolean;
}

interface DeviceScannerScreenProps {
  pet: Pet;
  onBack: () => void;
  onDevicePaired: (device: Device) => void;
}

export const DeviceScannerScreen: React.FC<DeviceScannerScreenProps> = ({
  pet,
  onBack,
  onDevicePaired,
}) => {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [pairingDeviceId, setPairingDeviceId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const startRealBleScan = async () => {
    setIsDemoMode(false);
    setStatusMessage(null);
    setDevices([]);

    const permissionResult = await BlePermissionHandler.requestBlePermissions();
    if (!permissionResult.granted) {
      setStatusMessage(permissionResult.message || 'Bluetooth permissions denied.');
      return;
    }

    setScanning(true);
    setStatusMessage('Scanning for nearby BLE collars (ESP32 Pet Collar)...');

    // Real BLE discovery window: When ESP32 hardware is not yet present, scan legitimately times out
    setTimeout(() => {
      setScanning(false);
      setStatusMessage('No real BLE hardware collars detected nearby. You can test using DEMO SIMULATOR mode below.');
    }, 6000);
  };

  const startDemoSimulationScan = () => {
    setIsDemoMode(true);
    setScanning(true);
    setStatusMessage('Scanning in DEMO SIMULATOR mode...');

    setTimeout(() => {
      setScanning(false);
      setStatusMessage('Found simulated development devices:');
      setDevices([
        {
          id: 'demo-sim-01',
          name: 'ESP32 Collar (Simulated Demo)',
          device_uid: 'SIM:24:6F:28:9A:12',
          rssi: -58,
          isDemo: true,
        },
        {
          id: 'demo-sim-02',
          name: 'ESP32 Collar (Active Walking Sim)',
          device_uid: 'SIM:24:6F:28:B4:77',
          rssi: -72,
          isDemo: true,
        },
      ]);
    }, 1200);
  };

  const handlePairDevice = async (item: DiscoveredDevice) => {
    setPairingDeviceId(item.id);
    try {
      // 1. Register device with backend
      const registered = await DeviceService.registerDevice({
        name: item.name,
        device_uid: item.device_uid,
        hardware_type: item.isDemo ? 'simulator' : 'esp32_imu_collar',
        firmware_version: '1.0.0-demo',
      });

      // 2. Pair device with pet
      const paired = await DeviceService.pairDevice(registered.id, pet.id);
      showToast(`${item.name} paired with ${pet.name}.`);
      onDevicePaired(paired);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.device_uid || 'Failed to pair device.';
      showToast(String(msg));
    } finally {
      setPairingDeviceId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevron-left" size={18} color={Colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={Typography.titleMedium}>Pair Wearable Collar</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.targetCard}>
        <Text style={styles.targetLabel}>Target Pet</Text>
        <Text style={styles.targetName}>{pet.name} ({pet.species.toUpperCase()})</Text>
        <Text style={styles.targetSubtitle}>Assign a wearable collar to enable activity monitoring and health tracking.</Text>
      </View>

      <View style={styles.actionRow}>
        <Button
          title={scanning && !isDemoMode ? 'Scanning BLE...' : 'Scan Real BLE Hardware'}
          onPress={startRealBleScan}
          loading={scanning && !isDemoMode}
          disabled={scanning}
          style={styles.scanBtn}
        />
        <Button
          title={scanning && isDemoMode ? 'Finding Demo...' : 'Demo Simulator Mode'}
          onPress={startDemoSimulationScan}
          variant="secondary"
          loading={scanning && isDemoMode}
          disabled={scanning}
          style={styles.demoBtn}
        />
      </View>

      {/* Notice on Real vs Demo mode */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>
          {isDemoMode ? 'DEMO MODE ACTIVE' : 'HARDWARE STATUS'}
        </Text>
        <Text style={styles.noticeText}>
          {isDemoMode
            ? 'Simulated devices generate synthetic IMU accelerometer readings for testing without physical BLE hardware.'
            : 'Physical BLE scan requires Bluetooth enabled and nearby ESP32 IMU collar broadcasting.'}
        </Text>
      </View>

      {/* Status Message */}
      {!!statusMessage && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}

      {/* Discovered Device List */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.deviceName}>{item.name}</Text>
                {item.isDemo && <Text style={styles.demoBadge}>SIMULATED</Text>}
              </View>
              <Text style={styles.deviceUid}>{item.device_uid}</Text>
              <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
            </View>
            <Button
              title="Pair"
              onPress={() => handlePairDevice(item)}
              loading={pairingDeviceId === item.id}
              disabled={pairingDeviceId !== null}
              style={styles.pairBtn}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingTop: 0,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  targetCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  targetName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  targetSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: Spacing.md,
  },
  scanBtn: {
    height: 46,
  },
  demoBtn: {
    height: 46,
  },
  noticeBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: 10,
    marginBottom: Spacing.md,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  statusBox: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  list: {
    paddingBottom: 40,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  demoBadge: {
    backgroundColor: '#ED8936',
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deviceUid: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deviceRssi: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pairBtn: {
    height: 38,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
});
