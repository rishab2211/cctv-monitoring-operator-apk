import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { StatusPill } from '../../components/common/StatusPill';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { socketService } from '../../services/socket.service';
import { setCameras, setSelectedCamera, setStatusFilter } from '../../store/slices/cameraSlice';
import { Camera, CameraStatus } from '../../types/camera.types';

interface CameraListScreenProps {
  navigation: any;
}

export const CameraListScreen: React.FC<CameraListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { cameras, statusFilter } = useSelector((state: RootState) => state.camera);

  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadCameras = async () => {
    try {
      const data = await OperatorApi.getAssignedCameras();
      dispatch(setCameras(data));

      // Subscribe to Socket.IO camera rooms for realtime alerts
      data.forEach((cam) => {
        socketService.joinCamera(cam._id);
      });
    } catch (e) {
      console.warn('[CameraList] Failed to load cameras:', e);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCameras();
    setRefreshing(false);
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchesFilter = statusFilter === 'all' || cam.status === statusFilter;
    const matchesSearch =
      search.trim() === '' ||
      cam.name.toLowerCase().includes(search.toLowerCase()) ||
      cam.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cam.location?.city && cam.location.city.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const renderFilterButton = (filter: 'all' | CameraStatus, label: string) => {
    const isActive = statusFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        activeOpacity={0.8}
        onPress={() => dispatch(setStatusFilter(filter))}
        style={[
          styles.filterChip,
          isActive ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : {},
        ]}
      >
        <Text style={[styles.filterText, isActive ? { color: '#FFFFFF', fontWeight: '800' } : {}]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCameraCard = ({ item }: { item: Camera }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        dispatch(setSelectedCamera(item));
        navigation.navigate('CameraDetail', { cameraId: item._id });
      }}
      style={styles.cameraCard}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleArea}>
          <Text numberOfLines={1} style={styles.cameraName}>
            {item.name}
          </Text>
          <Text style={styles.serial}>{item.serialNumber}</Text>
        </View>
        <StatusPill label={item.status} variant={item.status} size="small" />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.locationText}>
          📍 {item.location?.street || item.location?.city ? `${item.location.street || ''} ${item.location.city || ''}` : 'Location unconfigured'}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.tagRow}>
          {item.settings?.talkbackEnabled && (
            <View style={styles.talkbackBadge}>
              <Text style={styles.talkbackBadgeText}>🎙️ Talkback</Text>
            </View>
          )}
          {item.settings?.recordingEnabled && (
            <View style={styles.recBadge}>
              <Text style={styles.recBadgeText}>REC</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LiveView', { cameraId: item._id, cameraName: item.name })}
          style={styles.watchLiveBtn}
        >
          <Text style={styles.watchLiveText}>▶ Watch Live</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Assigned Cameras" subtitle={`${filteredCameras.length} monitoring feeds`} />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by name, serial number, or city..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('online', 'Online')}
        {renderFilterButton('offline', 'Offline')}
        {renderFilterButton('maintenance', 'Maintenance')}
      </View>

      {/* Camera List */}
      <FlatList
        data={filteredCameras}
        keyExtractor={(item) => item._id}
        renderItem={renderCameraCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📹</Text>
            <Text style={styles.emptyTitle}>No Cameras Found</Text>
            <Text style={styles.emptySub}>No cameras match your active search or status filter.</Text>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  cameraCard: {
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
  titleArea: {
    flex: 1,
    marginRight: 10,
  },
  cameraName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  serial: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  cardBody: {
    marginVertical: 10,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceElevated,
    paddingTop: 10,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  talkbackBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  talkbackBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  recBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.critical,
  },
  watchLiveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  watchLiveText: {
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
