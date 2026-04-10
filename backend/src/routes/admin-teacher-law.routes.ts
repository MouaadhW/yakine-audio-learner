import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminTeacherLawRouter = Router();

adminTeacherLawRouter.use(requireAuth, requireRole('ADMIN'));

const assignSchema = z.object({
  teacherId: z.string().min(1),
  subjectId: z.string().min(1),
});

// GET /api/admin/teacher-law/:teacherId — list assigned law subject ids
adminTeacherLawRouter.get('/:teacherId', async (req, res, next) => {
  try {
    const rows = await prisma.teacherLawSubject.findMany({
      where: { teacherId: req.params.teacherId },
      select: { id: true, subjectId: true, subject: { select: { nameEn: true, nameFr: true, lawUniversity: true } } },
    });
    return res.json(rows);
  } catch (e) {
    return next(e);
  }
});

// POST /api/admin/teacher-law — assign subject
adminTeacherLawRouter.post('/', async (req, res, next) => {
  try {
    const input = assignSchema.parse(req.body);
    const teacher = await prisma.user.findUnique({
      where: { id: input.teacherId },
      select: { lawUniversity: true, role: true },
    });
    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(400).json({ message: 'Invalid teacher' });
    }
    const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject || subject.programType !== 'LAW') {
      return res.status(400).json({ message: 'Invalid law subject' });
    }
    if (teacher.lawUniversity && subject.lawUniversity !== teacher.lawUniversity) {
      return res.status(400).json({ message: 'Subject belongs to a different faculty than the teacher' });
    }
    const row = await prisma.teacherLawSubject.upsert({
      where: {
        teacherId_subjectId: { teacherId: input.teacherId, subjectId: input.subjectId },
      },
      update: {},
      create: { teacherId: input.teacherId, subjectId: input.subjectId },
    });
    return res.status(201).json(row);
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/admin/teacher-law/:id — remove assignment by junction id
adminTeacherLawRouter.delete('/assignment/:id', async (req, res, next) => {
  try {
    await prisma.teacherLawSubject.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Removed' });
  } catch (e) {
    return next(e);
  }
});
