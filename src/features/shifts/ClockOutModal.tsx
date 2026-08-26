import React, { useState } from 'react';
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
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { OperatorApi } from '../../api/endpoints/operator.api';
import { clockOutSuccess } from '../../store/slices/shiftSlice';
import { RootState } from '../../store';

interface ClockOutModalProps {
  navigation: any;
}

export const ClockOutModal: React.FC<ClockOutModalProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { currentShift } = useSelector((state: RootState) => state.shift);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [loading, setLoading] = useState(false);

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

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Shift Summary Box */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Active Shift Summary</Text>
          <Text style={styles.summarySub}>
            Started at:{' '}
            {currentShift?.startTime ? new Date(currentShift.startTime).toLocaleTimeString() : 'N/A'}
          </Text>
        </View>

        {/* Handover Composer */}
        <View style={styles.form}>
          <Text style={styles.label}>Handover Notes (Optional)</Text>
          <Text style={styles.sublabel}>
            Notes are shared with incoming operators and logged in your activity timeline.
          </Text>

          <TextInput
            multiline
            numberOfLines={4}
            placeholder="e.g. Camera 3 has intermittent motion alerts due to tree branch. Handing over to night team..."
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
  },
  summaryBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summarySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sublabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
