import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken, generateSessionId } from '../lib/jwt';
import { requireAuth } from '../middleware/auth';

const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 200 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registrations from this IP, please try again later' }
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  language: z.enum(['fr', 'en']).optional(),
  educationLevel: z.enum(['HIGH_SCHOOL', 'UNIVERSITY']).optional(),
  grade: z.number().int().optional(),
  universityYear: z.number().int().optional(),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  language: z.enum(['fr', 'en']).optional()
});

/** Compute the refresh token expiry date based on env config */
function getRefreshTokenExpiry(): Date {
  const raw = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';
  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + value * (multipliers[unit] ?? 86400000));
}

export const authRouter = Router();

authRouter.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });

    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const password = await bcrypt.hash(input.password, 10);
    const sessionId = generateSessionId();

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password,
        role: 'STUDENT',
        language: input.language,
        currentSessionId: sessionId,
        educationLevel: input.educationLevel,
        grade: input.grade,
        universityYear: input.universityYear,
        stream: input.stream,
      }
    });

    const tokenPayload = { sub: user.id, role: user.role, sessionId };
    const accessToken = signAccessToken(tokenPayload);
    const refreshTokenJwt = signRefreshToken(tokenPayload);

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenJwt,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry()
      }
    });

    return res.status(201).json({
      accessToken,
      refreshToken: refreshTokenJwt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        educationLevel: user.educationLevel,
        grade: user.grade,
        universityYear: user.universityYear,
        stream: user.stream,
      }
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/login', authLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(input.password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.banned) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    const sessionId = generateSessionId();

    // Revoke all existing refresh tokens and update session
    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), currentSessionId: sessionId }
      })
    ]);

    const tokenPayload = { sub: user.id, role: user.role, sessionId };
    const accessToken = signAccessToken(tokenPayload);
    const refreshTokenJwt = signRefreshToken(tokenPayload);

    // Store new refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenJwt,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry()
      }
    });

    return res.json({
      accessToken,
      refreshToken: refreshTokenJwt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        educationLevel: user.educationLevel,
        grade: user.grade,
        universityYear: user.universityYear,
        stream: user.stream,
      }
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        language: true,
        educationLevel: true,
        grade: true,
        universityYear: true,
        stream: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

authRouter.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const input = updateProfileSchema.parse(req.body);

    // If email is being changed, check it's not already taken
    if (input.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing && existing.id !== req.auth!.userId) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.auth!.userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.language !== undefined && { language: input.language }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        language: true,
        createdAt: true
      }
    });

    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/refresh', authLimiter, async (req, res, next) => {
  try {
    const input = refreshSchema.parse(req.body);

    let payload;
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Look up the refresh token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: input.refreshToken }
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh token has been revoked or expired' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (user.banned) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    // Revoke old token and issue new ones (rotation)
    const sessionId = user.currentSessionId ?? generateSessionId();
    const tokenPayload = { sub: user.id, role: user.role, sessionId };
    const accessToken = signAccessToken(tokenPayload);
    const newRefreshTokenJwt = signRefreshToken(tokenPayload);

    const transactionOps = [
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() }
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshTokenJwt,
          userId: user.id,
          expiresAt: getRefreshTokenExpiry()
        }
      })
    ];

    // Persist sessionId if it was missing from the user record
    if (!user.currentSessionId) {
      transactionOps.push(
        prisma.user.update({
          where: { id: user.id },
          data: { currentSessionId: sessionId }
        }) as any
      );
    }

    await prisma.$transaction(transactionOps);

    return res.json({ accessToken, refreshToken: newRefreshTokenJwt });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/logout', authLimiter, requireAuth, async (req, res, next) => {
  try {
    // Revoke all refresh tokens and clear session
    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { userId: req.auth!.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      }),
      prisma.user.update({
        where: { id: req.auth!.userId },
        data: { currentSessionId: null }
      })
    ]);

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
});
