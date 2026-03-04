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

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = verifyAccessToken(token);

    // Validate session against DB
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { currentSessionId: true, banned: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.banned) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    if (user.currentSessionId !== payload.sessionId) {
      return res.status(401).json({ message: 'Session expired. Your account was logged in on another device.' });
    }

    req.auth = { userId: payload.sub, role: payload.role, sessionId: payload.sessionId };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Like requireAuth but does not fail when no token is provided.
 * If a valid token is present, req.auth is populated; otherwise req.auth stays undefined.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { currentSessionId: true, banned: true }
    });

    if (user && !user.banned && user.currentSessionId === payload.sessionId) {
      req.auth = { userId: payload.sub, role: payload.role, sessionId: payload.sessionId };
    }
  } catch {
    // Token invalid — proceed without auth
  }

  return next();
}

export function requireRole(...roles: Array<'STUDENT' | 'TEACHER' | 'ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}
