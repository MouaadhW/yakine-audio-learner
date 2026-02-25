import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const createLessonSchema = z.object({
  titleEn: z.string().min(2),
  titleFr: z.string().min(2),
  audioUrl: z.string().url(),
  scriptEn: z.string().min(10),
  scriptFr: z.string().min(10),
  duration: z.number().int().positive(),
  chapterId: z.string().min(1)
});

const querySchema = z.object({
  chapterId: z.string().optional(),
  subjectId: z.string().optional(),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL']).optional()
});

export const lessonRouter = Router();

lessonRouter.get('/', async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const lessons = await prisma.lesson.findMany({
      where: {
        chapter: {
          id: query.chapterId,
          subjectId: query.subjectId,
          subject: {
            stream: query.stream
          }
        }
      },
      include: {
        chapter: {
          include: {
            subject: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(lessons);
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
          include: {
            subject: true
          }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    return res.json(lesson);
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
        teacherId: req.auth!.userId
      }
    });

    return res.status(201).json(lesson);
  } catch (error) {
    return next(error);
  }
});
