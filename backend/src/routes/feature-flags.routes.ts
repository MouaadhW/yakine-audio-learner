import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const featureFlagsRouter = Router();

const upsertFlagSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
  description: z.string().optional(),
});

// GET /api/feature-flags — public, returns all flags (keys + enabled status)
featureFlagsRouter.get('/', async (_req, res, next) => {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });

    return res.json(flags);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/feature-flags/:id — admin only, toggle or update a flag
featureFlagsRouter.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const input = upsertFlagSchema.partial().parse(req.body);

      const flag = await prisma.featureFlag.update({
        where: { id: req.params.id },
        data: input,
      });

      return res.json(flag);
    } catch (error) {
      return next(error);
    }
  },
);

// POST /api/feature-flags — admin only, create a new flag
featureFlagsRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const input = upsertFlagSchema.parse(req.body);

      const flag = await prisma.featureFlag.create({
        data: {
          key: input.key,
          enabled: input.enabled,
          description: input.description || '',
        },
      });

      return res.status(201).json(flag);
    } catch (error) {
      return next(error);
    }
  },
);

// DELETE /api/feature-flags/:id — admin only
featureFlagsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      await prisma.featureFlag.delete({ where: { id: req.params.id } });
      return res.json({ message: 'Flag deleted' });
    } catch (error) {
      return next(error);
    }
  },
);
