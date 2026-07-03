import { API_URL } from '@env';
import { mmkv, storageKeys } from './storage/mmkv';
import { store } from './store';
import { logout } from '@/features/auth/authSlice';

interface MakeApiRequestProps {
  url: string;
  options?: RequestInit;
}

const REQUEST_TIMEOUT_MS = 10_000;

let inflightRefresh: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

async function attemptTokenRefresh(): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = (async () => {
    const refreshToken = mmkv.getString(storageKeys.refreshToken);
    if (!refreshToken) {
      store.dispatch(logout());
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      });
      if (response.ok) {
        const tokens = await response.json();
        if (tokens.accessToken && tokens.refreshToken) {
          mmkv.setString(storageKeys.accessToken, tokens.accessToken);
          mmkv.setString(storageKeys.refreshToken, tokens.refreshToken);
          return tokens as { accessToken: string; refreshToken: string };
        }
      }
      store.dispatch(logout());
      return null;
    } catch {
      store.dispatch(logout());
      return null;
    } finally {
      clearTimeout(timeoutId);
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

function withTimeout(callerSignal?: AbortSignal): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

export async function makeApiRequest({
  url,
  options = {},
}: MakeApiRequestProps): Promise<Response> {
  if (!API_URL || API_URL.trim() === '') {
    throw new Error('API_URL is not configured. Please set it in your .env file.');
  }

  const requestUrl = `${API_URL}${url}`;
  const callerSignal = options.signal ?? undefined;

  const accessToken = mmkv.getString(storageKeys.accessToken);

  const buildHeaders = (token: string | undefined): Record<string, string> => ({
    ...(options.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const { signal, clear } = withTimeout(callerSignal);
  try {
    const response = await fetch(requestUrl, {
      ...options,
      signal,
      headers: buildHeaders(accessToken),
    });

    if (response.status !== 401) return response;

    // Cross-device session invalidation — no recovery possible
    try {
      const body = await response.clone().json();
      if (body?.message?.includes('Session expired')) {
        store.dispatch(logout());
        return response;
      }
    } catch { /* ignore parse errors */ }

    // Refresh (shared promise prevents concurrent refresh races)
    const newTokens = await attemptTokenRefresh();
    if (!newTokens) return response;

    // Retry with a fresh timeout so the original timeout doesn't affect the retry
    const { signal: retrySignal, clear: clearRetry } = withTimeout(callerSignal);
    try {
      return await fetch(requestUrl, {
        ...options,
        signal: retrySignal,
        headers: buildHeaders(newTokens.accessToken),
      });
    } finally {
      clearRetry();
    }
  } finally {
    clear();
  }
}
