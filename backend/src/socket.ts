import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import IORedis from 'ioredis';
import { env } from './config/env';

let io: Server | null = null;

export function initSocket(server: any) {
  io = new Server(server, { cors: { origin: '*' } });

  if (env.REDIS_URL) {
    const pubClient = new IORedis(env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.on('connection', socket => {
    // join live room by default
    socket.join('live');
    socket.on('subscribeLive', () => socket.join('live'));
    socket.on('unsubscribeLive', () => socket.leave('live'));
  });

  return io;
}

export function getIo() {
  return io;
}
