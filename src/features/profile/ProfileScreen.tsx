import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { AuthApi } from '../../api/endpoints/auth.api';
import { StorageService } from '../../services/storage.service';
import { socketService } from '../../services/socket.service';
import { logout } from '../../store/slices/authSlice';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, franchiseName } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your operator session and sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AuthApi.logout();
          await StorageService.clearTokens();
          socketService.disconnect();
          dispatch(logout());
        },
      },
    ]);
  };

  const renderSettingItem = (
    emoji: string,
    title: string,
    subtitle: string,
    onPress: () => void
  ) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.settingItem}>
      <Text style={styles.itemEmoji}>{emoji}</Text>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSub}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Operator Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <Card variant="elevated" style={styles.userCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                : 'OP'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Operator'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userPhone}>📱 {user?.phone || 'Phone unset'}</Text>

            <View style={styles.franchiseBadge}>
              <Text style={styles.franchiseText}>
                🏢 {franchiseName || 'Standard Franchise Territory'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Operational Records */}
        <Text style={styles.sectionHeader}>Operational Records</Text>
        <Card variant="elevated">
          {renderSettingItem('⏱', 'My Shift History', 'Logs of past clock-in & duration times', () =>
            navigation.navigate('ShiftHistory')
          )}
          {renderSettingItem('🎙️', 'Talkback Call History', 'Log of two-way audio communications', () =>
            navigation.navigate('CallHistory')
          )}
          {renderSettingItem('📰', 'Activity Audit Trail', 'Chronological security events', () =>
            navigation.navigate('Timeline')
          )}
        </Card>

        {/* Security & Settings */}
        <Text style={styles.sectionHeader}>Security & Preferences</Text>
        <Card variant="elevated">
          {renderSettingItem('🔔', 'Notification Preferences', 'Push, In-App & Email alerts', () =>
            navigation.navigate('NotificationPreferences')
          )}
          {renderSettingItem('💻', 'Active Device Sessions', 'Manage logged-in devices', () =>
            navigation.navigate('ActiveSessions')
          )}
          {renderSettingItem('🔒', 'Change Password', 'Update your authentication password', () =>
            navigation.navigate('ChangePassword')
          )}
        </Card>

        {/* Logout CTA */}
        <Button
          title="Sign Out of Session"
          variant="destructive"
          onPress={handleLogout}
          size="large"
          style={styles.logoutBtn}
        />

        <Text style={styles.versionText}>CCTV Operator Mobile Client • v1.2</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  franchiseBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  franchiseText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  itemEmoji: {
    fontSize: 20,
    marginRight: 14,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  logoutBtn: {
    marginTop: 30,
  },
  versionText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});
