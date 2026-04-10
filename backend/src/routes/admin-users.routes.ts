import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  LAW_LEVELS,
  LAW_MAJORS,
  LAW_REGIONS,
  LAW_UNIVERSITIES_BY_REGION,
  type LawRegion,
} from '../constants/lawOnboarding';

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth, requireRole('ADMIN'));

const updateUserSchema = z
  .object({
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
    banned: z.boolean().optional(),
    subscriptionTier: z.enum(['FREE', 'PREMIUM']).optional(),
    lawRegion: z.enum(LAW_REGIONS).optional().nullable(),
    lawUniversity: z.string().min(2).optional().nullable(),
    lawMajor: z.enum(LAW_MAJORS).optional().nullable(),
    lawAcademicLevel: z.enum(LAW_LEVELS).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.lawUniversity && !data.lawRegion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lawRegion'],
        message: 'lawRegion is required when lawUniversity is provided',
      });
    }
    if (data.lawRegion && data.lawUniversity) {
      const allowed = LAW_UNIVERSITIES_BY_REGION[data.lawRegion as LawRegion];
      if (!allowed.includes(data.lawUniversity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lawUniversity'],
          message: 'University is not valid for the selected region',
        });
      }
    }
  });

// GET /api/admin/users — list/search with pagination
adminUsersRouter.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const role = req.query.role as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && ['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          banned: true,
          language: true,
          subscriptionTier: true,
          lawRegion: true,
          lawUniversity: true,
          lawMajor: true,
          lawAcademicLevel: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { lessons: true, progress: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      contents: users,
      currentPage: page,
      totalPage: Math.ceil(total / limit) || 1,
      pageSize: limit,
      totalElements: total,
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/admin/users/:id — change role or ban/unban
adminUsersRouter.put('/:id', async (req, res, next) => {
  try {
    const input = updateUserSchema.parse(req.body);

    // Don't allow admin to ban themselves
    if (input.banned && req.params.id === req.auth!.userId) {
      return res.status(400).json({ message: 'Cannot ban yourself' });
    }

    if (input.subscriptionTier != null) {
      const target = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { role: true },
      });
      if (!target || target.role !== 'STUDENT') {
        return res.status(400).json({ message: 'Subscription tier can only be set for students' });
      }
    }

    const updateData: Record<string, unknown> = { ...input };

    // When banning a user, clear their session to immediately kick them out
    if (input.banned) {
      updateData.currentSessionId = null;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData as Prisma.UserUpdateInput,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        language: true,
        subscriptionTier: true,
        lawRegion: true,
        lawUniversity: true,
        lawMajor: true,
        lawAcademicLevel: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    // When banning, revoke all refresh tokens
    if (input.banned) {
      await prisma.refreshToken.updateMany({
        where: { userId: req.params.id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/admin/users/:id — delete user
adminUsersRouter.delete('/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.auth!.userId) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    return res.json({ message: 'User deleted' });
  } catch (error) {
    return next(error);
  }
});
