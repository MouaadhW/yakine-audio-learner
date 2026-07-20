import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { makeApiRequest } from './makeApiRequest';

export async function registerForPushNotificationsAsync() {
  let token;
  if (!Constants.isDevice) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;

  try {
    await makeApiRequest({ url: '/api/push/register', options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) } });
  } catch (e) {
    // ignore
  }

  return token;
}
