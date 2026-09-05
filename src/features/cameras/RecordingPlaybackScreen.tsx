import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar03Icon,
  CassetteTapeIcon,
  Clock01Icon,
  Download01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { AppIcon } from '../../components/common/AppIcon';
import { CameraApi } from '../../api/endpoints/camera.api';
import { RecordingChunk, RecordingTimelineItem } from '../../types/camera.types';
import { getApiErrorMessage } from '../../utils/error';
import { formatDateYMD } from '../../utils/date';

interface RecordingPlaybackScreenProps {
  navigation: any;
  route: {
    params: {
      cameraId: string;
      cameraName?: string;
    };
  };
}

export const RecordingPlaybackScreen: React.FC<RecordingPlaybackScreenProps> = ({
  navigation,
  route,
}) => {
  const { cameraId, cameraName } = route.params;

  const today = formatDateYMD(new Date());
  const yesterday = formatDateYMD(new Date(Date.now() - 86400000));

  const [selectedDate, setSelectedDate] = useState(today);
  const [timelineItems, setTimelineItems] = useState<RecordingTimelineItem[]>([]);
  const [chunks, setChunks] = useState<RecordingChunk[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecordings = React.useCallback(async () => {
    setLoading(true);
    try {
      const timeline = await CameraApi.getRecordingTimeline(cameraId, selectedDate);
      setTimelineItems(timeline);

      const startTime = `${selectedDate}T00:00:00.000Z`;
      const endTime = `${selectedDate}T23:59:59.999Z`;
      const chunkList = await CameraApi.getRecordingPlayback(cameraId, startTime, endTime);
      setChunks(chunkList);
    } catch (e: any) {
      console.warn('[Playback] Error loading recordings:', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [cameraId, selectedDate]);

  useEffect(() => {
    loadRecordings();
  }, [cameraId, selectedDate, loadRecordings]);

  const handleDownload = async (recordingId: string) => {
    try {
      const { downloadUrl } = await CameraApi.getRecordingDownloadUrl(recordingId);
      if (downloadUrl) {
        Linking.openURL(downloadUrl);
      }
    } catch (e: any) {
      Alert.alert('Download Error', getApiErrorMessage(e, 'Could not generate download link.'));
    }
  };

  const renderChunkItem = ({ item }: { item: RecordingChunk }) => (
    <View style={styles.chunkCard}>
      <View style={styles.chunkHeader}>
        <View>
          <View style={styles.chunkTimeRow}>
            <AppIcon icon={Clock01Icon} size="xs" color={Colors.textSecondary} />
            <Text style={styles.chunkTime}>
              {new Date(item.startTime).toLocaleTimeString()} - {new Date(item.endTime).toLocaleTimeString()}
            </Text>
          </View>
          <Text style={styles.chunkMeta}>
            Duration: {Math.round(item.durationSeconds / 60)} mins • Type: {item.type}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleDownload(item._id)}
          style={styles.downloadBtn}
        >
          <AppIcon icon={Download01Icon} size="xs" color={Colors.primaryLight} />
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Recording Playback"
        subtitle={cameraName || 'Camera History'}
        onBack={() => navigation.goBack()}
      />

      {/* Date Filter */}
      <View style={styles.dateSection}>
        <View style={styles.quickDateRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedDate(today)}
            style={[
              styles.quickDateChip,
              selectedDate === today && styles.activeQuickDateChip,
            ]}
          >
            <Text style={[styles.quickDateText, selectedDate === today && styles.activeQuickDateText]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedDate(yesterday)}
            style={[
              styles.quickDateChip,
              selectedDate === yesterday && styles.activeQuickDateChip,
            ]}
          >
            <Text style={[styles.quickDateText, selectedDate === yesterday && styles.activeQuickDateText]}>
              Yesterday
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateInputRow}>
          <AppIcon icon={Calendar03Icon} size="sm" color={Colors.textMuted} />
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            style={styles.dateInput}
            value={selectedDate}
            onChangeText={setSelectedDate}
          />
        </View>
      </View>

      {/* Timeline Segments Summary */}
      <View style={styles.timelineSummary}>
        <Text style={styles.summaryText}>
          Available Segments for {selectedDate}: {timelineItems.length}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loaderMargin} />
      ) : (
        <FlatList
          data={chunks}
          keyExtractor={(item) => item._id}
          renderItem={renderChunkItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <AppIcon icon={CassetteTapeIcon} size="xxl" color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Recordings Found</Text>
              <Text style={styles.emptySub}>
                No video footage recorded for this camera on {selectedDate}.
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
  dateSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quickDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickDateChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  activeQuickDateChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeQuickDateText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  loaderMargin: {
    marginTop: 40,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  timelineSummary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceElevated,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  chunkCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  chunkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chunkTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chunkTime: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  chunkMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginLeft: 6,
  },
  emptyBox: {
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
