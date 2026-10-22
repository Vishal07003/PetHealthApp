import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Pet, TelemetryReading, ActivitySummary } from '../types/api';
import { TelemetryService, InsightsService } from '../services/PetHealthService';

interface ActivityInsightsScreenProps {
  pet: Pet;
  onBack: () => void;
}

export const ActivityInsightsScreen: React.FC<ActivityInsightsScreenProps> = ({ pet, onBack }) => {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rData, sData] = await Promise.all([
        TelemetryService.listReadings(pet.id),
        InsightsService.listSummaries(pet.id),
      ]);
      setReadings(rData);
      setSummaries(sData);
    } catch (e: any) {
      console.warn('Failed to load insights:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pet.id]);

  const handleRunSimulatorBatch = async () => {
    setSimulating(true);
    try {
      const now = new Date();
      // Generate synthetic IMU readings for active running session
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

      // Ingest via direct backend API call simulating ESP32
      await TelemetryService.ingestReadings(
        'SIM:24:6F:28:9A:12',
        'demo-dummy-key',
        syntheticReadings,
        true // is_simulation = true
      );

      // Compute fresh insight window
      await InsightsService.generateInsights(pet.id);
      await fetchData();
      Alert.alert('Simulated Telemetry Ingested', '15 synthetic IMU readings recorded and activity window computed.');
    } catch (err: any) {
      // In case device credentials are required, compute with existing readings or display message
      try {
        await InsightsService.generateInsights(pet.id);
        await fetchData();
      } catch (err2) {
        Alert.alert('Simulation Notice', 'Pair a collar device first to associate sensor telemetry with this pet.');
      }
    } finally {
      setSimulating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={Typography.titleMedium}>Activity & Vitals Insights</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Pet Header */}
      <View style={styles.headerCard}>
        <Text style={styles.petTitle}>{pet.name}'s Health Insights</Text>
        <Text style={styles.petSubtitle}>
          Statistical movement observation derived from wearable 3-axis accelerometer/gyroscope sensors.
        </Text>
        <View style={styles.disclaimerBadge}>
          <Text style={styles.disclaimerText}>
            Probabilistic Observation: Not a veterinary diagnosis.
          </Text>
        </View>
      </View>

      {/* Simulator Test Action */}
      <View style={styles.simCard}>
        <View style={styles.simHeader}>
          <Text style={styles.simTitle}>Synthetic IMU Simulator</Text>
          <Text style={styles.simTag}>DEMO</Text>
        </View>
        <Text style={styles.simSubtitle}>
          Simulate a high-energy running & walking session to verify telemetry vector math and anomaly inference.
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
      <Text style={styles.sectionTitle}>Activity Windows</Text>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
      ) : summaries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No activity summaries computed yet.</Text>
          <Text style={styles.emptySubtext}>Use the simulator above to generate initial motion readings.</Text>
        </View>
      ) : (
        summaries.map((s) => (
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
      <Text style={styles.sectionTitle}>Recent Sensor Readings ({readings.length})</Text>
      {readings.slice(0, 10).map((r) => (
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
    padding: 8,
  },
  backBtnText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  petTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  petSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  disclaimerBadge: {
    backgroundColor: '#EDF2F7',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  simCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
  },
  simHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  simTag: {
    backgroundColor: '#ED8936',
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  simSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  simBtn: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryState: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  simBadge: {
    backgroundColor: '#ED8936',
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  anomalyBox: {
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  anomalyText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  readingMag: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  readingAxes: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  readingSource: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  readingBattery: {
    fontSize: 11,
    color: Colors.success,
    marginTop: 2,
  },
});
