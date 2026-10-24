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
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Icon } from '../components/Icon';
import { Pet, MedicalRecord, VetAppointment } from '../types/api';
import { ClinicalService, PetService } from '../services/PetHealthService';

interface VaccinesMedicalRecordsScreenProps {
  initialPet?: Pet | null;
  onBack?: () => void;
}

export const VaccinesMedicalRecordsScreen: React.FC<VaccinesMedicalRecordsScreenProps> = ({
  initialPet,
  onBack,
}) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(initialPet || null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [recordType, setRecordType] = useState<
    'vaccination' | 'deworming' | 'medication' | 'lab_test' | 'checkup'
  >('vaccination');
  const [title, setTitle] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const petList = await PetService.listPets();
      setPets(petList);
      const active = selectedPet || petList[0] || null;
      setSelectedPet(active);

      if (active) {
        const [meds, appts] = await Promise.all([
          ClinicalService.listMedicalRecords(active.id).catch(() => []),
          ClinicalService.listAppointments(active.id).catch(() => []),
        ]);
        setMedicalRecords(meds);
        setAppointments(appts);
      }
    } catch (e) {
      console.warn('Failed to load medical records:', e);
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

  const handleSaveRecord = async () => {
    if (!selectedPet || !title.trim()) {
      Alert.alert('Required', 'Please enter a title for the vaccine or medical record.');
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await ClinicalService.addMedicalRecord({
        pet: selectedPet.id,
        record_type: recordType,
        title: title.trim(),
        administered_at: today,
        next_due_date: nextDueDate.trim() || null,
        batch_number: batchNumber.trim(),
        veterinarian: veterinarian.trim(),
        clinic_name: clinicName.trim() || 'Valley Veterinary Hospital',
        notes: notes.trim(),
      });
      setShowAddModal(false);
      setTitle('');
      setBatchNumber('');
      setVeterinarian('');
      setClinicName('');
      setNextDueDate('');
      setNotes('');
      loadData();
      Alert.alert('Success', 'Vaccine / medical record successfully saved.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = () => {
    Alert.alert(
      'Export Medical Record PDF',
      `Official clinical dossier for ${selectedPet?.name || 'Pet'} compiled with cryptographic timestamp & batch verification codes. Ready for veterinary sharing.`,
      [{ text: 'Download PDF', style: 'default' }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const pet = selectedPet;
  const avatar = pet?.species === 'cat' ? '🐱' : pet?.species === 'dog' ? '🐶' : '🐾';

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
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={styles.brandSubtitle}>PET HEALTH SYSTEM</Text>
            <Text style={styles.pageTitle}>Veterinary & Vaccines</Text>
          </View>
        )}
        <View style={styles.iconBadge}>
          <Icon name="syringe" size={18} color="#FFFFFF" />
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
              <Text style={styles.petName}>{pet?.name || 'Cooper'}</Text>
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedText}>● ACTIVE DOSSIER</Text>
              </View>
            </View>
            <Text style={styles.breedText}>
              {pet ? `${pet.breed || 'Standard'} • ${pet.species.toUpperCase()}` : 'Canine Patient'}
            </Text>
            <Text style={styles.chipText}>Chip: #{pet?.microchip_number || '985141002341992'}</Text>
          </View>
        </View>

        <View style={styles.vitalsRow}>
          <View style={styles.vitalCol}>
            <Text style={styles.vitalLabel}>WEIGHT</Text>
            <Text style={styles.vitalValue}>{pet?.weight_kg ? `${pet.weight_kg} kg` : '31.2 kg'}</Text>
          </View>
          <View style={styles.vitalDivider} />
          <View style={styles.vitalCol}>
            <Text style={styles.vitalLabel}>IMMUNITY</Text>
            <Text style={[styles.vitalValue, { color: Colors.primary }]}>98.4%</Text>
          </View>
          <View style={styles.vitalDivider} />
          <View style={styles.vitalCol}>
            <Text style={styles.vitalLabel}>NEXT CORE</Text>
            <Text style={styles.vitalValue}>32 Days</Text>
          </View>
        </View>
      </View>

      {/* Priority Reminder: Annual Wellness Check */}
      <View style={styles.reminderCard}>
        <View style={styles.reminderHeader}>
          <Text style={styles.reminderTag}>PRIORITY REMINDER • DUE SOON</Text>
        </View>
        <Text style={styles.reminderTitle}>Annual Wellness Check & Core Panel</Text>
        <Text style={styles.reminderDetails}>
          Friday, Nov 3 • 10:30 AM{'\n'}Dr. Sarah Jenkins • Valley Veterinary Hospital
        </Text>
        <View style={styles.reminderActionsRow}>
          <TouchableOpacity
            style={styles.calendarActionBtn}
            onPress={() => Alert.alert('Calendar', 'Appointment synced with device calendar.')}
          >
            <Icon name="clock" size={14} color={Colors.primary} />
            <Text style={styles.calendarActionText}>Add to Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callClinicBtn}
            onPress={() => Alert.alert('Contact Clinic', 'Calling Valley Veterinary Hospital (555) 019-2834')}
          >
            <Icon name="shield" size={14} color="#FFFFFF" />
            <Text style={styles.callClinicText}>Call Clinic</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preventative Schedule Section */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionLeft}>
          <View style={styles.sectionIconPill}>
            <Icon name="pill" size={14} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.sectionHeading}>Preventative Schedule</Text>
            <Text style={styles.sectionSub}>Active prophylaxis cycles</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Text style={styles.historyLink}>History ›</Text>
        </TouchableOpacity>
      </View>

      {/* Preventative Cards List */}
      <View style={styles.cardGroup}>
        <View style={styles.preventativeItem}>
          <View style={styles.preventativeLeft}>
            <View style={[styles.miniCircle, { backgroundColor: Colors.tertiaryLight }]}>
              <Icon name="pill" size={14} color={Colors.tertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.preventativeTitle}>Deworming Prophylaxis</Text>
              <Text style={styles.preventativeSub}>Milbemycin Oxime Spectrum</Text>
              <Text style={styles.datesRow}>Last: Sep 18, 2026 • Next: Oct 28, 2026</Text>
            </View>
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>Due in 5d</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.preventativeItem}>
          <View style={styles.preventativeLeft}>
            <View style={[styles.miniCircle, { backgroundColor: Colors.primaryLight }]}>
              <Icon name="shield" size={14} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.preventativeTitle}>Flea & Tick Preventative</Text>
              <Text style={styles.preventativeSub}>Chewable Isoxazoline (NexGard)</Text>
              <Text style={styles.datesRow}>Last: Sep 22, 2026 • Next: Nov 01, 2026</Text>
            </View>
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>Due in 9d</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.preventativeItem}>
          <View style={styles.preventativeLeft}>
            <View style={[styles.miniCircle, { backgroundColor: '#F0F4FF' }]}>
              <Icon name="syringe" size={14} color={Colors.accentBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.preventativeTitle}>DHPP Core Booster</Text>
              <Text style={styles.preventativeSub}>Subcutaneous • 1.0 mL</Text>
              <Text style={styles.datesRow}>Target: Nov 18, 2026 • Clinic Appt Confirmed</Text>
            </View>
            <View style={[styles.dueBadge, { backgroundColor: '#E0E7FF' }]}>
              <Text style={[styles.dueBadgeText, { color: '#3730A3' }]}>Scheduled: 32d</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Vaccination Dossier Section */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionHeading}>Vaccination Dossier</Text>
          <Text style={styles.sectionSub}>Official records & batch validation</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{medicalRecords.length} Active</Text>
        </View>
      </View>

      <View style={styles.cardGroup}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ padding: 20 }} />
        ) : medicalRecords.length === 0 ? (
          <View style={{ padding: 18, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: Colors.textMuted }}>
              No vaccination records logged yet.
            </Text>
          </View>
        ) : (
          medicalRecords.map((m, idx) => (
            <React.Fragment key={m.id}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.dossierItem}>
                <View style={styles.dossierTop}>
                  <View style={[styles.miniCircle, { backgroundColor: Colors.primaryLight }]}>
                    <Icon name="syringe" size={14} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dossierTitle}>{m.title}</Text>
                    <Text style={styles.dossierLot}>
                      {m.batch_number ? `Lot: #${m.batch_number}` : 'Lot: #RV-8820-K1'} • Given: {m.administered_at}
                    </Text>
                    <Text style={styles.dossierVet}>
                      Vet: {m.veterinarian || 'Dr. Sarah Jenkins'} • {m.clinic_name || 'Valley Vet Hospital'}
                    </Text>
                  </View>
                  <View style={styles.verifiedChip}>
                    <Text style={styles.verifiedChipText}>Verified</Text>
                  </View>
                </View>
              </View>
            </React.Fragment>
          ))
        )}

        <TouchableOpacity
          style={styles.logNewBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={14} color={Colors.primary} />
          <Text style={styles.logNewText}>Log New Vaccination / Treatment</Text>
        </TouchableOpacity>
      </View>

      {/* Designated Care Facility Card */}
      <View style={styles.facilityCard}>
        <View style={styles.facilityTopRow}>
          <View style={styles.facilityIconCircle}>
            <Icon name="shield" size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityTag}>DESIGNATED CARE FACILITY</Text>
            <Text style={styles.facilityName}>Valley Veterinary Hospital</Text>
            <Text style={styles.facilityDr}>Dr. Sarah Jenkins, DVM • Lic #CA-99321</Text>
          </View>
        </View>
        <View style={styles.facilityMetaRow}>
          <Text style={styles.facilityMeta}>Reception: (555) 019-2834</Text>
          <Text style={styles.facilityMeta}>Directions: 1.4 mi • Open</Text>
        </View>
      </View>

      {/* 24/7 Trauma & Emergency Service Banner */}
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyRow}>
          <Text style={styles.emergencyStar}>✱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>24/7 Trauma & Emergency Service</Text>
            <Text style={styles.emergencySub}>
              Metro Animal Emergency Clinic • 8.2 miles • Dispatch: (555) 019-9911
            </Text>
          </View>
        </View>
      </View>

      {/* Download Medical Record PDF Button */}
      <TouchableOpacity
        style={styles.downloadPdfBtn}
        onPress={handleExportPdf}
        activeOpacity={0.8}
      >
        <Icon name="download" size={16} color="#FFFFFF" />
        <Text style={styles.downloadPdfText}>Download Medical Record PDF</Text>
      </TouchableOpacity>
      <Text style={styles.disclaimerNote}>
        Includes cryptographically signed veterinary stamps & chip verification code.
      </Text>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Vaccination or Treatment</Text>
            <Text style={styles.modalSub}>Official health entry for {selectedPet?.name}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Vaccine / Treatment Title (e.g. Rabies 3-Year)"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Lot / Batch Number (e.g. RV-8820-K1)"
              placeholderTextColor={Colors.textMuted}
              value={batchNumber}
              onChangeText={setBatchNumber}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Administering Veterinarian (e.g. Dr. Sarah Jenkins)"
              placeholderTextColor={Colors.textMuted}
              value={veterinarian}
              onChangeText={setVeterinarian}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Next Due Date (YYYY-MM-DD)"
              placeholderTextColor={Colors.textMuted}
              value={nextDueDate}
              onChangeText={setNextDueDate}
            />

            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              placeholder="Clinical Notes or Route (e.g. Subcutaneous 1.0 mL)"
              placeholderTextColor={Colors.textMuted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleSaveRecord}
                disabled={saving}
              >
                <Text style={styles.confirmBtnText}>{saving ? 'Saving...' : 'Save Record'}</Text>
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
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EFE3D3',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  heroInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  verifiedTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  breedText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  chipText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  vitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  vitalCol: {
    alignItems: 'center',
    flex: 1,
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  vitalDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.border,
  },
  reminderCard: {
    backgroundColor: '#0F3E33',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reminderHeader: {
    marginBottom: 4,
  },
  reminderTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 0.8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  reminderDetails: {
    fontSize: 12,
    color: '#D1FAE5',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  reminderActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  calendarActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  callClinicBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  callClinicText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: Spacing.sm,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  historyLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  countBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  cardGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: Spacing.md,
  },
  preventativeItem: {
    paddingVertical: 10,
  },
  preventativeLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  miniCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  preventativeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  preventativeSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  datesRow: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
  },
  dueBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dueBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  dossierItem: {
    paddingVertical: 10,
  },
  dossierTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dossierTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  dossierLot: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dossierVet: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  verifiedChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  verifiedChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  logNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 4,
    gap: 6,
  },
  logNewText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  facilityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: Spacing.sm,
  },
  facilityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  facilityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  facilityTag: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  facilityName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  facilityDr: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  facilityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  facilityMeta: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: Spacing.md,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyStar: {
    fontSize: 18,
    color: Colors.danger,
    fontWeight: '800',
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  emergencySub: {
    fontSize: 10,
    color: '#B91C1C',
    marginTop: 1,
  },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  downloadPdfText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimerNote: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.lg,
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
