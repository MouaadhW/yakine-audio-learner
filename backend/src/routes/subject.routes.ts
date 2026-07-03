import { Router } from 'express';
import { z } from 'zod';
import { ProgramType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth';
import {
  buildSubjectWhereForUser,
  canRequestAccessSubject,
  SubjectAccessUser,
} from '../lib/subjectAccess';

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

    let scopeFilter: Record<string, unknown> = {};

    const auth = req.auth;
    if (!auth) {
      scopeFilter = buildSubjectWhereForUser(null) as Record<string, unknown>;
    } else if (auth.role === 'ADMIN') {
      scopeFilter = {};
    } else if (auth.role === 'STUDENT') {
      const student = await prisma.user.findUnique({
        where: { id: auth.userId },
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
      if (student) {
        scopeFilter = buildSubjectWhereForUser(student as SubjectAccessUser) as Record<
          string,
          unknown
        >;
      } else {
        scopeFilter = { id: { in: [] as string[] } };
      }
    } else if (auth.role === 'TEACHER') {
      const teacherRow = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { lawUniversity: true },
      });
      const scopes = await prisma.teacherScope.findMany({
        where: { teacherId: auth.userId },
      });
      const lawClause =
        teacherRow?.lawUniversity != null
          ? {
              programType: ProgramType.LAW,
              lawUniversity: teacherRow.lawUniversity,
            }
          : { programType: ProgramType.LAW };
      if (scopes.length > 0) {
        scopeFilter = {
          OR: [
            ...scopes.map(s => ({
              programType: ProgramType.BAC,
              educationLevel: s.educationLevel,
              ...(s.grade != null && { grade: s.grade }),
              ...(s.universityYear != null && { universityYear: s.universityYear }),
              stream: s.stream,
            })),
            lawClause,
          ],
        };
      } else {
        scopeFilter = lawClause;
      }
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
      programType: s.programType,
      contentTier: s.contentTier,
      lawUniversity: s.lawUniversity,
      lawAcademicLevel: s.lawAcademicLevel,
      lawMajor: s.lawMajor,
      semester: s.semester,
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

subjectRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
      include: {
        chapters: {
          include: { _count: { select: { lessons: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const allowed = await canRequestAccessSubject(prisma, req.auth, subject);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have access to this subject' });
    }

    return res.json(subject);
  } catch (error) {
    return next(error);
  }
});

subjectRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
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
