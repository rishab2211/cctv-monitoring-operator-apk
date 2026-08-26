import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { NotificationApi } from '../../api/endpoints/notification.api';
import { NotificationPreferences } from '../../types/notification.types';

interface NotificationPreferencesScreenProps {
  navigation: any;
}

export const NotificationPreferencesScreen: React.FC<NotificationPreferencesScreenProps> = ({
  navigation,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    alerts: { push: true, inApp: true, email: false },
    system: { push: true, inApp: true, email: true },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    NotificationApi.getPreferences()
      .then((data) => {
        if (data) setPreferences(data);
      })
      .catch((e) => console.warn('[Preferences] Error loading preferences:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (category: 'alerts' | 'system', channel: 'push' | 'inApp' | 'email', val: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: val,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await NotificationApi.updatePreferences(preferences);
      Alert.alert('Saved', 'Notification channel preferences updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="Notification Settings" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Notification Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Alerts Channel Card */}
        <Text style={styles.sectionTitle}>Camera & Motion Alerts</Text>
        <Card variant="elevated">
          <View style={styles.prefRow}>
            <View style={styles.prefLabelBox}>
              <Text style={styles.prefTitle}>Push Notifications</Text>
              <Text style={styles.prefDesc}>Receive urgent popups on your device</Text>
            </View>
            <Switch
              value={preferences.alerts.push}
              onValueChange={(v) => handleToggle('alerts', 'push', v)}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefLabelBox}>
              <Text style={styles.prefTitle}>In-App Alerts</Text>
              <Text style={styles.prefDesc}>Show banner popups while app is open</Text>
            </View>
            <Switch
              value={preferences.alerts.inApp}
              onValueChange={(v) => handleToggle('alerts', 'inApp', v)}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
            <View style={styles.prefLabelBox}>
              <Text style={styles.prefTitle}>Email Summary</Text>
              <Text style={styles.prefDesc}>Send email digest for high priority alerts</Text>
            </View>
            <Switch
              value={preferences.alerts.email}
              onValueChange={(v) => handleToggle('alerts', 'email', v)}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* System Notifications Channel Card */}
        <Text style={styles.sectionTitle}>System & Shift Updates</Text>
        <Card variant="elevated">
          <View style={styles.prefRow}>
            <View style={styles.prefLabelBox}>
              <Text style={styles.prefTitle}>Push Notifications</Text>
              <Text style={styles.prefDesc}>Shift reminders and camera assignments</Text>
            </View>
            <Switch
              value={preferences.system.push}
              onValueChange={(v) => handleToggle('system', 'push', v)}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefLabelBox}>
              <Text style={styles.prefTitle}>In-App Notifications</Text>
              <Text style={styles.prefDesc}>Display in notification center</Text>
            </View>
            <Switch
              value={preferences.system.inApp}
              onValueChange={(v) => handleToggle('system', 'inApp', v)}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
            <View style={styles.prefLabelBox}>
              <Text style={styles.prefTitle}>Email Notifications</Text>
              <Text style={styles.prefDesc}>Account and shift handover summaries</Text>
            </View>
            <Switch
              value={preferences.system.email}
              onValueChange={(v) => handleToggle('system', 'email', v)}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        <Button
          title="Save Notification Settings"
          loading={saving}
          onPress={handleSave}
          size="large"
          style={styles.saveBtn}
        />
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  prefLabelBox: {
    flex: 1,
    marginRight: 12,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  prefDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  saveBtn: {
    marginTop: 28,
  },
});
