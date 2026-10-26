import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { KeyboardAwareContainer } from '../components/KeyboardAwareContainer';
import { PetService } from '../services/PetHealthService';
import { Pet, PetSpecies, PetSex } from '../types/api';
import { PetAvatarPicker } from '../components/PetAvatarPicker';
import { Asset } from 'react-native-image-picker';

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
  const [photoAsset, setPhotoAsset] = useState<Asset | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [avatarId, setAvatarId] = useState<string | null>(pet.avatar_id || null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty =
    name !== pet.name ||
    species !== pet.species ||
    breed !== (pet.breed || '') ||
    sex !== pet.sex ||
    dateOfBirth !== (pet.date_of_birth || '') ||
    weightKg !== (pet.weight_kg ? String(pet.weight_kg) : '') ||
    isNeutered !== pet.is_neutered ||
    microchipNumber !== (pet.microchip_number || '') ||
    notes !== (pet.notes || '') ||
    photoAsset !== null ||
    photoRemoved ||
    avatarId !== (pet.avatar_id || null);

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes in this pet profile. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onBack },
        ]
      );
    } else {
      onBack();
    }
  };

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
      const updatePayload: any = {
        name: name.trim(),
        species,
        breed: breed.trim(),
        sex,
        date_of_birth: dateOfBirth ? dateOfBirth.trim() : null,
        weight_kg: weightKg ? parseFloat(weightKg).toFixed(2) : null,
        is_neutered: isNeutered,
        microchip_number: microchipNumber.trim(),
        avatar_id: avatarId || null,
        notes: notes.trim(),
      };

      if (photoAsset) {
        updatePayload.photo = photoAsset;
      } else if (photoRemoved) {
        updatePayload.photo = null;
      }

      const updated = await PetService.updatePet(pet.id, updatePayload);
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

  const currentPhotoUri = photoRemoved
    ? null
    : photoAsset
    ? photoAsset.uri
    : pet.photo;

  return (
    <KeyboardAwareContainer contentContainerStyle={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={handleCancel} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevron-left" size={18} color={Colors.primary} />
          <Text style={styles.backBtnText}>Cancel</Text>
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
        {/* Photo Upload & Built-in Avatar Selection */}
        <PetAvatarPicker
          photoUri={currentPhotoUri}
          avatarId={avatarId}
          species={species}
          onPhotoSelected={(asset) => {
            setPhotoAsset(asset);
            setPhotoRemoved(!asset && !currentPhotoUri);
          }}
          onAvatarSelected={(id) => {
            setAvatarId(id);
            if (id) {
              setPhotoAsset(null);
              setPhotoRemoved(true);
            }
          }}
        />

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

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Button
            title="Save Changes"
            onPress={handleUpdate}
            loading={loading}
            style={styles.saveBtn}
          />
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    marginTop: 0,
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
