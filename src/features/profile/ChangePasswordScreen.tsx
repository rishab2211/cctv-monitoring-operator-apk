import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { AuthApi } from '../../api/endpoints/auth.api';

interface ChangePasswordScreenProps {
  navigation: any;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  navigation,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Required', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await AuthApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      Alert.alert('Success', 'Your password has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header title="Change Password" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            secureTextEntry
            placeholder="••••••••••••"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>New Password</Text>
          <TextInput
            secureTextEntry
            placeholder="••••••••••••"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>Confirm New Password</Text>
          <TextInput
            secureTextEntry
            placeholder="••••••••••••"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Button
            title="Update Password"
            loading={loading}
            onPress={handleChangePassword}
            size="large"
            style={styles.submitBtn}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  submitBtn: {
    marginTop: 22,
  },
});
