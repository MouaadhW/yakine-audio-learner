import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const createSubjectSchema = z.object({
  nameEn: z.string().min(2),
  nameFr: z.string().min(2),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL'])
});

export const subjectRouter = Router();

subjectRouter.get('/', async (_req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        chapters: {
          include: {
            lessons: true
          }
        }
      }
    });

    return res.json(subjects);
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
