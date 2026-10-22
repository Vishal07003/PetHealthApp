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
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { KeyboardAwareContainer } from '../components/KeyboardAwareContainer';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/PetHealthService';

interface ProfileTabProps {
  onBack?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = () => {
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
      setSuccessMsg('Account profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of PetHealth?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  // Masked email for security
  const maskedEmail = (em: string) => {
    if (!em || !em.includes('@')) return em;
    const [name, domain] = em.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  };

  return (
    <KeyboardAwareContainer contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={Typography.titleLarge}>Account & Settings</Text>
        <Text style={styles.headerSub}>Owner preferences and pet security</Text>
      </View>

      {/* User Hero Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {(user?.username?.[0] || 'U').toUpperCase()}
          </Text>
        </View>
        <View style={styles.userMeta}>
          <Text style={styles.fullName}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
          </Text>
          <Text style={styles.usernameTag}>@{user?.username}</Text>
          <Text style={styles.maskedEmailText}>{maskedEmail(user?.email || '')}</Text>
        </View>
      </View>

      {!!successMsg && (
        <View style={styles.successBanner}>
          <Icon name="check" size={16} color={Colors.success} />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}

      {/* Edit Profile Form */}
      <View style={styles.formCard}>
        <Text style={styles.cardHeaderTitle}>Profile Information</Text>

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
          title="Save Changes"
          onPress={handleUpdate}
          loading={loading}
          style={styles.saveBtn}
        />
      </View>

      {/* App Preferences & Info Card */}
      <View style={styles.settingsCard}>
        <Text style={styles.cardHeaderTitle}>Application Info</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Environment</Text>
          <Text style={styles.settingValue}>Development & Testing</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Version</Text>
          <Text style={styles.settingValue}>1.0.0 (Build 2026.10)</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Telemetry Storage</Text>
          <Text style={styles.settingValue}>PostgreSQL Timeseries</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Hardware Protocol</Text>
          <Text style={styles.settingValue}>BLE 4.2+ / Wi-Fi IMU</Text>
        </View>
      </View>

      {/* Sign Out Button */}
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
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  userMeta: {
    flex: 1,
  },
  fullName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  usernameTag: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  maskedEmailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  successText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  saveBtn: {
    marginTop: Spacing.sm,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  logoutBtn: {
    marginTop: Spacing.xs,
    borderColor: Colors.danger,
  },
});
