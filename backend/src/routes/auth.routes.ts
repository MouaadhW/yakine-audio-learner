import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken, generateSessionId } from '../lib/jwt';
import { requireAuth, invalidateSessionCache } from '../middleware/auth';
import { LAW_LEVELS, LAW_MAJORS, LAW_REGIONS, LAW_UNIVERSITIES_BY_REGION } from '../constants/lawOnboarding';
import { env } from '../config/env';
import { sendPasswordResetEmail, sendEmailVerificationEmail } from '../lib/email';

const isDev = process.env.NODE_ENV !== 'production';

// Constant-time dummy hash used when the user doesn't exist — prevents email enumeration via timing.
const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y';

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registrations from this IP, please try again later' }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests, please try again later' }
});

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification emails requested, please try again later' }
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
  lawRegion: z.enum(LAW_REGIONS).optional(),
  lawUniversity: z.string().min(2).optional(),
  lawMajor: z.enum(LAW_MAJORS).optional(),
  lawAcademicLevel: z.enum(LAW_LEVELS).optional(),
}).superRefine((input, ctx) => {
  if (input.lawUniversity && !input.lawRegion) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lawRegion'],
      message: 'lawRegion is required when lawUniversity is provided',
    });
    return;
  }
  if (input.lawRegion && input.lawUniversity) {
    const allowedUniversities = LAW_UNIVERSITIES_BY_REGION[input.lawRegion];
    if (!allowedUniversities.includes(input.lawUniversity)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lawUniversity'],
        message: 'University is not valid for the selected region',
      });
    }
  }
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
  language: z.enum(['fr', 'en']).optional(),
  lawRegion: z.enum(LAW_REGIONS).optional(),
  lawUniversity: z.string().min(2).optional(),
  lawMajor: z.enum(LAW_MAJORS).optional(),
  lawAcademicLevel: z.enum(LAW_LEVELS).optional(),
}).superRefine((input, ctx) => {
  if (input.lawUniversity && !input.lawRegion) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lawRegion'],
      message: 'lawRegion is required when lawUniversity is provided',
    });
    return;
  }
  if (input.lawRegion && input.lawUniversity) {
    const allowedUniversities = LAW_UNIVERSITIES_BY_REGION[input.lawRegion];
    if (!allowedUniversities.includes(input.lawUniversity)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lawUniversity'],
        message: 'University is not valid for the selected region',
      });
    }
  }
});

function getRefreshTokenExpiry(): Date {
  const raw = env.REFRESH_TOKEN_EXPIRES_IN;
  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
        subscriptionTier: 'FREE',
        language: input.language,
        currentSessionId: sessionId,
        educationLevel: input.educationLevel,
        grade: input.grade,
        universityYear: input.universityYear,
        stream: input.stream,
        lawRegion: input.lawRegion,
        lawUniversity: input.lawUniversity,
        lawMajor: input.lawMajor,
        lawAcademicLevel: input.lawAcademicLevel,
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

    // Send email verification (fire-and-forget — don't block registration on email failure)
    const verifToken = generateToken();
    await prisma.emailVerificationToken.create({
      data: {
        token: verifToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRES_MS),
      },
    });
    void sendEmailVerificationEmail(user.email, verifToken);

    return res.status(201).json({
      accessToken,
      refreshToken: refreshTokenJwt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        language: user.language,
        educationLevel: user.educationLevel,
        grade: user.grade,
        universityYear: user.universityYear,
        stream: user.stream,
        lawRegion: user.lawRegion,
        lawUniversity: user.lawUniversity,
        lawMajor: user.lawMajor,
        lawAcademicLevel: user.lawAcademicLevel,
        emailVerified: user.emailVerified,
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

    // Always run bcrypt.compare regardless of whether the user exists to prevent
    // email enumeration via response-time differences.
    const match = await bcrypt.compare(input.password, user?.password ?? DUMMY_HASH);

    if (!user || !match) {
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
    invalidateSessionCache(user.id);

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
        subscriptionTier: user.subscriptionTier,
        language: user.language,
        educationLevel: user.educationLevel,
        grade: user.grade,
        universityYear: user.universityYear,
        stream: user.stream,
        lawRegion: user.lawRegion,
        lawUniversity: user.lawUniversity,
        lawMajor: user.lawMajor,
        lawAcademicLevel: user.lawAcademicLevel,
        emailVerified: user.emailVerified,
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
        subscriptionTier: true,
        language: true,
        educationLevel: true,
        grade: true,
        universityYear: true,
        stream: true,
        lawRegion: true,
        lawUniversity: true,
        lawMajor: true,
        lawAcademicLevel: true,
        emailVerified: true,
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
        ...(input.lawRegion !== undefined && { lawRegion: input.lawRegion }),
        ...(input.lawUniversity !== undefined && { lawUniversity: input.lawUniversity }),
        ...(input.lawMajor !== undefined && { lawMajor: input.lawMajor }),
        ...(input.lawAcademicLevel !== undefined && { lawAcademicLevel: input.lawAcademicLevel }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionTier: true,
        language: true,
        lawRegion: true,
        lawUniversity: true,
        lawMajor: true,
        lawAcademicLevel: true,
        createdAt: true,
      },
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

    await prisma.$transaction([
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
      }),
    ]);

    // Persist sessionId only if missing — separate write outside transaction to avoid type widening
    if (!user.currentSessionId) {
      await prisma.user.update({ where: { id: user.id }, data: { currentSessionId: sessionId } });
    }

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
    invalidateSessionCache(req.auth!.userId);

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
});

// ── Password reset ─────────────────────────────────────────────────────────────

authRouter.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    // Always return 200 — never reveal whether the email exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.banned) {
      // Revoke any existing unused reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      const token = generateToken();
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MS),
        },
      });
      void sendPasswordResetEmail(user.email, token);
    }

    return res.json({ message: 'If that email is registered you will receive a reset link shortly' });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { token, password } = z.object({
      token: z.string().min(1),
      password: z.string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[0-9]/, 'Must contain a number')
        .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    }).parse(req.body);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Reset link is invalid or has expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sessionId = generateSessionId();

    await prisma.$transaction([
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Update password and rotate session (invalidates all existing sessions)
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword, currentSessionId: sessionId },
      }),
      // Revoke all refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    invalidateSessionCache(resetToken.userId);
    return res.json({ message: 'Password updated successfully. Please log in with your new password.' });
  } catch (error) {
    return next(error);
  }
});

// ── Email verification ─────────────────────────────────────────────────────────

authRouter.post('/send-verification', resendVerificationLimiter, requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { email: true, emailVerified: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.json({ message: 'Email is already verified' });

    // Revoke any pending tokens and issue a fresh one
    await prisma.emailVerificationToken.deleteMany({ where: { userId: req.auth!.userId } });

    const token = generateToken();
    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: req.auth!.userId,
        expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRES_MS),
      },
    });
    void sendEmailVerificationEmail(user.email, token);

    return res.json({ message: 'Verification email sent' });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/verify-email', authLimiter, async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);

    const verifToken = await prisma.emailVerificationToken.findUnique({ where: { token } });

    if (!verifToken || verifToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Verification link is invalid or has expired' });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verifToken.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.delete({ where: { id: verifToken.id } }),
    ]);

    return res.json({ message: 'Email verified successfully' });
  } catch (error) {
    return next(error);
  }
});
