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
  ChevronRightIcon,
  Location01Icon,
  Message01Icon,
  ShieldCheckIcon,
  SirenIcon,
} from '@hugeicons/core-free-icons';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { StatusPill } from '../../components/common/StatusPill';
import { AppIcon } from '../../components/common/AppIcon';
import { SOSApi } from '../../api/endpoints/sos.api';
import { setActiveSosAlerts } from '../../store/slices/sosSlice';
import { SOSAlert } from '../../types/sos.types';
import { formatRelativeTime } from '../../utils/date';

interface SOSListScreenProps {
  navigation: any;
}

export const SOSListScreen: React.FC<SOSListScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { activeSosAlerts } = useSelector((state: RootState) => state.sos);
  const [allSosList, setAllSosList] = useState<SOSAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSOS = async () => {
    try {
      const [active, history] = await Promise.all([
        SOSApi.getActiveSosAlerts(),
        SOSApi.getSosAlerts({ page: 1, limit: 30 }),
      ]);
      dispatch(setActiveSosAlerts(active));
      setAllSosList(history.alerts);
    } catch (e) {
      console.warn('[SOSList] Error loading SOS alerts:', e);
    }
  };

  useEffect(() => {
    loadSOS();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSOS();
    setRefreshing(false);
  };

  const renderSosCard = ({ item }: { item: SOSAlert }) => {
    const userName =
      typeof item.triggeredBy === 'object' && item.triggeredBy !== null
        ? item.triggeredBy.name
        : 'Emergency User';

    const isActive = item.status === 'active';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SOSDetail', { sosId: item._id })}
        style={[
          styles.sosCard,
          isActive ? styles.activeSosCard : {},
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userRow}>
            <View style={styles.sosIconBox}>
              <AppIcon icon={SirenIcon} size="md" color={Colors.critical} />
            </View>
            <View>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.timeAgo}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
          </View>
          <StatusPill
            label={item.status}
            variant={item.status === 'active' ? 'critical' : item.status === 'acknowledged' ? 'high' : 'resolved'}
            size="small"
          />
        </View>

        <View style={styles.locationRow}>
          <AppIcon icon={Location01Icon} size="xs" color={Colors.textMuted} />
          <Text numberOfLines={2} style={styles.locationText}>
            {item.location || 'Location coordinates not provided'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.notesCountRow}>
            <AppIcon icon={Message01Icon} size="xs" color={Colors.textMuted} />
            <Text style={styles.notesCount}>
              {item.notes?.length || 0} investigation notes
            </Text>
          </View>
          <View style={styles.viewDetailRow}>
            <Text style={styles.viewDetail}>Respond / Details</Text>
            <AppIcon icon={ChevronRightIcon} size="xs" color={Colors.primaryLight} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="SOS Emergencies"
        subtitle={`${activeSosAlerts.length} urgent panic events active`}
      />

      <FlatList
        data={allSosList.length > 0 ? allSosList : activeSosAlerts}
        keyExtractor={(item) => item._id}
        renderItem={renderSosCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.critical} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppIcon icon={ShieldCheckIcon} size="xxl" color={Colors.online} />
            <Text style={styles.emptyTitle}>No SOS Alerts</Text>
            <Text style={styles.emptySub}>No active emergency panics reported in your franchise territory.</Text>
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
  sosCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  activeSosCard: {
    borderColor: Colors.critical,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sosIconBox: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  timeAgo: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceElevated,
    paddingTop: 10,
  },
  notesCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetail: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginRight: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
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
