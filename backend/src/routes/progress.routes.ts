import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const upsertSchema = z.object({
  lessonId: z.string().min(1),
  position: z.number().int().nonnegative(),
  completed: z.boolean().optional()
});

export const progressRouter = Router();

progressRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const progress = await prisma.progress.findMany({
      where: { userId: req.auth!.userId },
      include: {
        lesson: true
      },
      orderBy: {
        lesson: {
          createdAt: 'desc'
        }
      }
    });

    return res.json(progress);
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
