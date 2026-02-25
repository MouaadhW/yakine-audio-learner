import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { env } from '../config/env';

export const storageRouter = Router();

storageRouter.get('/config', requireAuth, requireRole('TEACHER', 'ADMIN'), async (_req, res) => {
  return res.json({
    provider: env.STORAGE_PROVIDER,
    bucket: env.STORAGE_BUCKET,
    endpoint: env.AWS_ENDPOINT ?? null,
    region: env.AWS_REGION
  });
});

storageRouter.get('/upload-url', requireAuth, requireRole('TEACHER', 'ADMIN'), async (_req, res) => {
  return res.status(501).json({
    message: 'Presigned URL generation is not implemented yet. Connect AWS SDK (S3-compatible) for R2/S3.'
  });
});
