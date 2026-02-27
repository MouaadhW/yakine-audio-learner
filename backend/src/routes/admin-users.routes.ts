import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth, requireRole('ADMIN'));

const updateUserSchema = z.object({
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
  banned: z.boolean().optional(),
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

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: input,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        language: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

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
