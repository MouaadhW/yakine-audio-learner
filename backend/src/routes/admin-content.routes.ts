import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminContentRouter = Router();

// Admin-only: list ALL lessons with search, no status filter
adminContentRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');
      const search = (req.query.search as string) || '';

      const where: any = {};

      if (search) {
        where.OR = [
          { titleEn: { contains: search, mode: 'insensitive' } },
          { titleFr: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [lessons, total] = await Promise.all([
        prisma.lesson.findMany({
          where,
          include: {
            chapter: {
              include: { subject: { select: { nameEn: true, nameFr: true } } },
            },
            teacher: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: (page - 1) * limit,
        }),
        prisma.lesson.count({ where }),
      ]);

      const contents = lessons.map((l: any) => ({
        id: l.id,
        titleEn: l.titleEn,
        titleFr: l.titleFr,
        audioUrl: l.audioUrl,
        scriptEn: l.scriptEn,
        scriptFr: l.scriptFr,
        duration: l.duration,
        sortOrder: l.sortOrder,
        status: l.status,
        createdAt: l.createdAt,
        teacherName: l.teacher?.name ?? 'Unknown',
        chapter: l.chapter
          ? {
              id: l.chapter.id,
              nameEn: l.chapter.nameEn,
              nameFr: l.chapter.nameFr,
              subject: l.chapter.subject ?? null,
            }
          : null,
      }));

      return res.json({
        contents,
        currentPage: page,
        totalPage: Math.ceil(total / limit) || 1,
        pageSize: limit,
        totalElements: total,
      });
    } catch (error) {
      return next(error);
    }
  },
);
