import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const moderationRouter = Router();

moderationRouter.use(requireAuth, requireRole('ADMIN'));

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
});

const lessonStatusSchema = z.enum(['PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'DRAFT']);

// GET /api/admin/moderation — list pending lessons
moderationRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const status = lessonStatusSchema.catch('PENDING_REVIEW').parse(req.query.status);

    const where = { status };

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          chapter: { include: { subject: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.lesson.count({ where }),
    ]);

    return res.json({
      contents: lessons.map((l) => ({
        ...l,
        teacherName: l.teacher?.name || 'Unknown',
        teacherEmail: l.teacher?.email || '',
        subjectName: l.chapter?.subject?.nameEn || '',
        chapterName: l.chapter?.nameEn || '',
      })),
      currentPage: page,
      totalPage: Math.ceil(total / limit) || 1,
      pageSize: limit,
      totalElements: total,
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/admin/moderation/:id — approve or reject
moderationRouter.put('/:id', async (req, res, next) => {
  try {
    const input = reviewSchema.parse(req.body);

    const existing = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      select: { status: true },
    });
    if (!existing) return res.status(404).json({ message: 'Lesson not found' });
    if (existing.status !== 'PENDING_REVIEW') {
      return res.status(409).json({ message: 'Lesson is not pending review' });
    }

    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { status: input.action === 'approve' ? 'PUBLISHED' : 'REJECTED' },
    });

    return res.json(lesson);
  } catch (error) {
    return next(error);
  }
});
