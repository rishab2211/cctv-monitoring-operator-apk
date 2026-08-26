import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
  Call02Icon,
  CameraVideoIcon,
  ChevronRightIcon,
  Location01Icon,
  SirenIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/common/Button';
import { AppIcon } from '../../components/common/AppIcon';
import { SOSApi } from '../../api/endpoints/sos.api';
import { sosAcknowledgedRealtime, sosResolvedRealtime } from '../../store/slices/sosSlice';
import { SOSAlert } from '../../types/sos.types';
import { formatDateTime } from '../../utils/date';
import { getApiErrorMessage } from '../../utils/error';

interface SOSDetailScreenProps {
  navigation: any;
  route: {
    params: {
      sosId: string;
    };
  };
}

export const SOSDetailScreen: React.FC<SOSDetailScreenProps> = ({ navigation, route }) => {
  const { sosId } = route.params;
  const dispatch = useDispatch();

  const [sos, setSos] = useState<SOSAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // New Note state
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Resolve Modal State
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadSos = async () => {
    try {
      setLoading(true);
      const data = await SOSApi.getSosById(sosId);
      setSos(data);
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Failed to load SOS incident details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSos();
  }, [sosId]);

  const handleAcknowledge = async () => {
    setActionLoading(true);
    try {
      const updated = await SOSApi.acknowledgeSos(sosId);
      setSos(updated);
      dispatch(sosAcknowledgedRealtime(updated));
      Alert.alert('Acknowledged', 'SOS state moved to Acknowledged.');
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Could not acknowledge SOS.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    setNoteLoading(true);
    try {
      const notes = await SOSApi.addNote(sosId, noteText.trim());
      setSos((prev) => (prev ? { ...prev, notes } : prev));
      setNoteText('');
    } catch (e: any) {
      Alert.alert('Note Error', getApiErrorMessage(e, 'Failed to attach investigation note.'));
    } finally {
      setNoteLoading(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolutionNotes.trim()) {
      Alert.alert('Resolution Notes Required', 'Please enter your closure notes before resolving this emergency.');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await SOSApi.resolveSos(sosId, resolutionNotes.trim());
      setSos(updated);
      dispatch(sosResolvedRealtime({ sosId }));
      setResolveModalVisible(false);
      Alert.alert('Emergency Resolved', 'SOS alert has been formally closed.');
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Could not resolve SOS.'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !sos) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="SOS Panic Details" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={Colors.critical} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const userObj = typeof sos.triggeredBy === 'object' && sos.triggeredBy !== null ? sos.triggeredBy : null;
  const cameraObj = typeof sos.cameraId === 'object' && sos.cameraId !== null ? (sos.cameraId as any) : null;

  return (
    <View style={styles.container}>
      <Header
        title="Emergency SOS"
        subtitle={`Alert #${sos._id.slice(-6).toUpperCase()}`}
        onBack={() => navigation.goBack()}
        rightAction={<StatusPill label={sos.status} variant={sos.status === 'active' ? 'critical' : sos.status === 'acknowledged' ? 'high' : 'resolved'} size="small" />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Triggering User Card */}
        <Card variant={sos.status === 'active' ? 'danger' : 'elevated'}>
          <View style={styles.userHeader}>
            <View>
              <Text style={styles.userName}>{userObj?.name || 'Customer'}</Text>
              {userObj?.phone && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(`tel:${userObj.phone}`)}
                  style={styles.phoneRow}
                >
                  <AppIcon icon={Call02Icon} size="xs" color={Colors.primaryLight} />
                  <Text style={styles.phoneText}>{userObj.phone} (Tap to Call)</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.sosSymbolBox}>
              <AppIcon icon={SirenIcon} size="lg" color={Colors.critical} />
            </View>
          </View>

          <View style={styles.locationRow}>
            <AppIcon icon={Location01Icon} size="xs" color={Colors.textSecondary} />
            <Text style={styles.locationText}>
              Location: {sos.location || 'Location not configured by user'}
            </Text>
          </View>

          {cameraObj && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LiveView', { cameraId: cameraObj._id, cameraName: cameraObj.name })}
              style={styles.cameraLink}
            >
              <View style={styles.cameraLinkContent}>
                <AppIcon icon={CameraVideoIcon} size="xs" color={Colors.primaryLight} />
                <Text style={styles.cameraLinkText}>{cameraObj.name} — Open Live Stream</Text>
              </View>
              <AppIcon icon={ChevronRightIcon} size="xs" color={Colors.primaryLight} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Timestamps */}
        <Text style={styles.sectionTitle}>Emergency Timeline</Text>
        <Card variant="elevated">
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Triggered At</Text>
            <Text style={styles.timeVal}>{formatDateTime(sos.createdAt)}</Text>
          </View>
          {sos.acknowledgedAt && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Acknowledged</Text>
              <Text style={styles.timeVal}>{formatDateTime(sos.acknowledgedAt)}</Text>
            </View>
          )}
          {sos.resolvedAt && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Resolved</Text>
              <Text style={styles.timeVal}>{formatDateTime(sos.resolvedAt)}</Text>
            </View>
          )}
        </Card>

        {/* Resolution Notes (if completed) */}
        {sos.resolutionNotes && (
          <>
            <Text style={styles.sectionTitle}>Resolution Log</Text>
            <Card variant="elevated">
              <Text style={styles.resNotesText}>{sos.resolutionNotes}</Text>
            </Card>
          </>
        )}

        {/* Emergency Notes Thread */}
        <Text style={styles.sectionTitle}>Operator Response Notes ({sos.notes?.length || 0})</Text>
        <Card variant="elevated">
          {sos.notes && sos.notes.length > 0 ? (
            sos.notes.map((note, index) => (
              <View key={note._id || index} style={styles.noteItem}>
                <Text style={styles.noteAuthor}>
                  {typeof note.author === 'object' && note.author !== null
                    ? (note.author as any).name
                    : 'Operator'}{' '}
                  • {formatDateTime(note.createdAt)}
                </Text>
                <Text style={styles.noteBody}>{note.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noNotesText}>No investigation notes added yet.</Text>
          )}

          {/* Quick Note Composer */}
          <View style={styles.noteComposer}>
            <TextInput
              placeholder="Type update (e.g. Police dispatched)..."
              placeholderTextColor={Colors.textMuted}
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
            />
            <Button
              title="Add Note"
              size="small"
              loading={noteLoading}
              onPress={handleAddNote}
              style={styles.addNoteBtn}
            />
          </View>
        </Card>

        {/* Emergency Action Buttons */}
        <View style={styles.actionContainer}>
          {sos.status === 'active' && (
            <Button
              title="Acknowledge & Respond"
              variant="destructive"
              loading={actionLoading}
              onPress={handleAcknowledge}
              size="large"
              style={styles.actionBtn}
            />
          )}

          {sos.status === 'acknowledged' && (
            <Button
              title="Resolve SOS Emergency"
              variant="primary"
              onPress={() => setResolveModalVisible(true)}
              size="large"
              style={styles.actionBtn}
            />
          )}
        </View>
      </ScrollView>

      {/* Resolve SOS Modal */}
      <Modal visible={resolveModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Resolve Emergency SOS</Text>
            <Text style={styles.modalSub}>
              Enter comprehensive resolution details before completing the emergency event.
            </Text>

            <TextInput
              multiline
              numberOfLines={4}
              placeholder="e.g. Patrol arrived at scene. Premises secured and customer confirmed safe."
              placeholderTextColor={Colors.textMuted}
              style={styles.modalInput}
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setResolveModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Confirm Resolution"
                variant="destructive"
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginLeft: 4,
  },
  sosSymbolBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  cameraLink: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
    fontWeight: '800',
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
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  timeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timeVal: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  resNotesText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  noteItem: {
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  noteAuthor: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  noteBody: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  noNotesText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  noteComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  noteInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
    marginRight: 8,
  },
  addNoteBtn: {
    paddingVertical: 8,
  },
  actionContainer: {
    marginTop: 24,
  },
  actionBtn: {
    width: '100%',
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
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
});
