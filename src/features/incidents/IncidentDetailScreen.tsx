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
} from '@hugeicons/core-free-icons';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/common/Button';
import { AppIcon } from '../../components/common/AppIcon';
import { IncidentApi } from '../../api/endpoints/incident.api';
import { Incident, IncidentNote } from '../../types/incident.types';
import { formatDateTime } from '../../utils/date';

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

  const loadIncident = async () => {
    try {
      setLoading(true);
      const data = await IncidentApi.getIncidentById(incidentId);
      setIncident(data);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to load incident details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  const isAssignedToMe = () => {
    if (!incident || !incident.assignedTo) return false;
    const assignedId =
      typeof incident.assignedTo === 'object' ? incident.assignedTo._id : incident.assignedTo;
    return assignedId === user?._id;
  };

  const handleStatusUpdate = async (newStatus: 'investigating' | 'resolved') => {
    setActionLoading(true);
    try {
      const updated = await IncidentApi.updateStatus(incidentId, { status: newStatus });
      setIncident(updated);
      Alert.alert('Status Updated', `Incident status set to ${newStatus}.`);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update status.');
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
      Alert.alert('Error', 'Could not post note.');
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
      Alert.alert('Error', e.response?.data?.message || 'Failed to verify.');
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
      Alert.alert('Error', 'Failed to generate incident summary report.');
    }
  };

  const handleCloseIncident = async () => {
    if (!closeNotes.trim()) {
      Alert.alert('Closure Notes Required', 'Please enter your final resolution summary.');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await IncidentApi.closeIncident(incidentId, closeNotes.trim());
      setIncident(updated);
      setCloseModalVisible(false);
      Alert.alert('Incident Closed', 'Incident has been formally closed.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not close incident.');
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
                title="Start Investigation"
                variant="primary"
                loading={actionLoading}
                onPress={() => handleStatusUpdate('investigating')}
                style={styles.actionBtn}
              />
            )}

            {incident.status === 'investigating' && (
              <Button
                title="Mark as Resolved"
                variant="primary"
                loading={actionLoading}
                onPress={() => handleStatusUpdate('resolved')}
                style={styles.actionBtn}
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
