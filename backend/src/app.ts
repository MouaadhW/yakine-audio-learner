import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import { authRouter } from './routes/auth.routes';
import { subjectRouter } from './routes/subject.routes';
import { lessonRouter } from './routes/lesson.routes';
import { progressRouter } from './routes/progress.routes';
import { downloadRouter } from './routes/download.routes';
import { storageRouter } from './routes/storage.routes';
import { env } from './config/env';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/subjects', subjectRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/progress', progressRouter);
app.use('/api/downloads', downloadRouter);
app.use('/api/storage', storageRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: error.issues
    });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
});
