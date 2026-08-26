import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  Clock01Icon,
  FileEditIcon,
  SirenIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { AppIcon } from '../../components/common/AppIcon';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { ShiftHistoryItem } from '../../types/shift.types';
import { formatDateTime, formatDuration } from '../../utils/date';

interface ShiftHistoryScreenProps {
  navigation: any;
}

const PAGE_SIZE = 20;

export const ShiftHistoryScreen: React.FC<ShiftHistoryScreenProps> = ({ navigation }) => {
  const [shifts, setShifts] = useState<ShiftHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<{ [key: string]: boolean }>({});

  const fetchShifts = useCallback(async (pageToFetch: number, isRefresh = false) => {
    try {
      const data = await OperatorApi.getShiftsHistory(pageToFetch, PAGE_SIZE);
      const newShifts = data.shifts || [];

      if (isRefresh) {
        setShifts(newShifts);
      } else {
        setShifts((prev) => [...prev, ...newShifts]);
      }

      setHasMore(newShifts.length === PAGE_SIZE && shifts.length + newShifts.length < (data.total || 0));
    } catch (e) {
      console.warn('[ShiftHistory] Error loading shifts:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [shifts.length]);

  useEffect(() => {
    fetchShifts(1, true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchShifts(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoadingMore(true);
      fetchShifts(nextPage, false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderShiftItem = ({ item }: { item: ShiftHistoryItem }) => {
    const isExpanded = !!expandedNotes[item._id];
    const durationSec =
      item.durationSeconds ||
      (item.durationMs ? Math.floor(item.durationMs / 1000) : 0);

    return (
      <View style={styles.shiftCard}>
        {/* Card Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.shiftDate}>{formatDateTime(item.startTime)}</Text>
            {item.endTime ? (
              <Text style={styles.shiftEndSub}>Ended: {formatDateTime(item.endTime)}</Text>
            ) : (
              <Text style={[styles.shiftEndSub, { color: Colors.online }]}>Active Shift</Text>
            )}
          </View>
          <View style={styles.durationPill}>
            <Text style={styles.durationText}>
              {durationSec > 0 ? formatDuration(durationSec) : 'In Progress'}
            </Text>
          </View>
        </View>

        {/* Metrics Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <AppIcon icon={ClipboardIcon} size="xs" color={Colors.primaryLight} />
            <Text style={styles.statText}>
              Incidents Resolved: <Text style={styles.statBold}>{item.incidentsResolved || 0}</Text>
            </Text>
          </View>
          <View style={styles.statBadge}>
            <AppIcon icon={SirenIcon} size="xs" color={Colors.critical} />
            <Text style={styles.statText}>
              SOS Acknowledged: <Text style={styles.statBold}>{item.sosAcknowledged || 0}</Text>
            </Text>
          </View>
        </View>

        {/* Handover Notes (Expandable) */}
        {item.handoverNotes ? (
          <View style={styles.notesContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleExpand(item._id)}
              style={styles.notesHeaderRow}
            >
              <View style={styles.notesTitleRow}>
                <AppIcon icon={FileEditIcon} size="xs" color={Colors.primaryLight} />
                <Text style={styles.notesHeaderTitle}>Handover Notes</Text>
              </View>
              <View style={styles.expandToggleRow}>
                <Text style={styles.expandToggleText}>{isExpanded ? 'Collapse' : 'Expand'}</Text>
                <AppIcon
                  icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                  size="xs"
                  color={Colors.primaryLight}
                />
              </View>
            </TouchableOpacity>

            <Text
              style={styles.notesContent}
              numberOfLines={isExpanded ? undefined : 2}
            >
              "{item.handoverNotes}"
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="My Shift History"
        subtitle="Historical station monitoring sessions"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading shift history...</Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item) => item._id}
          renderItem={renderShiftItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <AppIcon icon={Clock01Icon} size="xxl" color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Shifts Recorded</Text>
              <Text style={styles.emptySub}>
                Your concluded monitoring shifts and handover notes will appear here.
              </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  shiftCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  shiftDate: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  shiftEndSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  durationPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.online,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceElevated,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  statBold: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  notesContainer: {
    marginTop: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 10,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  expandToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginRight: 2,
  },
  notesContent: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
