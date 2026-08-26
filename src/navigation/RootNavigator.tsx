import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { Colors } from '../theme/colors';
import { StorageService } from '../services/storage.service';
import { socketService } from '../services/socket.service';
import { setOnUnauthorizedCallback } from '../api/client';
import { loginSuccess, logout, setFranchiseName } from '../store/slices/authSlice';
import { AuthApi } from '../api/endpoints/auth.api';
import { deepLinking } from './deepLinking';

import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

// Modals & Detailed Screens
import { CameraDetailScreen } from '../features/cameras/CameraDetailScreen';
import { LiveViewScreen } from '../features/cameras/LiveViewScreen';
import { RecordingPlaybackScreen } from '../features/cameras/RecordingPlaybackScreen';
import { AlertDetailScreen } from '../features/alerts/AlertDetailScreen';
import { SOSDetailScreen } from '../features/sos/SOSDetailScreen';
import { IncidentListScreen } from '../features/incidents/IncidentListScreen';
import { IncidentDetailScreen } from '../features/incidents/IncidentDetailScreen';
import { ReportIncidentScreen } from '../features/incidents/ReportIncidentScreen';
import { IncidentTimelineScreen } from '../features/incidents/IncidentTimelineScreen';
import { TalkbackActiveOverlay } from '../features/talkback/TalkbackActiveOverlay';
import { CallHistoryScreen } from '../features/talkback/CallHistoryScreen';
import { ClockOutModal } from '../features/shifts/ClockOutModal';
import { ReportsScreen } from '../features/reports/ReportsScreen';
import { TimelineScreen } from '../features/timeline/TimelineScreen';
import { NotificationCenterScreen } from '../features/notifications/NotificationCenterScreen';
import { NotificationPreferencesScreen } from '../features/notifications/NotificationPreferencesScreen';
import { ActiveSessionsScreen } from '../features/profile/ActiveSessionsScreen';
import { ChangePasswordScreen } from '../features/profile/ChangePasswordScreen';
import { ShiftHistoryScreen } from '../features/profile/ShiftHistoryScreen';

const RootStack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [initializing, setInitializing] = useState(true);

  // Silent session hydration & socket connection
  useEffect(() => {
    const bootstrap = async () => {
      try {
        setOnUnauthorizedCallback(() => {
          socketService.disconnect();
          dispatch(logout());
        });

        const { accessToken } = await StorageService.getTokens();
        if (accessToken) {
          const profile = await AuthApi.getMe();
          if (profile && profile.role === 'operator') {
            dispatch(loginSuccess({ user: profile }));

            // Connect socket
            const franchiseId = profile.operatorDetails?.assignedFranchise;
            await socketService.connect(profile._id, franchiseId);

            // Fetch franchise name if present
            if (franchiseId) {
              try {
                const franchise = await AuthApi.getFranchiseDetails(franchiseId);
                if (franchise?.name) {
                  dispatch(setFranchiseName(franchise.name));
                }
              } catch {
                // Non-critical if franchise lookup fails
              }
            }
          }
        }
      } catch (err) {
        console.log('[Bootstrap] Stored session invalid or expired:', err);
      } finally {
        setInitializing(false);
      }
    };

    bootstrap();
  }, [dispatch]);

  if (initializing) {
    return (
      <View style={styles.initializingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={deepLinking}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
            <RootStack.Screen name="CameraDetail" component={CameraDetailScreen as any} />
            <RootStack.Screen name="LiveView" component={LiveViewScreen as any} />
            <RootStack.Screen name="RecordingPlayback" component={RecordingPlaybackScreen as any} />
            <RootStack.Screen name="AlertDetail" component={AlertDetailScreen as any} />
            <RootStack.Screen name="SOSDetail" component={SOSDetailScreen as any} />
            <RootStack.Screen name="IncidentList" component={IncidentListScreen} />
            <RootStack.Screen name="IncidentDetail" component={IncidentDetailScreen as any} />
            <RootStack.Screen name="ReportIncident" component={ReportIncidentScreen as any} />
            <RootStack.Screen name="IncidentTimeline" component={IncidentTimelineScreen as any} />
            <RootStack.Screen name="TalkbackActive" component={TalkbackActiveOverlay as any} />
            <RootStack.Screen name="CallHistory" component={CallHistoryScreen} />
            <RootStack.Screen
              name="ClockOutModal"
              component={ClockOutModal}
              options={{ presentation: 'modal' }}
            />
            <RootStack.Screen name="Reports" component={ReportsScreen} />
            <RootStack.Screen name="Timeline" component={TimelineScreen} />
            <RootStack.Screen name="Notifications" component={NotificationCenterScreen} />
            <RootStack.Screen
              name="NotificationPreferences"
              component={NotificationPreferencesScreen}
            />
            <RootStack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
            <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <RootStack.Screen name="ShiftHistory" component={ShiftHistoryScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  initializingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
