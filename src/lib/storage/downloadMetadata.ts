import { mmkv, storageKeys } from './mmkv';

export type LessonDownloadMetadata = {
  lessonId: string;
  status: 'downloading' | 'downloaded' | 'failed';
  progress: number;
  localPath?: string;
  updatedAt: number;
};

type DownloadMetadataMap = Record<string, LessonDownloadMetadata>;

const getAll = (): DownloadMetadataMap => {
  return mmkv.getObject<DownloadMetadataMap>(storageKeys.downloads) ?? {};
};

const saveAll = (value: DownloadMetadataMap) => {
  mmkv.setObject(storageKeys.downloads, value);
};

export const getLessonDownloadMetadata = (
  lessonId: string,
): LessonDownloadMetadata | undefined => {
  return getAll()[lessonId];
};

export const getAllLessonDownloadMetadata = (): DownloadMetadataMap => {
  return getAll();
};

export const upsertLessonDownloadMetadata = (
  lessonId: string,
  patch: Omit<LessonDownloadMetadata, 'lessonId' | 'updatedAt'>,
) => {
  const all = getAll();
  all[lessonId] = {
    ...all[lessonId],
    lessonId,
    ...patch,
    updatedAt: Date.now(),
  };
  saveAll(all);
  return all[lessonId];
};
