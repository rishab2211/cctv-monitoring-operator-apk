import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { AuthApi } from '../../api/endpoints/auth.api';
import { getApiErrorMessage } from '../../utils/error';

interface OTPVerificationScreenProps {
  navigation: any;
  route: {
    params: {
      email: string;
      maskedEmail?: string;
    };
  };
}

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { email, maskedEmail } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthApi.verifyOtp({ email, otp });
      // Navigate to ResetPassword with the secured resetToken
      navigation.navigate('ResetPassword', {
        email,
        resetToken: data.resetToken,
      });
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Invalid or expired OTP code.');
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      await AuthApi.forgotPassword(email);
      setResendTimer(60);
      Alert.alert('Sent', 'A new verification code has been dispatched to your email.');
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to resend code. Please wait a moment.'));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header title="Verify OTP" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.description}>
          Enter the 6-digit security code sent to{' '}
          <Text style={styles.emailHighlight}>{maskedEmail || email}</Text>.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>6-Digit Verification Code</Text>
          <TextInput
            autoFocus
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={Colors.textMuted}
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
          />

          <Button
            title="Verify & Proceed"
            loading={loading}
            onPress={handleVerifyOtp}
            size="large"
            style={styles.verifyBtn}
          />

          <View style={styles.resendRow}>
            {resendTimer > 0 ? (
              <Text style={styles.timerText}>Resend code in {resendTimer}s</Text>
            ) : (
              <TouchableOpacity activeOpacity={0.7} onPress={handleResendOtp}>
                <Text style={styles.resendText}>Resend Verification Code</Text>
              </TouchableOpacity>
            )}
          </View>
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
  emailHighlight: {
    color: Colors.textPrimary,
    fontWeight: '700',
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
  otpInput: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 8,
  },
  verifyBtn: {
    marginTop: 20,
  },
  resendRow: {
    marginTop: 18,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
});
