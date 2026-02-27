import { BACLesson } from '@/lib/models';

/**
 * Check whether we're running inside Expo Go, where native modules like
 * react-native-fs are unavailable.
 */
const isExpoGo = (): boolean => {
  try {
    const constantsModule = require('expo-constants') as {
      default?: { appOwnership?: string };
      appOwnership?: string;
    };
    const constants = constantsModule.default ?? constantsModule;
    return constants.appOwnership === 'expo';
  } catch {
    return false;
  }
};

/**
 * Lazy accessor for react-native-fs.
 * The module is NOT available inside Expo Go (its native NativeEventEmitter
 * instantiation crashes at load-time), so we defer the require AND guard
 * against the Expo Go runtime.
 */
const getRNFS = (): typeof import('react-native-fs').default | null => {
  if (isExpoGo()) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-fs');
    return mod.default ?? mod ?? null;
  } catch {
    return null;
  }
};

/** Returns true when the native download module is available (dev-client / standalone). */
export const isDownloadAvailable = (): boolean => {
  return getRNFS() !== null;
};

const getAudioDownloadDir = () => {
  const rnfs = getRNFS();
  if (!rnfs) {
    throw new Error('Downloads are not available in Expo Go');
  }
  return `${rnfs.DocumentDirectoryPath}/audio-lessons`;
};

const getLessonFilePath = (lessonId: string) =>
  `${getAudioDownloadDir()}/${lessonId.replace(/[^a-zA-Z0-9-_]/g, '_')}.mp3`;

const ensureDownloadDir = async () => {
  const RNFS = getRNFS();
  if (!RNFS) {
    throw new Error('Downloads are not available in Expo Go');
  }
  const dir = getAudioDownloadDir();
  const exists = await RNFS.exists(dir);
  if (!exists) {
    await RNFS.mkdir(dir, {
      NSURLIsExcludedFromBackupKey: true,
    });
  }
};

export const downloadLessonAudio = (
  lesson: BACLesson,
  onProgress?: (progress: number) => void,
) => {
  const start = async () => {
    const RNFS = getRNFS();
    if (!RNFS) {
      throw new Error(
        'Downloading is not available in Expo Go. Use a dev-client or standalone build.',
      );
    }

    const toFile = getLessonFilePath(lesson.id);
    await ensureDownloadDir();
    const task = RNFS.downloadFile({
      fromUrl: lesson.audioUrl,
      toFile,
      discretionary: true,
      progressDivider: 1,
      progress: ({ bytesWritten, contentLength }) => {
        if (contentLength > 0 && bytesWritten >= 0) {
          onProgress?.(Math.min(1, bytesWritten / contentLength));
        }
      },
    });

    const result = await task.promise;
    if (result.statusCode < 200 || result.statusCode >= 300) {
      throw new Error(
        `Download failed for lesson ${lesson.id} with status ${result.statusCode}`,
      );
    }
    return { localPath: toFile, jobId: task.jobId };
  };

  return { start };
};

/** Re-export dir path getter for external consumers */
export const AUDIO_DOWNLOAD_DIR = getAudioDownloadDir;
