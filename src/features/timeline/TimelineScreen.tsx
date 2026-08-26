import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BellIcon,
  ClipboardIcon,
  FlashIcon,
  Login01Icon,
  Logout01Icon,
  Mic01Icon,
  SirenIcon,
  TimelineIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { AppIcon } from '../../components/common/AppIcon';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { OperatorTimelineItem } from '../../types/reports.types';
import { formatDateTime } from '../../utils/date';

interface TimelineScreenProps {
  navigation: any;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({ navigation }) => {
  const [timeline, setTimeline] = useState<OperatorTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTimeline = async () => {
    try {
      const data = await OperatorApi.getTimeline();
      setTimeline(data);
    } catch (e) {
      console.warn('[Timeline] Error loading operator activity timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTimeline();
    setRefreshing(false);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CLOCK_IN')) return { icon: Login01Icon, color: Colors.online };
    if (action.includes('CLOCK_OUT')) return { icon: Logout01Icon, color: Colors.textMuted };
    if (action.includes('ALERT')) return { icon: BellIcon, color: Colors.warning };
    if (action.includes('INCIDENT')) return { icon: ClipboardIcon, color: Colors.primaryLight };
    if (action.includes('SOS')) return { icon: SirenIcon, color: Colors.critical };
    if (action.includes('TALKBACK')) return { icon: Mic01Icon, color: Colors.secondary };
    return { icon: FlashIcon, color: Colors.primaryLight };
  };

  const renderTimelineItem = ({ item, index }: { item: OperatorTimelineItem; index: number }) => {
    const iconData = getActionIcon(item.action);

    return (
      <View style={styles.itemContainer}>
        <View style={styles.lineCol}>
          <View style={styles.actionIconBox}>
            <AppIcon icon={iconData.icon} size="xs" color={iconData.color} />
          </View>
          {index !== timeline.length - 1 && <View style={styles.line} />}
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.actionTitle}>{item.action.replace(/_/g, ' ')}</Text>
          <Text style={styles.desc}>{item.description}</Text>
          <Text style={styles.timestamp}>{formatDateTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Activity Timeline" subtitle="Chronological operator audit log" onBack={() => navigation.goBack()} />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={timeline}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderTimelineItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <AppIcon icon={TimelineIcon} size="xxl" color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Activity Logs</Text>
              <Text style={styles.emptySub}>Your actions during active shifts will be recorded here.</Text>
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
    padding: 20,
  },
  itemContainer: {
    flexDirection: 'row',
  },
  lineCol: {
    alignItems: 'center',
    width: 32,
  },
  actionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  itemContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 22,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
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
