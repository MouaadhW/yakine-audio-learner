import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { audioGenerationQueue, mediaProcessingQueue, pushQueue, mediaProcessingDeadLetterQueue } from '../lib/queue';

export const monitorRouter = Router();

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [
    new BullMQAdapter(audioGenerationQueue),
    new BullMQAdapter(mediaProcessingQueue),
    new BullMQAdapter(pushQueue),
    new BullMQAdapter(mediaProcessingDeadLetterQueue),
  ],
  serverAdapter,
});

// Basic auth helper
function checkBasicAuth(req: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) return false;
  const cred = Buffer.from(auth.replace('Basic ', ''), 'base64').toString('utf8');
  const [user, pass] = cred.split(':');
  const allowedUser = process.env.MONITOR_BASIC_USER;
  const allowedPass = process.env.MONITOR_BASIC_PASS;
  return allowedUser && allowedPass && user === allowedUser && pass === allowedPass;
}

// IP allowlist check
function checkIpAllowlist(req: any) {
  const allow = process.env.MONITOR_ALLOWLIST;
  if (!allow) return false;
  const ips = allow.split(',').map(s => s.trim()).filter(Boolean);
  const remote = req.ip || req.connection?.remoteAddress;
  return ips.includes(String(remote));
}

// Protect this endpoint: ADMIN or a signed monitor token via `x-monitor-token` header, or basic auth or IP allowlist
monitorRouter.use((req, res, next) => {
  const token = req.header('x-monitor-token');
  const envToken = process.env.MONITOR_SECRET;
  if (envToken && token === envToken) return next();
  if (checkBasicAuth(req)) return next();
  if (checkIpAllowlist(req)) return next();
  return requireAuth(req, res, err => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    // @ts-ignore
    return requireRole('ADMIN')(req, res, next);
  });
});

monitorRouter.use('/bull', serverAdapter.getRouter());

export default monitorRouter;
