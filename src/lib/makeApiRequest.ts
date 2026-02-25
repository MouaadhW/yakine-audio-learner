import { API_URL } from '@env';

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

  let requestOptions: RequestInit = {
    ...options,
    signal: timeoutController.signal,
  };

  if (!API_URL || API_URL.trim() === '') {
    throw new Error(
      'API_URL is not configured. Please set it in your .env file.',
    );
  }

  const requestUrl = `${API_URL}${url}`;
  // console.log(requestUrl);

  // await new Promise(resolve => setTimeout(resolve, 3000));
  try {
    const response = await fetch(requestUrl, requestOptions);

    if (response.status === 401) {
      // access token has expired, try to refresh it
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
      });
      if (refreshResponse.ok) {
        //   const { accessToken, refreshToken } = await refreshResponse.json();
        // retry original request with new access token
        const retryResponse = await fetch(requestUrl, requestOptions);
        return retryResponse;
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
