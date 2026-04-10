import { makeApiRequest } from '../makeApiRequest';
import { BACSubject, BACChapter, BACLesson, Page, ProgressEntry } from '../models';
import { validateApiResponse } from '../validateApiResponse';
import type { AuthUser } from '@/features/auth/authSlice';
import { API_URL } from '@env';
import { mmkv, storageKeys } from '../storage/mmkv';

/**
 * Fetch all subjects (with chapters and lesson counts).
 * Returns the `contents` array from a Page<BACSubject> response.
 */
/** Current user from `GET /api/auth/me` (subscription tier, law faculty, etc.). */
export async function fetchCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  const resp = await makeApiRequest({
    url: '/api/auth/me',
    options: { signal },
  });
  await validateApiResponse(resp);
  const data = (await resp.json()) as Record<string, unknown>;
  return {
    id: data.id as string,
    name: data.name as string,
    email: data.email as string,
    role: data.role as AuthUser['role'],
    subscriptionTier: data.subscriptionTier as AuthUser['subscriptionTier'],
    language: data.language as AuthUser['language'],
    educationLevel: data.educationLevel as AuthUser['educationLevel'],
    grade: data.grade as AuthUser['grade'],
    universityYear: data.universityYear as AuthUser['universityYear'],
    stream: data.stream as AuthUser['stream'],
    lawRegion: data.lawRegion as AuthUser['lawRegion'],
    lawUniversity: data.lawUniversity as AuthUser['lawUniversity'],
    lawMajor: data.lawMajor as AuthUser['lawMajor'],
    lawAcademicLevel: data.lawAcademicLevel as AuthUser['lawAcademicLevel'],
  };
}

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
  audience?: 'FREE' | 'PREMIUM';
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
    audience: 'FREE' | 'PREMIUM';
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

// ─── Progress tracking ──────────────────────────────────────────────

export async function getProgress(
  signal?: AbortSignal,
): Promise<ProgressEntry[]> {
  const resp = await makeApiRequest({
    url: '/api/progress',
    options: { signal },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as ProgressEntry[];
}

export async function saveProgress(data: {
  lessonId: string;
  position: number;
  completed?: boolean;
}): Promise<void> {
  const resp = await makeApiRequest({
    url: '/api/progress',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
}

// ─── Audio File Upload ──────────────────────────────────────────────

export async function uploadAudioFile(
  fileUri: string,
  fileName: string,
  mimeType = 'audio/mpeg',
): Promise<{ path: string; publicUrl: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const accessToken = mmkv.getString(storageKeys.accessToken);

  const response = await fetch(`${API_URL}/api/storage/upload`, {
    method: 'POST',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(err.message ?? 'Upload failed');
  }

  return response.json();
}

// ─── Teacher Composer APIs ─────────────────────────────────────────

export type ComposerLanguage = 'EN' | 'FR' | 'AR';

export interface TeacherComposerLessonInput {
  chapterId: string;
  titleEn: string;
  titleFr: string;
  sortOrder?: number;
  audience?: 'FREE' | 'PREMIUM';
  defaultAudioLanguage?: ComposerLanguage;
  autoPublish?: boolean;
  transcripts?: Partial<Record<ComposerLanguage, string>>;
  scripts?: Partial<Record<ComposerLanguage, string>>;
}

export interface AttachManualAudioInput {
  audioUrl: string;
  duration?: number;
  language: ComposerLanguage;
  sourceType?: 'MANUAL_UPLOAD' | 'MANUAL_RECORDING';
  script?: string;
}

export interface EnqueueAiGenerationInput {
  languages: ComposerLanguage[];
  voiceSelection?: Partial<Record<ComposerLanguage, string>>;
  autoPublish?: boolean;
}

export interface ComposerGenerationJob {
  id: string;
  lessonId: string;
  teacherId: string;
  provider: 'ELEVENLABS';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  requestedLanguages: ComposerLanguage[];
  voiceSelection?: Partial<Record<ComposerLanguage, string>>;
  errorMessage?: string | null;
  attemptCount: number;
  requestedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function uploadTranscriptDocument(
  fileUri: string,
  fileName: string,
  mimeType = 'application/octet-stream',
): Promise<{ text: string; characterCount: number; filename: string; mimeType: string }> {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const accessToken = mmkv.getString(storageKeys.accessToken);

  const response = await fetch(`${API_URL}/api/teacher-composer/transcripts/upload`, {
    method: 'POST',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Transcript upload failed' }));
    throw new Error(err.message ?? 'Transcript upload failed');
  }

  return response.json();
}

export async function createTeacherComposerLesson(
  data: TeacherComposerLessonInput,
): Promise<BACLesson> {
  const resp = await makeApiRequest({
    url: '/api/teacher-composer/lessons',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as BACLesson;
}

export async function attachTeacherComposerManualAudio(
  lessonId: string,
  data: AttachManualAudioInput,
): Promise<BACLesson> {
  const resp = await makeApiRequest({
    url: `/api/teacher-composer/lessons/${lessonId}/manual-audio`,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as BACLesson;
}

export async function enqueueTeacherComposerAiGeneration(
  lessonId: string,
  data: EnqueueAiGenerationInput,
): Promise<{ message: string; lessonId: string; job: ComposerGenerationJob }> {
  const resp = await makeApiRequest({
    url: `/api/teacher-composer/lessons/${lessonId}/ai-jobs`,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as { message: string; lessonId: string; job: ComposerGenerationJob };
}

export async function getTeacherComposerLessonJobs(
  lessonId: string,
): Promise<ComposerGenerationJob[]> {
  const resp = await makeApiRequest({
    url: `/api/teacher-composer/lessons/${lessonId}/jobs`,
  });
  await validateApiResponse(resp);
  return (await resp.json()) as ComposerGenerationJob[];
}

export async function getTeacherComposerAiJob(jobId: string): Promise<ComposerGenerationJob> {
  const resp = await makeApiRequest({
    url: `/api/teacher-composer/ai-jobs/${jobId}`,
  });
  await validateApiResponse(resp);
  return (await resp.json()) as ComposerGenerationJob;
}

export async function retryTeacherComposerAiJob(jobId: string): Promise<ComposerGenerationJob> {
  const resp = await makeApiRequest({
    url: `/api/teacher-composer/ai-jobs/${jobId}/retry`,
    options: {
      method: 'POST',
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as ComposerGenerationJob;
}

export async function cancelTeacherComposerAiJob(jobId: string): Promise<ComposerGenerationJob> {
  const resp = await makeApiRequest({
    url: `/api/teacher-composer/ai-jobs/${jobId}/cancel`,
    options: {
      method: 'POST',
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as ComposerGenerationJob;
}
