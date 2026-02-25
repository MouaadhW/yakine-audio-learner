import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const createDownloadSchema = z.object({
  lessonId: z.string().min(1),
  localPath: z.string().min(1)
});

export const downloadRouter = Router();

downloadRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const downloads = await prisma.download.findMany({
      where: { userId: req.auth!.userId },
      include: {
        lesson: true
      }
    });

    return res.json(downloads);
  } catch (error) {
    return next(error);
  }
});

downloadRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const input = createDownloadSchema.parse(req.body);

    const download = await prisma.download.upsert({
      where: {
        userId_lessonId: {
          userId: req.auth!.userId,
          lessonId: input.lessonId
        }
      },
      update: {
        localPath: input.localPath
      },
      create: {
        userId: req.auth!.userId,
        lessonId: input.lessonId,
        localPath: input.localPath
      }
    });

    return res.status(201).json(download);
  } catch (error) {
    return next(error);
  }
});
