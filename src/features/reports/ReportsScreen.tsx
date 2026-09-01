import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Analytics01Icon,
  Chart01Icon,
  ClipboardIcon,
  Clock01Icon,
  FileEditIcon,
  SirenIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { AppIcon } from '../../components/common/AppIcon';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { OperatorReportsResponse, ReportShiftItem } from '../../types/reports.types';
import { formatDateTime, formatDuration } from '../../utils/date';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ReportsScreenProps {
  navigation: any;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [reports, setReports] = useState<OperatorReportsResponse | null>(null);
  const [allTimeKpis, setAllTimeKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = React.useCallback(async () => {
    try {
      const [reportsData, kpisData] = await Promise.all([
        OperatorApi.getReports(),
        user?._id 
          ? OperatorApi.getPerformanceKpis(user._id).catch((err) => {
              console.warn('[Reports] Error loading KPIs:', err);
              return null;
            })
          : Promise.resolve(null),
      ]);
      setReports(reportsData);
      setAllTimeKpis(kpisData);
    } catch (e) {
      console.warn('[Reports] Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

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
        <View style={styles.statMetricRow}>
          <AppIcon icon={ClipboardIcon} size="xs" color={Colors.primaryLight} />
          <Text style={styles.statMetric}>Incidents: {item.incidentsResolved}</Text>
        </View>
        <View style={styles.statMetricRow}>
          <AppIcon icon={SirenIcon} size="xs" color={Colors.critical} />
          <Text style={styles.statMetric}>SOS Handled: {item.sosAcknowledged}</Text>
        </View>
      </View>

      {item.handoverNotes && (
        <View style={styles.handoverRow}>
          <AppIcon icon={FileEditIcon} size="xs" color={Colors.textMuted} />
          <Text numberOfLines={2} style={styles.handoverText}>
            "{item.handoverNotes}"
          </Text>
        </View>
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
        {allTimeKpis && (
          <View style={styles.allTimeContainer}>
            <Text style={styles.sectionTitle}>All-Time Performance KPIs</Text>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <AppIcon icon={Clock01Icon} size="md" color={Colors.primaryLight} />
                <Text style={styles.kpiValue}>{allTimeKpis.totalShifts ?? 0}</Text>
                <Text style={styles.kpiLabel}>Total Shifts</Text>
              </View>
              <View style={styles.kpiCard}>
                <AppIcon icon={ClipboardIcon} size="md" color={Colors.online} />
                <Text style={styles.kpiValue}>{allTimeKpis.totalIncidents ?? 0}</Text>
                <Text style={styles.kpiLabel}>Incidents</Text>
              </View>
              <View style={styles.kpiCard}>
                <AppIcon icon={SirenIcon} size="md" color={Colors.critical} />
                <Text style={styles.kpiValue}>{allTimeKpis.totalSos ?? 0}</Text>
                <Text style={styles.kpiLabel}>SOS Handled</Text>
              </View>
              <View style={styles.kpiCard}>
                <AppIcon icon={Analytics01Icon} size="md" color={Colors.warning} />
                <Text style={styles.kpiValue}>{allTimeKpis.rating ?? 'N/A'}</Text>
                <Text style={styles.kpiLabel}>Operator Rating</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Last 30 Shifts Summary</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <AppIcon icon={Clock01Icon} size="md" color={Colors.primaryLight} />
            <Text style={styles.kpiValue}>{summary.totalShifts}</Text>
            <Text style={styles.kpiLabel}>Total Shifts</Text>
          </View>

          <View style={styles.kpiCard}>
            <AppIcon icon={ClipboardIcon} size="md" color={Colors.online} />
            <Text style={styles.kpiValue}>{summary.totalIncidentsResolved}</Text>
            <Text style={styles.kpiLabel}>Incidents Resolved</Text>
          </View>

          <View style={styles.kpiCard}>
            <AppIcon icon={SirenIcon} size="md" color={Colors.critical} />
            <Text style={styles.kpiValue}>{summary.totalSosAcknowledged}</Text>
            <Text style={styles.kpiLabel}>SOS Handled</Text>
          </View>

          <View style={styles.kpiCard}>
            <AppIcon icon={Analytics01Icon} size="md" color={Colors.warning} />
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
            <AppIcon icon={Chart01Icon} size="xxl" color={Colors.textMuted} />
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
  allTimeContainer: {
    marginBottom: 8,
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
  statMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statMetric: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  handoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  handoverText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
    fontStyle: 'italic',
    flex: 1,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
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
