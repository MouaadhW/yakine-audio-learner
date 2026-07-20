import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import fsp from 'fs/promises';
import { uploadFileToStorage } from '../lib/storageUpload';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 100 * 1024 * 1024 } });
export const liveRouter = Router();

// Only teachers/admins can ingest live radio episodes
liveRouter.post('/ingest', requireAuth, requireRole('TEACHER', 'ADMIN'), upload.single('file'), async (req, res, next) => {
  try {
    const teacherId = req.auth!.userId;
    const { titleEn, titleFr, chapterId, autoPublish } = req.body as any;

    if (!req.file) return res.status(400).json({ message: 'Missing file' });
    if (!chapterId) return res.status(400).json({ message: 'Missing chapterId' });
    const filePath = (req.file as any).path as string;
    // Basic content type validation
    const contentType = req.file.mimetype || 'audio/mpeg';

    let uploadResult;
    try {
      uploadResult = await uploadFileToStorage({ filePath, contentType, extension: 'mp3', folder: `live-radio/${chapterId}` });
    } finally {
      // cleanup temp file
      try {
        await fsp.unlink(filePath);
      } catch (e) {
        // ignore
      }
    }

    // Create a lesson record for this live episode
    const lesson = await prisma.lesson.create({
      data: {
        titleEn: titleEn || `Live Episode ${Date.now()}`,
        titleFr: titleFr || `Épisode en direct ${Date.now()}`,
        audioUrl: uploadResult.path,
        audioUrlEn: uploadResult.path,
        scriptEn: '',
        scriptFr: '',
        transcriptEn: null,
        transcriptFr: null,
        duration: 0,
        chapterId: chapterId,
        teacherId,
        status: autoPublish === 'true' || autoPublish === true ? 'PUBLISHED' : 'DRAFT',
        audioSourceType: 'MANUAL_UPLOAD',
      },
    });

    // Persist StoredFile record for this upload linking it to the lesson
    try {
      await prisma.storedFile.create({ data: { path: uploadResult.path, lessonId: lesson.id, ownerId: teacherId, ownerType: 'TEACHER' } });
    } catch (e) {
      console.warn('Failed to persist stored file for live upload', e);
    }

    // Emit realtime event via Socket.io if available
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getIo } = require('../socket');
      const io = getIo();
      if (io) {
        io.to('live').emit('live:new', { lessonId: lesson.id, titleEn: lesson.titleEn, titleFr: lesson.titleFr });
      }
    } catch (e) {
      // ignore if socket not initialized
    }

    // Enqueue media processing (transcode + HLS) — separate queue
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mediaProcessingQueue } = require('../lib/queue');
      await mediaProcessingQueue.add('transcode', { lessonId: lesson.id }, { attempts: 2, backoff: { type: 'exponential', delay: 2000 } });
    } catch (e) {
      console.error('Failed to enqueue media processing', e);
    }

    // Enqueue push broadcast job (non-blocking)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { enqueuePushBroadcast } = require('../lib/push');
      await enqueuePushBroadcast({ title: 'Live: ' + (lesson.titleEn || lesson.titleFr || 'New episode'), body: 'A new live episode is available.' });
    } catch (e) {
      console.error('Failed to enqueue push broadcast', e);
    }

    return res.json({ lesson });
  } catch (err) {
    next(err);
  }
});

export default liveRouter;
