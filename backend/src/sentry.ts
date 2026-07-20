import * as Sentry from '@sentry/node';
import { env } from './config/env';

export function initSentry() {
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || 'development',
  });
}

export default Sentry;
