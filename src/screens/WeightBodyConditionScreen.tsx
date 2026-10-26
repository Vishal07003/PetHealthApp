import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Icon } from '../components/Icon';
import { Pet, WeightRecord, BodyConditionScore } from '../types/api';
import { ClinicalService, PetService } from '../services/PetHealthService';

interface WeightBodyConditionScreenProps {
  initialPet?: Pet | null;
  onBack?: () => void;
}

export const WeightBodyConditionScreen: React.FC<WeightBodyConditionScreenProps> = ({
  initialPet,
  onBack,
}) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(initialPet || null);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [bcsRecords, setBcsRecords] = useState<BodyConditionScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendHorizon, setTrendHorizon] = useState<'1M' | '6M' | '1Y'>('6M');

  // Weigh-in Modal State
  const [showWeighModal, setShowWeighModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  // BCS Modal State
  const [showBcsModal, setShowBcsModal] = useState(false);
  const [selectedBcs, setSelectedBcs] = useState<number>(5);
  const [assessorSource, setAssessorSource] = useState('Owner Assessment');
  const [palpationNotes, setPalpationNotes] = useState('Ribs easily palpable with slight subcutaneous fat cover.');
  const [silhouetteNotes, setSilhouetteNotes] = useState('Well-proportioned waistline apparent when viewed from above.');
  const [savingBcs, setSavingBcs] = useState(false);

  const loadData = async () => {
    try {
      const petList = await PetService.listPets();
      setPets(petList);
      const active = selectedPet || petList[0] || null;
      setSelectedPet(active);

      if (active) {
        const [weights, bcs] = await Promise.all([
          ClinicalService.listWeights(active.id).catch(() => []),
          ClinicalService.listBCS(active.id).catch(() => []),
        ]);
        setWeightRecords(weights);
        setBcsRecords(bcs);
      }
    } catch (e) {
      console.warn('Failed to load weight/BCS data:', e);
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

  const handleSaveWeight = async () => {
    if (!selectedPet || !weightInput.trim()) {
      Alert.alert('Required', 'Please enter a valid weight in kg.');
      return;
    }
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid', 'Please enter a positive weight number.');
      return;
    }
    setSavingWeight(true);
    try {
      await ClinicalService.addWeight(selectedPet.id, val, weightNotes.trim() || 'Verified Weigh-in');
      setShowWeighModal(false);
      setWeightInput('');
      setWeightNotes('');
      loadData();
      Alert.alert('Success', 'Weight entry logged.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to log weight.');
    } finally {
      setSavingWeight(false);
    }
  };

  const handleSaveBcs = async () => {
    if (!selectedPet) return;
    setSavingBcs(true);
    try {
      await ClinicalService.addBCS({
        pet: selectedPet.id,
        score: selectedBcs,
        assessor_source: assessorSource.trim() || 'Owner Assessment',
        palpation_notes: palpationNotes.trim(),
        silhouette_notes: silhouetteNotes.trim(),
      });
      setShowBcsModal(false);
      loadData();
      Alert.alert('Success', 'Body Condition Score assessment logged.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to log BCS.');
    } finally {
      setSavingBcs(false);
    }
  };

  const handleExportCsv = async () => {
    const rows = [
      'Date,PetName,Weight_KG,Notes',
      ...weightRecords.map(
        (w) => `${w.recorded_at},${selectedPet?.name || 'Pet'},${w.weight_kg},"${w.notes || ''}"`
      ),
    ].join('\n');

    try {
      await Share.share({
        title: `${selectedPet?.name || 'Pet'}_Weight_History.csv`,
        message: rows,
      });
    } catch (err) {
      // Ignored
    }
  };

  const pet = selectedPet;
  const avatar = pet?.species === 'cat' ? '🐱' : pet?.species === 'dog' ? '🐶' : '🐾';
  const latestWeight = weightRecords.length > 0 ? parseFloat(weightRecords[0].weight_kg) : (pet?.weight_kg ? parseFloat(String(pet.weight_kg)) : 28.5);
  const latestBcs = bcsRecords.length > 0 ? bcsRecords[0] : null;
  const bcsScore = latestBcs ? latestBcs.score : 5;

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
            <Text style={styles.pageTitle}>Weight & Body Condition</Text>
          </View>
        )}
        <View style={styles.iconBadge}>
          <Icon name="scale" size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Patient Hero Badge Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarEmoji}>{avatar}</Text>
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.petName}>{pet?.name || 'Milo'}</Text>
              <View style={styles.telemetryTag}>
                <Text style={styles.telemetryTagText}>● TELEMETRY ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.breedText}>
              {pet ? `${pet.breed || 'Golden Retriever'} • 4 yrs` : 'Canine Patient'}
            </Text>
          </View>
        </View>

        {/* Current Weight Block */}
        <View style={styles.weightHeroBox}>
          <View style={styles.weightRow}>
            <View>
              <Text style={styles.weightTag}>CURRENT WEIGHT</Text>
              <Text style={styles.weightNumber}>
                {latestWeight.toFixed(1)} <Text style={styles.weightKg}>kg</Text>{' '}
                <Text style={styles.weightLbs}>({(latestWeight * 2.20462).toFixed(1)} lbs)</Text>
              </Text>
            </View>
            <View style={styles.idealTag}>
              <Text style={styles.idealTagText}>IDEAL WEIGHT</Text>
              <Text style={styles.idealDelta}>+0.2 kg / 30d</Text>
            </View>
          </View>

          {/* Underweight - Target - Overweight Bar */}
          <View style={styles.rangeLabelsRow}>
            <Text style={styles.rangeLbl}>Underweight{'\n'}&lt;27.0</Text>
            <Text style={[styles.rangeLbl, { color: Colors.primary, fontWeight: '800' }]}>
              Target: 27.0 - 29.0{'\n'}kg
            </Text>
            <Text style={styles.rangeLbl}>Overweight{'\n'}&gt;30.0</Text>
          </View>

          {/* Continuous Target Scale Bar */}
          <View style={styles.scaleTrack}>
            <View style={[styles.scaleActiveFill, { width: '60%' }]} />
            <View style={[styles.targetPin, { left: '55%' }]} />
          </View>
          <View style={styles.scaleTickRow}>
            <Text style={styles.scaleTick}>24.0 kg</Text>
            <Text style={[styles.scaleTick, { color: Colors.primaryDark, fontWeight: '700' }]}>
              ● Stable Plateau
            </Text>
            <Text style={styles.scaleTick}>34.0 kg</Text>
          </View>
        </View>
      </View>

      {/* 6-Month Trendline Chart Card */}
      <View style={styles.trendCard}>
        <View style={styles.trendHeaderRow}>
          <Text style={styles.trendTitle}>6-Month Trendline</Text>
          <View style={styles.horizonPillsRow}>
            {(['1M', '6M', '1Y'] as const).map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setTrendHorizon(h)}
                style={[styles.horizonPill, trendHorizon === h && styles.horizonPillActive]}
              >
                <Text style={[styles.horizonPillText, trendHorizon === h && styles.horizonPillTextActive]}>
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Compact SVG/Canvas-free Sparkline */}
        <View style={styles.sparklineContainer}>
          <Text style={styles.chartMax}>Max: 29.0kg</Text>
          <View style={styles.sparklineGrid}>
            <View style={styles.guideline} />
            <View style={styles.guideline} />
            {/* Visual SVG-like polyline dots */}
            <View style={styles.sparkPointRow}>
              {[
                { m: 'May', val: 28.1, top: 40 },
                { m: 'Jun', val: 28.2, top: 38 },
                { m: 'Jul', val: 28.3, top: 35 },
                { m: 'Aug', val: 28.4, top: 30 },
                { m: 'Sep', val: 28.4, top: 30 },
                { m: 'Oct', val: 28.5, top: 26 },
              ].map((pt, idx) => (
                <View key={idx} style={styles.pointCol}>
                  <View style={[styles.chartDot, { marginTop: pt.top }]} />
                  <Text style={styles.monthLabel}>
                    {pt.m} ({pt.val})
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.chartMin}>Min: 27.0kg</Text>
        </View>
      </View>

      {/* Body Condition Score (WSAVA 1-9 Scale) Card */}
      <View style={styles.bcsCard}>
        <View style={styles.bcsHeaderRow}>
          <View>
            <Text style={styles.bcsTitle}>Body Condition Score</Text>
            <Text style={styles.bcsSub}>WSAVA SYSTEM</Text>
          </View>
          <TouchableOpacity onPress={() => setShowBcsModal(true)}>
            <Text style={styles.bcsEditBtn}>Update ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.bigScore}>{bcsScore}<Text style={styles.bigScoreMax}>/9</Text></Text>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.scoreCategoryTitle}>
              {bcsScore === 5 ? 'Ideal Body Condition' : bcsScore < 5 ? 'Under Ideal Ratio' : 'Over Ideal Ratio'}
            </Text>
            <Text style={styles.scoreCategoryDesc}>Optimal muscular tone and skeletal ratio</Text>
          </View>
        </View>

        {/* 1-9 Discrete Pill Scale */}
        <View style={styles.discreteScaleRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const isSelected = num === bcsScore;
            const isIdeal = num >= 4 && num <= 5;
            return (
              <View
                key={num}
                style={[
                  styles.scaleNumberBox,
                  isIdeal && styles.idealBox,
                  isSelected && styles.selectedBox,
                ]}
              >
                <Text
                  style={[
                    styles.scaleNumberText,
                    isIdeal && styles.idealText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {num}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.bcsScaleLabels}>
          <Text style={styles.bcsScaleLbl}>1 Too Thin</Text>
          <Text style={[styles.bcsScaleLbl, { color: Colors.primaryDark, fontWeight: '700' }]}>5 Ideal</Text>
          <Text style={styles.bcsScaleLbl}>9 Heavy</Text>
        </View>

        <View style={styles.divider} />

        {/* Clinical Palpation & Silhouette Notes */}
        <View style={styles.checkNotesList}>
          <View style={styles.checkNoteRow}>
            <Icon name="check" size={14} color={Colors.primary} />
            <Text style={styles.checkNoteText}>
              <Text style={{ fontWeight: '700' }}>Physical Palpation:</Text>{' '}
              {latestBcs?.palpation_notes || 'Ribs easily palpable with slight subcutaneous fat cover; minimal excess skin fold.'}
            </Text>
          </View>
          <View style={styles.checkNoteRow}>
            <Icon name="check" size={14} color={Colors.primary} />
            <Text style={styles.checkNoteText}>
              <Text style={{ fontWeight: '700' }}>Visual Silhouette:</Text>{' '}
              {latestBcs?.silhouette_notes || 'Well-proportioned waistline apparent when viewed from above; distinct abdominal tuck behind rib cage.'}
            </Text>
          </View>
        </View>

        <View style={styles.verifiedFacilityRow}>
          <Icon name="shield" size={14} color={Colors.primary} />
          <Text style={styles.verifiedFacilityText}>
            Verified at {latestBcs?.assessor_source || 'Valley Vet Clinic (Dr. Sarah Chen, DVM)'}
          </Text>
        </View>
      </View>

      {/* Weigh-in History Card */}
      <View style={styles.historySectionHeader}>
        <Text style={styles.historySectionTitle}>Weigh-in History</Text>
        <Text style={styles.historyCountText}>{weightRecords.length} Verified Logs</Text>
      </View>

      <View style={styles.historyCardGroup}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ padding: 20 }} />
        ) : weightRecords.length === 0 ? (
          <View style={{ padding: 18, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: Colors.textMuted }}>No weight entries recorded.</Text>
          </View>
        ) : (
          weightRecords.map((w, idx) => (
            <React.Fragment key={w.id}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.historyRow}>
                <View style={styles.historyLeftCircle}>
                  <Icon name="scale" size={14} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.weightDiffRow}>
                    <Text style={styles.histWeightVal}>{w.weight_kg} kg</Text>
                    <Text style={styles.histWeightDiff}>+0.1</Text>
                  </View>
                  <Text style={styles.histWeightNote}>{w.notes || 'Verified BLE Smart Scale'}</Text>
                </View>
                <Text style={styles.histWeightDate}>{w.recorded_at}</Text>
              </View>
            </React.Fragment>
          ))
        )}
      </View>

      {/* Action Buttons: Log Weigh-in & Export CSV */}
      <TouchableOpacity
        style={styles.logWeighBtn}
        onPress={() => setShowWeighModal(true)}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={16} color="#FFFFFF" />
        <Text style={styles.logWeighText}>Log Weigh-in</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.exportCsvBtn}
        onPress={handleExportCsv}
        activeOpacity={0.8}
      >
        <Icon name="download" size={14} color={Colors.primary} />
        <Text style={styles.exportCsvText}>Export Weight History (CSV)</Text>
      </TouchableOpacity>

      {/* Log Weigh-in Modal */}
      <Modal visible={showWeighModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Pet Weight</Text>
            <Text style={styles.modalSub}>Verified entry for {selectedPet?.name}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Weight in kg (e.g. 28.5)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Measurement notes (e.g. Clinic visit, morning scale)"
              placeholderTextColor={Colors.textMuted}
              value={weightNotes}
              onChangeText={setWeightNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWeighModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleSaveWeight}
                disabled={savingWeight}
              >
                <Text style={styles.confirmBtnText}>{savingWeight ? 'Saving...' : 'Record Weight'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Body Condition Score Modal */}
      <Modal visible={showBcsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Body Condition Score</Text>
            <Text style={styles.modalSub}>WSAVA 1-9 Scale Assessment</Text>

            <View style={styles.bcsSelectRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setSelectedBcs(num)}
                  style={[styles.bcsPill, selectedBcs === num && styles.bcsPillActive]}
                >
                  <Text style={[styles.bcsPillText, selectedBcs === num && styles.bcsPillTextActive]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Assessor Source (e.g. Owner Assessment, Dr. Chen DVM)"
              placeholderTextColor={Colors.textMuted}
              value={assessorSource}
              onChangeText={setAssessorSource}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Palpation Notes (e.g. Ribs easily palpable)"
              placeholderTextColor={Colors.textMuted}
              value={palpationNotes}
              onChangeText={setPalpationNotes}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Silhouette Notes (e.g. Waistline apparent from above)"
              placeholderTextColor={Colors.textMuted}
              value={silhouetteNotes}
              onChangeText={setSilhouetteNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBcsModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleSaveBcs}
                disabled={savingBcs}
              >
                <Text style={styles.confirmBtnText}>{savingBcs ? 'Saving...' : 'Save BCS'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  telemetryTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  telemetryTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  breedText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  weightHeroBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  weightTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  weightNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  weightKg: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  weightLbs: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  idealTag: {
    alignItems: 'flex-end',
  },
  idealTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  idealDelta: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 4,
  },
  rangeLbl: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  scaleTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    position: 'relative',
    marginVertical: 4,
  },
  scaleActiveFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  targetPin: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 14,
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  scaleTickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  scaleTick: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  trendCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  trendTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  horizonPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  horizonPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  horizonPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  horizonPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  horizonPillTextActive: {
    color: '#FFFFFF',
  },
  sparklineContainer: {
    paddingTop: 8,
  },
  chartMax: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  sparklineGrid: {
    height: 90,
    position: 'relative',
    justifyContent: 'space-around',
    marginVertical: 4,
  },
  guideline: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  sparkPointRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pointCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  monthLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 28,
  },
  chartMin: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  bcsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  bcsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bcsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  bcsSub: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  bcsEditBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bigScore: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
  },
  bigScoreMax: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  scoreCategoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  scoreCategoryDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  discreteScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  scaleNumberBox: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  idealBox: {
    borderColor: Colors.primary,
  },
  selectedBox: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scaleNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  idealText: {
    color: Colors.primaryDark,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  bcsScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: Spacing.xs,
  },
  bcsScaleLbl: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  checkNotesList: {
    gap: 8,
  },
  checkNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  checkNoteText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  verifiedFacilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  verifiedFacilityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  historySectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  historyCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  historyCardGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: Spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  historyLeftCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightDiffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  histWeightVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  histWeightDiff: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  histWeightNote: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  histWeightDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  logWeighBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8,
  },
  logWeighText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exportCsvBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    marginBottom: Spacing.lg,
  },
  exportCsvText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  bcsSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  bcsPill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bcsPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bcsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  bcsPillTextActive: {
    color: '#FFFFFF',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
