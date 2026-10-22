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
import { Pet } from '../types/api';
import { PetService } from '../services/PetHealthService';

interface PetDetailScreenProps {
  pet: Pet;
  onBack: () => void;
  onEdit: (pet: Pet) => void;
  onPetDeleted: (id: string) => void;
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
      'Delete Pet Profile',
      `Are you sure you want to delete ${pet.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
      ]
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await PetService.deletePet(pet.id);
      onPetDeleted(pet.id);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to delete pet profile.');
    } finally {
      setDeleting(false);
    }
  };

  const icon = pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEdit(pet)} style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Pet Card */}
      <View style={styles.heroCard}>
        <View style={styles.petIconCircle}>
          <Text style={styles.petIcon}>{icon}</Text>
        </View>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petBreed}>
          {pet.breed || pet.species.toUpperCase()} • {pet.sex.toUpperCase()}
        </Text>
      </View>

      {/* Details Grid */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardHeaderTitle}>Profile Information</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Species</Text>
          <Text style={styles.detailValue}>{pet.species.toUpperCase()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight</Text>
          <Text style={styles.detailValue}>
            {pet.weight_kg ? `${pet.weight_kg} kg` : 'Not recorded'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Birth Date</Text>
          <Text style={styles.detailValue}>{pet.date_of_birth || 'Not specified'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Neutered/Spayed</Text>
          <Text style={styles.detailValue}>{pet.is_neutered ? 'Yes' : 'No'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Microchip</Text>
          <Text style={styles.detailValue}>{pet.microchip_number || 'None'}</Text>
        </View>

        {!!pet.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.notesText}>{pet.notes}</Text>
          </View>
        )}
      </View>

      {/* Wearable Sensors Architecture & Pairing */}
      <View style={styles.sensorCard}>
        <Text style={styles.sensorTitle}>Wearable Device Status</Text>
        <Text style={styles.sensorSubtitle}>
          Pair an ESP32 IMU collar to transmit continuous 3-axis motion and activity vitals.
        </Text>
        <View style={styles.sensorBtnRow}>
          <Button
            title="Pair Wearable Collar"
            onPress={onNavigateToScanner}
            style={styles.pairSensorBtn}
          />
          <Button
            title="Activity Insights & Simulator"
            variant="secondary"
            onPress={onNavigateToInsights}
            style={styles.insightsBtn}
          />
        </View>
      </View>

      {/* Delete Pet Button */}
      <Button
        title="Delete Pet Profile"
        variant="danger"
        loading={deleting}
        onPress={confirmDelete}
        style={styles.deleteBtn}
      />
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
  editBtn: {
    padding: 8,
  },
  editBtnText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  petIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  petIcon: {
    fontSize: 44,
  },
  petName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  petBreed: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  notesBox: {
    marginTop: Spacing.md,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
    lineHeight: 20,
  },
  sensorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sensorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  sensorSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  sensorBtnRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 14,
  },
  pairSensorBtn: {
    height: 44,
  },
  insightsBtn: {
    height: 44,
  },
  deleteBtn: {
    marginTop: Spacing.sm,
  },
});
