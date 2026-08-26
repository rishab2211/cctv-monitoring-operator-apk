import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { ShiftHistoryItem } from '../../types/shift.types';
import { formatDateTime, formatDuration } from '../../utils/date';

interface ShiftHistoryScreenProps {
  navigation: any;
}

export const ShiftHistoryScreen: React.FC<ShiftHistoryScreenProps> = ({ navigation }) => {
  const [shifts, setShifts] = useState<ShiftHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadShifts = async () => {
    try {
      const data = await OperatorApi.getShiftsHistory(1, 40);
      setShifts(data.shifts);
    } catch (e) {
      console.warn('[ShiftHistory] Error loading shift history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  };

  const renderShiftItem = ({ item }: { item: ShiftHistoryItem }) => (
    <View style={styles.shiftCard}>
      <View style={styles.headerRow}>
        <Text style={styles.shiftDate}>{formatDateTime(item.startTime)}</Text>
        <Text style={styles.durationText}>
          {item.durationSeconds ? formatDuration(item.durationSeconds) : 'In progress'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statText}>📋 Incidents: {item.incidentsResolved || 0}</Text>
        <Text style={styles.statText}>🆘 SOS: {item.sosAcknowledged || 0}</Text>
      </View>

      {item.handoverNotes && (
        <Text style={styles.notesText}>📝 Handover: "{item.handoverNotes}"</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="My Shift History" subtitle="Logged operator work shifts" onBack={() => navigation.goBack()} />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item) => item._id}
          renderItem={renderShiftItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>⏱</Text>
              <Text style={styles.emptyTitle}>No Shifts Recorded</Text>
              <Text style={styles.emptySub}>Your concluded monitoring shifts will be displayed here.</Text>
            </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  shiftCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftDate: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.online,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceElevated,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  notesText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
