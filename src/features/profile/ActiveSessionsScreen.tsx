import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LaptopIcon } from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { AppIcon } from '../../components/common/AppIcon';
import { AuthApi } from '../../api/endpoints/auth.api';
import { DeviceSession } from '../../types/auth.types';
import { formatDateTime } from '../../utils/date';

interface ActiveSessionsScreenProps {
  navigation: any;
}

export const ActiveSessionsScreen: React.FC<ActiveSessionsScreenProps> = ({
  navigation,
}) => {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = async () => {
    try {
      const data = await AuthApi.getSessions();
      setSessions(data.sessions || []);
      setCurrentSessionId(data.currentSessionId || null);
    } catch (e) {
      console.warn('[Sessions] Error loading sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleRevokeSingle = (sessionId: string) => {
    Alert.alert('Revoke Session', 'Terminate this remote device session immediately?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthApi.revokeSession(sessionId);
            setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
            Alert.alert('Success', 'Remote session terminated.');
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Could not revoke session.');
          }
        },
      },
    ]);
  };

  const handleRevokeAllOthers = () => {
    Alert.alert(
      'Sign Out All Other Devices',
      'This will revoke all active logins except for this device. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out Others',
          style: 'destructive',
          onPress: async () => {
            try {
              const count = await AuthApi.revokeAllOtherSessions();
              Alert.alert('Revoked', `${count} other device session(s) signed out successfully.`);
              loadSessions();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Could not revoke other sessions.');
            }
          },
        },
      ]
    );
  };

  const renderSessionItem = ({ item }: { item: DeviceSession }) => {
    const isCurrent = item.sessionId === currentSessionId;

    return (
      <View style={[styles.sessionCard, isCurrent ? styles.currentCard : {}]}>
        <View style={styles.sessionHeader}>
          <View>
            <View style={styles.deviceRow}>
              <AppIcon icon={LaptopIcon} size="xs" color={isCurrent ? Colors.primaryLight : Colors.textSecondary} />
              <Text style={styles.deviceName}>
                {item.deviceName || `${item.os || 'Device'} • ${item.browser || 'Client'}`}
              </Text>
            </View>
            <Text style={styles.ipText}>IP: {item.ipAddress || '127.0.0.1'}</Text>
          </View>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>THIS DEVICE</Text>
            </View>
          )}
        </View>

        <Text style={styles.activeText}>Last active: {formatDateTime(item.lastActiveAt)}</Text>

        {!isCurrent && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleRevokeSingle(item.sessionId)}
            style={styles.revokeBtn}
          >
            <Text style={styles.revokeText}>Terminate Remote Session</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Active Device Sessions"
        subtitle="Manage authenticated operator logins"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loaderMargin} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.sessionId}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListFooterComponent={
            sessions.length > 1 ? (
              <Button
                title="Sign Out All Other Devices"
                variant="destructive"
                onPress={handleRevokeAllOthers}
                style={styles.revokeAllBtn}
              />
            ) : undefined
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loaderMargin: {
    marginTop: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  currentCard: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  ipText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  currentBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  revokeBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  revokeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.critical,
  },
  revokeAllBtn: {
    marginTop: 20,
  },
});
