import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Camera01Icon, EyeIcon, EyeOffIcon } from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { AppIcon } from '../../components/common/AppIcon';
import { AuthApi } from '../../api/endpoints/auth.api';
import { StorageService } from '../../services/storage.service';
import { socketService } from '../../services/socket.service';
import { loginSuccess, setError, setLoading } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { getApiErrorMessage } from '../../utils/error';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email/phone and password.');
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail
        ? { email: identifier.trim().toLowerCase(), password }
        : { phone: identifier.trim(), password };

      const data = await AuthApi.login(payload);

      // Verify operator role
      if (data.user.role !== 'operator') {
        throw new Error('Access Denied: Only Operator accounts can log into this application.');
      }

      // Save tokens to Keychain
      await StorageService.saveTokens(data.tokens.accessToken, data.tokens.refreshToken);
      await StorageService.saveCachedUser(data.user);

      // Connect Socket.IO
      const franchiseId = data.user.operatorDetails?.assignedFranchise;
      await socketService.connect(data.user._id, franchiseId);

      // Update Redux state
      dispatch(loginSuccess({ user: data.user }));
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(
        err,
        'Login failed. Please verify credentials.'
      );
      dispatch(setError(errorMsg));
      Alert.alert('Authentication Failed', errorMsg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* App Branding & Badge */}
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <AppIcon icon={Camera01Icon} size="xl" color={Colors.primaryLight} />
          </View>
          <Text style={styles.appName}>CCTV MONITOR</Text>
          <Text style={styles.appSubtitle}>Operator Command Client</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>OPERATOR ROLE ONLY</Text>
          </View>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email or Phone</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="e.g. operator@cctvmonitor.com"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="••••••••••••"
              placeholderTextColor={Colors.textMuted}
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <AppIcon
                icon={showPassword ? EyeOffIcon : EyeIcon}
                size="sm"
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In CTA */}
          <Button
            title="Sign In to Shift"
            loading={isLoading}
            onPress={handleLogin}
            size="large"
            style={styles.loginBtn}
          />
        </View>

        {/* Security Footer Notice */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Protected by multi-tenant JWT encryption & active shift tracking.
          </Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeEmoji: {
    fontSize: 30,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  roleTag: {
    marginTop: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: Colors.primary,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryLight,
    letterSpacing: 1,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.critical,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorBoxText: {
    color: Colors.critical,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeText: {
    fontSize: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 20,
  },
  forgotText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
