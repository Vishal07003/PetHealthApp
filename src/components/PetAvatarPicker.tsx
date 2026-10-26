import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { Colors, Spacing } from '../theme/theme';
import { Icon } from './Icon';
import { PetAvatar, BUILTIN_AVATARS, BuiltinAvatar } from './PetAvatar';

interface PetAvatarPickerProps {
  photoUri?: string | null;
  avatarId?: string | null;
  species?: 'dog' | 'cat' | 'other';
  onPhotoSelected: (asset: Asset | null) => void;
  onAvatarSelected: (avatarId: string | null) => void;
}

export const PetAvatarPicker: React.FC<PetAvatarPickerProps> = ({
  photoUri,
  avatarId,
  species = 'dog',
  onPhotoSelected,
  onAvatarSelected,
}) => {
  const [activeMode, setActiveMode] = useState<'avatar' | 'photo'>(
    photoUri ? 'photo' : 'avatar'
  );
  const [loadingImage, setLoadingImage] = useState(false);

  const requestGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const handlePickPhoto = async () => {
    try {
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        Alert.alert(
          'Storage Permission Denied',
          'Please grant photo library access in your system settings to upload pet images.'
        );
        return;
      }

      setLoadingImage(true);
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        setLoadingImage(false);
        return;
      }

      if (result.errorCode) {
        Alert.alert('Image Picker Error', result.errorMessage || 'Unable to open photo library.');
        setLoadingImage(false);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onPhotoSelected(asset);
        // Clear avatarId when a photo is chosen
        onAvatarSelected(null);
        setActiveMode('photo');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Could not pick image.');
    } finally {
      setLoadingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoSelected(null);
    setActiveMode('avatar');
  };

  const handleSelectAvatar = (item: BuiltinAvatar) => {
    onAvatarSelected(item.id);
    // Clear photo selection when choosing a built-in avatar
    onPhotoSelected(null);
    setActiveMode('avatar');
  };

  return (
    <View style={styles.container}>
      {/* Centered Preview Badge with Edit Options */}
      <View style={styles.previewContainer}>
        <PetAvatar
          photoUrl={photoUri}
          avatarId={avatarId}
          species={species}
          size={84}
          borderColor={Colors.primary}
          borderWidth={2}
        />
        {photoUri && (
          <TouchableOpacity
            style={styles.removePhotoBadge}
            onPress={handleRemovePhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.removePhotoText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Switcher: Choose Avatar vs Upload Photo */}
      <View style={styles.modeSwitchRow}>
        <TouchableOpacity
          style={[styles.modeTab, activeMode === 'avatar' && styles.modeTabActive]}
          onPress={() => setActiveMode('avatar')}
          activeOpacity={0.7}
        >
          <Icon
            name="paw"
            size={14}
            color={activeMode === 'avatar' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[styles.modeTabText, activeMode === 'avatar' && styles.modeTabTextActive]}
          >
            Choose Avatar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeMode === 'photo' && styles.modeTabActive]}
          onPress={() => setActiveMode('photo')}
          activeOpacity={0.7}
        >
          <Icon
            name="camera"
            size={14}
            color={activeMode === 'photo' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[styles.modeTabText, activeMode === 'photo' && styles.modeTabTextActive]}
          >
            Upload Photo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mode A: Choose Built-in Avatar Grid */}
      {activeMode === 'avatar' && (
        <View style={styles.avatarGrid}>
          {BUILTIN_AVATARS.map((av) => {
            const isSelected = avatarId === av.id && !photoUri;
            return (
              <TouchableOpacity
                key={av.id}
                style={[
                  styles.avatarOption,
                  { backgroundColor: av.bgColor },
                  isSelected && styles.avatarOptionSelected,
                ]}
                onPress={() => handleSelectAvatar(av)}
                activeOpacity={0.7}
              >
                <Icon name={av.icon} size={24} color={av.iconColor} />
                {isSelected && (
                  <View style={styles.checkBubble}>
                    <Icon name="check" size={10} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Mode B: Upload Custom Photo Actions */}
      {activeMode === 'photo' && (
        <View style={styles.photoActionsBox}>
          {photoUri ? (
            <View style={styles.photoActionButtons}>
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={handlePickPhoto}
                disabled={loadingImage}
                activeOpacity={0.7}
              >
                <Icon name="image" size={14} color={Colors.primary} />
                <Text style={styles.changePhotoText}>
                  {loadingImage ? 'Opening Gallery...' : 'Change Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={handleRemovePhoto}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadCtaBtn}
              onPress={handlePickPhoto}
              disabled={loadingImage}
              activeOpacity={0.8}
            >
              {loadingImage ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Icon name="camera" size={18} color={Colors.primary} />
                  <Text style={styles.uploadCtaText}>Choose Photo from Gallery</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  removePhotoBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  removePhotoText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 3,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: Colors.surface,
    elevation: 1,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modeTabTextActive: {
    color: Colors.primary,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 280,
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  avatarOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    transform: [{ scale: 1.08 }],
  },
  checkBubble: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  photoActionsBox: {
    marginTop: 4,
    alignItems: 'center',
  },
  uploadCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  uploadCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  photoActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  removePhotoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
});
