import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  AppState,
  AppStateStatus,
} from 'react-native';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import { Colors, Spacing } from '../theme/theme';
import { Icon } from './Icon';
import { PetAvatar, BUILTIN_AVATARS, BuiltinAvatar } from './PetAvatar';
import {
  showToast,
  requestCameraPermission,
  checkCameraPermission,
  openAppSettings,
  PermissionCheckResult,
} from '../utils';

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

  // Permission Explanatory Dialog State
  const [permissionDialogVisible, setPermissionDialogVisible] = useState(false);
  const [permissionType, setPermissionType] = useState<'camera' | 'storage'>('camera');
  const [canRequestAgain, setCanRequestAgain] = useState(true);
  const [pendingAction, setPendingAction] = useState<'camera' | 'gallery' | null>(null);

  // Monitor AppState to automatically re-check permission when returning from device Settings
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && pendingAction) {
        if (pendingAction === 'camera') {
          const hasCam = await checkCameraPermission();
          if (hasCam) {
            setPermissionDialogVisible(false);
            setPendingAction(null);
            launchCameraPicker();
          }
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [pendingAction]);

  /**
   * Option A: Gallery Image Selection
   * Uses Android System Photo Picker (API 30+ / Backport) which requires NO runtime storage permissions.
   */
  const handlePickFromGallery = async () => {
    try {
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
        showToast('Photo selection cancelled.');
        return;
      }

      if (result.errorCode) {
        if (result.errorCode === 'permission') {
          setPermissionType('storage');
          setCanRequestAgain(false);
          setPendingAction('gallery');
          setPermissionDialogVisible(true);
        } else {
          showToast(result.errorMessage || 'Unable to open photo library.');
        }
        setLoadingImage(false);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onPhotoSelected(asset);
        onAvatarSelected(null);
        setActiveMode('photo');
        showToast('Photo selected from gallery.');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not pick image.');
    } finally {
      setLoadingImage(false);
    }
  };

  /**
   * Option B: Camera Capture
   * Checks runtime CAMERA permission only when the user chooses the Camera action.
   */
  const launchCameraPicker = async () => {
    try {
      setLoadingImage(true);
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        saveToPhotos: false,
      });

      if (result.didCancel) {
        setLoadingImage(false);
        showToast('Camera capture cancelled.');
        return;
      }

      if (result.errorCode) {
        showToast(result.errorMessage || 'Camera error.');
        setLoadingImage(false);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onPhotoSelected(asset);
        onAvatarSelected(null);
        setActiveMode('photo');
        showToast('Photo captured with camera.');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not launch camera.');
    } finally {
      setLoadingImage(false);
    }
  };

  const handleTakePhotoWithCamera = async () => {
    const permResult = await requestCameraPermission();
    if (permResult === 'granted') {
      await launchCameraPicker();
    } else if (permResult === 'never_ask_again') {
      setPermissionType('camera');
      setCanRequestAgain(false);
      setPendingAction('camera');
      setPermissionDialogVisible(true);
    } else {
      // 'denied' (first time or user tapped Not Now)
      setPermissionType('camera');
      setCanRequestAgain(true);
      setPendingAction('camera');
      setPermissionDialogVisible(true);
    }
  };

  const handleTryPermissionAgain = async () => {
    setPermissionDialogVisible(false);
    if (pendingAction === 'camera') {
      const permResult = await requestCameraPermission();
      if (permResult === 'granted') {
        setPendingAction(null);
        await launchCameraPicker();
      } else if (permResult === 'never_ask_again') {
        setCanRequestAgain(false);
        setPermissionDialogVisible(true);
      } else {
        showToast('Camera permission denied.');
      }
    } else if (pendingAction === 'gallery') {
      setPendingAction(null);
      await handlePickFromGallery();
    }
  };

  const handleOpenSettingsFromDialog = async () => {
    await openAppSettings();
    // Keep pendingAction active so AppState listener re-checks upon return
  };

  const handleDismissPermissionDialog = () => {
    setPermissionDialogVisible(false);
    setPendingAction(null);
    showToast('Permission request cancelled.');
  };

  const handleRemovePhoto = () => {
    onPhotoSelected(null);
    setActiveMode('avatar');
    showToast('Photo removed. Avatar mode active.');
  };

  const handleSelectAvatar = (item: BuiltinAvatar) => {
    onAvatarSelected(item.id);
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
            Pet Photo
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
                onPress={handlePickFromGallery}
                disabled={loadingImage}
                activeOpacity={0.7}
              >
                <Icon name="image" size={14} color={Colors.primary} />
                <Text style={styles.changePhotoText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={handleTakePhotoWithCamera}
                disabled={loadingImage}
                activeOpacity={0.7}
              >
                <Icon name="camera" size={14} color={Colors.primary} />
                <Text style={styles.changePhotoText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={handleRemovePhoto}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dualPickerRow}>
              <TouchableOpacity
                style={styles.pickerCtaBtn}
                onPress={handlePickFromGallery}
                disabled={loadingImage}
                activeOpacity={0.8}
              >
                {loadingImage ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Icon name="image" size={16} color={Colors.primary} />
                    <Text style={styles.pickerCtaText}>Choose from Gallery</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerCtaBtn, styles.pickerCtaBtnSecondary]}
                onPress={handleTakePhotoWithCamera}
                disabled={loadingImage}
                activeOpacity={0.8}
              >
                <Icon name="camera" size={16} color={Colors.textSecondary} />
                <Text style={[styles.pickerCtaText, { color: Colors.text }]}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Permission Explanation Dialog Modal */}
      <Modal
        visible={permissionDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDismissPermissionDialog}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Icon
                name={permissionType === 'camera' ? 'camera' : 'image'}
                size={26}
                color={Colors.primary}
              />
            </View>

            <Text style={styles.modalTitle}>
              {permissionType === 'camera' ? 'Camera Access Required' : 'Storage Access Required'}
            </Text>

            <Text style={styles.modalDescription}>
              {canRequestAgain
                ? `Pet Health needs ${
                    permissionType === 'camera' ? 'camera' : 'photo library'
                  } access to let you capture or choose photos of your pet. Would you like to grant access now?`
                : `${
                    permissionType === 'camera' ? 'Camera' : 'Storage'
                  } permission has been disabled for this app. Please open System Settings to allow access.`}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelActionBtn}
                onPress={handleDismissPermissionDialog}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelActionText}>Cancel</Text>
              </TouchableOpacity>

              {canRequestAgain ? (
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={handleTryPermissionAgain}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionText}>Try Again</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={handleOpenSettingsFromDialog}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionText}>Open Settings</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  dualPickerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pickerCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pickerCtaBtnSecondary: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  pickerCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  photoActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  removePhotoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  primaryActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
