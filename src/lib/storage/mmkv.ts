import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'yakine-audio-learner',
});

export const storageKeys = {
  themeMode: 'theme.mode',
  language: 'app.language',
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
} as const;

export const mmkv = {
  getString: (key: string) => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
};
