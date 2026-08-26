import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/common/Button';
import { BannerAlert } from '../../components/common/BannerAlert';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { SOSApi } from '../../api/endpoints/sos.api';
import {
  clockInSuccess,
  clockOutSuccess,
  dismissHandoverBanner,
  setShiftStatus,
} from '../../store/slices/shiftSlice';
import { setAlertStats } from '../../store/slices/alertSlice';
import { setActiveSosAlerts } from '../../store/slices/sosSlice';
import { formatDuration } from '../../utils/date';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { user, franchiseName } = useSelector((state: RootState) => state.auth);
  const { isOnShift, currentShift, handoverBanner } = useSelector((state: RootState) => state.shift);
  const { urgentBannerAlert, activeSosAlerts } = useSelector((state: RootState) => state.sos);
  const { stats: alertStats } = useSelector((state: RootState) => state.alert);

  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    assignedCameras: 0,
    openIncidents: 0,
    activeSos: 0,
  });
  const [liveDuration, setLiveDuration] = useState('00:00:00');

  // Live timer for active shift duration
  useEffect(() => {
    let timer: any = null;
    if (isOnShift && currentShift?.startTime) {
      const updateTimer = () => {
        const start = new Date(currentShift.startTime).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
        setLiveDuration(formatDuration(diffSeconds));
      };
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setLiveDuration('00:00:00');
    }
    return () => clearInterval(timer);
  }, [isOnShift, currentShift]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [dashData, shiftData, sosData] = await Promise.all([
        OperatorApi.getDashboard().catch(() => null),
        OperatorApi.getShiftStatus().catch(() => null),
        SOSApi.getActiveSosAlerts().catch(() => []),
      ]);

      if (dashData) {
        setDashboardStats(dashData.stats);
      }

      if (shiftData) {
        dispatch(
          setShiftStatus({
            isOnShift: shiftData.isOnShift,
            currentShift: shiftData.currentShift as any,
            lastShift: shiftData.lastShift,
          })
        );
      }

      if (sosData) {
        dispatch(setActiveSosAlerts(sosData));
      }
    } catch (error) {
      console.warn('[Dashboard] Error fetching dashboard data:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // 60s auto-refresh
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleClockIn = () => {
    Alert.alert('Start Shift', 'Are you ready to clock in and begin active monitoring?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock In',
        onPress: async () => {
          try {
            const shift = await OperatorApi.startShift();
            dispatch(clockInSuccess(shift));
            Alert.alert('Shift Started', 'You are now ON SHIFT. Camera feeds and alerts are synchronized.');
            loadDashboardData();
          } catch (e: any) {
            Alert.alert('Shift Error', e.response?.data?.message || 'Could not start shift.');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Operator'}</Text>
          {franchiseName && <Text style={styles.franchise}>{franchiseName}</Text>}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notificationBtn}
        >
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Realtime Urgent SOS Red Banner */}
        {urgentBannerAlert && (
          <BannerAlert
            title="EMERGENCY SOS ACTIVE"
            message={`SOS triggered at ${urgentBannerAlert.location || 'Assigned camera'}. Immediate response required!`}
            variant="danger"
            actionText="RESPOND"
            onPress={() => navigation.navigate('SOSDetail', { sosId: urgentBannerAlert._id })}
          />
        )}

        {/* Realtime Shift Handover Notes Banner */}
        {handoverBanner && (
          <BannerAlert
            title={`Handover Note from ${handoverBanner.operatorName || 'Operator'}`}
            message={handoverBanner.handoverNotes}
            variant="info"
            onDismiss={() => dispatch(dismissHandoverBanner())}
          />
        )}

        {/* Shift Command Card */}
        <Card variant="elevated" style={styles.shiftCard}>
          <View style={styles.shiftCardHeader}>
            <View style={styles.shiftTitleRow}>
              <Text style={styles.shiftCardTitle}>Shift Status</Text>
              <StatusPill
                label={isOnShift ? 'ON SHIFT' : 'OFF SHIFT'}
                variant={isOnShift ? 'on_shift' : 'off_shift'}
              />
            </View>

            {isOnShift && (
              <View style={styles.timerRow}>
                <Text style={styles.timerLabel}>ACTIVE DURATION</Text>
                <Text style={styles.timerValue}>{liveDuration}</Text>
              </View>
            )}
          </View>

          <View style={styles.shiftActionRow}>
            {isOnShift ? (
              <Button
                title="Clock Out & Handover"
                variant="destructive"
                onPress={() => navigation.navigate('ClockOutModal')}
                style={styles.shiftBtn}
              />
            ) : (
              <Button
                title="Clock In to Shift"
                variant="primary"
                onPress={handleClockIn}
                style={styles.shiftBtn}
              />
            )}
          </View>
        </Card>

        {/* Key Metrics Row */}
        <Text style={styles.sectionHeader}>Overview Metrics</Text>
        <View style={styles.statsRow}>
          {/* Assigned Cameras */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CamerasTab')}
            style={[styles.statBox, { borderColor: Colors.border }]}
          >
            <Text style={styles.statEmoji}>📹</Text>
            <Text style={styles.statNumber}>{dashboardStats.assignedCameras}</Text>
            <Text style={styles.statLabel}>Assigned Cameras</Text>
          </TouchableOpacity>

          {/* My Open Incidents */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('IncidentList')}
            style={[styles.statBox, { borderColor: Colors.border }]}
          >
            <Text style={styles.statEmoji}>📋</Text>
            <Text style={styles.statNumber}>{dashboardStats.openIncidents}</Text>
            <Text style={styles.statLabel}>My Incidents</Text>
          </TouchableOpacity>

          {/* Franchise Active SOS */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SOSTab')}
            style={[
              styles.statBox,
              {
                borderColor: dashboardStats.activeSos > 0 ? Colors.critical : Colors.border,
                backgroundColor: dashboardStats.activeSos > 0 ? 'rgba(220, 38, 38, 0.12)' : Colors.surface,
              },
            ]}
          >
            <Text style={styles.statEmoji}>🆘</Text>
            <Text
              style={[
                styles.statNumber,
                dashboardStats.activeSos > 0 ? { color: Colors.critical } : {},
              ]}
            >
              {dashboardStats.activeSos}
            </Text>
            <Text style={styles.statLabel}>Active SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CamerasTab')}
            style={styles.actionCard}
          >
            <Text style={styles.actionEmoji}>🎯</Text>
            <Text style={styles.actionTitle}>Watch Cameras</Text>
            <Text style={styles.actionDesc}>Live WebRTC & Playback</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AlertsTab')}
            style={styles.actionCard}
          >
            <Text style={styles.actionEmoji}>🔔</Text>
            <Text style={styles.actionTitle}>Pending Alerts</Text>
            <Text style={styles.actionDesc}>Triage & Acknowledge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ReportIncident')}
            style={styles.actionCard}
          >
            <Text style={styles.actionEmoji}>📝</Text>
            <Text style={styles.actionTitle}>Report Incident</Text>
            <Text style={styles.actionDesc}>File evidence & photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Reports')}
            style={styles.actionCard}
          >
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionTitle}>My Reports</Text>
            <Text style={styles.actionDesc}>30-shift analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Timeline')}
            style={styles.actionCard}
          >
            <Text style={styles.actionEmoji}>📰</Text>
            <Text style={styles.actionTitle}>Activity Timeline</Text>
            <Text style={styles.actionDesc}>Audit logs & shifts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SOSTab')}
            style={styles.actionCard}
          >
            <Text style={styles.actionEmoji}>🚨</Text>
            <Text style={styles.actionTitle}>SOS Emergency</Text>
            <Text style={styles.actionDesc}>Immediate dispatch</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  franchise: {
    fontSize: 11,
    color: Colors.primaryLight,
    fontWeight: '600',
    marginTop: 1,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  shiftCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 18,
  },
  shiftCardHeader: {
    marginBottom: 16,
  },
  shiftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  timerRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  timerValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.online,
    fontVariant: ['tabular-nums'],
  },
  shiftActionRow: {
    width: '100%',
  },
  shiftBtn: {
    width: '100%',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
  },
  actionCard: {
    width: '46%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    margin: '2%',
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  actionDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
