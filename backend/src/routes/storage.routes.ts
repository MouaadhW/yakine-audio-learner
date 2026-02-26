import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth';
import { env } from '../config/env';
import { getSupabase } from '../lib/supabase';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max
});

const BUCKET = env.STORAGE_BUCKET;

let bucketReady = false;

async function ensureBucket() {
  if (bucketReady) return;
  const supabase = getSupabase();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ['audio/*', 'text/plain'],
      fileSizeLimit: 50 * 1024 * 1024, // 50 MB (Supabase free tier limit)
    });
    if (error && !error.message.includes('already exists')) {
      console.error('Failed to create bucket:', error);
      throw error;
    }
    console.log(`Created storage bucket: ${BUCKET}`);
  }
  bucketReady = true;
}

export const storageRouter = Router();

// Get storage config
storageRouter.get('/config', requireAuth, requireRole('TEACHER', 'ADMIN'), async (_req, res) => {
  return res.json({
    provider: env.STORAGE_PROVIDER,
    bucket: BUCKET,
    supabaseUrl: env.SUPABASE_URL ?? null
  });
});

// Upload an audio file
storageRouter.post(
  '/upload',
  requireAuth,
  requireRole('TEACHER', 'ADMIN'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      await ensureBucket();
      const supabase = getSupabase();
      const ext = req.file.originalname.split('.').pop() ?? 'mp3';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const storagePath = `lessons/${filename}`;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ message: 'Upload failed', detail: error.message });
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      return res.status(201).json({
        path: data.path,
        publicUrl: urlData.publicUrl,
        filename
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Get a signed URL for a private file (valid 1 hour)
storageRouter.get('/signed-url', requireAuth, async (req, res, next) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ message: 'path query parameter is required' });
    }

    await ensureBucket();
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600);

    if (error) {
      return res.status(500).json({ message: 'Failed to create signed URL', detail: error.message });
    }

    return res.json({ signedUrl: data.signedUrl });
  } catch (error) {
    return next(error);
  }
});

// List files in a folder
storageRouter.get('/list', requireAuth, requireRole('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const folder = (req.query.folder as string) ?? 'lessons';

    await ensureBucket();
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      return res.status(500).json({ message: 'Failed to list files', detail: error.message });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

// Delete a file
storageRouter.delete('/file', requireAuth, requireRole('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ message: 'path query parameter is required' });
    }

    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filePath]);

    if (error) {
      return res.status(500).json({ message: 'Failed to delete file', detail: error.message });
    }

    return res.json({ message: 'File deleted' });
  } catch (error) {
    return next(error);
  }
});

