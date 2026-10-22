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
  onNavigateToPetSelect?: () => void;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ initialPet }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(initialPet || null);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [dataFilter, setDataFilter] = useState<'all' | 'real' | 'simulated'>('all');
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const loadInitialData = async () => {
    try {
      const petList = await PetService.listPets();
      setPets(petList);
      const active = selectedPet || petList[0] || null;
      setSelectedPet(active);
      if (active) {
        await fetchTelemetryAndInsights(active.id);
      }
    } catch (e) {
      console.warn('Failed to load activity data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTelemetryAndInsights = async (petId: string) => {
    try {
      const [rData, sData] = await Promise.all([
        TelemetryService.listReadings(petId).catch(() => []),
        InsightsService.listSummaries(petId).catch(() => []),
      ]);
      setReadings(rData);
      setSummaries(sData);
    } catch (e) {
      console.warn('Error loading telemetry:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedPet) {
      await fetchTelemetryAndInsights(selectedPet.id);
    }
    setRefreshing(false);
  };

  const handleSelectPet = async (pet: Pet) => {
    setSelectedPet(pet);
    setLoading(true);
    await fetchTelemetryAndInsights(pet.id);
    setLoading(false);
  };

  const handleRunSimulatorBatch = async () => {
    if (!selectedPet) return;
    setSimulating(true);
    try {
      const now = new Date();
      const syntheticBatch = [];
      for (let i = 0; i < 15; i++) {
        const timeOffset = new Date(now.getTime() - i * 1000 * 15).toISOString();
        const ax = (Math.random() * 0.8 + 1.2).toFixed(2);
        const ay = (Math.random() * 0.6 + 0.8).toFixed(2);
        const az = (Math.random() * 0.4 + 0.1).toFixed(2);
        syntheticBatch.push({
          accel_x: parseFloat(ax),
          accel_y: parseFloat(ay),
          accel_z: parseFloat(az),
          gyro_x: 0.05,
          gyro_y: 0.02,
          gyro_z: 0.01,
          battery_level: 95,
          rssi: -62,
          timestamp: timeOffset,
        });
      }

      await TelemetryService.ingestReadings(
        'DEMO-SIM-001',
        'demo-key',
        syntheticBatch,
        true
      );
      await InsightsService.generateInsights(selectedPet.id);
      await fetchTelemetryAndInsights(selectedPet.id);
      Alert.alert('Simulated Telemetry Ingested', '15 synthetic IMU readings recorded and activity window computed.');
    } catch (err) {
      try {
        await InsightsService.generateInsights(selectedPet.id);
        await fetchTelemetryAndInsights(selectedPet.id);
      } catch (e) {
        Alert.alert('Simulation Notice', 'Pair a collar device first to associate sensor telemetry with this pet.');
      }
    } finally {
      setSimulating(false);
    }
  };

  // Filtered readings
  const filteredReadings = readings.filter((r) => {
    if (dataFilter === 'real') return !r.is_simulation;
    if (dataFilter === 'simulated') return r.is_simulation;
    return true;
  });

  const latestSummary = summaries.length > 0 ? summaries[0] : null;

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
      {/* Screen Title & Multi-pet Switcher */}
      <View style={styles.topHeader}>
        <View>
          <Text style={Typography.titleLarge}>Activity & Vitals</Text>
          <Text style={styles.headerSubtitle}>Continuous motion tracking & trends</Text>
        </View>
      </View>

      {/* Pet Selector Chips */}
      {pets.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petSelectorBar}>
          {pets.map((p) => {
            const isSelected = selectedPet?.id === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => handleSelectPet(p)}
                style={[styles.petPill, isSelected && styles.petPillActive]}
              >
                <Text style={styles.petPillAvatar}>
                  {p.species === 'cat' ? '🐱' : p.species === 'dog' ? '🐶' : '🐾'}
                </Text>
                <Text style={[styles.petPillText, isSelected && styles.petPillTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Time Horizon Filter: Today / Week / Month */}
      <View style={styles.filterPillGroup}>
        {(['today', 'week', 'month'] as const).map((tf) => (
          <TouchableOpacity
            key={tf}
            onPress={() => setTimeFilter(tf)}
            style={[styles.timeFilterBtn, timeFilter === tf && styles.timeFilterBtnActive]}
          >
            <Text
              style={[styles.timeFilterText, timeFilter === tf && styles.timeFilterTextActive]}
            >
              {tf.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Disclaimer Badge */}
      <View style={styles.disclaimerBox}>
        <Icon name="shield" size={14} color={Colors.primary} />
        <Text style={styles.disclaimerText}>
          Activity estimates reflect movement patterns and do not constitute a veterinary diagnosis.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading telemetry vitals...</Text>
        </View>
      ) : !selectedPet ? (
        <View style={styles.emptyContainer}>
          <Text style={Typography.titleMedium}>No Pet Selected</Text>
          <Text style={styles.emptySub}>Please register or choose a pet to view movement data.</Text>
        </View>
      ) : (
        <>
          {/* Movement Overview Rings */}
          <View style={styles.ringsCard}>
            <Text style={styles.cardHeaderTitle}>Daily Movement Target</Text>
            <Text style={styles.cardHeaderSubtitle}>
              {timeFilter === 'today' ? "Today's exertion progress" : `Aggregated for ${timeFilter}`}
            </Text>

            <View style={styles.ringsCenter}>
              <ActivityRings
                movePercent={latestSummary ? Math.min((latestSummary.active_minutes / 60) * 100, 100) : 40}
                exercisePercent={latestSummary ? Math.min((latestSummary.high_intensity_minutes / 20) * 100, 100) : 25}
                restPercent={latestSummary ? Math.min((latestSummary.rest_minutes / 480) * 100, 100) : 60}
                size={175}
                centerLabel={latestSummary?.dominant_state ? latestSummary.dominant_state.toUpperCase() : 'RESTING'}
                centerValue={latestSummary ? `${latestSummary.avg_acceleration}G` : '0.98G'}
              />
            </View>

            {/* Quick Metrics 3-Col Bar */}
            <View style={styles.metricStatsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>
                  {latestSummary ? `${latestSummary.active_minutes}m` : '0m'}
                </Text>
                <Text style={styles.metricLbl}>Active Time</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>
                  {latestSummary ? `${latestSummary.peak_acceleration}G` : '1.0G'}
                </Text>
                <Text style={styles.metricLbl}>Peak Force</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>
                  {latestSummary ? `${Math.round(latestSummary.confidence_score * 100)}%` : '95%'}
                </Text>
                <Text style={styles.metricLbl}>Confidence</Text>
              </View>
            </View>
          </View>

          {/* Synthetic Simulator Action Bar */}
          <View style={styles.simCard}>
            <View style={styles.simHeader}>
              <Text style={styles.simTitle}>Synthetic IMU Simulator</Text>
              <View style={styles.simTag}>
                <Text style={styles.simTagText}>DEMO</Text>
              </View>
            </View>
            <Text style={styles.simSubtitle}>
              Generate synthetic 3-axis motion packets to test telemetry storage and statistical inference without hardware.
            </Text>
            <Button
              title={simulating ? 'Ingesting Batch...' : 'Ingest Simulated Telemetry Batch'}
              variant="secondary"
              onPress={handleRunSimulatorBatch}
              loading={simulating}
              style={styles.simBtn}
            />
          </View>

          {/* Data Source Filter: All / Real Hardware / Simulated */}
          <View style={styles.subFilterRow}>
            <Text style={styles.sectionHeaderTitle}>Raw Readings ({filteredReadings.length})</Text>
            <View style={styles.segmentedFilter}>
              {(['all', 'real', 'simulated'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setDataFilter(f)}
                  style={[styles.segBtn, dataFilter === f && styles.segBtnActive]}
                >
                  <Text style={[styles.segBtnText, dataFilter === f && styles.segBtnTextActive]}>
                    {f === 'all' ? 'All' : f === 'real' ? 'Real' : 'Sim'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Historical Telemetry Stream */}
          {filteredReadings.length === 0 ? (
            <View style={styles.emptyReadingsCard}>
              <Text style={styles.emptyReadingsText}>No sensor telemetry records found.</Text>
              <Text style={styles.emptyReadingsSub}>
                Ingest synthetic data above or stream from an active ESP32 collar.
              </Text>
            </View>
          ) : (
            filteredReadings.slice(0, 10).map((r) => (
              <View key={r.id} style={styles.readingRow}>
                <View>
                  <Text style={styles.readingMag}>{r.accel_magnitude} G</Text>
                  <Text style={styles.readingAxes}>
                    X: {r.accel_x} | Y: {r.accel_y} | Z: {r.accel_z}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.sourceBadge, r.is_simulation ? styles.sourceSim : styles.sourceReal]}>
                    {r.is_simulation ? 'Simulated' : 'ESP32 IMU'}
                  </Text>
                  {r.battery_level !== null && (
                    <Text style={styles.batteryText}>Battery {r.battery_level}%</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </>
      )}
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
    paddingBottom: Spacing.xl,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  petSelectorBar: {
    flexDirection: 'row',
    marginVertical: Spacing.sm,
  },
  petPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  petPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  petPillAvatar: {
    fontSize: 14,
    marginRight: 6,
  },
  petPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  petPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillGroup: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    padding: 3,
    marginVertical: Spacing.sm,
  },
  timeFilterBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeFilterBtnActive: {
    backgroundColor: Colors.surface,
    elevation: 1,
  },
  timeFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  timeFilterTextActive: {
    color: Colors.primary,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginVertical: Spacing.xs,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.primaryDark,
    marginLeft: 6,
    flex: 1,
    lineHeight: 15,
  },
  centerContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  ringsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ringsCenter: {
    alignItems: 'center',
    marginVertical: 10,
  },
  metricStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  metricLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.borderLight,
  },
  simCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#C2E5DC',
  },
  simHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  simTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  simTag: {
    backgroundColor: '#FEFCBF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  simTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B7791F',
  },
  simSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  simBtn: {
    paddingVertical: 8,
  },
  subFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  segmentedFilter: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    padding: 2,
  },
  segBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segBtnActive: {
    backgroundColor: Colors.surface,
  },
  segBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segBtnTextActive: {
    color: Colors.primary,
  },
  emptyReadingsCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyReadingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyReadingsSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  readingRow: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  readingMag: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  readingAxes: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sourceBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourceSim: {
    backgroundColor: '#FEFCBF',
    color: '#B7791F',
  },
  sourceReal: {
    backgroundColor: Colors.primaryLight,
    color: Colors.primaryDark,
  },
  batteryText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
