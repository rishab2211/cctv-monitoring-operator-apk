import { LinkingOptions } from '@react-navigation/native';
import { ENV } from '../config/env';

export const deepLinking: LinkingOptions<any> = {
  prefixes: [`${ENV.APP_SCHEME}://`],
  config: {
    screens: {
      MainTabs: {
        screens: {
          DashboardTab: 'dashboard',
          CamerasTab: 'cameras',
          AlertsTab: 'alerts',
          SOSTab: 'sos',
          ProfileTab: 'profile',
        },
      },
      SOSDetail: 'sos/:sosId',
      AlertDetail: 'alerts/:alertId',
      IncidentDetail: 'incidents/:incidentId',
      CameraDetail: 'cameras/:cameraId',
      LiveView: 'live/:cameraId',
      Notifications: 'notifications',
    },
  },
};
