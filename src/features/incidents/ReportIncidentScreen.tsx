import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { IncidentApi } from '../../api/endpoints/incident.api';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { Camera } from '../../types/camera.types';
import { IncidentSeverity, IncidentType } from '../../types/incident.types';

interface ReportIncidentScreenProps {
  navigation: any;
  route?: {
    params?: {
      prefilledCameraId?: string;
    };
  };
}

export const ReportIncidentScreen: React.FC<ReportIncidentScreenProps> = ({
  navigation,
  route,
}) => {
  const prefilledCam = route?.params?.prefilledCameraId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IncidentType>('theft');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(prefilledCam || null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    OperatorApi.getAssignedCameras()
      .then(setCameras)
      .catch((e) => console.warn('[ReportIncident] Error loading cameras:', e));
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required Fields', 'Please provide a title and detailed description.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('type', type);
      formData.append('severity', severity);
      if (selectedCameraId) {
        formData.append('cameraId', selectedCameraId);
      }

      const created = await IncidentApi.createIncident(formData);

      Alert.alert(
        'Incident Logged',
        `Incident #${created._id.slice(-6)} has been recorded and dispatched to active queues.`,
        [
          {
            text: 'View Report',
            onPress: () => {
              navigation.replace('IncidentDetail', { incidentId: created._id });
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Submission Error', e.response?.data?.message || 'Could not file incident.');
    } finally {
      setLoading(false);
    }
  };

  const incidentTypes: Array<{ key: IncidentType; label: string }> = [
    { key: 'theft', label: '🔒 Theft' },
    { key: 'vandalism', label: '🏚️ Vandalism' },
    { key: 'safety', label: '🦺 Safety' },
    { key: 'maintenance', label: '🔧 Maintenance' },
    { key: 'other', label: '📄 Other' },
  ];

  const severityLevels: Array<{ key: IncidentSeverity; label: string }> = [
    { key: 'low', label: 'Low' },
    { key: 'medium', label: 'Medium' },
    { key: 'high', label: 'High' },
    { key: 'critical', label: 'Critical' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header title="Report Incident" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Form Container */}
        <View style={styles.form}>
          <Text style={styles.label}>Incident Title *</Text>
          <TextInput
            placeholder="e.g. Unauthorized entry attempt at Rear Door"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Description *</Text>
          <TextInput
            multiline
            numberOfLines={4}
            placeholder="Detailed description of the event, observed behavior, and timestamps..."
            placeholderTextColor={Colors.textMuted}
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
          />

          {/* Incident Type Picker */}
          <Text style={[styles.label, { marginTop: 16 }]}>Incident Category</Text>
          <View style={styles.chipRow}>
            {incidentTypes.map((t) => (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.8}
                onPress={() => setType(t.key)}
                style={[styles.chip, type === t.key ? styles.activeChip : {}]}
              >
                <Text style={[styles.chipText, type === t.key ? styles.activeChipText : {}]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Severity Picker */}
          <Text style={[styles.label, { marginTop: 16 }]}>Severity Level</Text>
          <View style={styles.chipRow}>
            {severityLevels.map((s) => (
              <TouchableOpacity
                key={s.key}
                activeOpacity={0.8}
                onPress={() => setSeverity(s.key)}
                style={[
                  styles.chip,
                  severity === s.key ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : {},
                ]}
              >
                <Text style={[styles.chipText, severity === s.key ? styles.activeChipText : {}]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Linked Camera Picker */}
          <Text style={[styles.label, { marginTop: 16 }]}>Linked Camera (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cameraRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedCameraId(null)}
              style={[styles.chip, selectedCameraId === null ? styles.activeChip : {}]}
            >
              <Text style={[styles.chipText, selectedCameraId === null ? styles.activeChipText : {}]}>
                No Specific Camera
              </Text>
            </TouchableOpacity>

            {cameras.map((c) => (
              <TouchableOpacity
                key={c._id}
                activeOpacity={0.8}
                onPress={() => setSelectedCameraId(c._id)}
                style={[styles.chip, selectedCameraId === c._id ? styles.activeChip : {}]}
              >
                <Text style={[styles.chipText, selectedCameraId === c._id ? styles.activeChipText : {}]}>
                  📹 {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button
            title="Submit Incident Report"
            loading={loading}
            onPress={handleSubmit}
            size="large"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  activeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  cameraRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  submitBtn: {
    marginTop: 24,
  },
});
