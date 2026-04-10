import { LessonAudience, Prisma, PrismaClient, Role, SubscriptionTier } from '@prisma/client';

export type LessonAuthPayload = { userId: string; role: Role };

/** Logged-in viewer snapshot for list/progress `locked` flags. */
export type LessonListViewer = {
  role: Role;
  subscriptionTier: SubscriptionTier;
} | null;

/**
 * Lesson list filter: guests only see FREE-audience lessons; logged-in users see
 * all published lessons in allowed subjects (PREMIUM rows get `locked` in the handler).
 */
export function lessonListAudienceWhereInput(
  auth: LessonAuthPayload | undefined,
): Prisma.LessonWhereInput {
  if (!auth) {
    return { audience: LessonAudience.FREE };
  }
  return {};
}

export async function loadLessonListViewer(
  prisma: PrismaClient,
  auth: LessonAuthPayload | undefined,
): Promise<LessonListViewer> {
  if (!auth) {
    return null;
  }
  const u = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true, subscriptionTier: true },
  });
  if (!u) {
    return null;
  }
  return { role: u.role, subscriptionTier: u.subscriptionTier };
}

export function isLessonLockedForViewer(
  viewer: LessonListViewer,
  audience: LessonAudience,
): boolean {
  if (audience === LessonAudience.FREE) {
    return false;
  }
  if (!viewer) {
    return true;
  }
  if (viewer.role === Role.ADMIN || viewer.role === Role.TEACHER) {
    return false;
  }
  if (viewer.role !== Role.STUDENT) {
    return true;
  }
  return viewer.subscriptionTier !== SubscriptionTier.PREMIUM;
}

export async function canViewerAccessLessonAudience(
  prisma: PrismaClient,
  auth: LessonAuthPayload | undefined,
  audience: LessonAudience,
): Promise<boolean> {
  if (audience === LessonAudience.FREE) {
    return true;
  }
  if (!auth) {
    return false;
  }
  if (auth.role === 'ADMIN' || auth.role === 'TEACHER') {
    return true;
  }
  const u = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { subscriptionTier: true, role: true },
  });
  if (!u || u.role !== 'STUDENT') {
    return false;
  }
  return u.subscriptionTier === SubscriptionTier.PREMIUM;
}
