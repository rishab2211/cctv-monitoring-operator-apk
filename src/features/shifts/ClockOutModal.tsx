import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AppIcon } from '../../components/common/AppIcon';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { clockOutSuccess } from '../../store/slices/shiftSlice';
import { RootState } from '../../store';
import { formatDateTime, formatDuration } from '../../utils/date';

interface ClockOutModalProps {
  navigation: any;
  route: any;
}

export const ClockOutModal: React.FC<ClockOutModalProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { currentShift } = useSelector((state: RootState) => state.shift);
  const openIncidentsCount = route?.params?.openIncidentsCount ?? 0;

  const [handoverNotes, setHandoverNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveDuration, setLiveDuration] = useState('00:00:00');

  // Live timer for elapsed shift duration
  useEffect(() => {
    let timer: any = null;
    if (currentShift?.startTime) {
      const updateTimer = () => {
        const start = new Date(currentShift.startTime).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
        setLiveDuration(formatDuration(diffSeconds));
      };
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentShift]);

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const shift = await OperatorApi.endShift(handoverNotes.trim() || undefined);
      dispatch(clockOutSuccess(shift));
      Alert.alert(
        'Shift Ended',
        'Your shift has concluded. Handover notes have been broadcast to the next operator.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not end shift. Please try again.';
      Alert.alert('Shift Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header title="End Shift & Handover" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Open Incidents Warning Banner */}
        {openIncidentsCount > 0 && (
          <View style={styles.warningBox}>
            <View style={styles.warningIconBox}>
              <AppIcon icon={Alert02Icon} size="md" color={Colors.warning} />
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Open Incidents Notice</Text>
              <Text style={styles.warningText}>
                You currently have {openIncidentsCount} open incident(s) assigned to your station.
                Ending your shift now will leave them active for the incoming shift team.
              </Text>
            </View>
          </View>
        )}

        {/* Shift Summary Box */}
        <Card variant="elevated" style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Active Shift Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Started:</Text>
            <Text style={styles.summaryValue}>
              {currentShift?.startTime ? formatDateTime(currentShift.startTime) : 'N/A'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Elapsed Time:</Text>
            <Text style={[styles.summaryValue, { color: Colors.online, fontWeight: '800' }]}>
              {liveDuration}
            </Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>{currentShift?.incidentsResolved || 0}</Text>
              <Text style={styles.metricLabel}>Incidents Resolved</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>{currentShift?.sosAcknowledged || 0}</Text>
              <Text style={styles.metricLabel}>SOS Acknowledged</Text>
            </View>
          </View>
        </Card>

        {/* Handover Composer */}
        <View style={styles.form}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Handover Notes (Optional)</Text>
            <Text style={styles.charCount}>{handoverNotes.length} / 500</Text>
          </View>
          <Text style={styles.sublabel}>
            These notes will be broadcasted to incoming operators and logged in your shift history.
          </Text>

          <TextInput
            multiline
            numberOfLines={4}
            maxLength={500}
            placeholder="e.g. Camera 3 at Gate 2 had intermittent motion alerts. Night guard notified to verify physically..."
            placeholderTextColor={Colors.textMuted}
            style={styles.textArea}
            value={handoverNotes}
            onChangeText={setHandoverNotes}
          />

          <Button
            title="Complete Shift & Clock Out"
            variant="destructive"
            loading={loading}
            onPress={handleClockOut}
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  warningIconBox: {
    marginRight: 10,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.warning,
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
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
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sublabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  textArea: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 20,
  },
});
