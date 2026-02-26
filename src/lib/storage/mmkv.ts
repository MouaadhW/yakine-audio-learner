import { MMKV_ENCRYPTION_KEY } from '@env';
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'yakine-audio-learner',
  encryptionKey: MMKV_ENCRYPTION_KEY,
});

export const storageKeys = {
  themeMode: 'theme.mode',
  language: 'app.language',
  downloads: 'audio.downloads',
  authToken: 'auth.token',
  authUser: 'auth.user',
} as const;

export const mmkv = {
  getString: (key: string) => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
  delete: (key: string) => storage.delete(key),
  getObject: <T>(key: string): T | undefined => {
    const value = storage.getString(key);
    if (!value) {
      return undefined;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  },
  setObject: (key: string, value: unknown) => storage.set(key, JSON.stringify(value)),
};
