import { API_URL } from '@env';
import { mmkv, storageKeys } from './storage/mmkv';

interface MakeApiRequestProps {
  url: string;
  options?: RequestInit;
}

export async function makeApiRequest({
  url,
  options = {},
}: MakeApiRequestProps): Promise<Response> {
  const timeoutController = new AbortController();
  const timeoutMs = 10000;

  let onAbort: (() => void) | undefined;

  if (options.signal) {
    onAbort = () => {
      timeoutController.abort();
    };

    if (options.signal.aborted) {
      timeoutController.abort();
    } else {
      options.signal.addEventListener('abort', onAbort, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, timeoutMs);

  const accessToken = mmkv.getString(storageKeys.accessToken);

  let requestOptions: RequestInit = {
    ...options,
    signal: timeoutController.signal,
    headers: {
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  };

  if (!API_URL || API_URL.trim() === '') {
    throw new Error(
      'API_URL is not configured. Please set it in your .env file.',
    );
  }

  const requestUrl = `${API_URL}${url}`;

  try {
    const response = await fetch(requestUrl, requestOptions);

    if (response.status === 401) {
      const refreshToken = mmkv.getString(storageKeys.refreshToken);
      if (refreshToken) {
        try {
          const refreshController = new AbortController();
          const refreshTimeoutId = setTimeout(() => {
            refreshController.abort();
          }, timeoutMs);
          try {
            const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
              signal: refreshController.signal,
            });
            if (refreshResponse.ok) {
              const tokens = await refreshResponse.json();
              if (tokens.accessToken && tokens.refreshToken) {
                mmkv.setString(storageKeys.accessToken, tokens.accessToken);
                mmkv.setString(storageKeys.refreshToken, tokens.refreshToken);
                const retryOptions: RequestInit = {
                  ...options,
                  signal: timeoutController.signal,
                  headers: {
                    ...options.headers,
                    Authorization: `Bearer ${tokens.accessToken}`,
                  },
                };
                const retryResponse = await fetch(requestUrl, retryOptions);
                return retryResponse;
              }
            }
          } finally {
            clearTimeout(refreshTimeoutId);
          }
        } catch {
          // refresh failed, return original 401 response
        }
      }
    }

    return response;
  } finally {
    clearTimeout(timeoutId);

    if (options.signal && onAbort) {
      options.signal.removeEventListener('abort', onAbort);
    }
  }
}
