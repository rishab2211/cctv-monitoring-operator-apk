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
import { useSelector } from 'react-redux';
import {
  CameraVideoIcon,
  Chart01Icon,
  ChevronRightIcon,
  TimelineIcon,
  CloudUploadIcon,
} from '@hugeicons/core-free-icons';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/common/Button';
import { AppIcon } from '../../components/common/AppIcon';
import { IncidentApi } from '../../api/endpoints/incident.api';
import { Incident } from '../../types/incident.types';
import { formatDateTime } from '../../utils/date';
import { getApiErrorMessage } from '../../utils/error';

interface IncidentDetailScreenProps {
  navigation: any;
  route: {
    params: {
      incidentId: string;
    };
  };
}

export const IncidentDetailScreen: React.FC<IncidentDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { incidentId } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Note composer
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Close Incident Modal
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');

  // Media upload
  const [mediaLoading, setMediaLoading] = useState(false);

  const loadIncident = async () => {
    try {
      setLoading(true);
      const data = await IncidentApi.getIncidentById(incidentId);
      setIncident(data);
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Could not fetch incident details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  const assignedId =
    typeof incident?.assignedTo === 'object' && incident?.assignedTo !== null
      ? incident.assignedTo._id
      : incident?.assignedTo;

  const isAssignedToMe = assignedId === user?._id;

  const handleStatusUpdate = async (newStatus: 'investigating' | 'resolved') => {
    setActionLoading(true);
    try {
      const updated = await IncidentApi.updateStatus(incidentId, { status: newStatus });
      setIncident(updated);
      Alert.alert('Status Updated', `Incident status set to ${newStatus}.`);
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Could not update status.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    setNoteLoading(true);
    try {
      const notes = await IncidentApi.addNote(incidentId, noteText.trim());
      setIncident((prev) => (prev ? { ...prev, notes } : prev));
      setNoteText('');
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Could not post note.'));
    } finally {
      setNoteLoading(false);
    }
  };

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      const updated = await IncidentApi.verifyIncident(incidentId);
      setIncident(updated);
      Alert.alert('Verified', 'Incident formally verified.');
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Failed to verify incident.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await IncidentApi.getReport(incidentId);
      Alert.alert(
        'Incident Summary Report',
        `Generated: ${new Date(report.generatedAt).toLocaleString()}\n\nSeverity: ${report.summary.severity}\nStatus: ${report.summary.status}\nTotal Notes: ${report.summary.totalNotes}\nTotal Media: ${report.summary.totalAttachments}`
      );
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Failed to generate incident summary report.'));
    }
  };

  const handleUploadMedia = async () => {
    try {
      const results = await pick({
        allowMultiSelection: true,
        type: [types.allFiles],
      });
      const selected = results.slice(0, 10);
      
      const formData = new FormData();
      selected.forEach((file) => {
        formData.append('media', {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || 'media_file',
        } as any);
      });

      setMediaLoading(true);
      await IncidentApi.uploadMedia(incidentId, formData);
      
      Alert.alert('Success', 'Media uploaded successfully');
      loadIncident(); // Refresh
    } catch (err: any) {
      if (!(isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED)) {
        Alert.alert('Error', getApiErrorMessage(err, 'Failed to upload media.'));
      }
    } finally {
      setMediaLoading(false);
    }
  };

  const handleCloseIncident = async () => {
    const trimmedNotes = closeNotes.trim();
    if (!trimmedNotes) {
      Alert.alert('Closure Notes Required', 'Please enter your final resolution summary.');
      return;
    }

    if (trimmedNotes.length < 5) {
      Alert.alert('Closure Notes Too Short', 'Resolution notes must be at least 5 characters long.');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await IncidentApi.closeIncident(incidentId, trimmedNotes);
      setIncident(updated);
      setCloseModalVisible(false);
      Alert.alert('Incident Closed', 'Incident has been formally closed.');
    } catch (e: any) {
      Alert.alert('Error', getApiErrorMessage(e, 'Could not close incident.'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !incident) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="Incident Details" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const cameraObj =
    typeof incident.cameraId === 'object' && incident.cameraId !== null ? incident.cameraId : null;

  return (
    <View style={styles.container}>
      <Header
        title="Incident Record"
        subtitle={`Case #${incident._id.slice(-6).toUpperCase()}`}
        onBack={() => navigation.goBack()}
        rightAction={<StatusPill label={incident.status} variant={incident.status as any} size="small" />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Incident Summary Card */}
        <Card variant="elevated">
          <View style={styles.headerRow}>
            <Text style={styles.incidentTitle}>{incident.title}</Text>
            <StatusPill label={incident.severity} variant={incident.severity as any} size="small" />
          </View>

          <Text style={styles.incidentDesc}>{incident.description}</Text>

          <View style={styles.assigneeRow}>
            <Text style={styles.assigneeText}>
              Assigned:{' '}
              <Text style={styles.assigneeHighlight}>
                {isAssignedToMe ? 'You (Current Operator)' : (typeof incident.assignedTo === 'object' && incident.assignedTo !== null ? (incident.assignedTo as any).name : 'Unassigned')}
              </Text>
            </Text>
          </View>

          {cameraObj && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LiveView', { cameraId: cameraObj._id, cameraName: cameraObj.name })}
              style={styles.cameraRow}
            >
              <View style={styles.cameraContent}>
                <AppIcon icon={CameraVideoIcon} size="xs" color={Colors.primaryLight} />
                <Text style={styles.cameraText}>Linked Camera: {cameraObj.name}</Text>
              </View>
              <AppIcon icon={ChevronRightIcon} size="xs" color={Colors.primaryLight} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Action Row */}
        <View style={styles.quickActionRow}>
          <Button
            title="Generate Report"
            variant="outline"
            size="small"
            icon={<AppIcon icon={Chart01Icon} size="xs" color={Colors.primaryLight} />}
            onPress={handleGenerateReport}
            style={styles.subBtn}
          />
          <Button
            title="Upload Media"
            variant="outline"
            size="small"
            loading={mediaLoading}
            icon={<AppIcon icon={CloudUploadIcon} size="xs" color={Colors.primaryLight} />}
            onPress={handleUploadMedia}
            style={styles.subBtn}
          />
          <Button
            title="View Timeline"
            variant="secondary"
            size="small"
            icon={<AppIcon icon={TimelineIcon} size="xs" color={Colors.textPrimary} />}
            onPress={() => navigation.navigate('IncidentTimeline', { incidentId })}
            style={styles.subBtn}
          />
        </View>

        {/* Resolution Notes (if closed) */}
        {incident.resolutionNotes && (
          <>
            <Text style={styles.sectionTitle}>Closure & Resolution Log</Text>
            <Card variant="elevated">
              <Text style={styles.resNotes}>{incident.resolutionNotes}</Text>
              <Text style={styles.closedAtText}>
                Closed at: {incident.closedAt ? formatDateTime(incident.closedAt) : 'N/A'}
              </Text>
            </Card>
          </>
        )}

        {/* Investigation Notes Thread */}
        <Text style={styles.sectionTitle}>Investigation Notes ({incident.notes?.length || 0})</Text>
        <Card variant="elevated">
          {incident.notes && incident.notes.length > 0 ? (
            incident.notes.map((n, idx) => (
              <View key={n._id || idx} style={styles.noteBox}>
                <Text style={styles.noteMeta}>
                  {typeof n.author === 'object' && n.author !== null ? (n.author as any).name : 'Operator'} •{' '}
                  {formatDateTime(n.createdAt)}
                </Text>
                <Text style={styles.noteText}>{n.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyNote}>No investigation notes added yet.</Text>
          )}

          {incident.status !== 'closed' && (
            <View style={styles.composerRow}>
              <TextInput
                placeholder="Append case note..."
                placeholderTextColor={Colors.textMuted}
                style={styles.noteInput}
                value={noteText}
                onChangeText={setNoteText}
              />
              <Button title="Post" size="small" loading={noteLoading} onPress={handleAddNote} />
            </View>
          )}
        </Card>

        {/* Status Transition Actions */}
        {incident.status !== 'closed' && (
          <View style={styles.actionContainer}>
            {incident.status === 'open' && (
              <Button
                title={isAssignedToMe ? "Start Investigation" : "Assign to Me to Investigate"}
                variant="primary"
                loading={actionLoading}
                onPress={() => handleStatusUpdate('investigating')}
                style={styles.actionBtn}
                disabled={!isAssignedToMe}
              />
            )}

            {incident.status === 'investigating' && (
              <Button
                title={isAssignedToMe ? "Mark as Resolved" : "Assign to Me to Resolve"}
                variant="primary"
                loading={actionLoading}
                onPress={() => handleStatusUpdate('resolved')}
                style={styles.actionBtn}
                disabled={!isAssignedToMe}
              />
            )}

            {incident.status === 'resolved' && (
              <Button
                title="Close Incident (Final Sign-off)"
                variant="destructive"
                onPress={() => setCloseModalVisible(true)}
                style={styles.actionBtn}
              />
            )}

            {!incident.isVerified && (
              <Button
                title="Verify Incident (Confirm Genuine)"
                variant="outline"
                loading={actionLoading}
                onPress={handleVerify}
                style={styles.actionBtn}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Close Incident Modal */}
      <Modal visible={closeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Close Case Incident</Text>
            <Text style={styles.modalSub}>
              Enter mandatory resolution summary notes to conclude and permanently archive this incident.
            </Text>

            <TextInput
              multiline
              numberOfLines={4}
              placeholder="e.g. Police report filed. Incident investigated and resolved with customer confirmation."
              placeholderTextColor={Colors.textMuted}
              style={styles.modalInput}
              value={closeNotes}
              onChangeText={setCloseNotes}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setCloseModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Close Case"
                variant="destructive"
                loading={actionLoading}
                onPress={handleCloseIncident}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  incidentTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  incidentDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  assigneeRow: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  assigneeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  assigneeHighlight: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  cameraRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cameraText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginLeft: 6,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
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
    marginTop: 18,
    marginBottom: 8,
  },
  resNotes: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  closedAtText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  noteBox: {
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  noteMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginTop: 3,
  },
  emptyNote: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  composerRow: {
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
  actionContainer: {
    marginTop: 20,
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
