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
import { useDispatch, useSelector } from 'react-redux';
import {
  CameraVideoIcon,
  CassetteTapeIcon,
  Location01Icon,
  Mic01Icon,
  PlayIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { StatusPill } from '../../components/common/StatusPill';
import { AppIcon } from '../../components/common/AppIcon';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { socketService } from '../../services/socket.service';
import { setCameras, setSelectedCamera, setStatusFilter, updateCameraStatus } from '../../store/slices/cameraSlice';
import { Camera, CameraStatus } from '../../types/camera.types';
import { getApiErrorMessage } from '../../utils/error';

interface CameraListScreenProps {
  navigation: any;
}

export const CameraListScreen: React.FC<CameraListScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { cameras, statusFilter } = useSelector((state: RootState) => state.camera);

  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadCameras = React.useCallback(async () => {
    try {
      const data = await OperatorApi.getAssignedCameras();
      dispatch(setCameras(data));

      // Subscribe to Socket.IO camera rooms for realtime alerts
      data.forEach((cam) => {
        socketService.joinCamera(cam._id);
      });
    } catch (e) {
      console.warn('[CameraList] Failed to load cameras:', getApiErrorMessage(e));
    }
  }, [dispatch]);

  useEffect(() => {
    loadCameras();

    const handleCameraStatus = (payload: { cameraId?: string; id?: string; status: CameraStatus }) => {
      const targetId = payload.cameraId || payload.id;
      if (targetId && payload.status) {
        dispatch(updateCameraStatus({ cameraId: targetId, status: payload.status }));
      }
    };

    socketService.on('camera_status', handleCameraStatus);
    return () => {
      socketService.off('camera_status', handleCameraStatus);
    };
  }, [loadCameras, dispatch]);

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
        activeOpacity={0.7}
        onPress={() => dispatch(setStatusFilter(filter))}
        style={[styles.filterChip, isActive && styles.activeFilterChip]}
      >
        <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
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
        <View style={styles.locationRow}>
          <AppIcon icon={Location01Icon} size="xs" color={Colors.textMuted} />
          <Text numberOfLines={1} style={styles.locationText}>
            {item.location?.street || item.location?.city
              ? `${item.location.street || ''} ${item.location.city || ''}`
              : 'Location unconfigured'}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.tagRow}>
          {item.settings?.talkbackEnabled && (
            <View style={styles.talkbackBadge}>
              <AppIcon icon={Mic01Icon} size="xs" color={Colors.secondary} />
              <Text style={styles.talkbackBadgeText}>Talkback</Text>
            </View>
          )}
          {item.settings?.recordingEnabled && (
            <View style={styles.recBadge}>
              <Text style={styles.recBadgeText}>REC</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActionsRow}>
          {item.settings?.talkbackEnabled && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('TalkbackActive', {
                  cameraId: item._id,
                  cameraName: item.name,
                })
              }
              style={styles.cardActionBtn}
            >
              <AppIcon icon={Mic01Icon} size="xs" color={Colors.secondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('RecordingPlayback', {
                cameraId: item._id,
                cameraName: item.name,
              })
            }
            style={styles.cardActionBtn}
          >
            <AppIcon icon={CassetteTapeIcon} size="xs" color={Colors.primaryLight} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('LiveView', { cameraId: item._id, cameraName: item.name })
            }
            style={styles.watchLiveBtn}
          >
            <AppIcon icon={PlayIcon} size="xs" color="#FFFFFF" />
            <Text style={styles.watchLiveText}>Watch Live</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Assigned Cameras" subtitle={`${filteredCameras.length} monitoring feeds`} />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <AppIcon icon={Search01Icon} size="sm" color={Colors.textMuted} />
          <TextInput
            placeholder="Search by name, serial number, or city..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
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
            <AppIcon icon={CameraVideoIcon} size="xxl" color={Colors.textMuted} />
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
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
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '800',
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 4,
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
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 6,
  },
  watchLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  watchLiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
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
