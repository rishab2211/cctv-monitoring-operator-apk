import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertCircleIcon,
  CassetteTapeIcon,
  Location01Icon,
  Mic01Icon,
  PlayIcon,
} from '@hugeicons/core-free-icons';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/common/Button';
import { AppIcon } from '../../components/common/AppIcon';
import { CameraApi } from '../../api/endpoints/camera.api';
import { Camera, CameraHealth } from '../../types/camera.types';
import { getApiErrorMessage } from '../../utils/error';
import { formatRelativeTime, formatDateTime } from '../../utils/date';

interface CameraDetailScreenProps {
  route: any;
  navigation: any;
}

export const CameraDetailScreen: React.FC<CameraDetailScreenProps> = ({ route, navigation }) => {
  const { cameraId } = route.params;
  const dispatch = useDispatch();

  const reduxCamera = useSelector((state: RootState) =>
    state.camera.cameras.find((c) => c._id === cameraId) || state.camera.selectedCamera
  );

  const [camera, setCamera] = useState<Camera | null>(reduxCamera || null);
  const [loading, setLoading] = useState(!reduxCamera);

  const [health, setHealth] = useState<CameraHealth>({
    cpuUsage: reduxCamera?.health?.cpuUsage || 0,
    memoryUsage: reduxCamera?.health?.memoryUsage || 0,
    temperature: reduxCamera?.health?.temperature || 0,
    storageUsage: reduxCamera?.health?.storageUsage || 0,
    lastPing: reduxCamera?.health?.lastPing || null,
  });

  const loadCamera = async () => {
    try {
      const fetched = await CameraApi.getCameraById(cameraId);
      setCamera(fetched);
      if (fetched.health) {
        setHealth(fetched.health);
      }
    } catch (e) {
      console.warn('[CameraDetail] Error loading camera details:', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCamera();
    const interval = setInterval(loadCamera, 15000); // 15-second telemetry polling
    return () => clearInterval(interval);
  }, [cameraId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="Camera Details" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!camera) {
    return (
      <View style={styles.container}>
        <Header title="Camera Details" onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Camera not found or unassigned.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={camera.name}
        subtitle={camera.serialNumber}
        onBack={() => navigation.goBack()}
        rightAction={<StatusPill label={camera.status} variant={camera.status} size="small" />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Action Banner */}
        <View style={styles.actionBanner}>
          <Button
            title="Watch Live Stream"
            variant="primary"
            icon={<AppIcon icon={PlayIcon} size="sm" color="#FFFFFF" />}
            onPress={() =>
              navigation.navigate('LiveView', { cameraId: camera._id, cameraName: camera.name })
            }
            style={styles.mainActionBtn}
          />

          <View style={styles.subActionRow}>
            {camera.settings?.talkbackEnabled && (
              <Button
                title="Talkback"
                variant="secondary"
                icon={<AppIcon icon={Mic01Icon} size="sm" color={Colors.textPrimary} />}
                onPress={() =>
                  navigation.navigate('TalkbackActive', {
                    cameraId: camera._id,
                    cameraName: camera.name,
                  })
                }
                style={styles.subBtn}
              />
            )}
            <Button
              title="Playback"
              variant="outline"
              icon={<AppIcon icon={CassetteTapeIcon} size="sm" color={Colors.primaryLight} />}
              onPress={() =>
                navigation.navigate('RecordingPlayback', {
                  cameraId: camera._id,
                  cameraName: camera.name,
                })
              }
              style={styles.subBtn}
            />
          </View>
        </View>

        {/* Location Card */}
        <Text style={styles.sectionTitle}>Location</Text>
        <Card variant="elevated">
          <View style={styles.locationRow}>
            <AppIcon icon={Location01Icon} size="sm" color={Colors.primaryLight} />
            <Text style={styles.locationText}>
              {camera.location?.street || 'Street not set'}, {camera.location?.city || 'City not set'},{' '}
              {camera.location?.state || ''} {camera.location?.pincode || ''}
            </Text>
          </View>
          {camera.location?.latitude && (
            <Text style={styles.coordsText}>
              Coordinates: {camera.location.latitude.toFixed(4)}, {camera.location.longitude?.toFixed(4)}
            </Text>
          )}
        </Card>

        {/* Realtime Health & Telemetry Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Hardware Health Metrics</Text>
          <Text style={styles.telemetryLiveBadge}>15s Auto-refresh</Text>
        </View>
        <Card variant="elevated">
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>CPU Load</Text>
              <Text
                style={[
                  styles.metricValue,
                  health.cpuUsage > 85 ? { color: Colors.critical } : {},
                ]}
              >
                {health.cpuUsage}%
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Memory</Text>
              <Text
                style={[
                  styles.metricValue,
                  health.memoryUsage > 85 ? { color: Colors.warning } : {},
                ]}
              >
                {health.memoryUsage}%
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Temperature</Text>
              <Text
                style={[
                  styles.metricValue,
                  health.temperature > 70 ? { color: Colors.critical } : {},
                ]}
              >
                {health.temperature}°C
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Storage</Text>
              <Text
                style={[
                  styles.metricValue,
                  health.storageUsage > 90 ? { color: Colors.warning } : {},
                ]}
              >
                {health.storageUsage}%
              </Text>
            </View>
          </View>

          <View style={styles.pingRow}>
            <Text style={styles.pingLabel}>Last Telemetry Ping:</Text>
            <Text style={styles.pingValue}>
              {health.lastPing ? `${formatRelativeTime(health.lastPing)} (${formatDateTime(health.lastPing)})` : 'No telemetry recorded'}
            </Text>
          </View>
        </Card>

        {/* Configuration Settings */}
        <Text style={styles.sectionTitle}>Configuration & Features</Text>
        <Card variant="elevated">
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>24/7 Cloud Recording</Text>
            <Text style={[styles.configValue, camera.settings.recordingEnabled ? { color: Colors.online } : {}]}>
              {camera.settings.recordingEnabled ? 'ENABLED' : 'DISABLED'}
            </Text>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Motion Detection AI</Text>
            <Text style={[styles.configValue, camera.settings.motionDetectionEnabled ? { color: Colors.online } : {}]}>
              {camera.settings.motionDetectionEnabled ? 'ENABLED' : 'DISABLED'}
            </Text>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>AI Object/Vehicle Detection</Text>
            <Text style={[styles.configValue, camera.settings.aiFeaturesEnabled ? { color: Colors.online } : {}]}>
              {camera.settings.aiFeaturesEnabled ? 'ENABLED' : 'DISABLED'}
            </Text>
          </View>

          <View style={[styles.configRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.configLabel}>Video Retention</Text>
            <Text style={styles.configValue}>{camera.settings.recordingRetentionDays} Days</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  actionBanner: {
    marginBottom: 20,
  },
  mainActionBtn: {
    marginBottom: 10,
  },
  subActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  telemetryLiveBadge: {
    fontSize: 11,
    color: Colors.online,
    fontWeight: '700',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  coordsText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontFamily: 'monospace',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  pingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLight,
  },
  pingLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  pingValue: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  configLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  configValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
});
