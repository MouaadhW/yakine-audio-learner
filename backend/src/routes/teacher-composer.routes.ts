import { Request, Response, Router } from 'express';
import multer from 'multer';
import os from 'os';
import fsp from 'fs/promises';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { requireTeacherPostPermission } from '../middleware/teacherPostPermission';
import { extractTranscriptFromUpload } from '../lib/transcriptParser';
import { enqueueAudioGenerationJob, retryAudioGenerationJob } from '../lib/teacherComposer';
import { env } from '../config/env';

const transcriptUpload = multer({ dest: os.tmpdir(), limits: { fileSize: 10 * 1024 * 1024 } });

const languageSchema = z.enum(['EN', 'FR', 'AR']);

const transcriptObjectSchema = z.object({
  EN: z.string().trim().optional(),
  FR: z.string().trim().optional(),
  AR: z.string().trim().optional(),
});

const createComposerLessonSchema = z.object({
  chapterId: z.string().min(1),
  titleEn: z.string().min(2),
  titleFr: z.string().min(2),
  sortOrder: z.number().int().optional(),
  audience: z.enum(['FREE', 'PREMIUM']).optional().default('FREE'),
  defaultAudioLanguage: languageSchema.optional().default('FR'),
  autoPublish: z.boolean().optional().default(true),
  transcripts: transcriptObjectSchema.optional().default({}),
  scripts: transcriptObjectSchema.optional().default({}),
});

const attachManualAudioSchema = z.object({
  audioUrl: z.string().url(),
  duration: z.number().int().nonnegative().optional().default(0),
  language: languageSchema,
  sourceType: z.enum(['MANUAL_UPLOAD', 'MANUAL_RECORDING']).optional().default('MANUAL_UPLOAD'),
  script: z.string().trim().optional(),
});

const enqueueAiSchema = z.object({
  languages: z.array(languageSchema).min(1),
  voiceSelection: transcriptObjectSchema.optional().default({}),
  autoPublish: z.boolean().optional(),
});

export const teacherComposerRouter = Router();

const prismaClient = prisma as any;

teacherComposerRouter.use(requireAuth, requireRole('TEACHER', 'ADMIN'));

async function getManagedLessonOrReject(params: {
  lessonId: string;
  auth: NonNullable<Request['auth']>;
  res: Response;
}) {
  const lesson = await prisma.lesson.findUnique({ where: { id: params.lessonId } });

  if (!lesson) {
    params.res.status(404).json({ message: 'Lesson not found' });
    return null;
  }

  if (params.auth.role !== 'ADMIN' && lesson.teacherId !== params.auth.userId) {
    params.res.status(403).json({ message: 'You can only manage your own lessons' });
    return null;
  }

  return lesson;
}

function getTranscriptForLanguage(
  lesson: any,
  language: 'EN' | 'FR' | 'AR',
): string {
  if (language === 'EN') {
    return (lesson.transcriptEn || lesson.scriptEn || '').trim();
  }
  if (language === 'FR') {
    return (lesson.transcriptFr || lesson.scriptFr || '').trim();
  }
  return (lesson.transcriptAr || lesson.scriptAr || '').trim();
}

function getComposerSetupError(): string | null {
  if (!env.ELEVENLABS_API_KEY) {
    return 'ELEVENLABS_API_KEY is missing. Set it in backend/.env before starting AI generation.';
  }
  if (env.STORAGE_PROVIDER !== 'supabase') {
    return 'Teacher composer AI currently supports Supabase storage only. Set STORAGE_PROVIDER=supabase.';
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return 'SUPABASE_URL and SUPABASE_SERVICE_KEY are required to upload generated audio.';
  }
  return null;
}

teacherComposerRouter.post('/transcripts/upload', transcriptUpload.single('file'), async (req, res, next) => {
  const file = req.file;
  try {
    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const text = await extractTranscriptFromUpload(file);

    if (!text) {
      return res.status(400).json({ message: 'Transcript file did not contain readable text' });
    }

    return res.status(201).json({
      text,
      characterCount: text.length,
      filename: file.originalname,
      mimeType: file.mimetype,
    });
  } catch (error) {
    return next(error);
  } finally {
    // cleanup temp file if present
    try {
      if ((file as any).path) await fsp.unlink((file as any).path);
    } catch (e) {
      // ignore
    }
  }
});

teacherComposerRouter.post('/lessons', requireTeacherPostPermission, async (req, res, next) => {
  try {
    const input = createComposerLessonSchema.parse(req.body);

    const transcriptEn = input.transcripts.EN?.trim() || null;
    const transcriptFr = input.transcripts.FR?.trim() || null;
    const transcriptAr = input.transcripts.AR?.trim() || null;

    const scriptEn = input.scripts.EN?.trim() || transcriptEn || '';
    const scriptFr = input.scripts.FR?.trim() || transcriptFr || '';
    const scriptAr = input.scripts.AR?.trim() || transcriptAr || null;

    const lesson = await prisma.lesson.create({
      data: {
        titleEn: input.titleEn,
        titleFr: input.titleFr,
        audioUrl: '',
        scriptEn,
        scriptFr,
        scriptAr,
        transcriptEn,
        transcriptFr,
        transcriptAr,
        duration: 0,
        sortOrder: input.sortOrder ?? 0,
        chapterId: input.chapterId,
        teacherId: req.auth!.userId,
        audience: input.audience,
        status: 'DRAFT',
        defaultAudioLanguage: input.defaultAudioLanguage,
        audioSourceType: 'MANUAL_UPLOAD',
        isTeacherComposer: true,
        composerAutoPublish: input.autoPublish,
      },
    });

    return res.status(201).json(lesson);
  } catch (error) {
    return next(error);
  }
});

teacherComposerRouter.post('/lessons/:id/manual-audio', async (req, res, next) => {
  try {
    const input = attachManualAudioSchema.parse(req.body);

    const lesson = await getManagedLessonOrReject({
      lessonId: req.params.id,
      auth: req.auth!,
      res,
    });

    if (!lesson) {
      return;
    }

    const updateData: any = {
      audioUrl: input.audioUrl,
      duration: input.duration,
      defaultAudioLanguage: input.language,
      audioSourceType: input.sourceType,
      generatedAt: new Date(),
      status: 'PUBLISHED',
      isTeacherComposer: true,
    };

    if (input.language === 'EN') {
      updateData.audioUrlEn = input.audioUrl;
      if (input.script) updateData.scriptEn = input.script;
    }

    if (input.language === 'FR') {
      updateData.audioUrlFr = input.audioUrl;
      if (input.script) updateData.scriptFr = input.script;
    }

    if (input.language === 'AR') {
      updateData.audioUrlAr = input.audioUrl;
      if (input.script) updateData.scriptAr = input.script;
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lesson.id },
      data: updateData,
    });

    return res.json(updatedLesson);
  } catch (error) {
    return next(error);
  }
});

teacherComposerRouter.post('/lessons/:id/ai-jobs', async (req, res, next) => {
  try {
    const input = enqueueAiSchema.parse(req.body);

    const lesson = await getManagedLessonOrReject({
      lessonId: req.params.id,
      auth: req.auth!,
      res,
    });

    if (!lesson) {
      return;
    }

    const setupError = getComposerSetupError();
    if (setupError) {
      return res.status(400).json({ message: setupError });
    }

    for (const language of input.languages) {
      const transcript = getTranscriptForLanguage(lesson, language);
      if (!transcript) {
        return res.status(400).json({
          message: `Missing transcript/script for ${language}. Add text before queuing AI generation.`,
        });
      }
      if (transcript.length > env.TEACHER_COMPOSER_MAX_CHARS) {
        return res.status(400).json({
          message: `Transcript for ${language} exceeds ${env.TEACHER_COMPOSER_MAX_CHARS} characters.`,
        });
      }
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        audioSourceType: 'AI_TTS',
        generationRequestedAt: new Date(),
        status: 'DRAFT',
        composerAutoPublish:
          typeof input.autoPublish === 'boolean'
            ? input.autoPublish
            : Boolean((lesson as any).composerAutoPublish),
        isTeacherComposer: true,
      },
    });

    const job = await enqueueAudioGenerationJob({
      lessonId: lesson.id,
      teacherId: req.auth!.userId,
      languages: input.languages,
      voiceSelection: input.voiceSelection,
    });

    return res.status(202).json({
      message: 'Audio generation queued',
      job,
      lessonId: lesson.id,
    });
  } catch (error) {
    return next(error);
  }
});

teacherComposerRouter.get('/lessons/:id/jobs', async (req, res, next) => {
  try {
    const lesson = await getManagedLessonOrReject({
      lessonId: req.params.id,
      auth: req.auth!,
      res,
    });

    if (!lesson) {
      return;
    }

    const jobs = await prismaClient.audioGenerationJob.findMany({
      where: { lessonId: lesson.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(jobs);
  } catch (error) {
    return next(error);
  }
});

teacherComposerRouter.get('/ai-jobs/:id', async (req, res, next) => {
  try {
    const job = await prismaClient.audioGenerationJob.findUnique({
      where: { id: req.params.id },
      include: {
        lesson: {
          select: {
            id: true,
            titleEn: true,
            titleFr: true,
            status: true,
            audioUrl: true,
            audioUrlEn: true,
            audioUrlFr: true,
            audioUrlAr: true,
            defaultAudioLanguage: true,
            teacherId: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ message: 'Audio generation job not found' });
    }

    if (req.auth!.role !== 'ADMIN' && job.lesson.teacherId !== req.auth!.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(job);
  } catch (error) {
    return next(error);
  }
});

teacherComposerRouter.post('/ai-jobs/:id/retry', async (req, res, next) => {
  try {
    const existing = await prismaClient.audioGenerationJob.findUnique({
      where: { id: req.params.id },
      include: { lesson: { select: { teacherId: true } } },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Audio generation job not found' });
    }

    if (req.auth!.role !== 'ADMIN' && existing.lesson.teacherId !== req.auth!.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const retriedJob = await retryAudioGenerationJob(existing.id);
    return res.status(202).json(retriedJob);
  } catch (error) {
    return next(error);
  }
});

teacherComposerRouter.post('/ai-jobs/:id/cancel', async (req, res, next) => {
  try {
    const existing = await prismaClient.audioGenerationJob.findUnique({
      where: { id: req.params.id },
      include: { lesson: { select: { teacherId: true } } },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Audio generation job not found' });
    }

    if (req.auth!.role !== 'ADMIN' && existing.lesson.teacherId !== req.auth!.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (existing.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Completed jobs cannot be canceled' });
    }

    const canceled = await prismaClient.audioGenerationJob.update({
      where: { id: existing.id },
      data: { status: 'CANCELED', completedAt: new Date() },
    });

    return res.json(canceled);
  } catch (error) {
    return next(error);
  }
});
