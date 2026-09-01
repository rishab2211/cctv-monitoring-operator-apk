import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { AuthApi } from '../../api/endpoints/auth.api';

interface ResetPasswordScreenProps {
  navigation: any;
  route: {
    params: {
      email: string;
      resetToken: string;
    };
  };
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  navigation,
  route,
}) => {
  const { resetToken } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Required', 'Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await AuthApi.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });

      Alert.alert(
        'Password Reset Successful',
        'Your password has been updated. Please sign in with your new credentials.',
        [
          {
            text: 'Go to Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password. Token may have expired.';
      Alert.alert('Reset Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header title="Set New Password" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Create a strong password for your operator account. Must include at least 8 characters.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            secureTextEntry
            placeholder="••••••••••••"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Text style={[styles.label, styles.passwordLabel]}>Confirm New Password</Text>
          <TextInput
            secureTextEntry
            placeholder="••••••••••••"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Button
            title="Save Password & Sign In"
            loading={loading}
            onPress={handleResetPassword}
            size="large"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  passwordLabel: {
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  submitBtn: {
    marginTop: 24,
  },
});
