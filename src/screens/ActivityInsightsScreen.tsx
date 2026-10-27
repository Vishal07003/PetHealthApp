import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { PetAvatar } from '../components/PetAvatar';
import { Pet, TelemetryReading, ActivitySummary, PetAnalyticsResponse } from '../types/api';
import { TelemetryService, InsightsService } from '../services/PetHealthService';
import { showToast } from '../utils/toast';

interface ActivityInsightsScreenProps {
  pet: Pet;
  onBack: () => void;
}

export const ActivityInsightsScreen: React.FC<ActivityInsightsScreenProps> = ({ pet, onBack }) => {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [analytics, setAnalytics] = useState<PetAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [includeSim, setIncludeSim] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rData, sData, aData] = await Promise.all([
        TelemetryService.listReadings(pet.id).catch(() => []),
        InsightsService.listSummaries(pet.id).catch(() => []),
        InsightsService.getPetAnalytics(pet.id, includeSim).catch(() => null),
      ]);
      setReadings(rData);
      setSummaries(sData);
      setAnalytics(aData);
    } catch (e: any) {
      console.warn('Failed to load insights:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pet.id, includeSim]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleRunSimulatorBatch = async () => {
    setSimulating(true);
    try {
      const now = new Date();
      const syntheticReadings = [];
      for (let i = 0; i < 15; i++) {
        const timeOffset = new Date(now.getTime() - i * 1000 * 15).toISOString();
        const ax = (Math.random() * 0.8 + 1.2).toFixed(2);
        const ay = (Math.random() * 0.6 + 0.8).toFixed(2);
        const az = (Math.random() * 0.4 + 0.1).toFixed(2);
        syntheticReadings.push({
          accel_x: parseFloat(ax),
          accel_y: parseFloat(ay),
          accel_z: parseFloat(az),
          gyro_x: parseFloat((Math.random() * 10 - 5).toFixed(2)),
          gyro_y: parseFloat((Math.random() * 10 - 5).toFixed(2)),
          gyro_z: parseFloat((Math.random() * 10 - 5).toFixed(2)),
          battery_level: 88,
          rssi: -62,
          timestamp: timeOffset,
        });
      }

      await TelemetryService.ingestReadings(
        `SIM-${pet.id.slice(0, 8)}`,
        undefined,
        syntheticReadings,
        true, // is_simulation = true
        pet.id
      );

      // Compute fresh simulation window
      await InsightsService.generateInsights(pet.id, true);
      await fetchData();
      showToast('15 synthetic readings recorded. Toggle "Include Simulation" to view in analytics.');
    } catch (err: any) {
      try {
        await InsightsService.generateInsights(pet.id, true);
        await fetchData();
      } catch (err2) {
        showToast('Pair a collar device first to link telemetry.');
      }
    } finally {
      setSimulating(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevron-left" size={18} color={Colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={Typography.titleMedium}>Activity & Vitals Insights</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Pet Header */}
      <View style={styles.headerCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <PetAvatar
            photoUrl={pet.photo}
            avatarId={pet.avatar_id}
            species={pet.species}
            size={52}
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.petTitle}>{pet.name}'s Health Insights</Text>
            <Text style={styles.petSubtitle}>
              Probabilistic activity and movement trends derived from wearable 3-axis sensors.
            </Text>
          </View>
        </View>

        <View style={styles.filterToggleRow}>
          <Text style={styles.filterToggleLabel}>Data Source:</Text>
          <TouchableOpacity
            style={[styles.togglePill, !includeSim && styles.togglePillActive]}
            onPress={() => setIncludeSim(false)}
          >
            <Text style={[styles.togglePillText, !includeSim && styles.togglePillTextActive]}>
              Real Hardware Only
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.togglePill, includeSim && styles.togglePillActive]}
            onPress={() => setIncludeSim(true)}
          >
            <Text style={[styles.togglePillText, includeSim && styles.togglePillTextActive]}>
              Include Simulated
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimerBadge}>
          <Text style={styles.disclaimerText}>
            Observational Metrics: Not a veterinary diagnosis.
          </Text>
        </View>
      </View>

      {/* Personalized AI Insights & Baseline Card */}
      {analytics && (
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <Icon name="activity" size={20} color={Colors.primary} />
            <Text style={styles.analyticsTitle}>Personalized Baseline & Trends</Text>
          </View>

          {/* Baseline status banner */}
          {analytics.baseline.status === 'insufficient_data' ? (
            <View style={styles.insufficientBox}>
              <Icon name="clock" size={18} color="#D97706" />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.insufficientTitle}>Baseline Establishing</Text>
                <Text style={styles.insufficientText}>{analytics.baseline.message}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.baselineStatsRow}>
              <View style={styles.baselineStat}>
                <Text style={styles.baselineLabel}>Normal Active/Day</Text>
                <Text style={styles.baselineValue}>
                  {analytics.baseline.mean_daily_active_minutes} mins
                </Text>
              </View>
              <View style={styles.baselineStat}>
                <Text style={styles.baselineLabel}>Normal Rest/Day</Text>
                <Text style={styles.baselineValue}>
                  {analytics.baseline.mean_daily_rest_minutes} mins
                </Text>
              </View>
              <View style={styles.baselineStat}>
                <Text style={styles.baselineLabel}>Days Analyzed</Text>
                <Text style={styles.baselineValue}>
                  {analytics.baseline.days_analyzed} days
                </Text>
              </View>
            </View>
          )}

          {/* Anomaly Detection Banner */}
          {analytics.anomaly.detected && (
            <View style={styles.anomalyAlertBox}>
              <Icon name="alert" size={20} color="#DC2626" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.anomalyAlertTitle}>Activity Anomaly Detected</Text>
                <Text style={styles.anomalyAlertReason}>{analytics.anomaly.reason}</Text>
              </View>
            </View>
          )}

          {/* Actionable Natural Language Insights */}
          <Text style={styles.insightSectionHeader}>Observed Patterns & Recommendations</Text>
          {analytics.personalized_insights.map((insight, idx) => (
            <View key={idx} style={styles.insightItemRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.insightItemText}>{insight}</Text>
            </View>
          ))}

          {/* Factual Food & Water Correlation */}
          <View style={styles.foodWaterCorrelationBox}>
            <Text style={styles.fwHeader}>Nutrition & Hydration Observations</Text>
            <Text style={styles.fwNote}>{analytics.food_water_summary.observation_note}</Text>
          </View>
        </View>
      )}

      {/* Simulator Test Action */}
      <View style={styles.simCard}>
        <View style={styles.simHeader}>
          <Text style={styles.simTitle}>Synthetic IMU Simulator</Text>
          <Text style={styles.simTag}>DEMO</Text>
        </View>
        <Text style={styles.simSubtitle}>
          Simulate a high-energy running & walking session to verify vector math, classification, and anomaly detection.
        </Text>
        <Button
          title={simulating ? 'Ingesting Sensor Data...' : 'Ingest Simulated Telemetry Batch'}
          variant="secondary"
          onPress={handleRunSimulatorBatch}
          loading={simulating}
          style={styles.simBtn}
        />
      </View>

      {/* Activity Summaries */}
      <Text style={styles.sectionTitle}>Recent Activity Windows</Text>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
      ) : summaries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No activity summaries computed yet.</Text>
          <Text style={styles.emptySubtext}>Use the simulator above to generate initial motion readings.</Text>
        </View>
      ) : (
        summaries.slice(0, 10).map((s) => (
          <View key={s.id} style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryState}>
                {s.dominant_state === 'running'
                  ? 'Active / Running'
                  : s.dominant_state === 'walking'
                    ? 'Walking / Active'
                    : 'Resting / Low Motion'}
              </Text>
              {s.is_simulation && <Text style={styles.simBadge}>SIMULATED</Text>}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Avg Acceleration</Text>
                <Text style={styles.statVal}>{s.avg_acceleration} G</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Peak Force</Text>
                <Text style={styles.statVal}>{s.peak_acceleration} G</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Confidence</Text>
                <Text style={styles.statVal}>{Math.round(s.confidence_score * 100)}%</Text>
              </View>
            </View>

            {s.anomaly_detected && (
              <View style={styles.anomalyBox}>
                <Text style={styles.anomalyText}>Anomaly: {s.anomaly_reason}</Text>
              </View>
            )}
          </View>
        ))
      )}

      {/* Raw Sensor Readings */}
      <Text style={styles.sectionTitle}>Collar Sensor Readings ({readings.length})</Text>
      {readings.slice(0, 8).map((r) => (
        <View key={r.id} style={styles.readingRow}>
          <View>
            <Text style={styles.readingMag}>{r.accel_magnitude} G</Text>
            <Text style={styles.readingAxes}>
              X: {r.accel_x} | Y: {r.accel_y} | Z: {r.accel_z}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.readingSource}>{r.is_simulation ? 'Simulated' : 'ESP32 IMU'}</Text>
            {r.battery_level !== null && (
              <Text style={styles.readingBattery}>Battery {r.battery_level}%</Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
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
  headerCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  petTitle: {
    ...Typography.titleMedium,
    color: Colors.text,
  },
  petSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  filterToggleLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 8,
    fontWeight: '600',
  },
  togglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  togglePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  togglePillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disclaimerBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  analyticsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  insufficientBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  insufficientTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 2,
  },
  insufficientText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  baselineStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  baselineStat: {
    alignItems: 'center',
    flex: 1,
  },
  baselineLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  baselineValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  anomalyAlertBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  anomalyAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  anomalyAlertReason: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  insightSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  insightItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: 8,
  },
  insightItemText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  foodWaterCorrelationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fwHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  fwNote: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  simCard: {
    backgroundColor: '#F0FDF4',
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  simTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  simTag: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  simSubtitle: {
    ...Typography.bodySmall,
    color: '#15803D',
    marginBottom: Spacing.md,
  },
  simBtn: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryState: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  simBadge: {
    fontSize: 10,
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: 8,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  anomalyBox: {
    marginTop: Spacing.sm,
    backgroundColor: '#FEF2F2',
    padding: Spacing.sm,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  anomalyText: {
    fontSize: 12,
    color: '#B91C1C',
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readingMag: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  readingAxes: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  readingSource: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  readingBattery: {
    fontSize: 10,
    color: Colors.primary,
    marginTop: 2,
  },
});
