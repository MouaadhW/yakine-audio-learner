import { makeApiRequest } from '../makeApiRequest';
import { validateApiResponse } from '../validateApiResponse';

// ─── Types ──────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  banned: boolean;
  language: string;
  subscriptionTier?: 'FREE' | 'PREMIUM';
  lawRegion?: string | null;
  lawUniversity?: string | null;
  lawMajor?: string | null;
  lawAcademicLevel?: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  _count?: { lessons: number; progress: number };
}

export interface AdminUserPage {
  contents: AdminUser[];
  currentPage: number;
  totalPage: number;
  pageSize: number;
  totalElements: number;
}

export interface DashboardStats {
  totalUsers: number;
  students: number;
  teachers: number;
  admins: number;
  bannedCount: number;
  activeToday: number;
  totalLessons: number;
  totalSubjects: number;
  totalChapters: number;
  lessonsPlayedToday: number;
  pendingReview: number;
  topSubjects: {
    id: string;
    nameEn: string;
    nameFr: string;
    icon: string;
    chapterCount: number;
    lessonCount: number;
  }[];
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
}

export interface ModerationLesson {
  id: string;
  titleEn: string;
  titleFr: string;
  audioUrl: string;
  duration: number;
  status: string;
  createdAt: string;
  teacherName?: string;
  teacherEmail?: string;
  subjectName?: string;
  chapterName?: string;
  teacher?: { id: string; name: string; email: string };
  chapter?: { nameEn: string; subject?: { nameEn: string } };
}

export interface ModerationPage {
  contents: ModerationLesson[];
  currentPage: number;
  totalPage: number;
  pageSize: number;
  totalElements: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
  createdAt: string;
}

export interface BulkExport {
  version: number;
  exportedAt: string;
  subjects: any[];
}

export interface BulkImportResult {
  message: string;
  imported: { subjects: number; chapters: number; lessons: number };
}

// ─── User Management ────────────────────────────────────────────────

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}): Promise<AdminUserPage> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.search) qs.set('search', params.search);
  if (params?.role) qs.set('role', params.role);

  const resp = await makeApiRequest({
    url: `/api/admin/users?${qs.toString()}`,
  });
  await validateApiResponse(resp);
  return (await resp.json()) as AdminUserPage;
}

export async function updateUser(
  id: string,
  data: {
    role?: string;
    banned?: boolean;
    subscriptionTier?: 'FREE' | 'PREMIUM';
    lawRegion?: string | null;
    lawUniversity?: string | null;
    lawMajor?: string | null;
    lawAcademicLevel?: string | null;
  },
): Promise<AdminUser> {
  const resp = await makeApiRequest({
    url: `/api/admin/users/${id}`,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as AdminUser;
}

export async function deleteUser(id: string): Promise<void> {
  const resp = await makeApiRequest({
    url: `/api/admin/users/${id}`,
    options: { method: 'DELETE' },
  });
  await validateApiResponse(resp);
}

// ─── Dashboard Stats ────────────────────────────────────────────────

export async function getDashboardStats(
  signal?: AbortSignal,
): Promise<DashboardStats> {
  const resp = await makeApiRequest({
    url: '/api/admin/stats',
    options: { signal },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as DashboardStats;
}

// ─── Content Moderation ─────────────────────────────────────────────

export async function getModerationQueue(params?: {
  status?: string;
  page?: number;
}): Promise<ModerationPage> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));

  const resp = await makeApiRequest({
    url: `/api/admin/moderation?${qs.toString()}`,
  });
  await validateApiResponse(resp);
  return (await resp.json()) as ModerationPage;
}

export async function reviewLesson(
  id: string,
  action: 'approve' | 'reject',
): Promise<void> {
  const resp = await makeApiRequest({
    url: `/api/admin/moderation/${id}`,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    },
  });
  await validateApiResponse(resp);
}

// ─── Bulk Import/Export ─────────────────────────────────────────────

export async function bulkExport(): Promise<BulkExport> {
  const resp = await makeApiRequest({ url: '/api/admin/bulk/export' });
  await validateApiResponse(resp);
  return (await resp.json()) as BulkExport;
}

export async function bulkImport(
  data: BulkExport,
): Promise<BulkImportResult> {
  const resp = await makeApiRequest({
    url: '/api/admin/bulk/import',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as BulkImportResult;
}

// ─── Announcements ─────────────────────────────────────────────────

export async function getAnnouncements(all = false): Promise<Announcement[]> {
  const qs = all ? '?all=true' : '';
  const resp = await makeApiRequest({ url: `/api/announcements${qs}` });
  await validateApiResponse(resp);
  return (await resp.json()) as Announcement[];
}

/** Convenience alias – fetches only active, in-range announcements. */
export const getActiveAnnouncements = () => getAnnouncements(false);

export async function createAnnouncement(data: {
  title: string;
  body: string;
  type?: string;
  active?: boolean;
}): Promise<Announcement> {
  const resp = await makeApiRequest({
    url: '/api/announcements',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as Announcement;
}

export async function updateAnnouncement(
  id: string,
  data: Partial<{ title: string; body: string; type: string; active: boolean }>,
): Promise<Announcement> {
  const resp = await makeApiRequest({
    url: `/api/announcements/${id}`,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as Announcement;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const resp = await makeApiRequest({
    url: `/api/announcements/${id}`,
    options: { method: 'DELETE' },
  });
  await validateApiResponse(resp);
}

// ─── Feature Flags ──────────────────────────────────────────────────

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const resp = await makeApiRequest({ url: '/api/feature-flags' });
  await validateApiResponse(resp);
  return (await resp.json()) as FeatureFlag[];
}

export async function createFeatureFlag(data: {
  key: string;
  enabled: boolean;
  description?: string;
}): Promise<FeatureFlag> {
  const resp = await makeApiRequest({
    url: '/api/feature-flags',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as FeatureFlag;
}

export async function updateFeatureFlag(
  id: string,
  data: Partial<{ key: string; enabled: boolean; description: string }>,
): Promise<FeatureFlag> {
  const resp = await makeApiRequest({
    url: `/api/feature-flags/${id}`,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as FeatureFlag;
}

export async function deleteFeatureFlag(id: string): Promise<void> {
  const resp = await makeApiRequest({
    url: `/api/feature-flags/${id}`,
    options: { method: 'DELETE' },
  });
  await validateApiResponse(resp);
}

// ─── Teacher Scopes ─────────────────────────────────────────────────

export interface TeacherScopeItem {
  id: string;
  teacherId: string;
  educationLevel: 'HIGH_SCHOOL' | 'UNIVERSITY';
  grade: number | null;
  universityYear: number | null;
  stream: 'SCIENTIFIC' | 'LITERARY' | 'ECONOMIC' | 'TECHNICAL';
  createdAt: string;
}

export async function getTeacherScopes(
  teacherId: string,
): Promise<TeacherScopeItem[]> {
  const resp = await makeApiRequest({
    url: `/api/admin/teacher-scopes/${teacherId}`,
  });
  await validateApiResponse(resp);
  return (await resp.json()) as TeacherScopeItem[];
}

export async function createTeacherScope(data: {
  teacherId: string;
  educationLevel: 'HIGH_SCHOOL' | 'UNIVERSITY';
  grade: number | null;
  universityYear: number | null;
  stream: 'SCIENTIFIC' | 'LITERARY' | 'ECONOMIC' | 'TECHNICAL';
}): Promise<TeacherScopeItem> {
  const resp = await makeApiRequest({
    url: '/api/admin/teacher-scopes',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as TeacherScopeItem;
}

export async function deleteTeacherScope(id: string): Promise<void> {
  const resp = await makeApiRequest({
    url: `/api/admin/teacher-scopes/${id}`,
    options: { method: 'DELETE' },
  });
  await validateApiResponse(resp);
}

// ─── Teacher law subject assignments (faculty modules) ─────────────

export interface TeacherLawAssignmentRow {
  id: string;
  subjectId: string;
  subject: { nameEn: string; nameFr: string; lawUniversity: string | null };
}

export async function getTeacherLawAssignments(
  teacherId: string,
): Promise<TeacherLawAssignmentRow[]> {
  const resp = await makeApiRequest({
    url: `/api/admin/teacher-law/${encodeURIComponent(teacherId)}`,
  });
  await validateApiResponse(resp);
  return (await resp.json()) as TeacherLawAssignmentRow[];
}

export async function setTeacherLawSubject(
  teacherId: string,
  subjectId: string,
): Promise<{ id: string }> {
  const resp = await makeApiRequest({
    url: '/api/admin/teacher-law',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId, subjectId }),
    },
  });
  await validateApiResponse(resp);
  return (await resp.json()) as { id: string };
}

export async function removeTeacherLawAssignment(assignmentId: string): Promise<void> {
  const resp = await makeApiRequest({
    url: `/api/admin/teacher-law/assignment/${encodeURIComponent(assignmentId)}`,
    options: { method: 'DELETE' },
  });
  await validateApiResponse(resp);
}
