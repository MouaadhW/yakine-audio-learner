import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const statsRouter = Router();

statsRouter.use(requireAuth, requireRole('ADMIN'));

// GET /api/admin/stats — dashboard statistics
statsRouter.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      usersByRole,
      activeToday,
      totalLessons,
      totalSubjects,
      totalChapters,
      lessonsPlayedToday,
      pendingReview,
      topSubjects,
      recentUsers,
      bannedCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.user.count({ where: { lastLoginAt: { gte: todayStart } } }),
      prisma.lesson.count(),
      prisma.subject.count(),
      prisma.chapter.count(),
      prisma.progress.count({
        where: { lesson: { createdAt: { gte: todayStart } } },
      }),
      prisma.lesson.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.subject.findMany({
        select: {
          id: true,
          nameEn: true,
          nameFr: true,
          icon: true,
          _count: {
            select: {
              chapters: true,
            },
          },
          chapters: {
            select: {
              _count: { select: { lessons: true } },
            },
          },
        },
        take: 5,
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.user.count({ where: { banned: true } }),
    ]);

    const roleMap: Record<string, number> = {};
    for (const r of usersByRole) {
      roleMap[r.role] = r._count;
    }

    const subjectsWithLessonCount = topSubjects.map((s: any) => ({
      id: s.id,
      nameEn: s.nameEn,
      nameFr: s.nameFr,
      icon: s.icon,
      chapterCount: s._count.chapters,
      lessonCount: s.chapters.reduce(
        (sum: number, ch: any) => sum + ch._count.lessons,
        0,
      ),
    }));

    return res.json({
      totalUsers,
      students: roleMap.STUDENT || 0,
      teachers: roleMap.TEACHER || 0,
      admins: roleMap.ADMIN || 0,
      bannedCount,
      activeToday,
      totalLessons,
      totalSubjects,
      totalChapters,
      lessonsPlayedToday,
      pendingReview,
      topSubjects: subjectsWithLessonCount,
      recentUsers,
    });
  } catch (error) {
    return next(error);
  }
});
