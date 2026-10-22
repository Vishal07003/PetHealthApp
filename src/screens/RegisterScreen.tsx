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

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = 'Username is required';
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }
    if (password !== passwordConfirm) {
      errs.passwordConfirm = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await AuthService.register({
        username: username.trim(),
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        password_confirm: passwordConfirm,
      });
      setUser(res.user);
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData && typeof respData === 'object') {
        const fieldErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(respData)) {
          if (Array.isArray(value)) {
            fieldErrors[key] = value.join(' ');
          } else if (typeof value === 'string') {
            fieldErrors[key] = value;
          }
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareContainer contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={Typography.titleLarge}>Create Account</Text>
        <Text style={Typography.bodyMedium}>Join PetHealth to track pet vitals & activity</Text>
      </View>

      {!!errors.general && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errors.general}</Text>
        </View>
      )}

      <View style={styles.formCard}>
        <Input
          label="Username"
          placeholder="e.g. petlover99"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          error={errors.username}
        />

        <Input
          label="Email Address"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />

        <View style={styles.row}>
          <Input
            label="First Name"
            placeholder="Jane"
            containerStyle={styles.halfInput}
            value={firstName}
            onChangeText={setFirstName}
            error={errors.first_name}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            containerStyle={styles.halfInput}
            value={lastName}
            onChangeText={setLastName}
            error={errors.last_name}
          />
        </View>

        <Input
          label="Password"
          placeholder="At least 8 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <Input
          label="Confirm Password"
          placeholder="Re-enter password"
          secureTextEntry
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          error={errors.passwordConfirm || errors.password_confirm}
        />

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          style={styles.registerBtn}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    elevation: 3,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  registerBtn: {
    marginTop: Spacing.md,
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
