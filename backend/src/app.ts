import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authRouter } from './routes/auth.routes';
import { subjectRouter } from './routes/subject.routes';
import { chapterRouter } from './routes/chapter.routes';
import { lessonRouter } from './routes/lesson.routes';
import { progressRouter } from './routes/progress.routes';
import { downloadRouter } from './routes/download.routes';
import { storageRouter } from './routes/storage.routes';
import { adminUsersRouter } from './routes/admin-users.routes';
import { moderationRouter } from './routes/moderation.routes';
import { statsRouter } from './routes/stats.routes';
import { bulkRouter } from './routes/bulk.routes';
import { announcementsRouter } from './routes/announcements.routes';
import { featureFlagsRouter } from './routes/feature-flags.routes';
import { adminContentRouter } from './routes/admin-content.routes';
import { teacherScopesRouter } from './routes/teacher-scopes.routes';
import { adminTeacherLawRouter } from './routes/admin-teacher-law.routes';
import { teacherComposerRouter } from './routes/teacher-composer.routes';
import { env } from './config/env';

export const app = express();

app.use(helmet());

// Parse CORS_ORIGIN: supports comma-separated list of allowed origins or '*'
const corsOrigin = env.CORS_ORIGIN === '*'
  ? true
  : env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({ origin: corsOrigin }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Baseline rate limit runs before body parsing — auth routes have their own tighter limits
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV !== 'production' ? 2000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Bulk import needs a larger body limit than the rest of the API.
// Mount it BEFORE the global express.json() so body-parser uses the 10mb limit for this
// path and skips re-parsing when the global middleware runs later.
app.use('/api/admin/bulk', express.json({ limit: '10mb' }), bulkRouter);

// All other routes are capped at 1mb
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/subjects', subjectRouter);
app.use('/api/chapters', chapterRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/progress', progressRouter);
app.use('/api/downloads', downloadRouter);
app.use('/api/storage', storageRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/moderation', moderationRouter);
app.use('/api/admin/stats', statsRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/feature-flags', featureFlagsRouter);
app.use('/api/admin/content', adminContentRouter);
app.use('/api/admin/teacher-scopes', teacherScopesRouter);
app.use('/api/admin/teacher-law', adminTeacherLawRouter);
app.use('/api/teacher-composer', teacherComposerRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: error.issues
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Resource not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Resource already exists' });
    }
    if (error.code === 'P2003') {
      // Foreign-key constraint, e.g. deleting a teacher that still owns lessons.
      return res.status(409).json({
        message: 'This record is still referenced by other data and cannot be modified.',
      });
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      message: 'Database is temporarily unavailable. Please try again shortly.',
    });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
});
