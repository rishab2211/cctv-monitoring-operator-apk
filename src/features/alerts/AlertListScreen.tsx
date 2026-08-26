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
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { StatusPill } from '../../components/common/StatusPill';
import { AlertApi } from '../../api/endpoints/alert.api';
import { OperatorApi } from '../../api/endpoints/operator.api';
import {
  alertAcknowledgedSuccess,
  setActiveAlerts,
  setPendingAlerts,
} from '../../store/slices/alertSlice';
import { Alert as AlertType } from '../../types/alert.types';
import { formatRelativeTime } from '../../utils/date';

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
        return '🚨';
      case 'fire':
        return '🔥';
      case 'hazard':
        return '⚠️';
      case 'tampering':
        return '🔧';
      default:
        return '🔔';
    }
  };

  const renderAlertCard = ({ item }: { item: AlertType }) => {
    const cameraName =
      typeof item.cameraId === 'object' && item.cameraId !== null
        ? item.cameraId.name
        : 'Assigned Camera';

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
            <Text style={styles.alertIcon}>{getAlertIcon(item.type)}</Text>
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
              <Text style={styles.ackBtnText}>✓ Acknowledge</Text>
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
            <Text style={styles.emptyEmoji}>✅</Text>
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
  alertIcon: {
    fontSize: 22,
    marginRight: 10,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
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
