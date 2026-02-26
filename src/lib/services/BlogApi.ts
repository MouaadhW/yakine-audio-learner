import { makeApiRequest } from '../makeApiRequest';
import { Page, Post, SearchParams } from '../models';
import { buildQueryParams } from '../utils';
import { validateApiResponse } from '../validateApiResponse';

export async function getPostBySlug(slug: string, signal?: AbortSignal) {
  const url = `/api/lessons/${slug}`;

  const resp = await makeApiRequest({
    url,
    options: {
      signal,
    },
  });

  await validateApiResponse(resp);

  return (await resp.json()) as Post;
}

export async function getPosts(params: SearchParams, signal?: AbortSignal) {
  const query = buildQueryParams(params);

  const url = `/api/lessons${query}`;

  const resp = await makeApiRequest({
    url,
    options: {
      signal,
    },
  });

  await validateApiResponse(resp);

  return (await resp.json()) as Page<Post>;
}
