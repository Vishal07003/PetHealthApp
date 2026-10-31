import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Colors } from '../theme/theme';
import { Icon, IconName } from './Icon';
import { Pet } from '../types/api';
import { API_BASE_URL } from '../config/api';


export interface BuiltinAvatar {
  id: string;
  label: string;
  species: 'dog' | 'cat' | 'other';
  icon: IconName;
  bgColor: string;
  iconColor: string;
}

export const BUILTIN_AVATARS: BuiltinAvatar[] = [
  { id: 'dog-golden', label: 'Golden Dog', species: 'dog', icon: 'dog', bgColor: '#FEF3C7', iconColor: '#D97706' },
  { id: 'dog-husky', label: 'Playful Pup', species: 'dog', icon: 'dog', bgColor: '#DBEAFE', iconColor: '#2563EB' },
  { id: 'dog-guard', label: 'Brave Canine', species: 'dog', icon: 'dog', bgColor: '#DCFCE7', iconColor: '#16A34A' },
  { id: 'cat-calico', label: 'Calico Cat', species: 'cat', icon: 'cat', bgColor: '#FFEDD5', iconColor: '#EA580C' },
  { id: 'cat-siamese', label: 'Sleek Feline', species: 'cat', icon: 'cat', bgColor: '#F3E8FF', iconColor: '#9333EA' },
  { id: 'cat-tabby', label: 'Curious Cat', species: 'cat', icon: 'cat', bgColor: '#FEE2E2', iconColor: '#DC2626' },
  { id: 'paw-emerald', label: 'Active Paw', species: 'other', icon: 'paw', bgColor: '#CCFBF1', iconColor: '#0D9488' },
  { id: 'paw-amber', label: 'Gentle Paws', species: 'other', icon: 'paw', bgColor: '#FAF5EE', iconColor: Colors.primary },
];

export const getBuiltinAvatar = (avatarId?: string | null): BuiltinAvatar | undefined => {
  if (!avatarId) return undefined;
  return BUILTIN_AVATARS.find((a) => a.id === avatarId);
};

export const resolvePhotoUrl = (photoUrl?: string | null): string | null => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('file://') || photoUrl.startsWith('content://')) {
    return photoUrl;
  }
  // Relative media path from Django
  const baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${baseUrl}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

interface PetAvatarProps {
  pet?: Partial<Pet> | null;
  photoUrl?: string | null;
  avatarId?: string | null;
  species?: 'dog' | 'cat' | 'other';
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  borderColor?: string;
  borderWidth?: number;
}

export const PetAvatar: React.FC<PetAvatarProps> = React.memo<PetAvatarProps>(
  ({
    pet,
    photoUrl,
    avatarId,
    species,
    size = 48,
    style,
    imageStyle,
    borderColor = Colors.border,
    borderWidth = 1,
  }) => {
    const activePhoto = photoUrl || pet?.photo;
    const activeAvatarId = avatarId || pet?.avatar_id;
    const activeSpecies = species || pet?.species || 'dog';

    const resolvedPhoto = resolvePhotoUrl(activePhoto);
    const builtin = getBuiltinAvatar(activeAvatarId);

    const borderRadius = size / 2;

    const [imageError, setImageError] = React.useState(false);

    // Reset error state if photo URL changes
    React.useEffect(() => {
      setImageError(false);
    }, [resolvedPhoto]);

    // 1. If photo is available and hasn't errored out, render Image
    if (resolvedPhoto && !imageError) {
      return (
        <View
          style={[
            styles.container,
            {
              width: size,
              height: size,
              borderRadius,
              borderColor,
              borderWidth,
              backgroundColor: '#F3F4F6',
            },
            style,
          ]}
        >
          <Image
            source={{ uri: resolvedPhoto }}
            onError={() => setImageError(true)}
            style={[
              {
                width: size - borderWidth * 2,
                height: size - borderWidth * 2,
                borderRadius: (size - borderWidth * 2) / 2,
              },
              imageStyle,
            ]}
            resizeMode="cover"
          />
        </View>
      );
    }

    // 2. If a built-in avatar was chosen, render its stylized icon badge
    if (builtin) {
      const iconSize = Math.round(size * 0.52);
      return (
        <View
          style={[
            styles.container,
            {
              width: size,
              height: size,
              borderRadius,
              backgroundColor: builtin.bgColor,
              borderColor,
              borderWidth,
            },
            style,
          ]}
        >
          <Icon name={builtin.icon} size={iconSize} color={builtin.iconColor} />
        </View>
      );
    }

    // 3. Fallback: clean species-based icon badge (no emoji)
    const fallbackIcon: IconName = activeSpecies === 'cat' ? 'cat' : activeSpecies === 'dog' ? 'dog' : 'paw';
    const fallbackBg = activeSpecies === 'cat' ? '#FFF7ED' : activeSpecies === 'dog' ? '#EFF6FF' : '#FAF5EE';
    const fallbackColor = activeSpecies === 'cat' ? '#EA580C' : activeSpecies === 'dog' ? '#2563EB' : Colors.primary;
    const iconSize = Math.round(size * 0.52);

    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: fallbackBg,
            borderColor,
            borderWidth,
          },
          style,
        ]}
      >
        <Icon name={fallbackIcon} size={iconSize} color={fallbackColor} />
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render when props or meaningful pet fields change
    if (
      prevProps.size !== nextProps.size ||
      prevProps.photoUrl !== nextProps.photoUrl ||
      prevProps.avatarId !== nextProps.avatarId ||
      prevProps.species !== nextProps.species ||
      prevProps.borderColor !== nextProps.borderColor ||
      prevProps.borderWidth !== nextProps.borderWidth
    ) {
      return false;
    }

    // If pet objects are identical references, no re-render
    if (prevProps.pet === nextProps.pet) {
      return true;
    }

    // If either pet is null/undefined
    if (!prevProps.pet || !nextProps.pet) {
      return prevProps.pet === nextProps.pet;
    }

    // Check key fields on pet object that affect visual avatar output
    return (
      prevProps.pet.id === nextProps.pet.id &&
      prevProps.pet.photo === nextProps.pet.photo &&
      prevProps.pet.avatar_id === nextProps.pet.avatar_id &&
      prevProps.pet.species === nextProps.pet.species &&
      prevProps.pet.name === nextProps.pet.name
    );
  }
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

