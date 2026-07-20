import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

export const gamificationRouter = Router();

// ── In-memory Cache for Leaderboard ──────────────────────────────────────────
let leaderboardCache: any = null;
let leaderboardCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── GET /api/gamification/me ─────────────────────────────────────────────────
// Get current user's gamification stats and unlocked badges
gamificationRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: {
        xp: true,
        currentStreak: true,
        longestStreak: true,
        lastStreakAt: true,
        badges: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/gamification/leaderboard ────────────────────────────────────────
// Get top 50 students ranked by XP (cached for 5 minutes)
gamificationRouter.get('/leaderboard', requireAuth, async (req, res, next) => {
  try {
    const now = Date.now();
    if (leaderboardCache && now - leaderboardCacheTimestamp < CACHE_TTL_MS) {
      return res.json(leaderboardCache);
    }

    const topUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { xp: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        xp: true,
        currentStreak: true,
      },
    });

    // Rank assignment
    const ranked = topUsers.map((u, index) => ({
      ...u,
      rank: index + 1,
    }));

    leaderboardCache = ranked;
    leaderboardCacheTimestamp = now;

    return res.json(ranked);
  } catch (err) {
    return next(err);
  }
});
