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
    if (action.includes('CLOCK_IN')) return '🟢';
    if (action.includes('CLOCK_OUT')) return '🔴';
    if (action.includes('ALERT')) return '🔔';
    if (action.includes('INCIDENT')) return '📋';
    if (action.includes('SOS')) return '🆘';
    if (action.includes('TALKBACK')) return '🎙️';
    return '⚡';
  };

  const renderTimelineItem = ({ item, index }: { item: OperatorTimelineItem; index: number }) => (
    <View style={styles.itemContainer}>
      <View style={styles.lineCol}>
        <Text style={styles.actionEmoji}>{getActionIcon(item.action)}</Text>
        {index !== timeline.length - 1 && <View style={styles.line} />}
      </View>

      <View style={styles.itemContent}>
        <Text style={styles.actionTitle}>{item.action.replace(/_/g, ' ')}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.timestamp}>{formatDateTime(item.createdAt)}</Text>
      </View>
    </View>
  );

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
              <Text style={styles.emptyEmoji}>📰</Text>
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
  actionEmoji: {
    fontSize: 16,
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
