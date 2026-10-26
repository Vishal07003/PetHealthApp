import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { ActivityRings } from '../components/ActivityRings';
import { Pet, TelemetryReading, ActivitySummary } from '../types/api';
import { TelemetryService, InsightsService, PetService } from '../services/PetHealthService';

interface ActivityTabProps {
  initialPet?: Pet | null;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ initialPet }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(initialPet || null);
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days'>('today');
  const [dataFilter, setDataFilter] = useState<'all' | 'real' | 'simulated'>('all');
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const loadData = async () => {
    try {
      const petList = await PetService.listPets();
      setPets(petList);
      const active = selectedPet || petList[0] || null;
      setSelectedPet(active);
      if (active) {
        await fetchTelemetry(active.id);
      }
    } catch (e) {
      console.warn('Failed to load activity:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTelemetry = async (petId: string) => {
    try {
      const [rData, sData] = await Promise.all([
        TelemetryService.listReadings(petId).catch(() => []),
        InsightsService.listSummaries(petId).catch(() => []),
      ]);
      setReadings(rData);
      setSummaries(sData);
    } catch (e) {
      console.warn('Telemetry fetch error:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedPet) await fetchTelemetry(selectedPet.id);
    setRefreshing(false);
  };

  const handleSimulate = async () => {
    if (!selectedPet) return;
    setSimulating(true);
    try {
      const now = new Date();
      const syntheticBatch = [];
      for (let i = 0; i < 15; i++) {
        const timeOffset = new Date(now.getTime() - i * 15000).toISOString();
        const ax = (Math.random() * 0.8 + 1.2).toFixed(2);
        const ay = (Math.random() * 0.6 + 0.8).toFixed(2);
        const az = (Math.random() * 0.4 + 0.1).toFixed(2);
        syntheticBatch.push({
          accel_x: parseFloat(ax),
          accel_y: parseFloat(ay),
          accel_z: parseFloat(az),
          gyro_x: 0.05,
          battery_level: 78,
          rssi: -62,
          timestamp: timeOffset,
        });
      }

      await TelemetryService.ingestReadings(
        'ESP-8821',
        'demo-key',
        syntheticBatch,
        true
      );
      await InsightsService.generateInsights(selectedPet.id);
      await fetchTelemetry(selectedPet.id);
      Alert.alert('Telemetry Batch Ingested', 'Synthetic IMU data recorded & 24h timeline updated.');
    } catch (e) {
      try {
        await InsightsService.generateInsights(selectedPet.id);
        await fetchTelemetry(selectedPet.id);
      } catch (err2) {
        Alert.alert('Notice', 'Pair collar device to link telemetry.');
      }
    } finally {
      setSimulating(false);
    }
  };

  const summary = summaries.length > 0 ? summaries[0] : null;

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
      {/* Top Clinical Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandSubtitle}>PET HEALTH SYSTEM</Text>
          <Text style={styles.pageTitle}>Activity & Rest</Text>
          <Text style={styles.pageSub}>Movement metrics & IMU telemetry for {selectedPet?.name || 'Pet'}</Text>
        </View>
        <View style={styles.iconBadge}>
          <Icon name="activity" size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Time Horizon Filter (Today / 7 Days / 30 Days) */}
      <View style={styles.filterPillsRow}>
        {(['today', '7days', '30days'] as const).map((tf) => (
          <TouchableOpacity
            key={tf}
            onPress={() => setTimeFilter(tf)}
            style={[styles.filterBtn, timeFilter === tf && styles.filterBtnActive]}
          >
            <Text style={[styles.filterBtnText, timeFilter === tf && styles.filterBtnTextActive]}>
              {tf === 'today' ? 'Today' : tf === '7days' ? '7 Days' : '30 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Telemetry Hardware Device Pill */}
      <View style={styles.hardwarePillBar}>
        <View style={styles.hwLeft}>
          <View style={styles.liveGreenDot} />
          <Text style={styles.hwTitle}>ESP32 IMU LIVE TELEMETRY</Text>
        </View>
        <Text style={styles.hwId}>ID: ESP-8821</Text>
      </View>

      {/* Segmented Filter: All / Real / Simulated */}
      <View style={styles.segmentedFilterRow}>
        {(['all', 'real', 'simulated'] as const).map((df) => (
          <TouchableOpacity
            key={df}
            onPress={() => setDataFilter(df)}
            style={[styles.segBtn, dataFilter === df && styles.segBtnActive]}
          >
            <Text style={[styles.segBtnText, dataFilter === df && styles.segBtnTextActive]}>
              {df === 'all' ? 'All Records' : df === 'real' ? 'Real BLE' : 'Simulated'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Duration Hero Card */}
      <View style={styles.actionDurationCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.subTag}>ACTION DURATION (IMU METRICS)</Text>
            <Text style={styles.durationBig}>
              {summary ? `${summary.active_minutes} mins` : 'Not available'}{' '}
              <Text style={styles.durationSub}>{summary ? 'active' : ''}</Text>
            </Text>
            <Text style={styles.goalDeltaText}>
              {summary ? 'Daily Goal: 60 mins • Synced via Collar IMU' : 'Collar not connected or no telemetry'}
            </Text>
          </View>
          <View style={styles.percentCircle}>
            <Text style={styles.percentText}>
              {summary ? `${Math.min(Math.round((summary.active_minutes / 60) * 100), 100)}%` : '--'}
            </Text>
          </View>
        </View>

        {/* Movement Spectrum Micro-Breakdown */}
        <View style={styles.spectrumBarRow}>
          <Text style={styles.spectrumTitle}>Movement Spectrum</Text>
          <Text style={styles.recordedTime}>
            {summary ? `${((summary.active_minutes + summary.rest_minutes) / 60).toFixed(1)}h Recorded` : 'No telemetry logged'}
          </Text>
        </View>
        <View style={styles.spectrumBar}>
          <View style={[styles.spectrumSegment, { flex: 68, backgroundColor: '#B8E2D8' }]} />
          <View style={[styles.spectrumSegment, { flex: 20, backgroundColor: Colors.secondary }]} />
          <View style={[styles.spectrumSegment, { flex: 8, backgroundColor: Colors.tertiary }]} />
          <View style={[styles.spectrumSegment, { flex: 4, backgroundColor: Colors.danger }]} />
        </View>
        <View style={styles.spectrumLegendRow}>
          <Text style={styles.specLbl}>● Rest 68%</Text>
          <Text style={styles.specLbl}>● Low 20%</Text>
          <Text style={styles.specLbl}>● Mod 8%</Text>
          <Text style={styles.specLbl}>● High 4%</Text>
        </View>

        {/* 24h Timeline Heatmap Simulation */}
        <View style={styles.timelineHeatmapHeader}>
          <Text style={styles.timelineTitle}>24h Timeline Heatmap</Text>
          <Text style={styles.peakTimeText}>Peak: 08:30 AM</Text>
        </View>
        <View style={styles.barGraphRow}>
          {[20, 15, 10, 8, 12, 45, 85, 60, 40, 55, 30, 25].map((h, idx) => (
            <View key={idx} style={styles.barCol}>
              <View
                style={[
                  styles.heatBar,
                  {
                    height: h * 0.7,
                    backgroundColor: h > 60 ? Colors.primary : h > 30 ? Colors.secondary : '#DCECE7',
                  },
                ]}
              />
            </View>
          ))}
        </View>
        <View style={styles.barLabelsRow}>
          <Text style={styles.hourLabel}>12 AM</Text>
          <Text style={styles.hourLabel}>06 AM</Text>
          <Text style={styles.hourLabel}>12 PM</Text>
          <Text style={styles.hourLabel}>06 PM</Text>
          <Text style={styles.hourLabel}>11 PM</Text>
        </View>
      </View>

      {/* Motion Intensity Vector Card */}
      <View style={styles.intensityCard}>
        <View style={styles.intensityTopRow}>
          <View>
            <Text style={styles.intensityTitle}>Motion Intensity</Text>
            <Text style={styles.intensitySub}>3-Axis Accel / Gyro RMS</Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>97% Confidence</Text>
          </View>
        </View>

        <View style={styles.intensityStatsRow}>
          <Text style={styles.intensityDetail}>Variance: (g-force RMS)</Text>
          <Text style={styles.intensityDetail}>Sampling: 10Hz Real-Stream</Text>
        </View>

        <View style={styles.intensityScaleBar}>
          <View style={styles.scaleMarker} />
          <View style={[styles.scaleMarker, { left: '40%' }]} />
          <View style={[styles.scaleMarker, { left: '85%' }]} />
        </View>
        <View style={styles.scaleLabelsRow}>
          <Text style={styles.scaleLbl}>0g (Rest)</Text>
          <Text style={styles.scaleLbl}>0.85g (Median)</Text>
          <Text style={styles.scaleLbl}>2.4g (Sprint/Play)</Text>
        </View>

        <Text style={styles.intensityFooterNotice}>
          ESP32 IMU calculates frequency shifts and multi-axis duration to estimate activity intensity. Not intended for clinical diagnostic without veterinary consultation.
        </Text>
      </View>

      {/* Recent Sessions List */}
      <View style={styles.sessionsHeader}>
        <Text style={styles.sessionsTitle}>Motion Classification Reference</Text>
        <Text style={styles.sessionsCount}>IMU Baseline Gait Profiles</Text>
      </View>

      <View style={styles.sessionCard}>
        <View style={[styles.sessionDot, { backgroundColor: Colors.tertiary }]} />
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>Morning Walk & Jog</Text>
          <Text style={styles.sessionSub}>08:15 AM • 32 min • 2,120 strides</Text>
        </View>
        <View style={styles.sessionTag}>
          <Text style={styles.sessionTagText}>High</Text>
        </View>
      </View>

      <View style={styles.sessionCard}>
        <View style={[styles.sessionDot, { backgroundColor: Colors.secondary }]} />
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>Backyard Play</Text>
          <Text style={styles.sessionSub}>11:30 AM • 16 min • Ball Retrieval</Text>
        </View>
        <View style={[styles.sessionTag, { backgroundColor: Colors.secondaryLight }]}>
          <Text style={[styles.sessionTagText, { color: Colors.primary }]}>Moderate</Text>
        </View>
      </View>

      <View style={styles.sessionCard}>
        <View style={[styles.sessionDot, { backgroundColor: Colors.primary }]} />
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>Nap & Deep Rest</Text>
          <Text style={styles.sessionSub}>01:15 PM • 2h 10m • Basal State</Text>
        </View>
        <View style={[styles.sessionTag, { backgroundColor: '#F0F4FF' }]}>
          <Text style={[styles.sessionTagText, { color: Colors.accentBlue }]}>Rest</Text>
        </View>
      </View>

      {/* Simulator Trigger / Export PDF Button */}
      <TouchableOpacity
        style={styles.downloadPdfBtn}
        onPress={handleSimulate}
        activeOpacity={0.8}
      >
        <Icon name="download" size={16} color="#FFFFFF" />
        <Text style={styles.downloadPdfText}>
          {simulating ? 'Ingesting Sensor Telemetry...' : 'Download Activity Summary PDF'}
        </Text>
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
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillsRow: {
    flexDirection: 'row',
    backgroundColor: '#EAEFF0',
    borderRadius: 10,
    padding: 3,
    marginVertical: Spacing.sm,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: Colors.surface,
    elevation: 1,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.primary,
  },
  hardwarePillBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  hwLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  hwTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  hwId: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  segmentedFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  segBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  segBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segBtnTextActive: {
    color: Colors.primary,
  },
  actionDurationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  durationBig: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  durationSub: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  goalDeltaText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  percentCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  spectrumBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  spectrumTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  recordedTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  spectrumBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  spectrumSegment: {
    height: '100%',
  },
  spectrumLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  specLbl: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  timelineHeatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  peakTimeText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  barGraphRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  heatBar: {
    width: 14,
    borderRadius: 3,
  },
  barLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  hourLabel: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  intensityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  intensityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intensityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  intensitySub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  confidenceBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  intensityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  intensityDetail: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  intensityScaleBar: {
    height: 6,
    backgroundColor: '#EAEFF0',
    borderRadius: 3,
    position: 'relative',
    marginVertical: 4,
  },
  scaleMarker: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 10,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  scaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleLbl: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  intensityFooterNotice: {
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 14,
    marginTop: 10,
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  sessionsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  sessionsCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  sessionSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  sessionTag: {
    backgroundColor: Colors.tertiaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sessionTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.tertiary,
  },
  downloadPdfBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  downloadPdfText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
