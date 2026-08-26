import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertCircleIcon,
  BellIcon,
  CheckmarkCircle02Icon,
  FireIcon,
  SirenIcon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { StatusPill } from '../../components/common/StatusPill';
import { AppIcon } from '../../components/common/AppIcon';
import { AlertApi } from '../../api/endpoints/alert.api';
import { OperatorApi } from '../../api/endpoints/operator.api';
import {
  alertAcknowledgedSuccess,
  setActiveAlerts,
  setPendingAlerts,
} from '../../store/slices/alertSlice';
import { Alert as AlertType } from '../../types/alert.types';
import { formatRelativeTime } from '../../utils/date';
import { socketService } from '../../services/socket.service';

interface AlertListScreenProps {
  navigation: any;
}

export const AlertListScreen: React.FC<AlertListScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { pendingAlerts, activeAlerts } = useSelector((state: RootState) => state.alert);

  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async () => {
    try {
      const [pending, active] = await Promise.all([
        OperatorApi.getPendingAlerts(),
        OperatorApi.getActiveAlerts(),
      ]);
      dispatch(setPendingAlerts(pending));
      dispatch(setActiveAlerts(active));
    } catch (e) {
      console.warn('[AlertList] Error loading alerts:', e);
    }
  };

  useEffect(() => {
    loadAlerts();

    const unsubNewAlert = socketService.on('new_alert', () => {
      loadAlerts();
    });
    const unsubAck = socketService.on('alert_acknowledged', () => {
      loadAlerts();
    });
    const unsubResolved = socketService.on('alert_resolved', () => {
      loadAlerts();
    });
    const unsubEscalated = socketService.on('alert_escalated', () => {
      loadAlerts();
    });

    return () => {
      unsubNewAlert();
      unsubAck();
      unsubResolved();
      unsubEscalated();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const updated = await AlertApi.acknowledgeAlert(alertId);
      dispatch(alertAcknowledgedSuccess(updated));
    } catch (e: any) {
      console.warn('[AlertList] Acknowledge error:', e);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'motion':
        return { icon: SirenIcon, color: Colors.critical };
      case 'fire':
        return { icon: FireIcon, color: Colors.critical };
      case 'hazard':
        return { icon: AlertCircleIcon, color: Colors.warning };
      case 'tampering':
        return { icon: Wrench01Icon, color: Colors.warning };
      default:
        return { icon: BellIcon, color: Colors.info };
    }
  };

  const renderAlertCard = ({ item }: { item: AlertType }) => {
    const cameraName =
      typeof item.cameraId === 'object' && item.cameraId !== null
        ? item.cameraId.name
        : 'Assigned Camera';

    const iconData = getAlertIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AlertDetail', { alertId: item._id })}
        style={[
          styles.alertCard,
          item.priority === 'critical' ? { borderColor: Colors.critical } : {},
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconTitleRow}>
            <View style={styles.alertIconBox}>
              <AppIcon icon={iconData.icon} size="md" color={iconData.color} />
            </View>
            <View>
              <Text style={styles.cameraTitle}>{cameraName}</Text>
              <Text style={styles.relativeTime}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
          </View>
          <StatusPill label={item.priority} variant={item.priority as any} size="small" />
        </View>

        <Text numberOfLines={2} style={styles.description}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <StatusPill label={item.status} variant={item.status as any} size="small" />

          {item.status === 'new' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAcknowledge(item._id)}
              style={styles.ackBtn}
            >
              <AppIcon icon={CheckmarkCircle02Icon} size="xs" color="#000000" />
              <Text style={styles.ackBtnText}>Acknowledge</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const currentList = activeTab === 'pending' ? pendingAlerts : activeAlerts;

  return (
    <View style={styles.container}>
      <Header title="Alert Management" subtitle={`${pendingAlerts.length} pending triage`} />

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('pending')}
          style={[styles.tab, activeTab === 'pending' ? styles.activeTab : {}]}
        >
          <Text style={[styles.tabText, activeTab === 'pending' ? styles.activeTabText : {}]}>
            Pending ({pendingAlerts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('active')}
          style={[styles.tab, activeTab === 'active' ? styles.activeTab : {}]}
        >
          <Text style={[styles.tabText, activeTab === 'active' ? styles.activeTabText : {}]}>
            Active / Investigating ({activeAlerts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentList}
        keyExtractor={(item) => item._id}
        renderItem={renderAlertCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppIcon icon={CheckmarkCircle02Icon} size="xxl" color={Colors.online} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'pending' ? 'All Clear' : 'No Active Alerts'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'pending'
                ? 'No pending alerts requiring immediate operator triage.'
                : 'No alerts currently being investigated.'}
            </Text>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.surface,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primaryLight,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  alertCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconBox: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  relativeTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceElevated,
    paddingTop: 10,
  },
  ackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.online,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ackBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
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
