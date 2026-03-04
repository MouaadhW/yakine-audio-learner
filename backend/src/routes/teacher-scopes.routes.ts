import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const teacherScopesRouter = Router();

const createScopeSchema = z.object({
  teacherId: z.string().min(1),
  educationLevel: z.enum(['HIGH_SCHOOL', 'UNIVERSITY']),
  grade: z.number().int().nullable().optional(),
  universityYear: z.number().int().nullable().optional(),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL']),
});

// GET /api/admin/teacher-scopes/:teacherId — list scopes for a teacher
teacherScopesRouter.get(
  '/:teacherId',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const scopes = await prisma.teacherScope.findMany({
        where: { teacherId: req.params.teacherId },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(scopes);
    } catch (error) {
      return next(error);
    }
  },
);

// POST /api/admin/teacher-scopes — grant a scope to a teacher
teacherScopesRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const input = createScopeSchema.parse(req.body);

      // Verify the teacher exists and is indeed a TEACHER
      const teacher = await prisma.user.findUnique({
        where: { id: input.teacherId },
      });

      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      if (teacher.role !== 'TEACHER') {
        return res
          .status(400)
          .json({ message: 'User is not a teacher' });
      }

      const scope = await prisma.teacherScope.create({
        data: {
          teacherId: input.teacherId,
          educationLevel: input.educationLevel,
          grade: input.grade ?? null,
          universityYear: input.universityYear ?? null,
          stream: input.stream,
        },
      });

      return res.status(201).json(scope);
    } catch (error: any) {
      // Handle unique constraint violation
      if (error?.code === 'P2002') {
        return res
          .status(409)
          .json({ message: 'This scope already exists for the teacher' });
      }
      return next(error);
    }
  },
);

// DELETE /api/admin/teacher-scopes/:id — revoke a scope
teacherScopesRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      await prisma.teacherScope.delete({
        where: { id: req.params.id },
      });

      return res.json({ message: 'Scope revoked' });
    } catch (error) {
      return next(error);
    }
  },
);
