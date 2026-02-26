import { MMKV_ENCRYPTION_KEY } from '@env';

type StorageLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

const memoryStorage = new Map<string, string>();

const createStorage = (): StorageLike => {
  let isExpoGo = false;

  try {
    const constantsModule = require('expo-constants') as {
      default?: { appOwnership?: string };
      appOwnership?: string;
    };
    const constants = constantsModule.default ?? constantsModule;
    isExpoGo = constants.appOwnership === 'expo';
  } catch {
    isExpoGo = false;
  }

  if (isExpoGo) {
    return {
      getString: key => memoryStorage.get(key),
      set: (key, value) => {
        memoryStorage.set(key, value);
      },
      delete: key => {
        memoryStorage.delete(key);
      },
    };
  }

  try {
    const mmkvModule = require('react-native-mmkv') as {
      createMMKV: (args: {
        id: string;
        encryptionKey?: string;
      }) => {
        getString: (key: string) => string | undefined;
        set: (key: string, value: string) => void;
        delete: (key: string) => void;
      };
    };

    return mmkvModule.createMMKV({
      id: 'yakine-audio-learner',
      encryptionKey: MMKV_ENCRYPTION_KEY,
    });
  } catch {
    return {
      getString: key => memoryStorage.get(key),
      set: (key, value) => {
        memoryStorage.set(key, value);
      },
      delete: key => {
        memoryStorage.delete(key);
      },
    };
  }
};

export const storage = createStorage();

export const storageKeys = {
  themeMode: 'theme.mode',
  language: 'app.language',
  downloads: 'audio.downloads',
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
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
