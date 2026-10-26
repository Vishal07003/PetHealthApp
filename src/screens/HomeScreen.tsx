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
import { Pet, ActivitySummary, Device, VetAppointment, MedicalRecord } from '../types/api';
import { PetService, InsightsService, DeviceService, ClinicalService, NotificationService } from '../services/PetHealthService';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  onSelectPet: (pet: Pet) => void;
  onNavigateToAddPet: () => void;
  onNavigateToScanner: (pet: Pet) => void;
  onNavigateToInsights: (pet: Pet) => void;
  onNavigateToProfile: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToVaccines: (pet: Pet) => void;
  onNavigateToObservations: (pet: Pet) => void;
  onNavigateToWeight: (pet: Pet) => void;
  onNavigateToSimulator: (pet: Pet) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPet,
  onNavigateToAddPet,
  onNavigateToScanner,
  onNavigateToInsights,
  onNavigateToProfile,
  onNavigateToNotifications,
  onNavigateToVaccines,
  onNavigateToObservations,
  onNavigateToWeight,
  onNavigateToSimulator,
}) => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState<VetAppointment | null>(null);
  const [latestMedical, setLatestMedical] = useState<MedicalRecord | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const petList = await PetService.listPets();
      setPets(petList);

      const active = selectedPet
        ? petList.find((p) => p.id === selectedPet.id) || petList[0] || null
        : petList[0] || null;

      setSelectedPet(active);

      if (active) {
        const [summaries, devices, appts, meds, notifs] = await Promise.all([
          InsightsService.listSummaries(active.id).catch(() => []),
          DeviceService.listDevices().catch(() => []),
          ClinicalService.listAppointments(active.id).catch(() => []),
          ClinicalService.listMedicalRecords(active.id).catch(() => []),
          NotificationService.listNotifications().catch(() => []),
        ]);
        setSummary(summaries.length > 0 ? summaries[0] : null);
        const paired = devices.find((d) => d.pet === active.id);
        setDevice(paired || null);
        setUpcomingAppointment(appts.length > 0 ? appts[0] : null);
        setLatestMedical(meds.length > 0 ? meds[0] : null);
        setUnreadNotifications(notifs.filter((n) => !n.is_read).length);
      } else {
        const notifs = await NotificationService.listNotifications().catch(() => []);
        setUnreadNotifications(notifs.filter((n) => !n.is_read).length);
        setSummary(null);
        setDevice(null);
        setUpcomingAppointment(null);
        setLatestMedical(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to sync clinical pet health data.');
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

  const getAvatar = (pet: Pet) => {
    return pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾';
  };

  const activeMins = summary?.active_minutes || 0;
  const restMins = summary?.rest_minutes || 0;
  const scorePct = summary ? Math.min(Math.round((activeMins / 60) * 100), 100) : 0;

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
          <Text style={styles.pageTitle}>Home</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={onNavigateToNotifications}
            activeOpacity={0.8}
          >
            <Icon name="bell" size={20} color={Colors.text} />
            {unreadNotifications > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileBadge}
            onPress={onNavigateToProfile}
            activeOpacity={0.8}
          >
            <Icon name="profile" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Multi-Pet Selector Pills */}
      {pets.length > 0 && (
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
                onPress={() => {
                  setSelectedPet(p);
                  InsightsService.listSummaries(p.id)
                    .then((sums) => setSummary(sums[0] || null))
                    .catch(() => { });
                  DeviceService.listDevices()
                    .then((devs) => setDevice(devs.find((d) => d.pet === p.id) || null))
                    .catch(() => { });
                }}
                style={[styles.petPill, isSelected && styles.petPillActive]}
              >
                <View style={[styles.dotIndicator, isSelected && styles.dotIndicatorActive]} />
                <Text style={[styles.petPillText, isSelected && styles.petPillTextActive]}>
                  {p.name} ({p.species === 'dog' ? 'Canine' : p.species === 'cat' ? 'Feline' : p.species.toUpperCase()})
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.addPetChip}
            onPress={onNavigateToAddPet}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {loading && pets.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Syncing Bio-Care telemetry...</Text>
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={Typography.titleMedium}>No Patient Profiles Registered</Text>
          <Text style={styles.emptySub}>
            Register your pet to initialize IMU motion telemetry and wearable device monitoring.
          </Text>
          <Button
            title="+ Register Patient Pet"
            onPress={onNavigateToAddPet}
            style={{ width: '100%', marginTop: 14 }}
          />
        </View>
      ) : selectedPet ? (
        <>
          {/* Patient Hero Dossier Card */}
          <TouchableOpacity
            style={styles.dossierCard}
            activeOpacity={0.85}
            onPress={() => onSelectPet(selectedPet)}
          >
            <View style={styles.dossierTop}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarEmoji}>{getAvatar(selectedPet)}</Text>
              </View>
              <View style={styles.dossierInfo}>
                <Text style={styles.dossierName}>{selectedPet.name}</Text>
                <Text style={styles.dossierSub}>
                  {selectedPet.species === 'dog' ? 'Canine' : 'Feline'} •{' '}
                  {selectedPet.breed || 'Standard'} •{' '}
                  {selectedPet.weight_kg ? `${selectedPet.weight_kg} kg` : '20.5 kg'}
                </Text>
                <Text style={styles.syncNotice}>
                  Collar Synced • {device ? (device.is_connected ? 'Active Live' : '6m ago') : 'Unassigned'}
                </Text>
              </View>
              <View style={styles.dossierRight}>
                <Text style={styles.fullDetailsLink}>Full Details ›</Text>
              </View>
            </View>

            <View style={styles.dossierDivider} />

            {/* Micro Vitals Badges */}
            <View style={styles.vitalsRow}>
              <View style={styles.vitalBadge}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: device?.is_connected ? Colors.success : Colors.textMuted },
                  ]}
                />
                <Text style={styles.vitalLabel}>
                  {device?.is_connected ? 'IMU Rest Tracking Active' : 'Sensor not connected'}
                </Text>
              </View>
              <View style={styles.vitalBadge}>
                <Icon name="battery" size={14} color={device ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.vitalLabel, { marginLeft: 4 }]}>
                  {device?.battery_level != null ? `Collar ${device.battery_level}%` : 'Collar --'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Daily Activity & Wellness Card */}
          <View style={styles.clinicalCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.clinicalHeaderTag}>TELEMETRY RINGS</Text>
                <Text style={styles.clinicalCardTitle}>Daily Activity & Wellness</Text>
              </View>
              <View style={styles.liveTag}>
                <View style={[styles.liveDot, { backgroundColor: device?.is_connected ? Colors.success : Colors.tertiary }]} />
                <Text style={styles.liveTagText}>
                  {!device ? 'NO DEVICE' : device.hardware_type === 'simulator' ? 'SIMULATOR' : 'LIVE ESP32'}
                </Text>
              </View>
            </View>

            {/* Circular Gauge */}
            <ActivityRings
              scorePercent={scorePct}
              size={175}
              label={summary ? 'Goal Met' : 'No Data'}
              subLabel="IMU Motion Score"
            />

            {/* 3-Column Clinical Metric Readout */}
            <View style={styles.triColStats}>
              <View style={styles.colStat}>
                <Text style={styles.colStatVal}>
                  {summary ? `${activeMins}m` : 'Not available'}
                </Text>
                <Text style={styles.colStatSub}>of 60m goal</Text>
                <Text style={styles.colStatLabel}>Active</Text>
              </View>
              <View style={styles.colDivider} />
              <View style={styles.colStat}>
                <Text style={styles.colStatVal}>
                  {summary ? `${(restMins / 60).toFixed(1)}h` : 'Not available'}
                </Text>
                <Text style={styles.colStatSub}>of 14h goal</Text>
                <Text style={styles.colStatLabel}>Rest</Text>
              </View>
              <View style={styles.colDivider} />
              <View style={styles.colStat}>
                <Text style={styles.colStatVal}>
                  {summary ? `${(summary.avg_acceleration * 4.2).toFixed(1)}k` : 'Not available'}
                </Text>
                <Text style={styles.colStatSub}>of 6.0k goal</Text>
                <Text style={styles.colStatLabel}>Steps (est)</Text>
              </View>
            </View>

            <View style={styles.gaugeFooter}>
              <Text style={styles.telemetryFooterText}>
                {device?.is_connected ? 'BLE Sensor Telemetry • Active Stream' : 'Collar not broadcasting • Inactive'}
              </Text>
            </View>
          </View>

          {/* Micro Metrics Triple Bar */}
          <View style={styles.tripleCardRow}>
            <View style={styles.miniMetricCard}>
              <Icon name="moon" size={16} color={Colors.primary} />
              <Text style={styles.miniVal}>{summary ? `${Math.round(restMins / 60)}h` : '--'}</Text>
              <Text style={styles.miniSub}>Rest Duration</Text>
            </View>

            <View style={styles.miniMetricCard}>
              <Icon name="flame" size={16} color={Colors.secondary} />
              <Text style={styles.miniVal}>
                {summary ? `${summary.high_intensity_minutes} min` : '--'}
              </Text>
              <Text style={styles.miniSub}>Brisk Play</Text>
            </View>

            <View style={styles.miniMetricCard}>
              <Icon name="battery" size={16} color={Colors.tertiary} />
              <Text style={styles.miniVal}>
                {device?.battery_level != null ? `${device.battery_level}%` : '--'}
              </Text>
              <Text style={styles.miniSub}>Collar Battery</Text>
            </View>
          </View>


          {/* System Tools & Care List */}
          <View style={styles.systemToolsHeader}>
            <Text style={styles.toolsTitle}>System Tools & Care</Text>
            <Text style={styles.toolsCount}>5 modules connected</Text>
          </View>

          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => onNavigateToInsights(selectedPet)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: Colors.primaryLight }]}>
                <Icon name="activity" size={18} color={Colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Activity Insights</Text>
                <Text style={styles.menuSub}>View 24h timeline & rest cycles</Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => onNavigateToScanner(selectedPet)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: Colors.secondaryLight }]}>
                <Icon name="bluetooth" size={18} color={Colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Wearable Device</Text>
                <Text style={styles.menuSub}>
                  {device ? `${device.name} • ${device.status.toUpperCase()}` : 'Collar ESP32 not connected'}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => onNavigateToVaccines(selectedPet)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: Colors.tertiaryLight }]}>
                <Icon name="syringe" size={18} color={Colors.tertiary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Veterinary & Vaccines</Text>
                <Text style={styles.menuSub}>
                  {upcomingAppointment
                    ? `Upcoming: ${upcomingAppointment.title || upcomingAppointment.reason} (${new Date(upcomingAppointment.appointment_date).toLocaleDateString()})`
                    : latestMedical
                      ? `Latest: ${latestMedical.title} (${latestMedical.record_type})`
                      : 'Preventative schedule, core boosters & PDF dossier'}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => onNavigateToObservations(selectedPet)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Icon name="file-text" size={18} color="#7E22CE" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Clinical Observation Notes</Text>
                <Text style={styles.menuSub}>Behavioral matrix, appetite, stool & gait notes</Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => onNavigateToWeight(selectedPet)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#F0F4FF' }]}>
                <Icon name="scale" size={18} color={Colors.accentBlue} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Weight & Body Condition</Text>
                <Text style={styles.menuSub}>
                  {selectedPet.weight_kg ? `${selectedPet.weight_kg} kg` : '28.5 kg'} • WSAVA 1-9 scale & 6M trendline
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => onNavigateToSimulator(selectedPet)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#0F172A' }]}>
                <Icon name="devices" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>IMU Telemetry Simulator</Text>
                <Text style={styles.menuSub}>Hardware workbench bench-test (Simulated)</Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Clinical Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Icon name="shield" size={14} color={Colors.textMuted} />
            <Text style={styles.disclaimerText}>
              Sensor observations provide wellness estimates and do not replace professional veterinary diagnostics. In case of acute symptoms, consult a licensed clinician.
            </Text>
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
    paddingBottom: Spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  profileBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petSelectorBar: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  petPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  petPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
    marginRight: 6,
  },
  dotIndicatorActive: {
    backgroundColor: Colors.secondary,
  },
  petPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  petPillTextActive: {
    color: '#FFFFFF',
  },
  addPetChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  dossierCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  dossierTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EFE3D3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  dossierInfo: {
    flex: 1,
  },
  dossierName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  dossierSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  syncNotice: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dossierRight: {
    justifyContent: 'center',
  },
  fullDetailsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  dossierDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vitalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  vitalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  clinicalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clinicalHeaderTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  clinicalCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 1,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  triColStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
    marginTop: 6,
  },
  colStat: {
    alignItems: 'center',
    flex: 1,
  },
  colStatVal: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  colStatSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  colStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  colDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.borderLight,
  },
  gaugeFooter: {
    marginTop: 12,
    alignItems: 'center',
  },
  telemetryFooterText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tripleCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  miniMetricCard: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  miniVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 6,
  },
  miniSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  systemToolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  toolsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  toolsCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  menuSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 60,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: Spacing.xs,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginLeft: 8,
    flex: 1,
    lineHeight: 14,
  },
  centerBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginTop: 20,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});
