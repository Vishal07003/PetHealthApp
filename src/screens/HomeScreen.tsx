import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { ActivityRings } from '../components/ActivityRings';
import { Pet, ActivitySummary, Device } from '../types/api';
import { PetService, InsightsService, DeviceService } from '../services/PetHealthService';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  onSelectPet: (pet: Pet) => void;
  onNavigateToAddPet: () => void;
  onNavigateToScanner: (pet: Pet) => void;
  onNavigateToInsights: (pet: Pet) => void;
  onNavigateToProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPet,
  onNavigateToAddPet,
  onNavigateToScanner,
  onNavigateToInsights,
}) => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const petList = await PetService.listPets();
      setPets(petList);

      const activePet = selectedPet
        ? petList.find((p) => p.id === selectedPet.id) || petList[0] || null
        : petList[0] || null;

      setSelectedPet(activePet);

      if (activePet) {
        // Fetch activity insights and paired device concurrently
        const [summaries, devices] = await Promise.all([
          InsightsService.listSummaries(activePet.id).catch(() => []),
          DeviceService.listDevices().catch(() => []),
        ]);

        setSummary(summaries.length > 0 ? summaries[0] : null);
        const paired = devices.find((d) => d.pet === activePet.id);
        setDevice(paired || null);
      } else {
        setSummary(null);
        setDevice(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to sync pet health vitals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handlePetChange = async (pet: Pet) => {
    setSelectedPet(pet);
    try {
      const [summaries, devices] = await Promise.all([
        InsightsService.listSummaries(pet.id).catch(() => []),
        DeviceService.listDevices().catch(() => []),
      ]);
      setSummary(summaries.length > 0 ? summaries[0] : null);
      const paired = devices.find((d) => d.pet === pet.id);
      setDevice(paired || null);
    } catch (e) {
      console.warn('Error switching pet:', e);
    }
  };

  // If initial load and no pets
  if (loading && pets.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Pet Health Dashboard...</Text>
      </View>
    );
  }

  // Pet avatar helper preserving requested icon
  const getAvatar = (pet: Pet) => {
    return pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾';
  };

  // Compute ring progress
  const activeMins = summary?.active_minutes || 0;
  const highIntensityMins = summary?.high_intensity_minutes || 0;
  const restMins = summary?.rest_minutes || 0;

  // Goals: 60 mins active, 20 mins running, 480 mins rest
  const movePct = Math.min(Math.round((activeMins / 60) * 100), 100);
  const exercisePct = Math.min(Math.round((highIntensityMins / 20) * 100), 100);
  const restPct = Math.min(Math.round((restMins / 480) * 100), 100);

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
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingTitle}>Pet Health</Text>
          <Text style={styles.greetingSub}>
            Welcome back, {user?.first_name || user?.username || 'Owner'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addPetBtn}
          onPress={onNavigateToAddPet}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color={Colors.primary} />
          <Text style={styles.addPetText}>Add Pet</Text>
        </TouchableOpacity>
      </View>

      {/* Multi-Pet Selector Pills */}
      {pets.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.petSelectorBar}
        >
          {pets.map((p) => {
            const isSelected = selectedPet?.id === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => handlePetChange(p)}
                style={[styles.petPill, isSelected && styles.petPillActive]}
              >
                <Text style={styles.pillAvatar}>{getAvatar(p)}</Text>
                <Text
                  style={[
                    styles.petPillText,
                    isSelected && styles.petPillTextActive,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Error Notice */}
      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadDashboardData} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State when no pets registered */}
      {pets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={Typography.titleMedium}>No Pets Added Yet</Text>
          <Text style={styles.emptySubtitle}>
            Register your dog, cat, or other pet to begin activity tracking and wearable monitoring.
          </Text>
          <Button
            title="+ Add Your First Pet"
            onPress={onNavigateToAddPet}
            style={styles.emptyAddBtn}
          />
        </View>
      ) : selectedPet ? (
        <>
          {/* Active Pet Overview Card */}
          <TouchableOpacity
            style={styles.overviewCard}
            activeOpacity={0.85}
            onPress={() => onSelectPet(selectedPet)}
          >
            <View style={styles.petCardHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>{getAvatar(selectedPet)}</Text>
              </View>
              <View style={styles.petMeta}>
                <Text style={styles.petNameText}>{selectedPet.name}</Text>
                <Text style={styles.petSubtitleText}>
                  {selectedPet.breed || selectedPet.species.toUpperCase()} •{' '}
                  {selectedPet.sex.toUpperCase()}
                  {selectedPet.weight_kg ? ` • ${selectedPet.weight_kg} kg` : ''}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={Colors.textMuted} />
            </View>

            <View style={styles.cardDivider} />

            {/* Wearable Connection Bar */}
            <View style={styles.deviceStatusBar}>
              <View style={styles.deviceStatusLeft}>
                <Icon
                  name="bluetooth"
                  size={16}
                  color={device?.is_connected ? Colors.primary : Colors.textMuted}
                />
                <Text style={styles.deviceNameText}>
                  {device ? device.name : 'No Collar Paired'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusTag,
                  device?.is_connected
                    ? styles.statusTagOnline
                    : styles.statusTagOffline,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    device?.is_connected
                      ? styles.statusTagTextOnline
                      : styles.statusTagTextOffline,
                  ]}
                >
                  {device
                    ? device.is_connected
                      ? 'Connected'
                      : 'Hardware Offline'
                    : 'Unpaired'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Daily Activity Rings Card */}
          <View style={styles.activityCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.cardSectionTitle}>Daily Activity</Text>
                <Text style={styles.cardSectionSub}>
                  {summary ? 'Telemetry observation window' : 'No motion records logged'}
                </Text>
              </View>
              {summary?.is_simulation && (
                <View style={styles.simBadge}>
                  <Text style={styles.simBadgeText}>SIMULATED</Text>
                </View>
              )}
            </View>

            <View style={styles.ringsContainer}>
              <ActivityRings
                movePercent={movePct || 35}
                exercisePercent={exercisePct || 25}
                restPercent={restPct || 60}
                size={170}
                centerLabel={summary?.dominant_state ? summary.dominant_state.toUpperCase() : 'RESTING'}
                centerValue={summary ? `${summary.avg_acceleration}G` : '0.98G'}
              />

              {/* Ring Metrics Legend */}
              <View style={styles.ringLegend}>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                  <View style={styles.legendTextCol}>
                    <Text style={styles.legendVal}>{activeMins} min</Text>
                    <Text style={styles.legendLabel}>Active Motion (Goal 60m)</Text>
                  </View>
                </View>

                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                  <View style={styles.legendTextCol}>
                    <Text style={styles.legendVal}>{highIntensityMins} min</Text>
                    <Text style={styles.legendLabel}>High Exertion (Goal 20m)</Text>
                  </View>
                </View>

                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
                  <View style={styles.legendTextCol}>
                    <Text style={styles.legendVal}>{restMins} min</Text>
                    <Text style={styles.legendLabel}>Rest & Sleep</Text>
                  </View>
                </View>
              </View>
            </View>

            {summary?.anomaly_detected && (
              <View style={styles.anomalyBanner}>
                <Icon name="alert" size={16} color={Colors.warning} />
                <Text style={styles.anomalyBannerText}>
                  Notice: {summary.anomaly_reason}
                </Text>
              </View>
            )}
          </View>

          {/* Health & Monitoring Feature Shortcuts Grid */}
          <Text style={styles.gridSectionTitle}>Wellness & Monitoring</Text>
          <View style={styles.featureGrid}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => onNavigateToInsights(selectedPet)}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconBadge, { backgroundColor: Colors.primaryLight }]}>
                <Icon name="activity" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Activity Insights</Text>
              <Text style={styles.featureSub}>Sensor telemetry & IMU charts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => onNavigateToScanner(selectedPet)}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconBadge, { backgroundColor: Colors.secondaryLight }]}>
                <Icon name="devices" size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.featureTitle}>Wearable Collar</Text>
              <Text style={styles.featureSub}>BLE scan & simulator pairing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => onSelectPet(selectedPet)}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconBadge, { backgroundColor: '#F0F4FF' }]}>
                <Icon name="heart" size={20} color={Colors.accent} />
              </View>
              <Text style={styles.featureTitle}>Profile & Records</Text>
              <Text style={styles.featureSub}>Vitals, breed, and weight</Text>
            </TouchableOpacity>

            <View style={[styles.featureCard, styles.featureCardDisabled]}>
              <View style={[styles.featureIconBadge, { backgroundColor: Colors.borderLight }]}>
                <Icon name="clock" size={20} color={Colors.textMuted} />
              </View>
              <Text style={styles.featureTitle}>Vet Reminders</Text>
              <Text style={styles.featureSub}>Planned upcoming feature</Text>
            </View>
          </View>
        </>
      ) : null}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  greetingSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addPetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C2E5DC',
  },
  addPetText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
  },
  petSelectorBar: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  petPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  petPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillAvatar: {
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
  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  petCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  petMeta: {
    flex: 1,
  },
  petNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  petSubtitleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  deviceStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagOnline: {
    backgroundColor: Colors.successLight,
  },
  statusTagOffline: {
    backgroundColor: '#EDF2F7',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTagTextOnline: {
    color: Colors.success,
  },
  statusTagTextOffline: {
    color: Colors.textMuted,
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSectionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  simBadge: {
    backgroundColor: '#FEFCBF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  simBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B7791F',
  },
  ringsContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  ringLegend: {
    width: '100%',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendTextCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  legendVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  anomalyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFAF0',
    borderWidth: 1,
    borderColor: '#FEEBC8',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  anomalyBannerText: {
    fontSize: 12,
    color: '#C05621',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  gridSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: 4,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 1,
  },
  featureCardDisabled: {
    opacity: 0.65,
  },
  featureIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  emptyAddBtn: {
    width: '100%',
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
});
