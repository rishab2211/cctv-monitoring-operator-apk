import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import {
  BellIcon,
  CameraVideoIcon,
  Home01Icon,
  SirenIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { RootState } from '../store';
import { Colors } from '../theme/colors';
import { AppIcon } from '../components/common/AppIcon';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { CameraListScreen } from '../features/cameras/CameraListScreen';
import { AlertListScreen } from '../features/alerts/AlertListScreen';
import { SOSListScreen } from '../features/sos/SOSListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const renderDashboardIcon = ({ color }: { color: string }) => (
  <AppIcon icon={Home01Icon} size={22} color={color} />
);
const renderCamerasIcon = ({ color }: { color: string }) => (
  <AppIcon icon={CameraVideoIcon} size={22} color={color} />
);
const renderAlertsIcon = ({ color }: { color: string }) => (
  <AppIcon icon={BellIcon} size={22} color={color} />
);
const renderSosIcon = ({ color }: { color: string }) => (
  <AppIcon icon={SirenIcon} size={22} color={color} />
);
const renderProfileIcon = ({ color }: { color: string }) => (
  <AppIcon icon={UserIcon} size={22} color={color} />
);

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
          tabBarIcon: renderDashboardIcon,
        }}
      />

      <Tab.Screen
        name="CamerasTab"
        component={CameraListScreen}
        options={{
          tabBarLabel: 'Cameras',
          tabBarIcon: renderCamerasIcon,
        }}
      />

      <Tab.Screen
        name="AlertsTab"
        component={AlertListScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: pendingAlerts.length > 0 ? pendingAlerts.length : undefined,
          tabBarBadgeStyle: styles.badgeAlert,
          tabBarIcon: renderAlertsIcon,
        }}
      />

      <Tab.Screen
        name="SOSTab"
        component={SOSListScreen}
        options={{
          tabBarLabel: 'SOS',
          tabBarBadge: activeSosAlerts.length > 0 ? activeSosAlerts.length : undefined,
          tabBarBadgeStyle: styles.badgeSos,
          tabBarIcon: renderSosIcon,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: renderProfileIcon,
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
