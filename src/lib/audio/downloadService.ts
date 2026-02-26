import { BACLesson } from '@/lib/models';

/**
 * Lazy accessor for react-native-fs.
 * The module is NOT available inside Expo Go (its native NativeEventEmitter
 * instantiation crashes at load-time), so we defer the require until it is
 * actually called at runtime – which only happens in dev-client / standalone
 * builds where the native module exists.
 */
const getRNFS = (): typeof import('react-native-fs').default => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('react-native-fs').default ?? require('react-native-fs');
};

const getAudioDownloadDir = () =>
  `${getRNFS().DocumentDirectoryPath}/audio-lessons`;

const getLessonFilePath = (lessonId: string) =>
  `${getAudioDownloadDir()}/${lessonId.replace(/[^a-zA-Z0-9-_]/g, '_')}.mp3`;

const ensureDownloadDir = async () => {
  const RNFS = getRNFS();
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
  const toFile = getLessonFilePath(lesson.id);

  const start = async () => {
    const RNFS = getRNFS();
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
