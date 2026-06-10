import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { processAudioGenerationJob } from './lib/teacherComposer';

const port = env.PORT;

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
    queueMicrotask(() => {
      void processAudioGenerationJob(id).catch(err => {
        console.error('[startup] TTS recovery failed for job', id, err);
      });
    });
  }
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend API running at http://0.0.0.0:${port}`);
  void recoverOrphanedTtsJobs();
});
