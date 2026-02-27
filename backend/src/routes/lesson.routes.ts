import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const createLessonSchema = z.object({
  titleEn: z.string().min(2),
  titleFr: z.string().min(2),
  audioUrl: z.string().url().optional().default(''),
  scriptEn: z.string().optional().default(''),
  scriptFr: z.string().optional().default(''),
  duration: z.number().int().positive().optional().default(0),
  sortOrder: z.number().int().optional(),
  chapterId: z.string().min(1)
});

const querySchema = z.object({
  chapterId: z.string().optional(),
  subjectId: z.string().optional(),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  orderBy: z.string().optional(),
});

const updateLessonSchema = z.object({
  titleEn: z.string().min(2).optional(),
  titleFr: z.string().min(2).optional(),
  audioUrl: z.string().optional(),
  scriptEn: z.string().optional(),
  scriptFr: z.string().optional(),
  duration: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
});

export const lessonRouter = Router();

lessonRouter.get('/', async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '15');

    const where: any = {
      status: 'PUBLISHED',
      chapter: {
        id: query.chapterId,
        subjectId: query.subjectId,
        subject: {
          stream: query.stream
        }
      }
    };

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          chapter: {
            include: { subject: true }
          },
          teacher: {
            select: { id: true, name: true }
          }
        },
        orderBy: query.orderBy === 'enrollment'
          ? { createdAt: 'desc' }
          : query.orderBy === 'publishedAt'
            ? { createdAt: 'desc' }
            : { sortOrder: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.lesson.count({ where }),
    ]);

    // Map to Page<T> format with both BAC and CMS-compatible fields
    const contents = lessons.map((l: any, i: number) => ({
      // BAC fields (used by LessonListScreen / AudioPlayer)
      ...l,
      teacherName: l.teacher?.name || 'Unknown Teacher',
      // CMS Course-compatible fields (used by HomeScreen)
      title: l.titleEn,
      slug: l.id,
      featured: false,
      level: 'beginner' as const,
      access: 'free' as const,
      status: 'published' as const,
      excerpt: l.scriptEn.substring(0, 120) + '...',
      // CMS Post-compatible fields (used by HomeScreen recent posts)
      wordCount: l.scriptEn.split(/\s+/).length,
      visibility: 'public' as const,
      publishedAt: l.createdAt.toISOString(),
      meta: {
        rating: '4.8',
        ratingCount: '0',
        enrolledCount: '0',
        viewCount: '0',
      },
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
});

lessonRouter.get('/:id', async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        chapter: {
          include: { subject: true }
        },
        teacher: {
          select: { id: true, name: true }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    return res.json({
      ...lesson,
      teacherName: lesson.teacher?.name || 'Unknown Teacher',
      title: lesson.titleEn,
      slug: lesson.id,
    });
  } catch (error) {
    return next(error);
  }
});

lessonRouter.post('/', requireAuth, requireRole('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const input = createLessonSchema.parse(req.body);

    const lesson = await prisma.lesson.create({
      data: {
        ...input,
        teacherId: req.auth!.userId,
        // Teachers submit for review; admins publish directly
        status: req.auth!.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING_REVIEW',
      }
    });

    return res.status(201).json(lesson);
  } catch (error) {
    return next(error);
  }
});

lessonRouter.put('/:id', requireAuth, requireRole('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const input = updateLessonSchema.parse(req.body);

    // Teachers can only edit their own lessons
    if (req.auth!.role === 'TEACHER') {
      const existing = await prisma.lesson.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.teacherId !== req.auth!.userId) {
        return res.status(403).json({ message: 'You can only edit your own lessons' });
      }
    }

    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: input,
    });

    return res.json(lesson);
  } catch (error) {
    return next(error);
  }
});

lessonRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Lesson deleted' });
  } catch (error) {
    return next(error);
  }
});
