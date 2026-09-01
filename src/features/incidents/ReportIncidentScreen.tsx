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
import {
  AlertDiamondIcon,
  CameraVideoIcon,
  File01Icon,
  LockIcon,
  Shield01Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { pick, types, isErrorWithCode, errorCodes, DocumentPickerResponse } from '@react-native-documents/picker';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { AppIcon } from '../../components/common/AppIcon';
import { IncidentApi } from '../../api/endpoints/incident.api';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { Camera } from '../../types/camera.types';
import { IncidentSeverity, IncidentType } from '../../types/incident.types';
import { getApiErrorMessage } from '../../utils/error';

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
  const [attachments, setAttachments] = useState<DocumentPickerResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickAttachments = async () => {
    try {
      const results = await pick({
        allowMultiSelection: true,
        type: [types.allFiles],
      });
      const newAttachments = [...attachments, ...results].slice(0, 5);
      setAttachments(newAttachments);
    } catch (err) {
      if (!(isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED)) {
        Alert.alert('Error', 'Failed to pick files');
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  useEffect(() => {
    OperatorApi.getAssignedCameras()
      .then(setCameras)
      .catch((e) => console.warn('[ReportIncident] Error loading cameras:', e));
  }, []);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      Alert.alert('Required Field', 'Please enter an incident title.');
      return;
    }

    if (trimmedTitle.length < 3) {
      Alert.alert('Invalid Title', 'Incident title must be at least 3 characters long.');
      return;
    }

    if (trimmedTitle.length > 100) {
      Alert.alert('Invalid Title', 'Incident title must not exceed 100 characters.');
      return;
    }

    if (!trimmedDescription) {
      Alert.alert('Required Field', 'Please enter a detailed incident description.');
      return;
    }

    if (trimmedDescription.length < 10) {
      Alert.alert(
        'Description Too Short',
        `Incident description must be at least 10 characters long (currently ${trimmedDescription.length} characters).`
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', trimmedTitle);
      formData.append('description', trimmedDescription);
      formData.append('type', type);
      formData.append('severity', severity);
      if (selectedCameraId) {
        formData.append('cameraId', selectedCameraId);
      }
      attachments.forEach((file) => {
        formData.append('attachments', {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || 'attachment',
        } as any);
      });

      await IncidentApi.createIncident(formData);

      Alert.alert(
        'Incident Logged',
        'Your security report has been recorded and submitted for audit.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Submission Error', getApiErrorMessage(e, 'Could not file incident.'));
    } finally {
      setLoading(false);
    }
  };

  const incidentTypes: Array<{ key: IncidentType; label: string; icon: any }> = [
    { key: 'theft', label: 'Theft', icon: LockIcon },
    { key: 'vandalism', label: 'Vandalism', icon: AlertDiamondIcon },
    { key: 'safety', label: 'Safety', icon: Shield01Icon },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench01Icon },
    { key: 'other', label: 'Other', icon: File01Icon },
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
          <View style={styles.labelRow}>
            <Text style={styles.label}>Incident Title *</Text>
            <Text style={styles.charCount}>{title.trim().length}/100 (min 3)</Text>
          </View>
          <TextInput
            placeholder="e.g. Unauthorized entry attempt at Rear Door"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <View style={[styles.labelRow, styles.fieldLabelMargin]}>
            <Text style={styles.label}>Description *</Text>
            <Text
              style={[
                styles.charCount,
                description.trim().length > 0 && description.trim().length < 10 && styles.charCountWarning,
              ]}
            >
              {description.trim().length} chars (min 10)
            </Text>
          </View>
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
          <Text style={[styles.label, styles.categoryLabelMargin]}>Incident Category</Text>
          <View style={styles.chipRow}>
            {incidentTypes.map((t) => {
              const isSelected = type === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  activeOpacity={0.8}
                  onPress={() => setType(t.key)}
                  style={[styles.chip, isSelected && styles.activeChip]}
                >
                  <AppIcon
                    icon={t.icon}
                    size="xs"
                    color={isSelected ? '#FFFFFF' : Colors.textSecondary}
                  />
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Severity Picker */}
          <Text style={[styles.label, styles.fieldLabelMargin]}>Severity Level</Text>
          <View style={styles.chipRow}>
            {severityLevels.map((s) => (
              <TouchableOpacity
                key={s.key}
                activeOpacity={0.8}
                onPress={() => setSeverity(s.key)}
                style={[
                  styles.chip,
                  severity === s.key && styles.activeChip,
                ]}
              >
                <Text style={[styles.chipText, severity === s.key && styles.activeChipText]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Linked Camera Picker */}
          <Text style={[styles.label, styles.fieldLabelMargin]}>Linked Camera (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cameraRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedCameraId(null)}
              style={[styles.chip, selectedCameraId === null && styles.activeChip]}
            >
              <Text style={[styles.chipText, selectedCameraId === null && styles.activeChipText]}>
                No Specific Camera
              </Text>
            </TouchableOpacity>

            {cameras.map((c) => {
              const isSelected = selectedCameraId === c._id;
              return (
                <TouchableOpacity
                  key={c._id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCameraId(c._id)}
                  style={[styles.chip, isSelected && styles.activeChip]}
                >
                  <AppIcon
                    icon={CameraVideoIcon}
                    size="xs"
                    color={isSelected ? '#FFFFFF' : Colors.textSecondary}
                  />
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Attachments */}
          <View style={[styles.labelRow, styles.fieldLabelMargin]}>
            <Text style={styles.label}>Attachments (Max 5)</Text>
            <Text style={styles.charCount}>{attachments.length}/5</Text>
          </View>
          <Button
            title="Select Files"
            variant="outline"
            icon={<AppIcon icon={File01Icon} size="xs" color={Colors.primaryLight} />}
            onPress={handlePickAttachments}
            disabled={attachments.length >= 5}
            style={styles.attachmentBtnMargin}
          />
          {attachments.map((file, idx) => (
            <View key={idx} style={styles.attachmentRow}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {file.name}
              </Text>
              <TouchableOpacity onPress={() => removeAttachment(idx)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  fieldLabelMargin: {
    marginTop: 16,
  },
  categoryLabelMargin: {
    marginTop: 16,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  charCountWarning: {
    color: Colors.critical,
  },
  attachmentBtnMargin: {
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 4,
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
  attachmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    marginRight: 10,
  },
  removeText: {
    fontSize: 12,
    color: Colors.critical,
    fontWeight: '600',
  },
});
