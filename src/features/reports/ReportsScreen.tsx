import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { OperatorReportsResponse, ReportShiftItem } from '../../types/reports.types';
import { formatDateTime, formatDuration } from '../../utils/date';

interface ReportsScreenProps {
  navigation: any;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [reports, setReports] = useState<OperatorReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    try {
      const data = await OperatorApi.getReports();
      setReports(data);
    } catch (e) {
      console.warn('[Reports] Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="Performance Reports" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const summary = reports?.summary || {
    totalShifts: 0,
    totalIncidentsResolved: 0,
    totalSosAcknowledged: 0,
    avgIncidentsPerShift: '0.00',
  };

  const renderShiftRow = ({ item }: { item: ReportShiftItem }) => (
    <View style={styles.shiftRowCard}>
      <View style={styles.shiftDateRow}>
        <Text style={styles.shiftDate}>{formatDateTime(item.startTime)}</Text>
        <Text style={styles.shiftDuration}>
          {item.durationSeconds ? formatDuration(item.durationSeconds) : 'In Progress'}
        </Text>
      </View>

      <View style={styles.shiftStatsRow}>
        <Text style={styles.statMetric}>📋 Incidents: {item.incidentsResolved}</Text>
        <Text style={styles.statMetric}>🆘 SOS Handled: {item.sosAcknowledged}</Text>
      </View>

      {item.handoverNotes && (
        <Text numberOfLines={2} style={styles.handoverText}>
          📝 "{item.handoverNotes}"
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Performance Analytics"
        subtitle="Last 30 Monitoring Shifts"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* KPI Cards Row */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiEmoji}>⏱</Text>
            <Text style={styles.kpiValue}>{summary.totalShifts}</Text>
            <Text style={styles.kpiLabel}>Total Shifts</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiEmoji}>📋</Text>
            <Text style={styles.kpiValue}>{summary.totalIncidentsResolved}</Text>
            <Text style={styles.kpiLabel}>Incidents Resolved</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiEmoji}>🆘</Text>
            <Text style={styles.kpiValue}>{summary.totalSosAcknowledged}</Text>
            <Text style={styles.kpiLabel}>SOS Handled</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiEmoji}>📈</Text>
            <Text style={styles.kpiValue}>{summary.avgIncidentsPerShift}</Text>
            <Text style={styles.kpiLabel}>Avg / Shift</Text>
          </View>
        </View>

        {/* Shift History List */}
        <Text style={styles.sectionTitle}>Shift Logs Breakdown</Text>
        {reports?.shifts && reports.shifts.length > 0 ? (
          reports.shifts.map((s, idx) => (
            <View key={s._id || idx}>
              {renderShiftRow({ item: s })}
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No Shift Records</Text>
            <Text style={styles.emptySub}>Clock in to shifts to generate historical performance metrics.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginVertical: 4,
    alignItems: 'center',
  },
  kpiEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 10,
  },
  shiftRowCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  shiftDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftDate: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  shiftDuration: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.online,
  },
  shiftStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceElevated,
  },
  statMetric: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  handoverText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
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
