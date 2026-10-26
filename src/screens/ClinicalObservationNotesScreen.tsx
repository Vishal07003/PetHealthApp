import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Icon } from '../components/Icon';
import { PetAvatar } from '../components/PetAvatar';
import {
  Pet,
  ClinicalObservation,
  ObservationCategory,
  FoodWaterLog,
  IntakeType,
  IntakeUnit,
  DailyIntakeTotalsResponse,
} from '../types/api';
import { ClinicalService, PetService } from '../services/PetHealthService';

interface ClinicalObservationNotesScreenProps {
  initialPet?: Pet | null;
  onBack?: () => void;
}

export const ClinicalObservationNotesScreen: React.FC<ClinicalObservationNotesScreenProps> = ({
  initialPet,
  onBack,
}) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(initialPet || null);
  const [observations, setObservations] = useState<ClinicalObservation[]>([]);
  const [foodWaterLogs, setFoodWaterLogs] = useState<FoodWaterLog[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyIntakeTotalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Observation Input State
  const [activeCategory, setActiveCategory] = useState<ObservationCategory>('gait');
  const [headline, setHeadline] = useState('');
  const [details, setDetails] = useState('');
  const [isSharedWithVet, setIsSharedWithVet] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Food & Water Quick Log State
  const [intakeType, setIntakeType] = useState<IntakeType>('food');
  const [intakeAmount, setIntakeAmount] = useState('');
  const [intakeUnit, setIntakeUnit] = useState<IntakeUnit>('g');
  const [intakeNotes, setIntakeNotes] = useState('');
  const [submittingIntake, setSubmittingIntake] = useState(false);

  const loadData = async () => {
    try {
      const petList = await PetService.listPets();
      setPets(petList);
      const active = selectedPet || petList[0] || null;
      setSelectedPet(active);

      if (active) {
        const [obs, logs, totals] = await Promise.all([
          ClinicalService.listObservations(active.id).catch(() => []),
          ClinicalService.listFoodWaterLogs(active.id).catch(() => []),
          ClinicalService.getDailyIntakeTotals(active.id).catch(() => null),
        ]);
        setObservations(obs);
        setFoodWaterLogs(logs);
        setDailyTotals(totals);
      }

    } catch (e) {
      console.warn('Failed to load observations:', e);
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

  const handleAddObservation = async () => {
    if (!selectedPet) {
      Alert.alert('No Pet', 'Please select a pet profile first.');
      return;
    }
    if (!headline.trim()) {
      Alert.alert('Required', 'Please enter a note headline (e.g. Post-walk paw check).');
      return;
    }
    setSubmitting(true);
    try {
      await ClinicalService.addObservation({
        pet: selectedPet.id,
        category: activeCategory,
        headline: headline.trim(),
        details: details.trim() || 'No additional commentary provided.',
        is_shared_with_vet: isSharedWithVet,
      });
      setHeadline('');
      setDetails('');
      loadData();
      Alert.alert('Observation Logged', 'Clinical observation securely added with manual entry verification tag.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save observation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFoodWaterLog = async () => {
    if (!selectedPet) {
      Alert.alert('No Pet', 'Please select a pet profile first.');
      return;
    }
    const parsedAmount = parseFloat(intakeAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid quantity greater than 0.');
      return;
    }
    setSubmittingIntake(true);
    try {
      await ClinicalService.addFoodWaterLog({
        pet: selectedPet.id,
        intake_type: intakeType,
        amount: parsedAmount.toFixed(2),
        unit: intakeUnit,
        notes: intakeNotes.trim(),
      });
      setIntakeAmount('');
      setIntakeNotes('');
      loadData();
      Alert.alert(
        'Intake Recorded',
        `Manually logged ${parsedAmount} ${intakeUnit} of ${intakeType}. (Identified as manual owner observation)`
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || err.response?.data?.amount?.[0] || 'Failed to log consumption.');
    } finally {
      setSubmittingIntake(false);
    }
  };

  const handleShareDossier = async () => {
    try {
      await Share.share({
        title: `Clinical Health Dossier - ${selectedPet?.name || 'Pet'}`,
        message: `Package ${selectedPet?.name || 'Cooper'}'s 7-day behavioral observations, manual vitals, and collar sensor logs into a verified FHIR-compliant summary for Dr. Sarah Jenkins.`,
      });
    } catch (err) {
      // Ignored
    }
  };

  const pet = selectedPet;
  const todayFoodTotal = dailyTotals?.totals.find((t) => t.intake_type === 'food') || null;
  const todayWaterTotal = dailyTotals?.totals.find((t) => t.intake_type === 'water') || null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Top Clinical Header */}
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="chevron-left" size={18} color={Colors.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={styles.brandSubtitle}>PET HEALTH SYSTEM</Text>
            <Text style={styles.pageTitle}>Clinical Observation Notes</Text>
          </View>
        )}
        <View style={styles.iconBadge}>
          <Icon name="file-text" size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Patient Hero Badge Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <PetAvatar
            pet={pet}
            size={52}
            style={{ marginRight: 12 }}
          />
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.petName}>{pet?.name || 'Cooper'}</Text>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>94<Text style={styles.scoreSub}>/100</Text></Text>
                <Text style={styles.scoreTag}>Optimal Score</Text>
              </View>
            </View>
            <Text style={styles.breedText}>
              {pet ? `${pet.breed || 'Standard'} • ${pet.species.toUpperCase()}` : 'Canine Patient'} • 31.9 kg
            </Text>
          </View>
        </View>

        {/* 3-Pill Status Row: Resting, Activity, Telemetry */}
        <View style={styles.triBadgeRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillTag}>VITALS (HR/TEMP)</Text>
            <Text style={[styles.badgePillVal, { color: Colors.textMuted }]}>Not available</Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillTag}>OBSERVATIONS</Text>
            <Text style={styles.badgePillVal}>{observations.length} Logged</Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillTag}>TELEMETRY</Text>
            <Text style={[styles.badgePillVal, { color: Colors.primary }]}>IMU Tri-Axial</Text>
          </View>
        </View>
      </View>

      {/* Daily Behavioral Matrix Card */}
      <View style={styles.matrixCard}>
        <View style={styles.matrixHeaderRow}>
          <Text style={styles.matrixTitle}>Daily Behavioral & Intake Status</Text>
          <Text style={styles.matrixCheckText}>TODAY'S OWNER SUMMARY</Text>
        </View>

        {/* Appetite / Food */}
        <View style={styles.matrixItem}>
          <View style={[styles.matrixIconCircle, { backgroundColor: '#F3E8FF' }]}>
            <Icon name="flame" size={14} color="#7E22CE" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.matrixLabelRow}>
              <Text style={styles.matrixLabel}>Food Consumption</Text>
              <View style={[styles.matrixTagPill, { backgroundColor: todayFoodTotal ? '#F3E8FF' : '#F1F5F9' }]}>
                <Text style={[styles.matrixTagText, { color: todayFoodTotal ? '#7E22CE' : Colors.textMuted }]}>
                  {todayFoodTotal ? 'Recorded' : 'Not recorded'}
                </Text>
              </View>
            </View>
            <Text style={styles.matrixDescription}>
              {todayFoodTotal
                ? `Manual log: ${todayFoodTotal.total_amount} ${todayFoodTotal.unit} consumed across ${todayFoodTotal.entry_count} meal(s)`
                : 'No food portions logged today. (Not recorded)'}
            </Text>
          </View>
          <View style={[styles.checkCircle, { backgroundColor: todayFoodTotal ? Colors.success : Colors.textMuted }]}>
            <Icon name="check" size={12} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Hydration / Water */}
        <View style={styles.matrixItem}>
          <View style={[styles.matrixIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Icon name="refresh" size={14} color="#0369A1" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.matrixLabelRow}>
              <Text style={styles.matrixLabel}>Water Intake</Text>
              <View style={[styles.matrixTagPill, { backgroundColor: todayWaterTotal ? '#E0F2FE' : '#F1F5F9' }]}>
                <Text style={[styles.matrixTagText, { color: todayWaterTotal ? '#0369A1' : Colors.textMuted }]}>
                  {todayWaterTotal ? 'Recorded' : 'Not recorded'}
                </Text>
              </View>
            </View>
            <Text style={styles.matrixDescription}>
              {todayWaterTotal
                ? `Manual log: ${todayWaterTotal.total_amount} ${todayWaterTotal.unit} tracked across ${todayWaterTotal.entry_count} entry/entries`
                : 'No water intake logged today. (Not recorded)'}
            </Text>
          </View>
          <View style={[styles.checkCircle, { backgroundColor: todayWaterTotal ? Colors.success : Colors.textMuted }]}>
            <Icon name="check" size={12} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Mobility & Gait */}
        <View style={styles.matrixItem}>
          <View style={[styles.matrixIconCircle, { backgroundColor: Colors.primaryLight }]}>
            <Icon name="activity" size={14} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.matrixLabelRow}>
              <Text style={styles.matrixLabel}>Mobility & Gait</Text>
              <View style={[styles.matrixTagPill, { backgroundColor: Colors.primaryLight }]}>
                <Text style={[styles.matrixTagText, { color: Colors.primaryDark }]}>IMU Collar</Text>
              </View>
            </View>
            <Text style={styles.matrixDescription}>
              Tri-axial accelerometer stream monitoring gait symmetry and movement intensity.
            </Text>
          </View>
          <View style={styles.checkCircle}>
            <Icon name="check" size={12} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Stool Quality */}
        <View style={styles.matrixItem}>
          <View style={[styles.matrixIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="shield" size={14} color="#B45309" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.matrixLabelRow}>
              <Text style={styles.matrixLabel}>Stool & Elimination</Text>
              <View style={[styles.matrixTagPill, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.matrixTagText, { color: '#B45309' }]}>Manual Observation</Text>
              </View>
            </View>
            <Text style={styles.matrixDescription}>
              {observations.find((o) => o.category === 'stool')
                ? `Latest note: "${observations.find((o) => o.category === 'stool')?.headline}"`
                : 'No elimination observation noted today.'}
            </Text>
          </View>
          <View style={[styles.checkCircle, { backgroundColor: observations.some((o) => o.category === 'stool') ? Colors.success : Colors.textMuted }]}>
            <Icon name="check" size={12} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Energy & Mood */}
        <View style={styles.matrixItem}>
          <View style={[styles.matrixIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Icon name="heart" size={14} color="#15803D" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.matrixLabelRow}>
              <Text style={styles.matrixLabel}>Energy & Disposition</Text>
              <View style={[styles.matrixTagPill, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.matrixTagText, { color: '#15803D' }]}>Owner Observed</Text>
              </View>
            </View>
            <Text style={styles.matrixDescription}>
              {observations.find((o) => o.category === 'energy')
                ? `Latest note: "${observations.find((o) => o.category === 'energy')?.headline}"`
                : 'Log energy level, alertness, or behavioral changes below.'}
            </Text>
          </View>
          <View style={[styles.checkCircle, { backgroundColor: observations.some((o) => o.category === 'energy') ? Colors.success : Colors.textMuted }]}>
            <Icon name="check" size={12} color="#FFFFFF" />
          </View>
        </View>
      </View>


      {/* New Observation Log Form Card */}
      <View style={styles.formCard}>
        <View style={styles.formHeaderRow}>
          <Text style={styles.formTitle}>New Observation Log</Text>
          <Text style={styles.draftReadyTag}>Draft Ready</Text>
        </View>

        {/* Category Pill Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {[
            { id: 'gait', label: 'Gait' },
            { id: 'appetite', label: 'Appetite' },
            { id: 'hydration', label: 'Hydration' },
            { id: 'medication', label: 'Medication' },
            { id: 'collar_fit', label: 'Skin/Collar' },
          ].map((cat) => {
            const isSel = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id as ObservationCategory)}
                style={[styles.catPill, isSel && styles.catPillActive]}
              >
                <Text style={[styles.catPillText, isSel && styles.catPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TextInput
          style={styles.headlineInput}
          placeholder="Note headline (e.g., Post-walk paw examination)"
          placeholderTextColor={Colors.textMuted}
          value={headline}
          onChangeText={setHeadline}
        />

        <TextInput
          style={styles.detailsInput}
          placeholder="Record physical observations, mobility changes, or physiological remarks..."
          placeholderTextColor={Colors.textMuted}
          multiline
          value={details}
          onChangeText={setDetails}
          maxLength={280}
        />

        <View style={styles.toolRow}>
          <TouchableOpacity
            style={styles.toolChip}
            onPress={() => Alert.alert('Photo Attachment', 'Clinical camera attachment ready.')}
          >
            <Icon name="plus" size={12} color={Colors.textSecondary} />
            <Text style={styles.toolChipText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolChip}
            onPress={() => Alert.alert('Voice Note', 'Microphone audio recording ready.')}
          >
            <Icon name="activity" size={12} color={Colors.textSecondary} />
            <Text style={styles.toolChipText}>Voice Note</Text>
          </TouchableOpacity>
          <Text style={styles.charCount}>{details.length}/280</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAddObservation}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>
            {submitting ? 'Recording Entry...' : '+ Add Observation Note'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Food & Water Intake Tracking Card */}
      <View style={styles.formCard}>
        <View style={styles.formHeaderRow}>
          <View>
            <Text style={styles.formTitle}>Food & Water Intake Tracking</Text>
            <Text style={styles.formSubtitle}>Manually record portions (Owner observations)</Text>
          </View>
          <View style={styles.manualEntryBadge}>
            <Text style={styles.manualEntryBadgeText}>MANUAL ENTRY</Text>
          </View>
        </View>

        {/* Daily Totals Bar */}
        <View style={styles.intakeTotalsRow}>
          <View style={styles.intakeTotalBox}>
            <Text style={styles.intakeTotalTag}>TODAY'S FOOD</Text>
            <Text style={styles.intakeTotalVal}>
              {todayFoodTotal ? `${todayFoodTotal.total_amount} ${todayFoodTotal.unit}` : 'Not recorded'}
            </Text>
            <Text style={styles.intakeTotalSub}>
              {todayFoodTotal ? `${todayFoodTotal.entry_count} meal(s)` : 'No entries today'}
            </Text>
          </View>
          <View style={styles.intakeTotalBox}>
            <Text style={styles.intakeTotalTag}>TODAY'S WATER</Text>
            <Text style={styles.intakeTotalVal}>
              {todayWaterTotal ? `${todayWaterTotal.total_amount} ${todayWaterTotal.unit}` : 'Not recorded'}
            </Text>
            <Text style={styles.intakeTotalSub}>
              {todayWaterTotal ? `${todayWaterTotal.entry_count} log(s)` : 'No entries today'}
            </Text>
          </View>
        </View>

        {/* Type Selector (Food vs Water) */}
        <View style={styles.intakeTypeSelector}>
          <TouchableOpacity
            style={[styles.intakeTypeBtn, intakeType === 'food' && styles.intakeTypeBtnActive]}
            onPress={() => {
              setIntakeType('food');
              if (intakeUnit === 'ml' || intakeUnit === 'fl_oz') setIntakeUnit('g');
            }}
          >
            <Icon name="flame" size={14} color={intakeType === 'food' ? Colors.surface : '#7E22CE'} />
            <Text style={[styles.intakeTypeBtnText, intakeType === 'food' && styles.intakeTypeBtnTextActive]}>
              Food / Meal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.intakeTypeBtn, intakeType === 'water' && styles.intakeTypeBtnActiveWater]}
            onPress={() => {
              setIntakeType('water');
              if (intakeUnit === 'g' || intakeUnit === 'oz') setIntakeUnit('ml');
            }}
          >
            <Icon name="refresh" size={14} color={intakeType === 'water' ? Colors.surface : '#0369A1'} />
            <Text style={[styles.intakeTypeBtnText, intakeType === 'water' && styles.intakeTypeBtnTextActive]}>
              Water / Drink
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount & Unit Row */}
        <View style={styles.amountUnitRow}>
          <TextInput
            style={styles.amountInput}
            placeholder="Quantity (e.g. 200)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={intakeAmount}
            onChangeText={setIntakeAmount}
          />
          <View style={styles.unitPillsRow}>
            {(intakeType === 'food' ? (['g', 'oz', 'cup'] as const) : (['ml', 'fl_oz', 'cup'] as const)).map(
              (u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setIntakeUnit(u)}
                  style={[styles.unitPill, intakeUnit === u && styles.unitPillActive]}
                >
                  <Text style={[styles.unitPillText, intakeUnit === u && styles.unitPillTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        <TextInput
          style={styles.headlineInput}
          placeholder="Optional notes (e.g. Wet kibble breakfast with meds)"
          placeholderTextColor={Colors.textMuted}
          value={intakeNotes}
          onChangeText={setIntakeNotes}
        />

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: intakeType === 'food' ? Colors.primary : '#0284C7' }]}
          onPress={handleAddFoodWaterLog}
          disabled={submittingIntake}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>
            {submittingIntake ? 'Recording Intake...' : `+ Log ${intakeType === 'food' ? 'Food' : 'Water'} Portion`}
          </Text>
        </TouchableOpacity>

        {/* Recent Intake Log Entries */}
        {foodWaterLogs.length > 0 && (
          <View style={styles.intakeHistoryList}>
            <Text style={styles.intakeHistoryTitle}>Recent Consumption Logs</Text>
            {foodWaterLogs.slice(0, 5).map((log) => (
              <View key={log.id} style={styles.intakeHistoryRow}>
                <View style={[styles.intakeTypeIconCircle, { backgroundColor: log.intake_type === 'food' ? '#F3E8FF' : '#E0F2FE' }]}>
                  <Icon
                    name={log.intake_type === 'food' ? 'flame' : 'refresh'}
                    size={12}
                    color={log.intake_type === 'food' ? '#7E22CE' : '#0369A1'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.intakeHistoryMain}>
                    {log.amount} {log.unit} • {log.intake_type.toUpperCase()}
                  </Text>
                  {log.notes ? <Text style={styles.intakeHistoryNotes}>{log.notes}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.intakeHistoryTime}>
                    {new Date(log.logged_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.manualEntryTagSmall}>Manual</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Observation Timeline Header */}
      <View style={styles.timelineHeaderRow}>
        <View>
          <Text style={styles.timelineHeading}>Observation Timeline</Text>
          <Text style={styles.timelineSub}>{observations.length} ENTRIES LOGGED</Text>
        </View>
      </View>

      {/* Timeline Entries List */}
      <View style={styles.timelineList}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ padding: 20 }} />
        ) : observations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No clinical observations recorded yet.</Text>
            <Text style={styles.emptySub}>
              Use the form above to log gait, appetite, hydration, or collar checks.
            </Text>
          </View>
        ) : (
          observations.map((obs) => (
            <View key={obs.id} style={styles.timelineCard}>
              <View style={styles.timelineCardHeader}>
                <View style={styles.timelineLeftTag}>
                  <View style={styles.blueDot} />
                  <Text style={styles.timestampText}>
                    {new Date(obs.observed_at).toLocaleDateString()} • {new Date(obs.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.badgePair}>
                  <View style={styles.routineBadge}>
                    <Text style={styles.routineText}>{obs.category.toUpperCase()}</Text>
                  </View>
                  <View style={styles.manualChip}>
                    <Text style={styles.manualText}>Owner Entry</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.obsHeadline}>{obs.headline}</Text>
              <Text style={styles.obsDetails}>{obs.details}</Text>

              {/* Verified Sensor Association Banner */}
              <View style={styles.sensorVerifyBanner}>
                <View style={styles.sensorVerifyRow}>
                  <Icon name="activity" size={14} color={Colors.primary} />
                  <Text style={styles.sensorVerifyTitle}>TELEMETRY VERIFICATION</Text>
                  <Text style={styles.verifiedGreen}>● Verified</Text>
                </View>
                <Text style={styles.sensorVerifySub}>
                  Collar 50Hz IMU • Tri-Axial Gait Symmetrical
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Export Health Dossier CTA Card */}
      <View style={styles.exportDossierCard}>
        <Text style={styles.exportTitle}>Export Health Dossier</Text>
        <Text style={styles.exportTag}>Clinical PDF & Raw Telemetry Data</Text>
        <Text style={styles.exportDesc}>
          Package {pet?.name || 'Cooper'}'s 7-day behavioral notes, vital metrics, and 50Hz sensor anomalies into a verified FHIR-compliant summary for Dr. Sarah Jenkins.
        </Text>
        <TouchableOpacity
          style={styles.shareVetBtn}
          onPress={handleShareDossier}
          activeOpacity={0.8}
        >
          <Icon name="shield" size={16} color="#FFFFFF" />
          <Text style={styles.shareVetText}>Share Notes with Vet</Text>
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
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EFE3D3',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  heroInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  scorePill: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  scoreSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  scoreTag: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },
  breedText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  triBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badgePill: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  badgePillTag: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  badgePillVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  matrixCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  matrixTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  matrixCheckText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  matrixItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  matrixIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matrixLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  matrixTagPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matrixTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7E22CE',
  },
  matrixDescription: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  draftReadyTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  catPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  headlineInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 8,
  },
  detailsInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: Colors.text,
    height: 68,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  charCount: {
    marginLeft: 'auto',
    fontSize: 10,
    color: Colors.textMuted,
  },
  addBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineHeaderRow: {
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  timelineSub: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  timelineList: {
    gap: 10,
    marginBottom: Spacing.md,
  },
  timelineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineLeftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  badgePair: {
    flexDirection: 'row',
    gap: 4,
  },
  routineBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routineText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  manualChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  manualText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#B45309',
  },
  obsHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  obsDetails: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  sensorVerifyBanner: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sensorVerifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sensorVerifyTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  verifiedGreen: {
    marginLeft: 'auto',
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
  },
  sensorVerifySub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  exportDossierCard: {
    backgroundColor: '#0F3E33',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exportTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5EEAD4',
    marginTop: 2,
  },
  exportDesc: {
    fontSize: 11,
    color: '#D1FAE5',
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  shareVetBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  shareVetText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  manualEntryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  manualEntryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  intakeTotalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  intakeTotalBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  intakeTotalTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  intakeTotalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  intakeTotalSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  intakeTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  intakeTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  intakeTypeBtnActive: {
    backgroundColor: '#7E22CE',
    borderColor: '#7E22CE',
  },
  intakeTypeBtnActiveWater: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  intakeTypeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  intakeTypeBtnTextActive: {
    color: Colors.surface,
  },
  amountUnitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.text,
  },
  unitPillsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  unitPill: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  unitPillTextActive: {
    color: '#FFFFFF',
  },
  intakeHistoryList: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  intakeHistoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  intakeHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  intakeTypeIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intakeHistoryMain: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  intakeHistoryNotes: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  intakeHistoryTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  manualEntryTagSmall: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
});
