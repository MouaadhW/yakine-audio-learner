import { makeApiRequest } from '../makeApiRequest';
import { BACSubject, BACChapter, BACLesson, Page } from '../models';
import { validateApiResponse } from '../validateApiResponse';

/**
 * Fetch all subjects (with chapters and lesson counts).
 * Returns the `contents` array from a Page<BACSubject> response.
 */
export async function getSubjects(signal?: AbortSignal): Promise<BACSubject[]> {
  const resp = await makeApiRequest({
    url: '/api/subjects',
    options: { signal },
  });

  await validateApiResponse(resp);

  const page = (await resp.json()) as Page<BACSubject>;
  return page.contents;
}

/**
 * Fetch chapters for a given subject.
 * Each chapter includes its lessons (with teacherName).
 */
export async function getChaptersBySubject(
  subjectId: string,
  signal?: AbortSignal,
): Promise<BACChapter[]> {
  const resp = await makeApiRequest({
    url: `/api/chapters?subjectId=${encodeURIComponent(subjectId)}`,
    options: { signal },
  });

  await validateApiResponse(resp);

  return (await resp.json()) as BACChapter[];
}

/**
 * Fetch lessons for a given chapter.
 * Returns Page<BACLesson>.contents.
 */
export async function getLessonsByChapter(
  chapterId: string,
  signal?: AbortSignal,
): Promise<BACLesson[]> {
  const resp = await makeApiRequest({
    url: `/api/lessons?chapterId=${encodeURIComponent(chapterId)}`,
    options: { signal },
  });

  await validateApiResponse(resp);

  const page = (await resp.json()) as Page<BACLesson>;
  return page.contents;
}

// ─── Admin / Teacher CRUD ────────────────────────────────────────────

export async function createSubject(data: {
  nameEn: string;
  nameFr: string;
  stream: string;
  icon?: string;
  color?: string;
}): Promise<BACSubject> {
  const resp = await makeApiRequest({
    url: '/api/subjects',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as BACSubject;
}

export async function updateSubject(
  id: string,
  data: Partial<{ nameEn: string; nameFr: string; stream: string; icon: string; color: string }>,
): Promise<BACSubject> {
  const resp = await makeApiRequest({
    url: `/api/subjects/${id}`,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as BACSubject;
}

export async function deleteSubject(id: string): Promise<void> {
  const resp = await makeApiRequest({
    url: `/api/subjects/${id}`,
    options: { method: 'DELETE' },
  });
  await validateApiResponse(resp);
}

export async function createChapter(data: {
  nameEn: string;
  nameFr: string;
  subjectId: string;
  sortOrder?: number;
}): Promise<BACChapter> {
  const resp = await makeApiRequest({
    url: '/api/chapters',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as BACChapter;
}

export async function updateChapter(
  id: string,
  data: Partial<{ nameEn: string; nameFr: string; sortOrder: number }>,
): Promise<BACChapter> {
  const resp = await makeApiRequest({
    url: `/api/chapters/${id}`,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as BACChapter;
}

export async function deleteChapter(id: string): Promise<void> {
  const resp = await makeApiRequest({
    url: `/api/chapters/${id}`,
    options: { method: 'DELETE' },
  });
  await validateApiResponse(resp);
}

export async function createLesson(data: {
  titleEn: string;
  titleFr: string;
  audioUrl: string;
  scriptEn: string;
  scriptFr: string;
  duration: number;
  chapterId: string;
  sortOrder?: number;
}): Promise<BACLesson> {
  const resp = await makeApiRequest({
    url: '/api/lessons',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as BACLesson;
}

export async function updateLesson(
  id: string,
  data: Partial<{
    titleEn: string;
    titleFr: string;
    audioUrl: string;
    scriptEn: string;
    scriptFr: string;
    duration: number;
    sortOrder: number;
  }>,
): Promise<BACLesson> {
  const resp = await makeApiRequest({
    url: `/api/lessons/${id}`,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as BACLesson;
}

export async function deleteLesson(id: string): Promise<void> {
  const resp = await makeApiRequest({
    url: `/api/lessons/${id}`,
    options: { method: 'DELETE' },
  });
  await validateApiResponse(resp);
}
