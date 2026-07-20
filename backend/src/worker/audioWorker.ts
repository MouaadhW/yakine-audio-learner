import { initTracing } from '../tracing';
import { createAudioWorker } from '../lib/queue';
import { processAudioGenerationJob } from '../lib/teacherComposer';

let audioWorker: ReturnType<typeof createAudioWorker> | null = null;

async function startWorker() {
  try {
    await initTracing();
  } catch (err) {
    console.warn('Tracing init failed for worker, continuing without tracing', err);
  }

  audioWorker = createAudioWorker(processAudioGenerationJob, { concurrency: 2 });

  if (require.main === module) {
    console.log('Audio worker started');
  }
}

void startWorker();

export { audioWorker };
