import { Queue, Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';

const connection = new IORedis(env.REDIS_URL || 'redis://localhost:6379');

export const audioGenerationQueue = new Queue('audio-generation', { connection });
export const audioGenerationScheduler = new QueueScheduler('audio-generation', { connection });
export const mediaProcessingQueue = new Queue('media-processing', { connection });
export const mediaProcessingScheduler = new QueueScheduler('media-processing', { connection });
export const mediaProcessingDeadLetterQueue = new Queue('media-processing-dlq', { connection });
export const mediaProcessingDlqScheduler = new QueueScheduler('media-processing-dlq', { connection });
export const pushQueue = new Queue('push', { connection });
export const pushScheduler = new QueueScheduler('push', { connection });

export function createAudioWorker(processFn: (jobId: string, carrier?: Record<string, string>) => Promise<any>) {
  // Worker processes jobs by id which maps to prisma audioGenerationJob IDs
  const worker = new Worker(
    'audio-generation',
    async job => {
      const id = job.data.jobId as string;
      const carrier = (job.data.otel || null) as Record<string, string> | null;
      return await processFn(id, carrier || undefined);
    },
    { connection }
  );

  worker.on('failed', (job, err) => {
    console.error('Audio worker failed job', job?.id, err);
  });

  return worker;
}

// Factory for media processing worker which expects lessonId in job data
export function createMediaWorker(processFn: (lessonId: string) => Promise<any>, opts?: { concurrency?: number }) {
  const worker = new Worker(
    'media-processing',
    async job => {
      const lessonId = job.data.lessonId as string;
      return await processFn(lessonId);
    },
    { connection, concurrency: opts?.concurrency ?? 1 }
  );

  worker.on('failed', async (job, err) => {
    try {
      console.error('Media worker failed job', job?.id, err);
      const attempts = (job?.opts && (job as any).opts.attempts) || 0;
      const attemptsMade = job?.attemptsMade || 0;
      // If the job exhausted its attempts, move to DLQ
      if (attempts > 0 && attemptsMade >= attempts) {
        await mediaProcessingDeadLetterQueue.add('dlq', { originalName: job.name, data: job.data, failedReason: String(err?.message || err) });
      }
    } catch (e) {
      console.error('Failed to move job to DLQ', e);
    }
  });

  return worker;
}
