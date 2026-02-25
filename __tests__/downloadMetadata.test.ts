jest.mock('../src/lib/storage/mmkv', () => {
  const memory = new Map<string, string>();
  return {
    storageKeys: {
      downloads: 'audio.downloads',
    },
    mmkv: {
      getObject: <T>(key: string): T | undefined => {
        const raw = memory.get(key);
        return raw ? (JSON.parse(raw) as T) : undefined;
      },
      setObject: (key: string, value: unknown) => {
        memory.set(key, JSON.stringify(value));
      },
    },
  };
});

import {
  getAllLessonDownloadMetadata,
  getLessonDownloadMetadata,
  upsertLessonDownloadMetadata,
} from '../src/lib/storage/downloadMetadata';

describe('download metadata storage', () => {
  it('stores and updates lesson download metadata', () => {
    const downloading = upsertLessonDownloadMetadata('lesson-1', {
      status: 'downloading',
      progress: 0.4,
    });

    expect(downloading.lessonId).toBe('lesson-1');
    expect(downloading.status).toBe('downloading');
    expect(downloading.progress).toBe(0.4);

    const downloaded = upsertLessonDownloadMetadata('lesson-1', {
      status: 'downloaded',
      progress: 1,
      localPath: '/sandbox/audio-lessons/lesson-1.mp3',
    });

    expect(downloaded.status).toBe('downloaded');
    expect(downloaded.localPath).toContain('/sandbox/audio-lessons/');
    expect(getLessonDownloadMetadata('lesson-1')?.progress).toBe(1);
    expect(Object.keys(getAllLessonDownloadMetadata())).toContain('lesson-1');
  });
});
