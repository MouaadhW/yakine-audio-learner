import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth';

const createSubjectSchema = z.object({
  nameEn: z.string().min(2),
  nameFr: z.string().min(2),
  slugEn: z.string().optional(),
  slugFr: z.string().optional(),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL']),
  icon: z.string().optional(),
  color: z.string().optional(),
  educationLevel: z.enum(['HIGH_SCHOOL', 'UNIVERSITY']).optional(),
  grade: z.number().int().optional(),
  universityYear: z.number().int().optional(),
});

const updateSubjectSchema = z.object({
  nameEn: z.string().min(2).optional(),
  nameFr: z.string().min(2).optional(),
  slugEn: z.string().optional(),
  slugFr: z.string().optional(),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL']).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  educationLevel: z.enum(['HIGH_SCHOOL', 'UNIVERSITY']).optional(),
  grade: z.number().int().optional(),
  universityYear: z.number().int().optional(),
});

export const subjectRouter = Router();

subjectRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '50');

    let scopeFilter: any = {}; // default: no filter (unauthenticated or admin)

    if ((req as any).auth) {
      const auth = (req as any).auth;

      if (auth.role === 'STUDENT') {
        // Student: show only subjects matching their education profile
        const student = await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { educationLevel: true, grade: true, universityYear: true, stream: true },
        });

        if (student) {
          if (student.educationLevel) {
            scopeFilter.educationLevel = student.educationLevel;
          }
          if (student.grade != null) {
            scopeFilter.grade = student.grade;
          }
          if (student.universityYear != null) {
            scopeFilter.universityYear = student.universityYear;
          }
          if (student.stream) {
            scopeFilter.stream = student.stream;
          }
        }
      } else if (auth.role === 'TEACHER') {
        // Teacher: show only subjects that match their scopes
        const scopes = await prisma.teacherScope.findMany({
          where: { teacherId: auth.userId },
        });

        if (scopes.length > 0) {
          scopeFilter.OR = scopes.map(s => ({
            educationLevel: s.educationLevel,
            ...(s.grade != null && { grade: s.grade }),
            ...(s.universityYear != null && { universityYear: s.universityYear }),
            stream: s.stream,
          }));
        } else {
          // Teacher has no scopes — show nothing
          scopeFilter.id = '__none__';
        }
      }
      // ADMIN: no filter, sees everything
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where: scopeFilter,
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
      prisma.subject.count({ where: scopeFilter }),
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
      educationLevel: s.educationLevel,
      grade: s.grade,
      universityYear: s.universityYear,
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
