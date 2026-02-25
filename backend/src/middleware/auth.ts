import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: 'STUDENT' | 'TEACHER' | 'ADMIN';
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
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
