import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

const collectDefault = client.collectDefaultMetrics;
collectDefault({ timeout: 5000 });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 1, 2, 5],
});

export const mediaTranscodeDuration = new client.Histogram({
  name: 'media_transcode_duration_seconds',
  help: 'Duration of media transcode tasks in seconds',
  labelNames: ['queue', 'status'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

export const bullQueueSize = new client.Gauge({
  name: 'bull_queue_size',
  help: 'Number of jobs in Bull queues',
  labelNames: ['queue'],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const end = httpRequestDuration.startTimer();
  const route = req.route?.path || req.path;
  res.on('finish', () => {
    end({ method: req.method, route, status_code: String(res.statusCode) });
  });
  next();
}

export async function metricsEndpoint(_req: Request, res: Response) {
  try {
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send(err instanceof Error ? err.message : String(err));
  }
}
