import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { IncidentApi } from '../../api/endpoints/incident.api';
import { IncidentTimelineEntry } from '../../types/incident.types';
import { formatDateTime } from '../../utils/date';

interface IncidentTimelineScreenProps {
  navigation: any;
  route: {
    params: {
      incidentId: string;
    };
  };
}

export const IncidentTimelineScreen: React.FC<IncidentTimelineScreenProps> = ({
  navigation,
  route,
}) => {
  const { incidentId } = route.params;
  const [timeline, setTimeline] = useState<IncidentTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    IncidentApi.getTimeline(incidentId)
      .then(setTimeline)
      .catch((e) => console.warn('[IncidentTimeline] Error loading timeline:', e))
      .finally(() => setLoading(false));
  }, [incidentId]);

  const renderTimelineNode = ({ item, index }: { item: IncidentTimelineEntry; index: number }) => (
    <View style={styles.nodeContainer}>
      <View style={styles.lineIndicatorCol}>
        <View style={styles.nodeDot} />
        {index !== timeline.length - 1 && <View style={styles.nodeLine} />}
      </View>

      <View style={styles.nodeContent}>
        <Text style={styles.actionTitle}>{item.action.replace(/_/g, ' ')}</Text>
        <Text style={styles.actionDesc}>{item.description}</Text>
        <Text style={styles.timeText}>{formatDateTime(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Incident Audit Trail" onBack={() => navigation.goBack()} />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={timeline}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderTimelineNode}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No activity logged for this incident.</Text>
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
  nodeContainer: {
    flexDirection: 'row',
  },
  lineIndicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surfaceElevated,
  },
  nodeLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  nodeContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
