import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { KeyboardAwareContainer } from '../components/KeyboardAwareContainer';
import { useAuth } from '../context/AuthContext';
import { PetService } from '../services/PetHealthService';
import { Pet } from '../types/api';

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

  useEffect(() => {
    PetService.listPets()
      .then((res) => {
        setPets(res);
        if (res.length > 0) setSelectedPet(res[0]);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of Pet Health System?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out Account', style: 'destructive', onPress: logout },
    ]);
  };

  const pet = selectedPet;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
              <Text style={styles.patientName}>{pet?.name || 'Cooper'}</Text>
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>● ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.patientBreed}>
              {pet?.species === 'dog' ? 'Golden Retriever • Canine' : 'Feline • Domestic'}
            </Text>
            <Text style={styles.patientAge}>3 yrs 4 mos • Male (Neutered)</Text>
          </View>
        </View>

        {/* Microchip RFID Bar */}
        <View style={styles.microchipBar}>
          <Text style={styles.microchipTag}>MICROCHIP RFID</Text>
          <Text style={styles.microchipVal}>{pet?.microchip_number || '985141002341992'}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{pet?.weight_kg ? `${pet.weight_kg} kg` : '28.5 kg'}</Text>
            <Text style={styles.statLbl}>Weight</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{pet?.date_of_birth || 'Nov 12 2021'}</Text>
            <Text style={styles.statLbl}>Birth Date</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{pet?.breed || 'Golden'}</Text>
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
            onPress={() => Alert.alert('Edit Dossier', 'Update pet vital statistics.')}
          >
            <Icon name="file-text" size={14} color={Colors.primary} />
            <Text style={styles.microBtnText}>Edit Dossier</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clinical Roadmap (Vaccines & Appointments) */}
      <View style={styles.roadmapHeader}>
        <Text style={styles.roadmapTitle}>Clinical Roadmap</Text>
        <Text style={styles.roadmapTag}>UP TO DATE</Text>
      </View>

      <View style={styles.roadmapCard}>
        <View style={styles.roadmapItem}>
          <View style={[styles.dotCircle, { backgroundColor: Colors.primaryLight }]}>
            <Icon name="syringe" size={14} color={Colors.primary} />
          </View>
          <View style={styles.roadmapContent}>
            <Text style={styles.itemTitle}>Rabies Core Vaccine</Text>
            <Text style={styles.itemSub}>Lot #RV-8820 • Annual booster</Text>
          </View>
          <Text style={styles.itemDate}>Nov 18 2026</Text>
        </View>

        <View style={styles.roadmapDivider} />

        <View style={styles.roadmapItem}>
          <View style={[styles.dotCircle, { backgroundColor: Colors.tertiaryLight }]}>
            <Icon name="pill" size={14} color={Colors.tertiary} />
          </View>
          <View style={styles.roadmapContent}>
            <Text style={styles.itemTitle}>Deworming Treatment</Text>
            <Text style={styles.itemSub}>Milbemycin broad spectrum</Text>
          </View>
          <View style={styles.dueBadge}>
            <Text style={styles.dueBadgeText}>Due in 14d</Text>
          </View>
        </View>

        <View style={styles.roadmapDivider} />

        <View style={styles.roadmapItem}>
          <View style={[styles.dotCircle, { backgroundColor: '#F0F4FF' }]}>
            <Icon name="clock" size={14} color={Colors.accentBlue} />
          </View>
          <View style={styles.roadmapContent}>
            <Text style={styles.itemTitle}>Annual Wellness Check</Text>
            <Text style={styles.itemSub}>Dr. Sarah Jenkins • Valley Veterinary</Text>
          </View>
          <Text style={styles.itemDate}>Dec 2 10:30 AM</Text>
        </View>
      </View>

      {/* Owner Account Section */}
      <View style={styles.ownerHeader}>
        <Text style={styles.ownerTitle}>Owner Account</Text>
        <Text style={styles.ownerTag}>STAFF / CL-1218</Text>
      </View>

      <View style={styles.ownerCard}>
        <View style={styles.ownerRow}>
          <View style={styles.ownerAvatarBadge}>
            <Text style={styles.ownerInitial}>NT</Text>
          </View>
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'NERD-TECH Veterinary Admin'}
            </Text>
            <Text style={styles.ownerEmail}>{user?.email || 'admin@nerd-tech.local'}</Text>
          </View>
          <Icon name="chevron-right" size={16} color={Colors.textMuted} />
        </View>
      </View>

      {/* Application Preferences & Settings */}
      <Text style={styles.settingsSectionTitle}>APPLICATION PREFERENCES</Text>
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <Text style={styles.settingLbl}>Push Notifications</Text>
          <Text style={styles.settingVal}>Enabled</Text>
        </View>
        <View style={styles.roadmapDivider} />
        <View style={styles.settingItem}>
          <Text style={styles.settingLbl}>Biometric Unlock</Text>
          <Text style={styles.settingVal}>Active</Text>
        </View>
        <View style={styles.roadmapDivider} />
        <View style={styles.settingItem}>
          <Text style={styles.settingLbl}>Theme</Text>
          <Text style={styles.settingVal}>System Light</Text>
        </View>
      </View>

      {/* Telemetry & Diagnostics */}
      <Text style={styles.settingsSectionTitle}>TELEMETRY & DIAGNOSTICS</Text>
      <View style={styles.settingsGroup}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => Alert.alert('Export CSV', 'Raw accelerometer CSV ready for download.')}
        >
          <Text style={styles.settingLbl}>Export Telemetry Data (CSV)</Text>
          <Icon name="chevron-right" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.roadmapDivider} />
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => Alert.alert('Cache Cleared', 'Local telemetry cache reset.')}
        >
          <Text style={styles.settingLbl}>Clear Local Cache</Text>
          <Text style={styles.settingVal}>48.2 MB</Text>
        </TouchableOpacity>
      </View>

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
});
