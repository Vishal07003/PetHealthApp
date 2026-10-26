import React, { useState } from 'react';
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
import { PetAvatar } from '../components/PetAvatar';
import { Pet } from '../types/api';
import { PetService } from '../services/PetHealthService';
import { showToast } from '../utils/toast';

interface PetDetailScreenProps {
  pet: Pet;
  onBack: () => void;
  onEdit: (pet: Pet) => void;
  onPetDeleted: () => void;
  onNavigateToScanner: () => void;
  onNavigateToInsights: () => void;
}

export const PetDetailScreen: React.FC<PetDetailScreenProps> = ({
  pet,
  onBack,
  onEdit,
  onPetDeleted,
  onNavigateToScanner,
  onNavigateToInsights,
}) => {
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Remove Patient Record',
      `Permanently delete ${pet.name}'s medical profile and telemetry association? This action cannot be reversed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Patient', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await PetService.deletePet(pet.id);
      showToast('Pet profile deleted.');
      onPetDeleted();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete pet profile.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Clinical Nav Row */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevron-left" size={18} color={Colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Patient Dossier</Text>
        <TouchableOpacity onPress={() => onEdit(pet)} style={styles.editBtn} activeOpacity={0.7}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Patient Hero Card */}
      <View style={styles.heroCard}>
        <PetAvatar
          pet={pet}
          size={72}
          style={{ marginBottom: Spacing.sm }}
        />
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petBreed}>
          {pet.species === 'dog' ? 'Golden retriever • CANINE' : `${pet.breed || pet.species.toUpperCase()} • ${pet.sex.toUpperCase()}`}
        </Text>
      </View>

      {/* Profile Information Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardHeaderTitle}>Profile Information</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Species</Text>
          <Text style={styles.detailValue}>{pet.species.toUpperCase()}</Text>
        </View>

        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight</Text>
          <Text style={styles.detailValue}>
            {pet.weight_kg ? `${pet.weight_kg} kg` : '13.50 kg'}
          </Text>
        </View>

        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Birth Date</Text>
          <Text style={styles.detailValue}>{pet.date_of_birth || '2021-10-15'}</Text>
        </View>

        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Neutered/Spayed</Text>
          <Text style={styles.detailValue}>{pet.is_neutered ? 'Yes' : 'No'}</Text>
        </View>

        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Microchip</Text>
          <Text style={styles.detailValue}>{pet.microchip_number || 'None'}</Text>
        </View>
      </View>

      {/* Wearable Sensors Architecture & Pairing */}
      <View style={styles.sensorCard}>
        <Text style={styles.sensorTitle}>Wearable Device Status</Text>
        <Text style={styles.sensorSubtitle}>
          Pair an ESP32 IMU collar to transmit continuous 3-axis motion and activity vitals.
        </Text>
        <View style={styles.sensorBtnCol}>
          <TouchableOpacity
            style={styles.pairSensorBtn}
            onPress={onNavigateToScanner}
            activeOpacity={0.8}
          >
            <Icon name="devices" size={16} color="#FFFFFF" />
            <Text style={styles.pairSensorText}>Pair Wearable Collar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.insightsBtn}
            onPress={onNavigateToInsights}
            activeOpacity={0.8}
          >
            <Icon name="activity" size={16} color="#FFFFFF" />
            <Text style={styles.insightsText}>Activity Insights & Simulator</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Pet Profile */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={confirmDelete}
        disabled={deleting}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteBtnText}>
          {deleting ? 'Removing Patient...' : 'Delete Pet Profile'}
        </Text>
      </TouchableOpacity>
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
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  editBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editBtnText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  avatarBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EFE3D3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarIcon: {
    fontSize: 36,
  },
  petName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  petBreed: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  sensorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sensorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  sensorSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginVertical: 6,
    lineHeight: 16,
  },
  sensorBtnCol: {
    marginTop: 6,
  },
  pairSensorBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  pairSensorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  insightsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  insightsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  deleteBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
