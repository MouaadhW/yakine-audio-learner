import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { isLessonLockedForViewer, loadLessonListViewer } from '../lib/lessonAccess';

const upsertSchema = z.object({
  lessonId: z.string().min(1),
  position: z.number().int().nonnegative(),
  completed: z.boolean().optional()
});

export const progressRouter = Router();

progressRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const listViewer = await loadLessonListViewer(prisma, req.auth);
    const progress = await prisma.progress.findMany({
      where: { userId: req.auth!.userId },
      include: {
        lesson: {
          include: {
            teacher: { select: { name: true } },
          },
        },
      },
      orderBy: {
        lesson: {
          createdAt: 'desc',
        },
      },
    });

    const mapped = progress.map(p => {
      const { teacher, ...lessonFields } = p.lesson;
      return {
        ...p,
        lesson: {
          ...lessonFields,
          teacherName: teacher?.name ?? 'Unknown Teacher',
          locked: isLessonLockedForViewer(listViewer, p.lesson.audience),
        },
      };
    });

    return res.json(mapped);
  } catch (error) {
    return next(error);
  }
});

progressRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const input = upsertSchema.parse(req.body);

    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: req.auth!.userId,
          lessonId: input.lessonId
        }
      },
      update: {
        position: input.position,
        completed: input.completed ?? false
      },
      create: {
        userId: req.auth!.userId,
        lessonId: input.lessonId,
        position: input.position,
        completed: input.completed ?? false
      }
    });

    return res.status(201).json(progress);
  } catch (error) {
    return next(error);
  }
});
