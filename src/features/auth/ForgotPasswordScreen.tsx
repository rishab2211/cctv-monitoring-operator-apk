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

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid operator email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await AuthApi.forgotPassword(email.trim().toLowerCase());
      Alert.alert(
        'OTP Dispatched',
        `An authentication code has been sent to ${result.maskedEmail || email}.`,
        [
          {
            text: 'Enter Code',
            onPress: () =>
              navigation.navigate('OTPVerification', {
                email: email.trim().toLowerCase(),
                maskedEmail: result.maskedEmail,
              }),
          },
        ]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header title="Password Recovery" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.description}>
          Enter your registered operator email. We will send a 6-digit one-time verification code
          to reset your password.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Operator Email</Text>
          <TextInput
            autoCapitalize="none"
            autoFocus
            keyboardType="email-address"
            placeholder="operator@cctvmonitor.com"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Button
            title="Send Verification Code"
            loading={loading}
            onPress={handleRequestOtp}
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
    flex: 1,
    padding: 24,
  },
  description: {
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
    marginTop: 20,
  },
});
