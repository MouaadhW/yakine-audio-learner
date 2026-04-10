import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));

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
app.use('/api/admin/bulk', bulkRouter);
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

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      message: 'Database is temporarily unavailable. Please try again shortly.',
    });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
});
