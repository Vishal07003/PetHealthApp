import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Icon } from '../components/Icon';
import { Pet, TelemetryReading } from '../types/api';
import { TelemetryService, PetService } from '../services/PetHealthService';

interface ImuTelemetrySimulatorScreenProps {
  initialPet?: Pet | null;
  onBack?: () => void;
}

export const ImuTelemetrySimulatorScreen: React.FC<ImuTelemetrySimulatorScreenProps> = ({
  initialPet,
  onBack,
}) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(initialPet || null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [packetCount, setPacketCount] = useState(18090);
  const [dropRate, setDropRate] = useState('0.00%');
  const [latency, setLatency] = useState('5ms');
  const [activeMotionPreset, setActiveMotionPreset] = useState<'rest' | 'trot' | 'sprint' | 'limp'>('trot');
  const [frequencyHz, setFrequencyHz] = useState<number>(25);
  const [noisePercent, setNoisePercent] = useState<number>(4);
  const [batterySim, setBatterySim] = useState<number>(76);
  const [recentVectors, setRecentVectors] = useState<{ x: number; y: number; z: number; gyroP: number; gyroY: number; gyroR: number }[]>([]);
  const [anomalyInjected, setAnomalyInjected] = useState(false);

  useEffect(() => {
    PetService.listPets().then((list) => {
      setPets(list);
      if (!selectedPet && list.length > 0) setSelectedPet(list[0]);
    }).catch(() => {});
  }, []);

  // Continuous streaming loop generating synthetic vectors
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setPacketCount((prev) => prev + 1);

      let baseAx = 0.05;
      let baseAy = 0.85;
      let baseAz = 1.02;

      if (activeMotionPreset === 'rest') {
        baseAx = 0.01;
        baseAy = 0.02;
        baseAz = 0.98;
      } else if (activeMotionPreset === 'trot') {
        baseAx = 0.05 + Math.sin(Date.now() / 200) * 0.35;
        baseAy = 0.85 + Math.cos(Date.now() / 200) * 0.45;
        baseAz = 1.02 + Math.sin(Date.now() / 300) * 0.2;
      } else if (activeMotionPreset === 'sprint') {
        baseAx = 0.8 + Math.sin(Date.now() / 100) * 1.6;
        baseAy = 1.8 + Math.cos(Date.now() / 100) * 1.2;
        baseAz = 1.4 + Math.sin(Date.now() / 120) * 0.8;
      } else if (activeMotionPreset === 'limp') {
        // Uneven gait oscillation
        baseAx = (Date.now() % 400 < 100 ? 1.4 : 0.1);
        baseAy = 0.7 + Math.cos(Date.now() / 150) * 0.3;
        baseAz = 1.1;
      }

      setRecentVectors((prev) => [
        {
          x: parseFloat(baseAx.toFixed(2)),
          y: parseFloat(baseAy.toFixed(2)),
          z: parseFloat(baseAz.toFixed(2)),
          gyroP: parseFloat((Math.sin(Date.now() / 250) * 8).toFixed(1)),
          gyroY: parseFloat((Math.cos(Date.now() / 250) * 4).toFixed(1)),
          gyroR: parseFloat((Math.sin(Date.now() / 300) * 18).toFixed(1)),
        },
        ...prev.slice(0, 19),
      ]);
    }, 1000 / Math.min(frequencyHz, 10));

    return () => clearInterval(interval);
  }, [isStreaming, activeMotionPreset, frequencyHz]);

  const handleInjectAnomaly = () => {
    setAnomalyInjected(true);
    setActiveMotionPreset('limp');
    Alert.alert(
      'Gait Stifle Anomaly Injected',
      'Telemetry vector stream modified to simulate a left hind-leg stride asymmetry (74% gait symmetry index). All records tagged is_simulation=true.'
    );
  };

  const handleResetBaseline = () => {
    setAnomalyInjected(false);
    setActiveMotionPreset('trot');
    Alert.alert('Baseline Restored', 'Standard harmonic trotting telemetry resumed.');
  };

  const currentVector = recentVectors[0] || { x: -0.02, y: 0.01, z: 1.02, gyroP: -0.6, gyroY: 0.0, gyroR: 18.2 };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Clinical Header */}
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="chevron-left" size={18} color={Colors.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={styles.brandSubtitle}>PET HEALTH SYSTEM • BENCHMARK</Text>
            <Text style={styles.pageTitle}>IMU Telemetry Simulator</Text>
          </View>
        )}
        <View style={[styles.iconBadge, { backgroundColor: '#0F172A' }]}>
          <Icon name="devices" size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Prominent Simulation Bench Banner */}
      <View style={styles.benchCard}>
        <View style={styles.benchHeaderRow}>
          <View style={styles.simPill}>
            <Text style={styles.simPillText}>SIMULATION BENCH</Text>
          </View>
          <View style={styles.benchLiveIndicator}>
            <View style={styles.greenDot} />
            <Text style={styles.benchLiveText}>Active</Text>
          </View>
        </View>
        <Text style={styles.benchTitle}>ESP32 Hardware Simulation Environment</Text>
        <Text style={styles.benchDesc}>
          Bench-test synthetic tri-axial IMU telemetry streams without physical collar hardware. All emitted readings are explicitly flagged with <Text style={{ fontWeight: '800', color: '#5EEAD4' }}>is_simulation=true</Text> to guarantee data integrity.
        </Text>
      </View>

      {/* Engine Status Block */}
      <View style={styles.engineCard}>
        <View style={styles.engineHeader}>
          <View style={styles.engineDotRow}>
            <View style={[styles.pulseDot, { backgroundColor: isStreaming ? Colors.success : Colors.tertiary }]} />
            <Text style={styles.engineStatusText}>
              Engine {isStreaming ? 'Active' : 'Paused'} • Emitting BLE GATT
            </Text>
          </View>
          <View style={styles.gattBadge}>
            <Text style={styles.gattBadgeText}>GATT: 0x180D</Text>
          </View>
        </View>

        <View style={styles.engineStatsGrid}>
          <View style={styles.engineStatBox}>
            <Text style={styles.engineStatLbl}>PACKETS</Text>
            <Text style={styles.engineStatVal}>{packetCount.toLocaleString()}</Text>
          </View>
          <View style={styles.gridDivider} />
          <View style={styles.engineStatBox}>
            <Text style={styles.engineStatLbl}>DROP RATE</Text>
            <Text style={[styles.engineStatVal, { color: Colors.success }]}>{dropRate}</Text>
          </View>
          <View style={styles.gridDivider} />
          <View style={styles.engineStatBox}>
            <Text style={styles.engineStatLbl}>LATENCY</Text>
            <Text style={styles.engineStatVal}>{latency}</Text>
          </View>
        </View>
      </View>

      {/* Motion & Gait Preset Selector */}
      <View style={styles.presetSectionHeader}>
        <Text style={styles.presetSectionTitle}>MOTION & GAIT PRESET</Text>
        <Text style={styles.imuProfileText}>IMU Profile: Canine Bio-Mechanics</Text>
      </View>

      <View style={styles.presetGrid}>
        {/* Rest / Sleep */}
        <TouchableOpacity
          style={[styles.presetCard, activeMotionPreset === 'rest' && styles.presetCardActive]}
          onPress={() => setActiveMotionPreset('rest')}
          activeOpacity={0.8}
        >
          <Text style={[styles.presetName, activeMotionPreset === 'rest' && styles.presetNameActive]}>
            Rest / Sleep
          </Text>
          <Text style={styles.presetDetail}>0.02g RMS, quiescent</Text>
          <Text style={styles.presetCadence}>Cadence: 0.0 Hz</Text>
        </TouchableOpacity>

        {/* Normal Trot */}
        <TouchableOpacity
          style={[styles.presetCard, activeMotionPreset === 'trot' && styles.presetCardActive]}
          onPress={() => setActiveMotionPreset('trot')}
          activeOpacity={0.8}
        >
          <Text style={[styles.presetName, activeMotionPreset === 'trot' && styles.presetNameActive]}>
            Normal Trot
          </Text>
          <Text style={styles.presetDetail}>0.85g RMS, rhythmic</Text>
          <Text style={[styles.presetCadence, { color: Colors.primary }]}>1.8 Hz Cadence</Text>
        </TouchableOpacity>

        {/* Sprint / Play */}
        <TouchableOpacity
          style={[styles.presetCard, activeMotionPreset === 'sprint' && styles.presetCardActive]}
          onPress={() => setActiveMotionPreset('sprint')}
          activeOpacity={0.8}
        >
          <Text style={[styles.presetName, activeMotionPreset === 'sprint' && styles.presetNameActive]}>
            Sprint / Play
          </Text>
          <Text style={styles.presetDetail}>2.4g RMS, high peak</Text>
          <Text style={styles.presetCadence}>Cadence: 4.1 Hz</Text>
        </TouchableOpacity>

        {/* Stifle Limp (Anomaly) */}
        <TouchableOpacity
          style={[styles.presetCard, activeMotionPreset === 'limp' && styles.presetCardActiveAnomaly]}
          onPress={() => setActiveMotionPreset('limp')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.presetName, activeMotionPreset === 'limp' && styles.presetNameAnomaly]}>
              Stifle Limp
            </Text>
            <Icon name="alert" size={13} color="#B45309" />
          </View>
          <Text style={styles.presetDetail}>74% gait symmetry</Text>
          <Text style={[styles.presetCadence, { color: '#B45309' }]}>Anomalous Stride</Text>
        </TouchableOpacity>
      </View>

      {/* Oscilloscope Telemetry Trace Card */}
      <View style={styles.oscilloscopeCard}>
        <View style={styles.oscilloHeaderRow}>
          <View style={styles.oscilloTitleRow}>
            <View style={styles.oscilloDot} />
            <Text style={styles.oscilloTitle}>Oscilloscope Telemetry</Text>
          </View>
          <View style={styles.channelLegend}>
            <Text style={[styles.channelText, { color: '#0EA5E9' }]}>― X</Text>
            <Text style={[styles.channelText, { color: '#10B981', marginLeft: 8 }]}>― Y</Text>
            <Text style={[styles.channelText, { color: '#F59E0B', marginLeft: 8 }]}>― Z</Text>
          </View>
        </View>

        {/* Waveform Canvas Simulation */}
        <View style={styles.waveformScreen}>
          <Text style={styles.bufferText}>BUFFER: 250pts</Text>
          <Text style={styles.trigText}>TRIG: AUTO</Text>

          {/* Center Zero Axis */}
          <View style={styles.zeroLine} />

          {/* Multi-channel Simulated Sine Wave Points */}
          <View style={styles.waveRow}>
            {recentVectors.map((v, i) => (
              <View key={i} style={styles.waveCol}>
                <View
                  style={[
                    styles.waveDot,
                    {
                      backgroundColor: '#10B981',
                      bottom: Math.min(Math.max((v.y + 1) * 20, 4), 60),
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* 6-Axis Digital Readout Bar */}
        <View style={styles.readoutBar}>
          <View style={styles.readoutCol}>
            <Text style={styles.readoutGroupTitle}>TRI-AXIAL ACCEL (g)</Text>
            <Text style={styles.readoutValues}>
              X: <Text style={{ color: Colors.text }}>{currentVector.x.toFixed(2)}g</Text>  Y: <Text style={{ color: Colors.text }}>{currentVector.y.toFixed(2)}g</Text>  Z: <Text style={{ color: Colors.text }}>{currentVector.z.toFixed(2)}g</Text>
            </Text>
          </View>
          <View style={styles.readoutDivider} />
          <View style={styles.readoutCol}>
            <Text style={styles.readoutGroupTitle}>GYROSCOPE (°/s)</Text>
            <Text style={styles.readoutValues}>
              P: <Text style={{ color: Colors.text }}>{currentVector.gyroP}°</Text>  Y: <Text style={{ color: Colors.text }}>{currentVector.gyroY}°</Text>  R: <Text style={{ color: Colors.text }}>{currentVector.gyroR}°</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Workbench Parameters Card */}
      <View style={styles.workbenchParamsCard}>
        <Text style={styles.paramsTitle}>Workbench Parameters</Text>

        {/* Frequency Dial */}
        <View style={styles.paramItem}>
          <View style={styles.paramLabelRow}>
            <Text style={styles.paramLbl}>Telemetry Stream Frequency</Text>
            <Text style={styles.paramVal}>{frequencyHz} Hz</Text>
          </View>
          <View style={styles.paramSliderTrack}>
            <View style={[styles.paramSliderFill, { width: `${(frequencyHz / 50) * 100}%` }]} />
          </View>
          <View style={styles.paramMinMaxRow}>
            <Text style={styles.paramMinMax}>1 Hz (Low Power)</Text>
            <Text style={styles.paramMinMax}>50 Hz (Clinical High Res)</Text>
          </View>
        </View>

        <View style={styles.paramDivider} />

        {/* Noise & Artifact */}
        <View style={styles.paramItem}>
          <View style={styles.paramLabelRow}>
            <Text style={styles.paramLbl}>Noise & Artifact Injection</Text>
            <Text style={styles.paramVal}>{noisePercent}%</Text>
          </View>
          <View style={styles.paramSliderTrack}>
            <View style={[styles.paramSliderFill, { width: `${noisePercent * 4}%` }]} />
          </View>
          <View style={styles.paramMinMaxRow}>
            <Text style={styles.paramMinMax}>0% (Ideal Synthetic)</Text>
            <Text style={styles.paramMinMax}>25% (Vigorous Fur/Collar Clip)</Text>
          </View>
        </View>

        <View style={styles.paramDivider} />

        {/* Hardware Telemetry Mock Indicators */}
        <View style={styles.hwMockRow}>
          <View style={styles.hwMockCol}>
            <Icon name="battery" size={14} color={Colors.primary} />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.hwMockLbl}>BATTERY SIM</Text>
              <Text style={styles.hwMockVal}>{batterySim}% (~4 days)</Text>
            </View>
          </View>
          <View style={styles.hwMockCol}>
            <Icon name="bluetooth" size={14} color={Colors.primary} />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.hwMockLbl}>BLE RSSI</Text>
              <Text style={styles.hwMockVal}>-62 dBm</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Diagnostic Routines & Injections */}
      <View style={styles.routineHeader}>
        <Text style={styles.routineTitle}>DIAGNOSTIC ROUTINES</Text>
        <Text style={styles.routineStatus}>RT-MACHINE</Text>
      </View>

      <TouchableOpacity
        style={[styles.injectAnomalyBtn, anomalyInjected && styles.injectAnomalyBtnActive]}
        onPress={handleInjectAnomaly}
        activeOpacity={0.8}
      >
        <Icon name="alert" size={16} color={anomalyInjected ? '#B45309' : Colors.tertiary} />
        <Text style={[styles.injectAnomalyText, anomalyInjected && { color: '#B45309' }]}>
          {anomalyInjected ? 'Stifle Gait Anomaly Injected' : 'Inject Gait Stifle Anomaly'}
        </Text>
      </TouchableOpacity>

      {/* Control Buttons: Pause / Resume Stream & Reset Baseline */}
      <View style={styles.controlRow}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={() => setIsStreaming(!isStreaming)}
          activeOpacity={0.8}
        >
          <Icon name="clock" size={14} color={Colors.text} />
          <Text style={styles.pauseBtnText}>{isStreaming ? 'Pause Stream' : 'Resume Stream'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetBaseline}
          activeOpacity={0.8}
        >
          <Icon name="refresh" size={14} color={Colors.text} />
          <Text style={styles.resetBtnText}>Reset Baseline</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
  },
  brandSubtitle: {
    fontSize: 9,
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
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benchCard: {
    backgroundColor: '#0F3E33',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  benchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  simPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  simPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 0.8,
  },
  benchLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  benchLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D1FAE5',
  },
  benchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  benchDesc: {
    fontSize: 11,
    color: '#D1FAE5',
    lineHeight: 16,
    marginTop: 6,
  },
  engineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  engineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  engineDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  engineStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  gattBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gattBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  engineStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  engineStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  engineStatLbl: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  engineStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  gridDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.borderLight,
  },
  presetSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  presetSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  imuProfileText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  presetCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  presetCardActiveAnomaly: {
    borderColor: Colors.tertiary,
    backgroundColor: Colors.tertiaryLight,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
  },
  presetNameActive: {
    color: Colors.primaryDark,
  },
  presetNameAnomaly: {
    color: Colors.tertiary,
  },
  presetDetail: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  presetCadence: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 4,
  },
  oscilloscopeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  oscilloHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  oscilloTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oscilloDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0EA5E9',
  },
  oscilloTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  channelLegend: {
    flexDirection: 'row',
  },
  channelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  waveformScreen: {
    height: 90,
    backgroundColor: '#0B132B',
    borderRadius: 10,
    padding: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  bufferText: {
    position: 'absolute',
    top: 6,
    left: 8,
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
  },
  trigText: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
  },
  zeroLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 45,
    height: 1,
    backgroundColor: '#1E293B',
  },
  waveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  waveCol: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  waveDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  readoutBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  readoutCol: {
    flex: 1,
  },
  readoutGroupTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  readoutValues: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
  },
  readoutDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 8,
  },
  workbenchParamsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  paramsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  paramItem: {
    marginBottom: 6,
  },
  paramLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  paramVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  paramSliderTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginVertical: 4,
  },
  paramSliderFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  paramMinMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paramMinMax: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  paramDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  hwMockRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  hwMockCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hwMockLbl: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  hwMockVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routineTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  routineStatus: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },
  injectAnomalyBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  injectAnomalyBtnActive: {
    backgroundColor: '#FDE68A',
  },
  injectAnomalyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  pauseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
});
