import { BACLesson } from '@/lib/models';
import RNFS from 'react-native-fs';

export const AUDIO_DOWNLOAD_DIR = `${RNFS.DocumentDirectoryPath}/audio-lessons`;

const getLessonFilePath = (lessonId: string) =>
  `${AUDIO_DOWNLOAD_DIR}/${lessonId.replace(/[^a-zA-Z0-9-_]/g, '_')}.mp3`;

const ensureDownloadDir = async () => {
  const exists = await RNFS.exists(AUDIO_DOWNLOAD_DIR);
  if (!exists) {
    await RNFS.mkdir(AUDIO_DOWNLOAD_DIR, {
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
    await ensureDownloadDir();
    const task = RNFS.downloadFile({
      fromUrl: lesson.audioUrl,
      toFile,
      discretionary: true,
      progressDivider: 1,
      progress: ({ bytesWritten, contentLength }) => {
        if (contentLength > 0) {
          onProgress?.(Math.min(1, bytesWritten / contentLength));
        }
      },
    });

    const result = await task.promise;
    if (result.statusCode < 200 || result.statusCode >= 300) {
      throw new Error(`Download failed with status ${result.statusCode}`);
    }
    return { localPath: toFile, jobId: task.jobId };
  };

  return { start };
};
