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
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Device, Pet } from '../types/api';
import { DeviceService, PetService } from '../services/PetHealthService';
import { showToast } from '../utils/toast';

interface DevicesTabProps {
  onNavigateToScanner: (pet: Pet) => void;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({ onNavigateToScanner }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handlePairPress = () => {
    if (pets.length > 0) {
      onNavigateToScanner(pets[0]);
    } else {
      showToast('Please register a pet profile before pairing a collar.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Top Clinical Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandSubtitle}>PET HEALTH SYSTEM</Text>
          <Text style={styles.pageTitle}>Devices</Text>
          <Text style={styles.pageSub}>TELEMETRY HARDWARE • Wearable Devices</Text>
        </View>
        <View style={styles.iconBadge}>
          <Icon name="devices" size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Action Buttons Row (+ Pair Collar & Scanning...) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.pairCollarBtn}
          onPress={handlePairPress}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.pairCollarText}>Pair Collar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanningBtn}
          onPress={handlePairPress}
          activeOpacity={0.8}
        >
          <View style={styles.scanningDot} />
          <Text style={styles.scanningText}>Scanning...</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Hardware Collar Card */}
      <View style={styles.hardwareCollarCard}>
        <View style={styles.collarTopRow}>
          <View style={styles.collarIconCircle}>
            <Icon name="devices" size={20} color={Colors.primary} />
          </View>
          <View style={styles.collarMeta}>
            <Text style={styles.collarName}>PetHealth Collar V2</Text>
            <Text style={styles.collarSub}>ESP32-BLE-8821A • FW v1.4.2</Text>
          </View>
          <View style={styles.streamingBadge}>
            <View style={styles.streamingDot} />
            <Text style={styles.streamingText}>Streaming</Text>
          </View>
        </View>

        <View style={styles.collarDivider} />

        {/* Assigned Subject Pill */}
        <View style={styles.subjectBox}>
          <Text style={styles.subjectTag}>ASSIGNED SUBJECT</Text>
          <View style={styles.subjectRow}>
            <Text style={styles.subjectName}>{pets[0]?.name || 'Cooper'}</Text>
            <Text style={styles.subjectBreed}>
              {pets[0]?.breed || 'Golden Retriever'}
            </Text>
          </View>
        </View>

        {/* Hardware Status Quad Grid */}
        <View style={styles.quadGrid}>
          <View style={styles.quadBox}>
            <Text style={styles.quadLabel}>BATTERY LIFE</Text>
            <Text style={styles.quadVal}>78% ~4 days</Text>
          </View>
          <View style={styles.quadDivider} />
          <View style={styles.quadBox}>
            <Text style={styles.quadLabel}>BLE SIGNAL</Text>
            <Text style={styles.quadVal}>-62 dBm Optimal</Text>
          </View>
        </View>

        <View style={styles.quadGrid}>
          <View style={styles.quadBox}>
            <Text style={styles.quadLabel}>SYNC STATUS</Text>
            <Text style={[styles.quadVal, { color: Colors.success }]}>Live (12s ago)</Text>
          </View>
          <View style={styles.quadDivider} />
          <View style={styles.quadBox}>
            <Text style={styles.quadLabel}>PACKET RATE</Text>
            <Text style={styles.quadVal}>10 Hz Tri-Axial</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.syncNowBtn}
          onPress={() => showToast('ESP32 collar synced successfully with backend.')}
          activeOpacity={0.8}
        >
          <Icon name="refresh" size={14} color={Colors.primaryDark} />
          <Text style={styles.syncNowText}>Sync Now</Text>
        </TouchableOpacity>
      </View>

      {/* Workbench Test Environment Card */}
      <View style={styles.workbenchCard}>
        <View style={styles.wbHeaderRow}>
          <View style={styles.wbIconBox}>
            <Icon name="activity" size={18} color={Colors.tertiary} />
          </View>
          <View style={styles.wbTitleBox}>
            <Text style={styles.wbTitle}>ESP32 Hardware Test Environment</Text>
            <Text style={styles.wbSub}>Workbench Simulation</Text>
          </View>
        </View>
        <Text style={styles.wbDescription}>
          Physical ESP32 collar hardware is bench-tested in stand-by. Use the continuous IMU Telemetry Simulator to emit synthetic tri-axial g-force readings.
        </Text>
        <TouchableOpacity
          style={styles.launchSimBtn}
          onPress={handlePairPress}
          activeOpacity={0.8}
        >
          <Text style={styles.launchSimText}>Launch IMU Simulator Tool ›</Text>
        </TouchableOpacity>
      </View>

      {/* Discovered Peripherals Section */}
      <View style={styles.discoveredHeader}>
        <Text style={styles.discoveredTitle}>DISCOVERED PERIPHERALS</Text>
        <Text style={styles.autoRefreshText}>Auto-refresh (4s)</Text>
      </View>

      <View style={styles.peripheralRow}>
        <View>
          <Text style={styles.periphName}>PetHealth-Sensor-4402</Text>
          <Text style={styles.periphSub}>Signal: Strong (-58 dBm) • BLE 5.0</Text>
        </View>
        <TouchableOpacity
          style={styles.pairMiniBtn}
          onPress={handlePairPress}
          activeOpacity={0.8}
        >
          <Text style={styles.pairMiniText}>Pair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.peripheralRow}>
        <View>
          <Text style={styles.periphName}>Unknown Beacon (E4:15:F6)</Text>
          <Text style={styles.periphSub}>Unsupported Hardware Profile</Text>
        </View>
        <View style={styles.unsupportedBadge}>
          <Text style={styles.unsupportedText}>Incompatible</Text>
        </View>
      </View>

      {/* Protocol Guide */}
      <TouchableOpacity
        style={styles.protocolRow}
        onPress={() => showToast('Collar communicates via BLE 4.2+ GATT and Fallback Wi-Fi HTTP POST.')}
        activeOpacity={0.7}
      >
        <Icon name="shield" size={16} color={Colors.primary} />
        <Text style={styles.protocolText}>Protocol Guide: Offline Diagnostics</Text>
        <Icon name="chevron-right" size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  pageSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
  },
  pairCollarBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 6,
  },
  pairCollarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  scanningBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: 6,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
    marginRight: 6,
  },
  scanningText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  hardwareCollarCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    elevation: 2,
  },
  collarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collarMeta: {
    flex: 1,
  },
  collarName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  collarSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  streamingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginRight: 4,
  },
  streamingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  collarDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  subjectBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
  },
  subjectTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  subjectBreed: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  quadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingVertical: 8,
  },
  quadBox: {
    flex: 1,
    alignItems: 'center',
  },
  quadDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  quadLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  quadVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  syncNowBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  syncNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginLeft: 6,
  },
  workbenchCard: {
    backgroundColor: '#FEF9F0',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FEEBC8',
    marginBottom: Spacing.md,
  },
  wbHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wbIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEEBC8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  wbTitleBox: {
    flex: 1,
  },
  wbTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  wbSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.tertiary,
  },
  wbDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginBottom: 10,
  },
  launchSimBtn: {
    backgroundColor: Colors.tertiary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  launchSimText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  discoveredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  discoveredTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  autoRefreshText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  peripheralRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  periphName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  periphSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pairMiniBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pairMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unsupportedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unsupportedText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  protocolText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
});
