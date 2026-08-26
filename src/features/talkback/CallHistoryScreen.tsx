import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Call02Icon, Mic01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { AppIcon } from '../../components/common/AppIcon';
import { TalkbackApi } from '../../api/endpoints/talkback.api';
import { TalkbackSession } from '../../types/talkback.types';
import { formatDateTime, formatDuration } from '../../utils/date';

interface CallHistoryScreenProps {
  navigation: any;
}

export const CallHistoryScreen: React.FC<CallHistoryScreenProps> = ({ navigation }) => {
  const [logs, setLogs] = useState<TalkbackSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      const data = await TalkbackApi.getCallsLog(1, 30);
      setLogs(data.logs);
    } catch (e) {
      console.warn('[CallHistory] Error loading call logs:', e);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const renderLogCard = ({ item }: { item: TalkbackSession }) => {
    const cameraName =
      typeof item.cameraId === 'object' && item.cameraId !== null
        ? item.cameraId.name
        : 'Assigned Camera';
    const operatorName =
      typeof item.operatorId === 'object' && item.operatorId !== null
        ? item.operatorId.name
        : 'Operator';

    return (
      <View style={styles.logCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleArea}>
            <View style={styles.cameraRow}>
              <AppIcon icon={Mic01Icon} size="xs" color={Colors.secondary} />
              <Text style={styles.cameraName}>{cameraName}</Text>
            </View>
            <Text style={styles.operatorText}>Initiated by: {operatorName}</Text>
          </View>
          <Text style={styles.durationText}>
            {item.durationSeconds ? formatDuration(item.durationSeconds) : 'Active'}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatDateTime(item.startedAt)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Talkback Call Log" subtitle="History of 2-way audio sessions" onBack={() => navigation.goBack()} />

      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        renderItem={renderLogCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <AppIcon icon={Call02Icon} size="xxl" color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Calls Recorded</Text>
            <Text style={styles.emptySub}>No talkback sessions have been initiated on your assigned cameras.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  logCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
    marginRight: 10,
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  operatorText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.online,
    fontVariant: ['tabular-nums'],
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 10,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
