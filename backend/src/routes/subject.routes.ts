import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const createSubjectSchema = z.object({
  nameEn: z.string().min(2),
  nameFr: z.string().min(2),
  slugEn: z.string().optional(),
  slugFr: z.string().optional(),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const updateSubjectSchema = z.object({
  nameEn: z.string().min(2).optional(),
  nameFr: z.string().min(2).optional(),
  slugEn: z.string().optional(),
  slugFr: z.string().optional(),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL']).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const subjectRouter = Router();

subjectRouter.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        include: {
          _count: { select: { chapters: true } },
          chapters: {
            include: { _count: { select: { lessons: true } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.subject.count(),
    ]);

    // Map to Page<T> format with CMS-compatible fields
    const contents = subjects.map((s: any) => ({
      // BAC fields (used by SubjectListScreen)
      id: s.id,
      nameEn: s.nameEn,
      nameFr: s.nameFr,
      slugEn: s.slugEn,
      slugFr: s.slugFr,
      stream: s.stream,
      icon: s.icon,
      color: s.color,
      chapterCount: s._count.chapters,
      // CMS Category-compatible fields (used by HomeScreen)
      name: s.nameEn,
      slug: s.slugEn || s.id,
      courseCount: String(s.chapters.reduce((sum: number, ch: any) => sum + ch._count.lessons, 0)),
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

subjectRouter.get('/:id', async (req, res, next) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
      include: {
        chapters: {
          include: { lessons: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    return res.json(subject);
  } catch (error) {
    return next(error);
  }
});

subjectRouter.post('/', requireAuth, requireRole('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const input = createSubjectSchema.parse(req.body);

    const subject = await prisma.subject.create({
      data: input
    });

    return res.status(201).json(subject);
  } catch (error) {
    return next(error);
  }
});

subjectRouter.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const input = updateSubjectSchema.parse(req.body);

    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: input,
    });

    return res.json(subject);
  } catch (error) {
    return next(error);
  }
});

subjectRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Subject deleted' });
  } catch (error) {
    return next(error);
  }
});
