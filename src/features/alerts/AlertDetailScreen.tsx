import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import {
  CameraVideoIcon,
  CheckmarkSquare02Icon,
  ChevronRightIcon,
  SquareIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/common/Button';
import { AppIcon } from '../../components/common/AppIcon';
import { AlertApi } from '../../api/endpoints/alert.api';
import { alertAcknowledgedSuccess, alertResolvedSuccess } from '../../store/slices/alertSlice';
import { Alert as AlertType } from '../../types/alert.types';
import { formatDateTime } from '../../utils/date';
import { getApiErrorMessage } from '../../utils/error';

interface AlertDetailScreenProps {
  navigation: any;
  route: {
    params: {
      alertId: string;
    };
  };
}

export const AlertDetailScreen: React.FC<AlertDetailScreenProps> = ({ navigation, route }) => {
  const { alertId } = route.params;
  const dispatch = useDispatch();

  const [alert, setAlert] = useState<AlertType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Resolve Modal State
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isVerifiedCheck, setIsVerifiedCheck] = useState(false);

  const loadAlert = async () => {
    try {
      setLoading(true);
      const data = await AlertApi.getAlertById(alertId);
      setAlert(data);
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Failed to load alert details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlert();
  }, [alertId]);

  const handleAcknowledge = async () => {
    setActionLoading(true);
    try {
      const updated = await AlertApi.acknowledgeAlert(alertId);
      setAlert(updated);
      dispatch(alertAcknowledgedSuccess(updated));
      Alert.alert('Acknowledged', 'Alert status moved to Active investigation.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not acknowledge alert.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    Alert.alert('Escalate Alert', 'Are you sure you want to escalate this alert to high-priority management?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Escalate',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            const updated = await AlertApi.escalateAlert(alertId);
            setAlert(updated);
            Alert.alert('Escalated', 'Alert status updated to Escalated.');
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Could not escalate alert.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleConfirmResolve = async () => {
    if (!resolutionNotes.trim()) {
      Alert.alert('Resolution Notes Required', 'Please enter your investigation notes before resolving.');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await AlertApi.resolveAlert(alertId, {
        resolutionNotes: resolutionNotes.trim(),
        isVerified: isVerifiedCheck,
      });
      setAlert(updated);
      dispatch(alertResolvedSuccess(alertId));
      setResolveModalVisible(false);
      Alert.alert('Resolved', 'Alert marked as resolved.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not resolve alert.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      const updated = await AlertApi.verifyAlert(alertId, { isVerified: true });
      setAlert(updated);
      Alert.alert('Verified', 'Alert has been formally verified.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not verify alert.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !alert) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="Alert Details" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const cameraObj = typeof alert.cameraId === 'object' && alert.cameraId !== null ? alert.cameraId : null;

  return (
    <View style={styles.container}>
      <Header
        title="Alert Details"
        subtitle={`ID: ${alert._id.slice(-8)}`}
        onBack={() => navigation.goBack()}
        rightAction={<StatusPill label={alert.status} variant={alert.status as any} size="small" />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Info Card */}
        <Card variant="elevated">
          <View style={styles.badgeRow}>
            <StatusPill label={alert.priority} variant={alert.priority as any} size="small" />
            <Text style={styles.typeText}>Type: {alert.type.toUpperCase()}</Text>
          </View>

          <Text style={styles.descriptionText}>{alert.description}</Text>

          {cameraObj && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LiveView', { cameraId: cameraObj._id, cameraName: cameraObj.name })}
              style={styles.cameraLink}
            >
              <View style={styles.cameraLinkContent}>
                <AppIcon icon={CameraVideoIcon} size="xs" color={Colors.primaryLight} />
                <Text style={styles.cameraLinkText}>{cameraObj.name} (View Live Feed)</Text>
              </View>
              <AppIcon icon={ChevronRightIcon} size="xs" color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Timestamps Card */}
        <Text style={styles.sectionTitle}>Audit Timeline</Text>
        <Card variant="elevated">
          <View style={styles.timelineRow}>
            <Text style={styles.timelineLabel}>Triggered</Text>
            <Text style={styles.timelineValue}>{formatDateTime(alert.createdAt)}</Text>
          </View>

          {alert.acknowledgedAt && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Acknowledged</Text>
              <Text style={styles.timelineValue}>{formatDateTime(alert.acknowledgedAt)}</Text>
            </View>
          )}

          {alert.resolvedAt && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Resolved</Text>
              <Text style={styles.timelineValue}>{formatDateTime(alert.resolvedAt)}</Text>
            </View>
          )}
        </Card>

        {/* Resolution Notes (if resolved) */}
        {alert.resolutionNotes && (
          <>
            <Text style={styles.sectionTitle}>Resolution Log</Text>
            <Card variant="elevated">
              <Text style={styles.notesText}>{alert.resolutionNotes}</Text>
            </Card>
          </>
        )}

        {/* Context-Aware Action Buttons */}
        <View style={styles.actionsContainer}>
          {alert.status === 'new' && (
            <>
              <Button
                title="Acknowledge Alert"
                variant="primary"
                loading={actionLoading}
                onPress={handleAcknowledge}
                style={styles.actionBtn}
              />
              <Button
                title="Escalate Alert"
                variant="destructive"
                loading={actionLoading}
                onPress={handleEscalate}
                style={styles.actionBtn}
              />
            </>
          )}

          {alert.status === 'acknowledged' && (
            <>
              <Button
                title="Resolve Alert"
                variant="primary"
                onPress={() => setResolveModalVisible(true)}
                style={styles.actionBtn}
              />
              <Button
                title="Escalate Alert"
                variant="destructive"
                loading={actionLoading}
                onPress={handleEscalate}
                style={styles.actionBtn}
              />
            </>
          )}

          {alert.status === 'escalated' && (
            <Button
              title="Resolve Alert"
              variant="primary"
              onPress={() => setResolveModalVisible(true)}
              style={styles.actionBtn}
            />
          )}

          {alert.status === 'resolved' && !alert.isVerified && (
            <Button
              title="Verify Alert (Confirm Genuine)"
              variant="outline"
              loading={actionLoading}
              onPress={handleVerify}
              style={styles.actionBtn}
            />
          )}
        </View>
      </ScrollView>

      {/* Resolution Bottom Sheet Modal */}
      <Modal visible={resolveModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Resolve Alert</Text>
            <Text style={styles.modalSub}>Enter your investigation notes to mark this alert resolved.</Text>

            <TextInput
              multiline
              numberOfLines={4}
              placeholder="e.g. Checked camera live feed. False alarm triggered by wind/lighting."
              placeholderTextColor={Colors.textMuted}
              style={styles.modalInput}
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsVerifiedCheck(!isVerifiedCheck)}
              style={styles.verifyCheckRow}
            >
              <AppIcon
                icon={isVerifiedCheck ? CheckmarkSquare02Icon : SquareIcon}
                size="sm"
                color={isVerifiedCheck ? Colors.primaryLight : Colors.textMuted}
              />
              <Text style={styles.checkLabel}>Mark as verified genuine event</Text>
            </TouchableOpacity>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setResolveModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Confirm Resolve"
                variant="primary"
                loading={actionLoading}
                onPress={handleConfirmResolve}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  descriptionText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  cameraLink: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cameraLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceElevated,
  },
  timelineLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timelineValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 24,
  },
  actionBtn: {
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
  },
  verifyCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  checkBox: {
    fontSize: 20,
    color: Colors.primaryLight,
    marginRight: 8,
  },
  checkLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
});
