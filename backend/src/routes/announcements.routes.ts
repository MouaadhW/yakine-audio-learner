import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const announcementsRouter = Router();

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  type: z.enum(['info', 'warning', 'success', 'error']).optional(),
  active: z.boolean().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

const updateAnnouncementSchema = createAnnouncementSchema.partial();

// GET /api/announcements — public, returns active announcements
announcementsRouter.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const adminView = req.query.all === 'true';

    // Admin wants to see all (needs auth checked by caller)
    if (adminView) {
      const announcements = await prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.json(announcements);
    }

    // Public: only active and within date range
    const announcements = await prisma.announcement.findMany({
      where: {
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return res.json(announcements);
  } catch (error) {
    return next(error);
  }
});

// POST /api/announcements — admin only
announcementsRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const input = createAnnouncementSchema.parse(req.body);

      const announcement = await prisma.announcement.create({
        data: {
          title: input.title,
          body: input.body,
          type: input.type || 'info',
          active: input.active ?? true,
          startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        },
      });

      return res.status(201).json(announcement);
    } catch (error) {
      return next(error);
    }
  },
);

// PUT /api/announcements/:id — admin only
announcementsRouter.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const input = updateAnnouncementSchema.parse(req.body);

      const data: any = { ...input };
      if (input.startsAt) data.startsAt = new Date(input.startsAt);
      if (input.endsAt) data.endsAt = new Date(input.endsAt);

      const announcement = await prisma.announcement.update({
        where: { id: req.params.id },
        data,
      });

      return res.json(announcement);
    } catch (error) {
      return next(error);
    }
  },
);

// DELETE /api/announcements/:id — admin only
announcementsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      await prisma.announcement.delete({ where: { id: req.params.id } });
      return res.json({ message: 'Announcement deleted' });
    } catch (error) {
      return next(error);
    }
  },
);
