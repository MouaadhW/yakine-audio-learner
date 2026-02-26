import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { requireAuth } from '../middleware/auth';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' }
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
  language: z.enum(['fr', 'en']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  language: z.enum(['fr', 'en']).optional()
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });

    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const password = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password,
        role: input.role,
        language: input.language
      }
    });

    const tokenPayload = { sub: user.id, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language
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

    const tokenPayload = { sub: user.id, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language
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

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    const tokenPayload = { sub: user.id, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return res.json({ accessToken, refreshToken });
  } catch (error) {
    return next(error);
  }
});
