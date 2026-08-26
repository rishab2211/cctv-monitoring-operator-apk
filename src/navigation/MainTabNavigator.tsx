import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Colors } from '../theme/colors';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { CameraListScreen } from '../features/cameras/CameraListScreen';
import { AlertListScreen } from '../features/alerts/AlertListScreen';
import { SOSListScreen } from '../features/sos/SOSListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  const { pendingAlerts } = useSelector((state: RootState) => state.alert);
  const { activeSosAlerts } = useSelector((state: RootState) => state.sos);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={[styles.tabEmoji, { color }]}>🏠</Text>,
        }}
      />

      <Tab.Screen
        name="CamerasTab"
        component={CameraListScreen}
        options={{
          tabBarLabel: 'Cameras',
          tabBarIcon: ({ color }) => <Text style={[styles.tabEmoji, { color }]}>📹</Text>,
        }}
      />

      <Tab.Screen
        name="AlertsTab"
        component={AlertListScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: pendingAlerts.length > 0 ? pendingAlerts.length : undefined,
          tabBarBadgeStyle: styles.badgeAlert,
          tabBarIcon: ({ color }) => <Text style={[styles.tabEmoji, { color }]}>🔔</Text>,
        }}
      />

      <Tab.Screen
        name="SOSTab"
        component={SOSListScreen}
        options={{
          tabBarLabel: 'SOS',
          tabBarBadge: activeSosAlerts.length > 0 ? activeSosAlerts.length : undefined,
          tabBarBadgeStyle: styles.badgeSos,
          tabBarIcon: ({ color }) => <Text style={[styles.tabEmoji, { color }]}>🆘</Text>,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={[styles.tabEmoji, { color }]}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    height: 62,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  tabEmoji: {
    fontSize: 20,
  },
  badgeAlert: {
    backgroundColor: Colors.warning,
    color: '#000000',
    fontWeight: '900',
    fontSize: 10,
  },
  badgeSos: {
    backgroundColor: Colors.critical,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
});
