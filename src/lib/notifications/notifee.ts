import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

export const setupNotifications = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: 'default',
    name: 'Default',
    importance: AndroidImportance.DEFAULT,
  });
};
