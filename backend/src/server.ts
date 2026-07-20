import { initTracing } from './tracing';
import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { audioGenerationQueue } from './lib/queue';
import http from 'http';
import { initSocket } from './socket';
import parentDigest from './lib/parentDigest';

const port = env.PORT;

// Initialize tracing as early as possible
void initTracing();

async function recoverOrphanedTtsJobs() {
  const stuckJobs = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "AudioGenerationJob"
    WHERE status IN ('QUEUED', 'PROCESSING')
  `;

  if (stuckJobs.length === 0) return;

  console.log(`[startup] Recovering ${stuckJobs.length} orphaned TTS job(s)...`);

  for (const { id } of stuckJobs) {
    // Reset to QUEUED so processAudioGenerationJob accepts it
    await prisma.$executeRaw`
      UPDATE "AudioGenerationJob"
      SET status = 'QUEUED', "startedAt" = NULL, "errorMessage" = NULL
      WHERE id = ${id} AND status = 'PROCESSING'
    `;
    // Enqueue job into BullMQ for regular processing
    await audioGenerationQueue.add('generate', { jobId: id }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
  }
}

const server = http.createServer(app);
// Initialize socket.io
initSocket(server);

server.listen(port, '0.0.0.0', () => {
  console.log(`Backend API running at http://0.0.0.0:${port}`);
  void recoverOrphanedTtsJobs();
  // Schedule weekly parent digests if enabled
  try {
    parentDigest.scheduleWeeklyDigests();
  } catch (e) {
    console.warn('Failed to schedule parent digests', e);
  }
});
