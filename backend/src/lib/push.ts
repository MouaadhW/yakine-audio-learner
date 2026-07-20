import Expo from 'expo-server-sdk';
import { prisma } from './prisma';
import { env } from '../config/env';

const expo = new Expo.Expo();

export async function registerPushToken(userId: string, token: string) {
  if (!Expo.Expo.isExpoPushToken(token)) {
    throw new Error('Invalid Expo push token');
  }
  return await prisma.pushToken.upsert({
    where: { token },
    update: { userId, updatedAt: new Date() as any },
    create: { userId, token },
  });
}

export async function sendPushToAll(message: { title: string; body: string }) {
  // Fetch tokens
  const tokens = await prisma.pushToken.findMany({ select: { token: true } });
  const messages: Expo.ExpoPushMessage[] = tokens.map(t => ({
    to: t.token,
    sound: 'default',
    title: message.title,
    body: message.body,
    data: { someData: 'goes here' },
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: any[] = [];
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      console.error('Expo push error', err);
    }
  }

  return tickets;
}

// Enqueue a broadcast job to the push queue (best-effort, non-blocking)
export async function enqueuePushBroadcast(message: { title: string; body: string }) {
  // Lazy require to avoid cycle at import time
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { pushQueue } = require('./queue');
  await pushQueue.add('broadcast', { message }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
}
