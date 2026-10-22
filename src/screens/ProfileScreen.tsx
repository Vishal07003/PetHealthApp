import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { KeyboardAwareContainer } from '../components/KeyboardAwareContainer';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/PetHealthService';

interface ProfileScreenProps {
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { user, setUser, logout } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdate = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const updated = await AuthService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      });
      setUser(updated);
      setSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of PetHealth?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <KeyboardAwareContainer contentContainerStyle={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={Typography.titleMedium}>My Profile</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.username?.[0] || 'U').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>@{user?.username}</Text>
        <Text style={styles.joinedDate}>
          Member since {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
        </Text>
      </View>

      {!!successMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}

      <View style={styles.formCard}>
        <Input
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <Input
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Button
          title="Save Profile"
          onPress={handleUpdate}
          loading={loading}
          style={styles.saveBtn}
        />
      </View>

      <Button
        title="Sign Out"
        variant="outline"
        onPress={handleLogout}
        style={styles.logoutBtn}
      />
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
  avatarCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  joinedDate: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  saveBtn: {
    marginTop: Spacing.sm,
  },
  logoutBtn: {
    borderColor: Colors.danger,
  },
  successBanner: {
    backgroundColor: Colors.successLight,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  successText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
});
