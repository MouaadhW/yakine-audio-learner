import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth';
import { canRequestAccessSubject, resolveAllowedSubjectIds } from '../lib/subjectAccess';
import {
  isLessonLockedForViewer,
  loadLessonListViewer,
} from '../lib/lessonAccess';
import { LessonStatus } from '@prisma/client';

export const chapterRouter = Router();

const createChapterSchema = z.object({
  nameEn: z.string().min(2),
  nameFr: z.string().min(2),
  sortOrder: z.number().int().optional(),
  subjectId: z.string().min(1),
});

const updateChapterSchema = z.object({
  nameEn: z.string().min(2).optional(),
  nameFr: z.string().min(2).optional(),
  sortOrder: z.number().int().optional(),
});

// GET /api/chapters?subjectId=xxx
chapterRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const subjectId = req.query.subjectId as string | undefined;

    const allowedIds = await resolveAllowedSubjectIds(prisma, req.auth);

    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        return res.status(404).json({ message: 'Subject not found' });
      }
      const ok = await canRequestAccessSubject(prisma, req.auth, subject);
      if (!ok) {
        return res.status(403).json({ message: 'You do not have access to this subject' });
      }
    }

    const listViewer = await loadLessonListViewer(prisma, req.auth);

    const chapters = await prisma.chapter.findMany({
      where: subjectId
        ? { subjectId }
        : allowedIds.length > 0
          ? { subjectId: { in: allowedIds } }
          : { subjectId: { in: [] as string[] } },
      include: {
        lessons: {
          where: { status: LessonStatus.PUBLISHED },
          orderBy: { sortOrder: 'asc' },
          include: {
            teacher: { select: { id: true, name: true } },
          },
        },
        subject: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const enriched = chapters.map(ch => ({
      ...ch,
      lessons: ch.lessons.map(l => {
        const { teacher, ...rest } = l;
        return {
          ...rest,
          teacherName: teacher?.name || 'Unknown Teacher',
          locked: isLessonLockedForViewer(listViewer, l.audience),
        };
      }),
    }));

    return res.json(enriched);
  } catch (error) {
    return next(error);
  }
});

chapterRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const input = createChapterSchema.parse(req.body);

    const chapter = await prisma.chapter.create({
      data: input,
      include: { subject: true, lessons: true },
    });

    return res.status(201).json(chapter);
  } catch (error) {
    return next(error);
  }
});

chapterRouter.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const input = updateChapterSchema.parse(req.body);

    const chapter = await prisma.chapter.update({
      where: { id: req.params.id },
      data: input,
    });

    return res.json(chapter);
  } catch (error) {
    return next(error);
  }
});

chapterRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.chapter.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Chapter deleted' });
  } catch (error) {
    return next(error);
  }
});
