import { Worker } from 'bullmq';
import Expo from 'expo-server-sdk';
import { prisma } from '../lib/prisma';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { initTracing } from '../tracing';

const expo = new Expo.Expo();
const connection = new IORedis(env.REDIS_URL || 'redis://localhost:6379');

async function processBroadcast(job: any) {
  const message = job.data.message as { title: string; body: string };
  // Fetch tokens
  const tokens = await prisma.pushToken.findMany({ select: { token: true } });
  const messages: Expo.ExpoPushMessage[] = tokens.map(t => ({
    to: t.token,
    sound: 'default',
    title: message.title,
    body: message.body,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: { id?: string; status?: string; to?: string; details?: any }[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < ticketChunk.length; i++) {
        const tk = ticketChunk[i] as any;
        tickets.push({ id: tk.id, status: tk.status, to: (chunk[i] as any).to, details: tk.details || null });
      }
    } catch (err) {
      console.error('Expo push send error', err);
    }
  }

  // Collect ticket ids and map back to tokens
  const idToToken: Record<string, string> = {};
  const ticketIds: string[] = [];
  for (const t of tickets) {
    if (t.id) {
      ticketIds.push(t.id);
      if (t.to) idToToken[t.id] = t.to;
    }
  }

  // Wait a short while for receipts to be available
  if (ticketIds.length > 0) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(ticketIds);
      for (const [ticketId, receipt] of Object.entries(receipts)) {
        if (receipt.status === 'error') {
          const token = idToToken[ticketId];
          const details = (receipt as any).details;
          const code = details?.error?.code;
          if (code === 'DeviceNotRegistered' && token) {
            try {
              await prisma.pushToken.deleteMany({ where: { token } });
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch push receipts', e);
    }
  }

  return { ticketsSent: tickets.length };
}

// Initialize tracing then start worker
let pushWorkerInstance: Worker | null = null;
async function startPushWorker() {
  try {
    await initTracing();
  } catch (err) {
    console.warn('Tracing init failed for push worker, continuing without tracing', err);
  }
  pushWorkerInstance = new Worker('push', async job => await processBroadcast(job), { connection, concurrency: 2 });
  pushWorkerInstance.on('failed', (job, err) => {
    console.error('Push worker failed', job?.id, err);
  });
  if (require.main === module) console.log('Push worker started');
}

void startPushWorker();

export { pushWorkerInstance };
