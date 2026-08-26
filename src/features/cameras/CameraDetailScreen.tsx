import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/common/Button';
import { CameraApi } from '../../api/endpoints/camera.api';
import { Camera } from '../../types/camera.types';

interface CameraDetailScreenProps {
  navigation: any;
  route: {
    params: {
      cameraId: string;
    };
  };
}

export const CameraDetailScreen: React.FC<CameraDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { cameraId } = route.params;
  const [camera, setCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCamera = async () => {
    try {
      setLoading(true);
      const data = await CameraApi.getCameraById(cameraId);
      setCamera(data);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to load camera telemetry details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCamera();
  }, [cameraId]);

  if (loading || !camera) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="Camera Telemetry" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const health = camera.health || {
    cpuUsage: 0,
    memoryUsage: 0,
    temperature: 0,
    storageUsage: 0,
  };

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
            onPress={() =>
              navigation.navigate('LiveView', { cameraId: camera._id, cameraName: camera.name })
            }
            style={styles.mainActionBtn}
          />

          <View style={styles.subActionRow}>
            {camera.settings?.talkbackEnabled && (
              <Button
                title="🎙️ Talkback"
                variant="secondary"
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
              title="📼 Playback"
              variant="outline"
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
          <Text style={styles.locationText}>
            📍 {camera.location?.street || 'Street not set'}, {camera.location?.city || 'City not set'},{' '}
            {camera.location?.state || ''} {camera.location?.pincode || ''}
          </Text>
          {camera.location?.latitude && (
            <Text style={styles.coordsText}>
              Coordinates: {camera.location.latitude.toFixed(4)}, {camera.location.longitude?.toFixed(4)}
            </Text>
          )}
        </Card>

        {/* Realtime Health & Telemetry Card */}
        <Text style={styles.sectionTitle}>Hardware Health Metrics</Text>
        <Card variant="elevated">
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>CPU Load</Text>
              <Text style={styles.metricValue}>{health.cpuUsage}%</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Memory</Text>
              <Text style={styles.metricValue}>{health.memoryUsage}%</Text>
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
              <Text style={styles.metricValue}>{health.storageUsage}%</Text>
            </View>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
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
