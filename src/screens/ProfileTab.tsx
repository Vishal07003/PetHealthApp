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
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { PetService, ClinicalService } from '../services/PetHealthService';
import { fcmManager } from '../services/FCMService';
import { Pet, MedicalRecord, VetAppointment, WeightRecord } from '../types/api';

interface ProfileTabProps {
  onNavigateToPetSelect?: () => void;
  onNavigateToScanner?: (pet: Pet) => void;
  onNavigateToInsights?: (pet: Pet) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  onNavigateToScanner,
  onNavigateToInsights,
}) => {
  const { user, logout } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingFCM, setFetchingFCM] = useState(false);

  const handleInspectFCMToken = async () => {
    if (!__DEV__) return;
    setFetchingFCM(true);
    try {
      const token = await fcmManager.getOrFetchToken();
      if (token) {
        Alert.alert(
          'FCM Registration Token (DEV ONLY)',
          token,
          [
            {
              text: 'OK',
            },
          ],
          { cancelable: true }
        );
      } else {
        Alert.alert(
          'Notification Permission Needed',
          'Could not retrieve FCM token because notification permission was denied or not granted yet.'
        );
      }
    } catch (err: any) {
      Alert.alert(
        'FCM Token Retrieval Error',
        err?.message || 'Failed to retrieve FCM token from device.'
      );
    } finally {
      setFetchingFCM(false);
    }
  };

  // Modal State for Adding Medical Record
  const [showAddModal, setShowAddModal] = useState(false);
  const [recordType, setRecordType] = useState<'vaccination' | 'deworming' | 'checkup' | 'medication'>('vaccination');
  const [newTitle, setNewTitle] = useState('');
  const [newVet, setNewVet] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [savingRecord, setSavingRecord] = useState(false);

  // Modal State for Weight Entry
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  const loadData = async () => {
    try {
      const res = await PetService.listPets();
      setPets(res);
      const active = selectedPet ? (res.find((p) => p.id === selectedPet.id) || res[0]) : res[0];
      setSelectedPet(active || null);

      if (active) {
        const [meds, appts, weights] = await Promise.all([
          ClinicalService.listMedicalRecords(active.id).catch(() => []),
          ClinicalService.listAppointments(active.id).catch(() => []),
          ClinicalService.listWeights(active.id).catch(() => []),
        ]);
        setMedicalRecords(meds);
        setAppointments(appts);
        setWeightRecords(weights);
      }
    } catch (err) {
      console.warn('Failed to load profile tab data:', err);
    } finally {
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

  const handleSaveMedicalRecord = async () => {
    if (!selectedPet || !newTitle.trim()) {
      Alert.alert('Required', 'Please enter a title for this clinical record.');
      return;
    }
    setSavingRecord(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await ClinicalService.addMedicalRecord({
        pet: selectedPet.id,
        record_type: recordType,
        title: newTitle.trim(),
        notes: newDesc.trim() || undefined,
        veterinarian: newVet.trim() || undefined,
        administered_at: today,
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewVet('');
      setNewDesc('');
      loadData();
      Alert.alert('Success', 'Clinical record added to patient dossier.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to add clinical record.');
    } finally {
      setSavingRecord(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!selectedPet || !newWeight.trim()) {
      Alert.alert('Required', 'Please enter weight in kg.');
      return;
    }
    const val = parseFloat(newWeight);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid', 'Please enter a valid weight number.');
      return;
    }
    setSavingWeight(true);
    try {
      await ClinicalService.addWeight(selectedPet.id, val, weightNotes.trim() || undefined);
      setShowWeightModal(false);
      setNewWeight('');
      setWeightNotes('');
      loadData();
      Alert.alert('Success', 'Weight entry logged.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to record weight.');
    } finally {
      setSavingWeight(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of Pet Health System?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out Account', style: 'destructive', onPress: logout },
    ]);
  };

  const pet = selectedPet;

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
          <Text style={styles.pageTitle}>Profile</Text>
        </View>
        <View style={styles.iconBadge}>
          <Icon name="profile" size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Multi-Pet Selector Pills if more than 1 */}
      {pets.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petPillRow}>
          {pets.map((p) => {
            const isSel = p.id === selectedPet?.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  setSelectedPet(p);
                  ClinicalService.listMedicalRecords(p.id).then(setMedicalRecords).catch(() => []);
                  ClinicalService.listAppointments(p.id).then(setAppointments).catch(() => []);
                  ClinicalService.listWeights(p.id).then(setWeightRecords).catch(() => []);
                }}
                style={[styles.petSelectorPill, isSel && styles.petSelectorPillActive]}
              >
                <Text style={[styles.petSelectorText, isSel && styles.petSelectorTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Patient Profile Hero Card */}
      <View style={styles.profileHeroCard}>
        <View style={styles.heroTop}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarEmoji}>
              {pet?.species === 'cat' ? '🐱' : pet?.species === 'dog' ? '🐶' : '🐾'}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.patientName}>{pet?.name || 'No Patient'}</Text>
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>● VERIFIED</Text>
              </View>
            </View>
            <Text style={styles.patientBreed}>
              {pet ? `${pet.breed || 'Standard'} • ${pet.species.toUpperCase()}` : 'No patient profiles'}
            </Text>
            <Text style={styles.patientAge}>
              {pet?.sex ? `${pet.sex.toUpperCase()}` : 'Unknown Sex'} • {pet?.is_neutered ? 'Neutered/Spayed' : 'Intact'}
            </Text>
          </View>
        </View>

        {/* Microchip RFID Bar */}
        <View style={styles.microchipBar}>
          <Text style={styles.microchipTag}>MICROCHIP RFID</Text>
          <Text style={styles.microchipVal}>{pet?.microchip_number || 'None registered'}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCol} onPress={() => setShowWeightModal(true)}>
            <Text style={styles.statVal}>{pet?.weight_kg ? `${pet.weight_kg} kg` : '--'}</Text>
            <Text style={styles.statLbl}>Weight (+Log)</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{pet?.date_of_birth || 'Not recorded'}</Text>
            <Text style={styles.statLbl}>Birth Date</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{pet?.breed || 'Standard'}</Text>
            <Text style={styles.statLbl}>Coat Standard</Text>
          </View>
        </View>

        {/* Wearable Collar CTA */}
        <TouchableOpacity
          style={styles.pairCollarBtn}
          onPress={() => pet && onNavigateToScanner && onNavigateToScanner(pet)}
          activeOpacity={0.8}
        >
          <Icon name="devices" size={16} color="#FFFFFF" />
          <Text style={styles.pairCollarText}>Pair Wearable Collar</Text>
        </TouchableOpacity>

        {/* Micro Action Buttons */}
        <View style={styles.microBtnRow}>
          <TouchableOpacity
            style={styles.microBtn}
            onPress={() => pet && onNavigateToInsights && onNavigateToInsights(pet)}
          >
            <Icon name="activity" size={14} color={Colors.primary} />
            <Text style={styles.microBtnText}>Activity Sim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.microBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="plus" size={14} color={Colors.primary} />
            <Text style={styles.microBtnText}>Add Record</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clinical Roadmap (Vaccines & Appointments) */}
      <View style={styles.roadmapHeader}>
        <Text style={styles.roadmapTitle}>Clinical Roadmap & Records</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Text style={styles.roadmapTag}>LOG EVENT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.roadmapCard}>
        {medicalRecords.length === 0 && appointments.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: Colors.textMuted }}>
              No medical records or appointments logged yet.
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.primaryLight, borderRadius: 6 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>
                Add First Vaccination / Record
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {medicalRecords.map((m, idx) => (
              <React.Fragment key={m.id}>
                {idx > 0 && <View style={styles.roadmapDivider} />}
                <View style={styles.roadmapItem}>
                  <View style={[styles.dotCircle, { backgroundColor: m.record_type === 'vaccination' ? Colors.primaryLight : Colors.tertiaryLight }]}>
                    <Icon
                      name={m.record_type === 'vaccination' ? 'syringe' : m.record_type === 'deworming' ? 'pill' : 'file-text'}
                      size={14}
                      color={m.record_type === 'vaccination' ? Colors.primary : Colors.tertiary}
                    />
                  </View>
                  <View style={styles.roadmapContent}>
                    <Text style={styles.itemTitle}>{m.title}</Text>
                    <Text style={styles.itemSub}>
                      {m.record_type.toUpperCase()} • {m.veterinarian || 'Clinical Staff'}
                    </Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {m.administered_at ? new Date(m.administered_at).toLocaleDateString() : 'Logged'}
                  </Text>
                </View>
              </React.Fragment>
            ))}

            {appointments.map((a, idx) => (
              <React.Fragment key={a.id}>
                {(idx > 0 || medicalRecords.length > 0) && <View style={styles.roadmapDivider} />}
                <View style={styles.roadmapItem}>
                  <View style={[styles.dotCircle, { backgroundColor: '#F0F4FF' }]}>
                    <Icon name="clock" size={14} color={Colors.accentBlue} />
                  </View>
                  <View style={styles.roadmapContent}>
                    <Text style={styles.itemTitle}>{a.title || a.reason}</Text>
                    <Text style={styles.itemSub}>{a.clinic_name || 'Clinic'} • {a.veterinarian || 'Vet'}</Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {new Date(a.appointment_date).toLocaleDateString()}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </>
        )}
      </View>

      {/* Weight History Section */}
      {weightRecords.length > 0 && (
        <>
          <View style={styles.roadmapHeader}>
            <Text style={styles.roadmapTitle}>Weight Progress History</Text>
            <TouchableOpacity onPress={() => setShowWeightModal(true)}>
              <Text style={styles.roadmapTag}>+ LOG WEIGHT</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.roadmapCard}>
            {weightRecords.slice(0, 5).map((w, idx) => (
              <React.Fragment key={w.id}>
                {idx > 0 && <View style={styles.roadmapDivider} />}
                <View style={styles.roadmapItem}>
                  <View style={[styles.dotCircle, { backgroundColor: '#F3F4F6' }]}>
                    <Icon name="scale" size={14} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.roadmapContent}>
                    <Text style={styles.itemTitle}>{w.weight_kg} kg</Text>
                    <Text style={styles.itemSub}>{w.notes || 'Routine weigh-in'}</Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {new Date(w.recorded_at).toLocaleDateString()}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </>
      )}

      {/* Add Clinical Record Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Clinical Record</Text>
            <Text style={styles.modalSub}>Log vaccination, deworming, or checkup for {selectedPet?.name}</Text>

            <View style={styles.recordTypeRow}>
              {(['vaccination', 'deworming', 'checkup', 'medication'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setRecordType(t)}
                  style={[styles.typePill, recordType === t && styles.typePillActive]}
                >
                  <Text style={[styles.typePillText, recordType === t && styles.typePillTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Record Title (e.g. Rabies Booster)"
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Veterinarian / Clinic Name"
              placeholderTextColor={Colors.textMuted}
              value={newVet}
              onChangeText={setNewVet}
            />

            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              placeholder="Notes, Batch/Lot number..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={newDesc}
              onChangeText={setNewDesc}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleSaveMedicalRecord}
                disabled={savingRecord}
              >
                <Text style={styles.confirmBtnText}>
                  {savingRecord ? 'Saving...' : 'Save Record'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Weight Modal */}
      <Modal visible={showWeightModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Weight Record</Text>
            <Text style={styles.modalSub}>Update {selectedPet?.name}'s weight entry (kg)</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Weight in kg (e.g. 14.5)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Notes (optional, e.g. Post-exercise, veterinary clinic)"
              placeholderTextColor={Colors.textMuted}
              value={weightNotes}
              onChangeText={setWeightNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowWeightModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleSaveWeight}
                disabled={savingWeight}
              >
                <Text style={styles.confirmBtnText}>
                  {savingWeight ? 'Saving...' : 'Record Weight'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Owner Account Section */}
      <View style={styles.ownerHeader}>
        <Text style={styles.ownerTitle}>Owner Account</Text>
      </View>

      <View style={styles.ownerCard}>
        <View style={styles.ownerRow}>
          <View style={styles.ownerAvatarBadge}>
            <Text style={styles.ownerInitial}>
              {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'Owner'}
            </Text>
            <Text style={styles.ownerEmail}>{user?.email || 'No email registered'}</Text>
          </View>
        </View>
      </View>

      {/* Development Diagnostics (Dev builds only) */}
      {__DEV__ && (
        <>
          <Text style={styles.settingsSectionTitle}>DEVELOPMENT & DIAGNOSTICS</Text>
          <View style={styles.settingsGroup}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleInspectFCMToken}
              disabled={fetchingFCM}
            >
              <View>
                <Text style={styles.settingLbl}>View FCM Device Token</Text>
                <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: '700', marginTop: 2 }}>
                  DEV ONLY • PUSH REGISTRATION
                </Text>
              </View>
              <Text style={styles.settingVal}>
                {fetchingFCM ? 'Reading...' : 'Inspect ›'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Sign Out Action */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.signOutText}>Sign Out Account</Text>
      </TouchableOpacity>

      <View style={styles.appFooter}>
        <Text style={styles.footerVersion}>Pet Health System v1.0 (Build 2026.10)</Text>
        <Text style={styles.footerTech}>React Native CLI + Android Target 34</Text>
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
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EFE3D3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  heroInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  activeTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
  },
  patientBreed: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  patientAge: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  microchipBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 10,
  },
  microchipTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  microchipVal: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingVertical: 10,
    marginTop: 10,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  statLbl: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  pairCollarBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  pairCollarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  microBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  microBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 3,
  },
  microBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  roadmapTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  roadmapTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  roadmapCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  roadmapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dotCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  roadmapContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  itemSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  itemDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dueBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  roadmapDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 54,
  },
  ownerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  ownerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  ownerTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  ownerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: Spacing.md,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  ownerInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  ownerEmail: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  settingsSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginTop: 6,
    marginBottom: Spacing.xs,
  },
  settingsGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  settingLbl: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  settingVal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  signOutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: Spacing.md,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
  },
  appFooter: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  footerTech: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  petPillRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  petSelectorPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  petSelectorPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  petSelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  petSelectorTextActive: {
    color: '#FFFFFF',
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
  recordTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
    gap: 6,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  typePillTextActive: {
    color: '#FFFFFF',
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
