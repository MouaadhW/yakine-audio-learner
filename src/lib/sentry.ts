import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

export function initSentry() {
  const dsn = (Constants?.manifest?.extra && (Constants.manifest.extra as any).SENTRY_DSN) || process.env?.SENTRY_DSN || '';
  if (!dsn) return;

  Sentry.init({
    dsn,
    enableInExpoDevelopment: true,
    tracesSampleRate: 0.05,
  });
}

export default Sentry;
