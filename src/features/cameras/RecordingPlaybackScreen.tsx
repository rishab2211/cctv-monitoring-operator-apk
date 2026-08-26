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
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { CameraApi } from '../../api/endpoints/camera.api';
import { RecordingChunk, RecordingTimelineItem } from '../../types/camera.types';

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

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [timelineItems, setTimelineItems] = useState<RecordingTimelineItem[]>([]);
  const [chunks, setChunks] = useState<RecordingChunk[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const timeline = await CameraApi.getRecordingTimeline(cameraId, selectedDate);
      setTimelineItems(timeline);

      const startTime = `${selectedDate}T00:00:00.000Z`;
      const endTime = `${selectedDate}T23:59:59.999Z`;
      const chunkList = await CameraApi.getRecordingPlayback(cameraId, startTime, endTime);
      setChunks(chunkList);
    } catch (e: any) {
      console.warn('[Playback] Error loading recordings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, [cameraId, selectedDate]);

  const handleDownload = async (recordingId: string) => {
    try {
      const { downloadUrl } = await CameraApi.getRecordingDownloadUrl(recordingId);
      if (downloadUrl) {
        Linking.openURL(downloadUrl);
      }
    } catch (e: any) {
      Alert.alert('Download Error', e.response?.data?.message || 'Could not generate download link.');
    }
  };

  const renderChunkItem = ({ item }: { item: RecordingChunk }) => (
    <View style={styles.chunkCard}>
      <View style={styles.chunkHeader}>
        <View>
          <Text style={styles.chunkTime}>
            ⏱ {new Date(item.startTime).toLocaleTimeString()} - {new Date(item.endTime).toLocaleTimeString()}
          </Text>
          <Text style={styles.chunkMeta}>
            Duration: {Math.round(item.durationSeconds / 60)} mins • Type: {item.type}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleDownload(item._id)}
          style={styles.downloadBtn}
        >
          <Text style={styles.downloadText}>⬇ Download</Text>
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
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Select Date (YYYY-MM-DD):</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textMuted}
          style={styles.dateInput}
          value={selectedDate}
          onChangeText={setSelectedDate}
        />
      </View>

      {/* Timeline Segments Summary */}
      <View style={styles.timelineSummary}>
        <Text style={styles.summaryText}>
          Available Segments for {selectedDate}: {timelineItems.length}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chunks}
          keyExtractor={(item) => item._id}
          renderItem={renderChunkItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📼</Text>
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 10,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
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
  chunkTime: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  chunkMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  downloadBtn: {
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
