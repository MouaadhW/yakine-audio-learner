import type { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from './prisma';
import { uploadBufferToStorage } from './storageUpload';
import { audioGenerationQueue } from './queue';
import { trace, propagation, context as otelContext } from '@opentelemetry/api';

type ComposerLanguage = 'EN' | 'FR' | 'AR';

const prismaClient = prisma as any;

const FALLBACK_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

const DEFAULT_VOICE_BY_LANGUAGE: Record<ComposerLanguage, string> = {
  EN: env.ELEVENLABS_VOICE_EN || FALLBACK_VOICE_ID,
  FR: env.ELEVENLABS_VOICE_FR || env.ELEVENLABS_VOICE_EN || FALLBACK_VOICE_ID,
  AR: env.ELEVENLABS_VOICE_AR || env.ELEVENLABS_VOICE_EN || FALLBACK_VOICE_ID,
};

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown audio generation error';
}

function parseRequestedLanguages(value: Prisma.JsonValue): ComposerLanguage[] {
  if (!Array.isArray(value)) {
    throw new Error('Audio generation job has invalid language payload');
  }

  const allowed: ComposerLanguage[] = ['EN', 'FR', 'AR'];
  const normalized = value
    .map(v => String(v).toUpperCase())
    .filter((v): v is ComposerLanguage => allowed.includes(v as ComposerLanguage));

  if (!normalized.length) {
    throw new Error('Audio generation job has no valid language target');
  }

  return Array.from(new Set(normalized));
}

function parseVoiceSelection(value: Prisma.JsonValue | null): Partial<Record<ComposerLanguage, string>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const voiceMap: Partial<Record<ComposerLanguage, string>> = {};
  const recordValue = value as Record<string, unknown>;

  for (const language of ['EN', 'FR', 'AR'] as const) {
    const voice = recordValue[language];
    if (typeof voice === 'string' && voice.trim()) {
      voiceMap[language] = voice.trim();
    }
  }

  return voiceMap;
}

function getTranscriptForLanguage(lesson: {
  transcriptEn: string | null;
  transcriptFr: string | null;
  transcriptAr: string | null;
  scriptEn: string;
  scriptFr: string;
  scriptAr: string | null;
}, language: ComposerLanguage): string {
  if (language === 'EN') {
    return (lesson.transcriptEn || lesson.scriptEn || '').trim();
  }
  if (language === 'FR') {
    return (lesson.transcriptFr || lesson.scriptFr || '').trim();
  }
  return (lesson.transcriptAr || lesson.scriptAr || '').trim();
}

function resolveVoice(language: ComposerLanguage, selection: Partial<Record<ComposerLanguage, string>>): string {
  return selection[language] || DEFAULT_VOICE_BY_LANGUAGE[language];
}

function detectExtensionFromOutputFormat(format: string): string {
  if (format.toLowerCase().startsWith('mp3')) {
    return 'mp3';
  }
  return 'mp3';
}

async function generateSpeechBuffer(params: {
  text: string;
  language: ComposerLanguage;
  voiceId: string;
}): Promise<Buffer> {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is required for AI generation');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.TTS_REQUEST_TIMEOUT_MS);

  try {
    const endpoint = `${env.ELEVENLABS_BASE_URL}/v1/text-to-speech/${params.voiceId}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: params.text,
        model_id: env.ELEVENLABS_MODEL_ID,
        output_format: env.ELEVENLABS_OUTPUT_FORMAT,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ElevenLabs error (${response.status}): ${errorBody.slice(0, 500)}`);
    }

    const bytes = await response.arrayBuffer();
    return Buffer.from(bytes);
  } finally {
    clearTimeout(timeout);
  }
}

async function markJobFailed(jobId: string, message: string) {
  await prismaClient.audioGenerationJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      errorMessage: message,
      completedAt: null,
    },
  });
}

export async function processAudioGenerationJob(jobId: string, otelCarrier?: Record<string, string>) {
  const tracer = trace.getTracer('teacher-composer');
  // Extract incoming context (if provided) so worker traces are linked to the originating request
  const parentCtx = otelCarrier ? propagation.extract(otelContext.active(), otelCarrier) : undefined;

  return await tracer.startActiveSpan(
    'processAudioGenerationJob',
    undefined,
    parentCtx || undefined,
    async span => {
      span.setAttribute('audioGenerationJob.id', jobId);
      try {
        const job = await prismaClient.audioGenerationJob.findUnique({
          where: { id: jobId },
          include: { lesson: true },
        });
      if (!job) {
        throw new Error('Audio generation job not found');
      }

      if (job.status === 'PROCESSING' || job.status === 'COMPLETED' || job.status === 'CANCELED') {
        span.end();
        return job;
      }

      await prismaClient.audioGenerationJob.update({
        where: { id: job.id },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
          attemptCount: { increment: 1 },
          errorMessage: null,
        },
      });

      try {
        const languages = parseRequestedLanguages(job.requestedLanguages);
    const voiceSelection = parseVoiceSelection(job.voiceSelection);

    const lessonUpdate: Record<string, unknown> = {
      audioSourceType: 'AI_TTS',
      generationRequestedAt: job.requestedAt,
      generatedAt: new Date(),
    };

    let fallbackAudioUrl: string | undefined;

    for (const language of languages) {
      const transcript = getTranscriptForLanguage(job.lesson, language);
      if (!transcript) {
        throw new Error(`Missing transcript for language ${language}`);
      }

      if (transcript.length > env.TEACHER_COMPOSER_MAX_CHARS) {
        throw new Error(`Transcript for ${language} exceeds ${env.TEACHER_COMPOSER_MAX_CHARS} characters`);
      }

      const voiceId = resolveVoice(language, voiceSelection);
      const audioBuffer = await generateSpeechBuffer({
        text: transcript,
        language,
        voiceId,
      });

      const upload = await uploadBufferToStorage({
        buffer: audioBuffer,
        contentType: 'audio/mpeg',
        extension: detectExtensionFromOutputFormat(env.ELEVENLABS_OUTPUT_FORMAT),
        folder: `lessons/generated/${job.lessonId}`,
      });

      if (language === 'EN') {
        lessonUpdate.audioUrlEn = upload.path;
        if (!job.lesson.scriptEn) {
          lessonUpdate.scriptEn = transcript;
        }
      }

      if (language === 'FR') {
        lessonUpdate.audioUrlFr = upload.path;
        if (!job.lesson.scriptFr) {
          lessonUpdate.scriptFr = transcript;
        }
      }

      if (language === 'AR') {
        lessonUpdate.audioUrlAr = upload.path;
        if (!job.lesson.scriptAr) {
          lessonUpdate.scriptAr = transcript;
        }
      }

      if (!fallbackAudioUrl || job.lesson.defaultAudioLanguage === language) {
        fallbackAudioUrl = upload.path;
      }
    }

    if (fallbackAudioUrl) {
      lessonUpdate.audioUrl = fallbackAudioUrl;
    }

    if (job.lesson.composerAutoPublish) {
      lessonUpdate.status = 'PUBLISHED';
    }

    await prisma.lesson.update({
      where: { id: job.lessonId },
      data: lessonUpdate as Prisma.LessonUpdateInput,
    });

        const completed = await prismaClient.audioGenerationJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            errorMessage: null,
          },
        });

        span.setAttribute('audioGenerationJob.status', 'COMPLETED');
        span.end();
        return completed;
      } catch (error) {
        const message = safeErrorMessage(error);
        await markJobFailed(job.id, message);
        span.recordException(error as Error);
        span.setAttribute('audioGenerationJob.status', 'FAILED');
        span.end();
        throw error;
      }
    } catch (err) {
      span.recordException(err as Error);
      span.end();
      throw err;
    }
  });
}

export async function enqueueAudioGenerationJob(params: {
  lessonId: string;
  teacherId: string;
  languages: ComposerLanguage[];
  voiceSelection?: Partial<Record<ComposerLanguage, string>>;
}) {
  const tracer = trace.getTracer('teacher-composer');
  return await tracer.startActiveSpan('enqueueAudioGenerationJob', async span => {
    span.setAttribute('lessonId', params.lessonId);
    span.setAttribute('teacherId', params.teacherId);
    span.setAttribute('languages', params.languages.join(','));

    const job = await prismaClient.audioGenerationJob.create({
      data: {
        lessonId: params.lessonId,
        teacherId: params.teacherId,
        provider: 'ELEVENLABS',
        status: 'QUEUED',
        requestedLanguages: params.languages,
        voiceSelection: params.voiceSelection || {},
      },
    });

    // Inject current trace context into the job data so the worker can continue the trace
    const carrier: Record<string, string> = {};
    try {
      propagation.inject(otelContext.active(), carrier);
    } catch (e) {
      // best-effort
    }

    await audioGenerationQueue.add(
      'generate',
      { jobId: job.id, otel: carrier },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );

    // Persist traceId in DB for quick correlation between DB records and traces
    try {
      const spanCtx = trace.getSpan(otelContext.active())?.spanContext();
      if (spanCtx?.traceId) {
        await prismaClient.audioGenerationJob.update({
          where: { id: job.id },
          data: { traceId: spanCtx.traceId },
        });
      }
    } catch (e) {
      // best effort
    }

    span.setAttribute('audioGenerationJob.id', job.id);
    span.end();
    return job;
  });
}

export async function retryAudioGenerationJob(jobId: string) {
  const job = await prismaClient.audioGenerationJob.update({
    where: { id: jobId },
    data: {
      status: 'QUEUED',
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    },
  });

  // Enqueue to BullMQ so retries go through the same queueing and backoff logic
  await audioGenerationQueue.add('generate', { jobId: job.id }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });

  return job;
}
