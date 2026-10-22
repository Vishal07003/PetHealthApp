import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { KeyboardAwareContainer } from '../components/KeyboardAwareContainer';
import { AuthService } from '../services/PetHealthService';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await AuthService.login({
        username: username.trim(),
        password,
      });
      await refreshProfile();
    } catch (err: any) {
      const respData = err.response?.data;
      let errorMsg = 'Unable to log in. Please check your credentials.';
      if (respData) {
        if (typeof respData === 'string') {
          errorMsg = respData;
        } else if (respData.detail) {
          errorMsg = respData.detail;
        } else if (respData.message) {
          errorMsg = respData.message;
        } else if (respData.non_field_errors) {
          errorMsg = Array.isArray(respData.non_field_errors)
            ? respData.non_field_errors.join(' ')
            : String(respData.non_field_errors);
        }
      } else if (err.message) {
        errorMsg = `${err.message}. Ensure backend is running.`;
      }
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareContainer contentContainerStyle={styles.scrollContent}>
      {/* Clinical Bio-Care Brand Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>PH</Text>
        </View>
        <Text style={styles.brandSubtitle}>CLINICAL BIO-CARE • PET HEALTH SYSTEM</Text>
        <Text style={styles.titleLarge}>Welcome Back</Text>
        <Text style={styles.bodyMedium}>Authenticate to access real-time pet health telemetry</Text>
      </View>

      {!!errors.general && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errors.general}</Text>
        </View>
      )}

      {/* Clinical Form Card */}
      <View style={styles.formCard}>
        <Input
          label="Account Username"
          placeholder="e.g. cooper01"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          error={errors.username}
        />

        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <Button
          title="Sign In to Clinical Portal"
          onPress={handleLogin}
          loading={loading}
          style={styles.signInBtn}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>SECURE HEALTH ACCESS</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New pet owner or clinician? </Text>
          <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.8}>
            <Text style={styles.registerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Disclaimer */}
      <View style={styles.securityBox}>
        <Text style={styles.securityText}>
          Encrypted TLS Telemetry Relay • Active PostgreSQL Timeseries Database
        </Text>
      </View>
    </KeyboardAwareContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  logoBadgeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  bodyMedium: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    marginHorizontal: 8,
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  registerLink: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    padding: 12,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  securityBox: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  securityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
