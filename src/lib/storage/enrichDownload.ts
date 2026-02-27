import { BACLesson } from '@/lib/models';
import { getAllLessonDownloadMetadata } from './downloadMetadata';

/**
 * Enrich a lesson (or array of lessons) with local download metadata
 * from MMKV, setting `downloadedPath` and `downloadStatus`.
 */
export function enrichLessonWithDownload(lesson: BACLesson): BACLesson {
  const map = getAllLessonDownloadMetadata();
  const meta = map[lesson.id];
  if (!meta) {
    return lesson;
  }
  return {
    ...lesson,
    downloadedPath: meta.status === 'downloaded' ? meta.localPath : undefined,
    downloadStatus: meta.status ?? 'not_downloaded',
    downloadProgress: meta.progress ?? 0,
  };
}

export function enrichLessonsWithDownload(lessons: BACLesson[]): BACLesson[] {
  const map = getAllLessonDownloadMetadata();
  return lessons.map(lesson => {
    const meta = map[lesson.id];
    if (!meta) {
      return lesson;
    }
    return {
      ...lesson,
      downloadedPath: meta.status === 'downloaded' ? meta.localPath : undefined,
      downloadStatus: meta.status ?? 'not_downloaded',
      downloadProgress: meta.progress ?? 0,
    };
  });
}
