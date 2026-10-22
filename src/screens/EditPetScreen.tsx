import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { KeyboardAwareContainer } from '../components/KeyboardAwareContainer';
import { PetService } from '../services/PetHealthService';
import { Pet, PetSpecies, PetSex } from '../types/api';

interface EditPetScreenProps {
  pet: Pet;
  onBack: () => void;
  onPetUpdated: (updatedPet: Pet) => void;
}

export const EditPetScreen: React.FC<EditPetScreenProps> = ({
  pet,
  onBack,
  onPetUpdated,
}) => {
  const [name, setName] = useState(pet.name);
  const [species, setSpecies] = useState<PetSpecies>(pet.species);
  const [breed, setBreed] = useState(pet.breed || '');
  const [sex, setSex] = useState<PetSex>(pet.sex);
  const [dateOfBirth, setDateOfBirth] = useState(pet.date_of_birth || '');
  const [weightKg, setWeightKg] = useState(pet.weight_kg ? String(pet.weight_kg) : '');
  const [isNeutered, setIsNeutered] = useState(pet.is_neutered);
  const [microchipNumber, setMicrochipNumber] = useState(pet.microchip_number || '');
  const [notes, setNotes] = useState(pet.notes || '');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Pet name is required';

    if (weightKg) {
      const parsedWeight = parseFloat(weightKg);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        errs.weight_kg = 'Weight must be greater than 0 kg';
      } else if (parsedWeight > 200) {
        errs.weight_kg = 'Weight cannot exceed 200 kg';
      }
    }

    if (dateOfBirth) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        errs.date_of_birth = 'Format must be YYYY-MM-DD';
      } else {
        const d = new Date(dateOfBirth);
        if (d > new Date()) {
          errs.date_of_birth = 'Date of birth cannot be in the future';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const updated = await PetService.updatePet(pet.id, {
        name: name.trim(),
        species,
        breed: breed.trim(),
        sex,
        date_of_birth: dateOfBirth ? dateOfBirth.trim() : null,
        weight_kg: weightKg ? parseFloat(weightKg).toFixed(2) : null,
        is_neutered: isNeutered,
        microchip_number: microchipNumber.trim(),
        notes: notes.trim(),
      });
      onPetUpdated(updated);
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData && typeof respData === 'object') {
        const fieldErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(respData)) {
          fieldErrors[key] = Array.isArray(value) ? value.join(' ') : String(value);
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Failed to update pet profile.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareContainer contentContainerStyle={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Cancel</Text>
        </TouchableOpacity>
        <Text style={Typography.titleMedium}>Edit Pet</Text>
        <View style={{ width: 60 }} />
      </View>

      {!!errors.general && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}

      <View style={styles.formCard}>
        <Input
          label="Pet Name *"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <Text style={styles.sectionLabel}>Species *</Text>
        <View style={styles.pillRow}>
          {(['dog', 'cat', 'other'] as PetSpecies[]).map((sp) => (
            <TouchableOpacity
              key={sp}
              style={[styles.pill, species === sp && styles.pillActive]}
              onPress={() => setSpecies(sp)}
            >
              <Text style={[styles.pillText, species === sp && styles.pillTextActive]}>
                {sp === 'dog' ? 'Dog' : sp === 'cat' ? 'Cat' : 'Other'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Sex</Text>
        <View style={styles.pillRow}>
          {(['male', 'female', 'unknown'] as PetSex[]).map((sx) => (
            <TouchableOpacity
              key={sx}
              style={[styles.pill, sex === sx && styles.pillActive]}
              onPress={() => setSex(sx)}
            >
              <Text style={[styles.pillText, sex === sx && styles.pillTextActive]}>
                {sx.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Breed"
          value={breed}
          onChangeText={setBreed}
          error={errors.breed}
        />

        <Input
          label="Weight (kg)"
          keyboardType="decimal-pad"
          value={weightKg}
          onChangeText={setWeightKg}
          error={errors.weight_kg}
        />

        <Input
          label="Date of Birth"
          placeholder="YYYY-MM-DD"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          error={errors.date_of_birth}
        />

        <Input
          label="Microchip Number"
          value={microchipNumber}
          onChangeText={setMicrochipNumber}
          error={errors.microchip_number}
        />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>Neutered / Spayed</Text>
            <Text style={styles.switchSubtitle}>Pet reproductive status</Text>
          </View>
          <Switch
            value={isNeutered}
            onValueChange={setIsNeutered}
            trackColor={{ false: Colors.border, true: Colors.primary }}
          />
        </View>

        <Input
          label="Notes"
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
          value={notes}
          onChangeText={setNotes}
          error={errors.notes}
        />

        <Button
          title="Save Changes"
          onPress={handleUpdate}
          loading={loading}
          style={styles.saveBtn}
        />
      </View>
    </KeyboardAwareContainer>
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
    marginBottom: Spacing.md,
    paddingTop: 0,
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  switchSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  saveBtn: {
    marginTop: Spacing.lg,
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
  },
});
