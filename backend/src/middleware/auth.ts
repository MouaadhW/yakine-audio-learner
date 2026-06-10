import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: 'STUDENT' | 'TEACHER' | 'ADMIN';
        sessionId: string;
      };
    }
  }
}

// ── In-process session cache ───────────────────────────────────────────────
// Avoids a DB round-trip on every authenticated request.
// TTL is intentionally short (30 s) so bans and forced logouts take effect quickly.
// Call invalidateSessionCache(userId) on login / logout / ban for immediate effect.

type CachedSession = { banned: boolean; currentSessionId: string | null; expiresAt: number };
const sessionCache = new Map<string, CachedSession>();
const SESSION_TTL_MS = 30_000;

function getCached(userId: string): CachedSession | null {
  const entry = sessionCache.get(userId);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) { sessionCache.delete(userId); return null; }
  return entry;
}

function setCache(userId: string, data: { banned: boolean; currentSessionId: string | null }) {
  sessionCache.set(userId, { ...data, expiresAt: Date.now() + SESSION_TTL_MS });
}

export function invalidateSessionCache(userId: string) {
  sessionCache.delete(userId);
}

// ── Middleware ─────────────────────────────────────────────────────────────

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = verifyAccessToken(token);

    let session = getCached(payload.sub);
    if (!session) {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { currentSessionId: true, banned: true },
      });
      if (!user) return res.status(401).json({ message: 'User not found' });
      setCache(payload.sub, { banned: user.banned, currentSessionId: user.currentSessionId });
      session = getCached(payload.sub)!;
    }

    if (session.banned) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }
    if (session.currentSessionId !== payload.sessionId) {
      return res.status(401).json({ message: 'Session expired. Your account was logged in on another device.' });
    }

    req.auth = { userId: payload.sub, role: payload.role, sessionId: payload.sessionId };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  const token = header.replace('Bearer ', '');
  try {
    const payload = verifyAccessToken(token);

    let session = getCached(payload.sub);
    if (!session) {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { currentSessionId: true, banned: true },
      });
      if (user) {
        setCache(payload.sub, { banned: user.banned, currentSessionId: user.currentSessionId });
        session = getCached(payload.sub)!;
      }
    }

    if (session && !session.banned && session.currentSessionId === payload.sessionId) {
      req.auth = { userId: payload.sub, role: payload.role, sessionId: payload.sessionId };
    }
  } catch { /* Token invalid — proceed without auth */ }

  return next();
}

export function requireRole(...roles: Array<'STUDENT' | 'TEACHER' | 'ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
}
