import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { canUserAccessSubject, SubjectAccessUser } from '../lib/subjectAccess';
import { isLessonLockedForViewer } from '../lib/lessonAccess';

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

    // Verify the user can actually access this lesson before recording a download.
    // (Without this, FREE users could create download records for PREMIUM lessons.)
    const lesson = await prisma.lesson.findUnique({
      where: { id: input.lessonId },
      include: { chapter: { include: { subject: true } } },
    });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (req.auth!.role !== 'ADMIN') {
      const viewer = await prisma.user.findUnique({
        where: { id: req.auth!.userId },
        select: {
          role: true,
          subscriptionTier: true,
          lawUniversity: true,
          lawMajor: true,
          lawAcademicLevel: true,
          educationLevel: true,
          grade: true,
          universityYear: true,
          stream: true,
        },
      });
      if (!viewer) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      if (!canUserAccessSubject(viewer as SubjectAccessUser, lesson.chapter.subject)) {
        return res.status(403).json({ message: 'You do not have access to this lesson' });
      }
      if (
        isLessonLockedForViewer(
          { role: viewer.role, subscriptionTier: viewer.subscriptionTier },
          lesson.audience,
        )
      ) {
        return res.status(403).json({ message: 'This lesson requires a premium subscription' });
      }
    }

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
