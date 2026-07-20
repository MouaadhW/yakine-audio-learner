import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import fsp from 'fs/promises';
import { uploadFileToStorage } from '../lib/storageUpload';
import { requireAuth, requireRole } from '../middleware/auth';
import { env } from '../config/env';
import { getSupabase } from '../lib/supabase';
import { prisma } from '../lib/prisma';

const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 100 * 1024 * 1024 } });

const BUCKET = env.STORAGE_BUCKET;

// Map validated MIME types to file extensions — never trust originalname
const MIME_TO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/aac': 'aac',
  'audio/webm': 'webm',
  'text/plain': 'txt',
};

function isSafePath(filePath: string): boolean {
  return (
    typeof filePath === 'string' &&
    filePath.startsWith('lessons/') &&
    !filePath.includes('..') &&
    !filePath.includes('\0')
  );
}

let bucketReady = false;

async function ensureBucket() {
  if (bucketReady) return;
  const supabase = getSupabase();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      allowedMimeTypes: ['audio/*', 'text/plain'],
      fileSizeLimit: 50 * 1024 * 1024,
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

      const ext = MIME_TO_EXT[req.file.mimetype];
      if (!ext) {
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      const filePath = (req.file as any).path as string;
      if (!filePath) return res.status(400).json({ message: 'No file path available' });
      try {
        const uploadResult = await uploadFileToStorage({ filePath, contentType: req.file.mimetype, extension: ext, folder: 'lessons', ownerId: req.auth!.userId, ownerType: 'TEACHER' });
        return res.status(201).json({ path: uploadResult.path, filename: uploadResult.filename });
      } finally {
        try { await fsp.unlink(filePath); } catch (e) { /* ignore */ }
      }
    } catch (error) {
      return next(error);
    }
  }
);

// Get a signed URL for a file — TEACHER/ADMIN only
storageRouter.get('/signed-url', requireAuth, requireRole('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ message: 'path query parameter is required' });
    }
    if (!isSafePath(filePath)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    await ensureBucket();
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600);

    if (error) {
      return res.status(500).json({ message: 'Failed to create signed URL' });
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
      return res.status(500).json({ message: 'Failed to list files' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

// Delete a file — TEACHER can only delete files they own; ADMIN can delete any
storageRouter.delete('/file', requireAuth, requireRole('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ message: 'path query parameter is required' });
    }
    if (!isSafePath(filePath)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    if (req.auth!.role === 'TEACHER') {
      const stored = await prisma.storedFile.findUnique({ where: { path: filePath } });
      if (!stored || stored.ownerId !== req.auth!.userId) {
        return res.status(403).json({ message: 'You do not own this file' });
      }
    }

    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filePath]);

    if (error) {
      return res.status(500).json({ message: 'Failed to delete file' });
    }

    // Remove stored file record if exists
    try {
      await prisma.storedFile.deleteMany({ where: { path: filePath } });
    } catch (e) {
      // ignore DB errors on cleanup
    }

    return res.json({ message: 'File deleted' });
  } catch (error) {
    return next(error);
  }
});
