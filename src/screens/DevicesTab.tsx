import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Device, Pet } from '../types/api';
import { DeviceService, PetService } from '../services/PetHealthService';

interface DevicesTabProps {
  onNavigateToScanner: (pet: Pet) => void;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({ onNavigateToScanner }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [devList, petList] = await Promise.all([
        DeviceService.listDevices().catch(() => []),
        PetService.listPets().catch(() => []),
      ]);
      setDevices(devList);
      setPets(petList);
    } catch (e) {
      console.warn('Failed to load devices:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUnpair = async (device: Device) => {
    Alert.alert(
      'Unpair Collar',
      `Are you sure you want to unpair ${device.name}? Telemetry transmission will be detached from the pet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(device.id);
            try {
              await DeviceService.unpairDevice(device.id);
              await loadData();
              Alert.alert('Device Unpaired', 'Collar is now unpaired and available for reassignment.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.detail || 'Failed to unpair device.');
            } finally {
              setActionInProgress(null);
            }
          },
        },
      ]
    );
  };

  const handleRevoke = async (device: Device) => {
    Alert.alert(
      'Revoke Device Credentials',
      `Permanently revoke API credentials for ${device.name}? This cannot be undone and blocks future telemetry ingestion.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Credentials',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(device.id);
            try {
              await DeviceService.revokeDevice(device.id);
              await loadData();
              Alert.alert('Credentials Revoked', 'Collar API credentials have been permanently invalidated.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.detail || 'Failed to revoke device.');
            } finally {
              setActionInProgress(null);
            }
          },
        },
      ]
    );
  };

  const renderDeviceCard = ({ item }: { item: Device }) => {
    const isBusy = actionInProgress === item.id;
    const pairedPet = pets.find((p) => p.id === item.pet);

    return (
      <View style={styles.deviceCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.deviceIconCircle}>
            <Icon
              name="devices"
              size={22}
              color={item.is_connected ? Colors.primary : Colors.textSecondary}
            />
          </View>
          <View style={styles.deviceMainInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceUid}>UID: {item.device_uid}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === 'revoked'
                ? styles.statusRevoked
                : item.is_connected
                ? styles.statusOnline
                : styles.statusOffline,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'revoked'
                  ? styles.statusRevokedText
                  : item.is_connected
                  ? styles.statusOnlineText
                  : styles.statusOfflineText,
              ]}
            >
              {item.status === 'revoked'
                ? 'Revoked'
                : item.is_connected
                ? 'Connected'
                : item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Metadata Details */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Paired Pet:</Text>
          <Text style={styles.metaValue}>
            {pairedPet ? `${pairedPet.name} (${pairedPet.species.toUpperCase()})` : 'None (Unassigned)'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Hardware Type:</Text>
          <Text style={styles.metaValue}>
            {item.hardware_type === 'simulator' ? 'Demo IMU Simulator' : 'ESP32 Smart Collar'}
          </Text>
        </View>

        {item.battery_level !== null && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Battery Level:</Text>
            <Text style={styles.metaValue}>{item.battery_level}%</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Last Transmitted:</Text>
          <Text style={styles.metaValue}>
            {item.last_seen_at
              ? new Date(item.last_seen_at).toLocaleTimeString()
              : 'Never recorded'}
          </Text>
        </View>

        {/* Actions Row */}
        {item.status !== 'revoked' && (
          <View style={styles.actionRow}>
            {item.pet && (
              <TouchableOpacity
                onPress={() => handleUnpair(item)}
                disabled={isBusy}
                style={styles.unpairBtn}
              >
                <Text style={styles.unpairText}>Unpair</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleRevoke(item)}
              disabled={isBusy}
              style={styles.revokeBtn}
            >
              <Text style={styles.revokeText}>Revoke</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={Typography.titleLarge}>Wearable Devices</Text>
          <Text style={styles.headerSub}>Manage collar hardware and pairing</Text>
        </View>
        {pets.length > 0 && (
          <Button
            title="+ Pair Collar"
            onPress={() => onNavigateToScanner(pets[0])}
            style={styles.headerAddBtn}
          />
        )}
      </View>

      {/* Notice box on hardware status */}
      <View style={styles.infoBanner}>
        <Icon name="bluetooth" size={16} color={Colors.primary} />
        <Text style={styles.infoBannerText}>
          Collar connection requires an active BLE or Wi-Fi broadcast from the ESP32. Simulated collars are tagged for development.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading devices...</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="devices" size={32} color={Colors.textMuted} />
              </View>
              <Text style={Typography.titleMedium}>No Devices Registered</Text>
              <Text style={styles.emptySub}>
                Pair an ESP32 IMU collar or initialize a Demo Simulator to stream pet movement and activity vitals.
              </Text>
              {pets.length > 0 && (
                <Button
                  title="Scan & Pair Wearable Collar"
                  onPress={() => onNavigateToScanner(pets[0])}
                  style={styles.emptyActionBtn}
                />
              )}
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerAddBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    margin: Spacing.md,
    marginBottom: Spacing.sm,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C2E5DC',
  },
  infoBannerText: {
    fontSize: 12,
    color: Colors.primaryDark,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  deviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceMainInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  deviceUid: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: Colors.successLight,
  },
  statusOffline: {
    backgroundColor: '#EDF2F7',
  },
  statusRevoked: {
    backgroundColor: Colors.dangerLight,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusOnlineText: {
    color: Colors.success,
  },
  statusOfflineText: {
    color: Colors.textMuted,
  },
  statusRevokedText: {
    color: Colors.danger,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  metaLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  unpairBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EDF2F7',
    marginRight: 8,
  },
  unpairText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  revokeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.dangerLight,
  },
  revokeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  emptyActionBtn: {
    width: '100%',
  },
});
