import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { mediaProcessingDeadLetterQueue, mediaProcessingQueue } from '../lib/queue';

export const dlqRouter = Router();

// Admin-only: list DLQ entries for media processing
dlqRouter.get('/media', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const jobs = await mediaProcessingDeadLetterQueue.getJobs(['waiting', 'delayed', 'failed'], 0, 200);
    const mapped = jobs.map(j => ({ id: j.id, name: j.name, data: j.data, failedReason: (j.data as any).failedReason || null, timestamp: j.timestamp }));
    return res.json(mapped);
  } catch (e) {
    next(e);
  }
});

// Requeue a DLQ entry back to media-processing
dlqRouter.post('/media/requeue', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { jobId } = req.body as { jobId: string };
    if (!jobId) return res.status(400).json({ message: 'jobId required' });
    const job = await mediaProcessingDeadLetterQueue.getJob(jobId);
    if (!job) return res.status(404).json({ message: 'DLQ job not found' });
    const payload = job.data?.data ?? job.data;
    await mediaProcessingQueue.add('transcode', payload, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    await job.remove();
    return res.json({ message: 'Requeued' });
  } catch (e) {
    next(e);
  }
});

// Delete a DLQ entry
dlqRouter.delete('/media/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const job = await mediaProcessingDeadLetterQueue.getJob(id);
    if (!job) return res.status(404).json({ message: 'DLQ job not found' });
    await job.remove();
    return res.json({ message: 'Deleted' });
  } catch (e) {
    next(e);
  }
});

export default dlqRouter;
