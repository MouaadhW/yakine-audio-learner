import path from 'path';
import fsp from 'fs/promises';
import os from 'os';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { createMediaWorker, mediaProcessingQueue } from '../lib/queue';
import { initTracing } from '../tracing';
import { downloadToTempFile, uploadFileToStorage } from '../lib/storageUpload';
import { mediaTranscodeDuration, bullQueueSize } from '../metrics';
import { prisma } from '../lib/prisma';

ffmpeg.setFfmpegPath(ffmpegPath as string);

async function transcodeJob(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error('Lesson not found for transcode');

  const storagePath = lesson.audioUrl || lesson.audioUrlEn || lesson.audioUrlFr;
  if (!storagePath) throw new Error('No audio URL found on lesson');

  const { path: inputPath, cleanup } = await downloadToTempFile(storagePath);
  // update queue size metric
  try {
    const counts = await mediaProcessingQueue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed');
    const total = Object.values(counts).reduce((a: number, b: number) => a + (b as number), 0);
    bullQueueSize.labels('media-processing').set(total);
  } catch (e) {
    // ignore metric failures
  }
  const endTimer = mediaTranscodeDuration.startTimer();
  try {
    const tmpDir = path.dirname(inputPath);
    const mp3Path = path.join(tmpDir, 'out-64k.mp3');
    const hlsDir = path.join(tmpDir, 'hls');
    await fsp.mkdir(hlsDir, { recursive: true });

    // Produce an MP3 at 64kbps
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate(64)
        .format('mp3')
        .on('error', err => reject(err))
        .on('end', () => resolve())
        .save(mp3Path);
    });

    // Create HLS (segment size 10s)
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .addOutput(path.join(hlsDir, 'index.m3u8'))
        .format('hls')
        .outputOptions(['-hls_time 10', '-hls_list_size 0'])
        .on('error', err => reject(err))
        .on('end', () => resolve())
        .run();
    });

    const mp3Upload = await uploadFileToStorage({ filePath: mp3Path, contentType: 'audio/mpeg', extension: 'mp3', folder: `lessons/generated/${lessonId}`, lessonId });

    // Upload HLS files
    const files = await fsp.readdir(hlsDir);
    let hlsIndexPath = '';
    for (const file of files) {
      const full = path.join(hlsDir, file);
      const ext = file.endsWith('.m3u8') ? 'm3u8' : 'ts';
      const upload = await uploadFileToStorage({ filePath: full, contentType: ext === 'm3u8' ? 'application/vnd.apple.mpegurl' : 'video/MP2T', extension: ext, folder: `lessons/generated/${lessonId}/hls`, lessonId });
      if (file.endsWith('.m3u8')) hlsIndexPath = upload.path;
    }

    // Update lesson with mp3 and hls paths
    await prisma.lesson.update({ where: { id: lessonId }, data: { audioUrl: mp3Upload.path, audioUrlEn: mp3Upload.path, audioUrlFr: mp3Upload.path } });
    endTimer({ queue: 'media-processing', status: 'success' });
  } catch (err) {
    endTimer({ queue: 'media-processing', status: 'failure' });
    throw err;
  } finally {
    try {
      const counts2 = await mediaProcessingQueue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed');
      const total2 = Object.values(counts2).reduce((a: number, b: number) => a + (b as number), 0);
      bullQueueSize.labels('media-processing').set(total2);
    } catch (e) {
      // ignore
    }
    await cleanup();
  }
}

// Create worker using factory with low concurrency to avoid CPU overcommit
let mediaWorkerInstance: ReturnType<typeof createMediaWorker> | null = null;

async function start() {
  try {
    await initTracing();
  } catch (err) {
    console.warn('Tracing init failed for media worker, continuing without tracing', err);
  }
  mediaWorkerInstance = createMediaWorker(transcodeJob, { concurrency: 1 });
  if (require.main === module) {
    console.log('Media worker started');
  }
}

void start();

export { mediaWorkerInstance as mediaWorker };
