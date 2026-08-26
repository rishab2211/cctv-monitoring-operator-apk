import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Add01Icon,
  AlertDiamondIcon,
  CameraVideoIcon,
  ClipboardIcon,
  File01Icon,
  LockIcon,
  ShieldCheckIcon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { StatusPill } from '../../components/common/StatusPill';
import { AppIcon } from '../../components/common/AppIcon';
import { IncidentApi } from '../../api/endpoints/incident.api';
import { Incident, IncidentStatus } from '../../types/incident.types';
import { formatRelativeTime } from '../../utils/date';

interface IncidentListScreenProps {
  navigation: any;
}

export const IncidentListScreen: React.FC<IncidentListScreenProps> = ({ navigation }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadIncidents = async () => {
    try {
      const data = await IncidentApi.getIncidents({
        page: 1,
        limit: 30,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setIncidents(data.incidents);
    } catch (e) {
      console.warn('[IncidentList] Error loading incidents:', e);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncidents();
    setRefreshing(false);
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'theft':
        return { icon: LockIcon, color: Colors.critical };
      case 'vandalism':
        return { icon: AlertDiamondIcon, color: Colors.warning };
      case 'safety':
        return { icon: ShieldCheckIcon, color: Colors.online };
      case 'maintenance':
        return { icon: Wrench01Icon, color: Colors.info };
      default:
        return { icon: File01Icon, color: Colors.textSecondary };
    }
  };

  const renderIncidentCard = ({ item }: { item: Incident }) => {
    const cameraName =
      typeof item.cameraId === 'object' && item.cameraId !== null
        ? item.cameraId.name
        : 'General Incident';

    const iconData = getIncidentIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('IncidentDetail', { incidentId: item._id })}
        style={styles.incidentCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleArea}>
            <View style={styles.iconTitleRow}>
              <View style={styles.typeIconBox}>
                <AppIcon icon={iconData.icon} size="md" color={iconData.color} />
              </View>
              <Text numberOfLines={1} style={styles.title}>
                {item.title}
              </Text>
            </View>
            <View style={styles.cameraRow}>
              <AppIcon icon={CameraVideoIcon} size="xs" color={Colors.textMuted} />
              <Text style={styles.cameraName}>{cameraName}</Text>
            </View>
          </View>
          <StatusPill label={item.severity} variant={item.severity as any} size="small" />
        </View>

        <Text numberOfLines={2} style={styles.desc}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <StatusPill label={item.status} variant={item.status as any} size="small" />
          <Text style={styles.timeAgo}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Incident Management"
        subtitle={`${incidents.length} assigned incidents`}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ReportIncident')}
            style={styles.createBtn}
          >
            <AppIcon icon={Add01Icon} size="xs" color="#FFFFFF" />
            <Text style={styles.createBtnText}>New Report</Text>
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'open', 'investigating', 'resolved', 'closed'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            activeOpacity={0.8}
            onPress={() => setStatusFilter(filter)}
            style={[styles.filterChip, statusFilter === filter ? styles.activeChip : {}]}
          >
            <Text style={[styles.filterText, statusFilter === filter ? styles.activeFilterText : {}]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={incidents}
        keyExtractor={(item) => item._id}
        renderItem={renderIncidentCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppIcon icon={ClipboardIcon} size="xxl" color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Incidents Found</Text>
            <Text style={styles.emptySub}>No incidents match your selected filter.</Text>
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  activeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  incidentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
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
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconBox: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cameraName: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  desc: {
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
  timeAgo: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyContainer: {
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
