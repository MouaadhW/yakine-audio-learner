import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  sessionId: string;
}

export function generateSessionId(): string {
  return randomUUID();
}

export function signAccessToken(payload: JwtPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn']
  };

  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, options);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
}
