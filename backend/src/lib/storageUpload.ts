import { env } from '../config/env';
import { getSupabase } from './supabase';

const BUCKET = env.STORAGE_BUCKET;

let bucketReady = false;

function safeExtension(extension: string): string {
  return extension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
}

export async function ensureStorageBucket(): Promise<void> {
  if (env.STORAGE_PROVIDER !== 'supabase') {
    throw new Error(
      'Unsupported STORAGE_PROVIDER for teacher composer uploads. Use STORAGE_PROVIDER=supabase.',
    );
  }

  if (bucketReady) return;

  const supabase = getSupabase();
  const { data: buckets } = await supabase.storage.listBuckets();
  const existing = buckets?.find(b => b.name === BUCKET);

  if (!existing) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      allowedMimeTypes: ['audio/*', 'text/plain', 'application/pdf'],
      fileSizeLimit: 50 * 1024 * 1024,
    });
    if (error && !error.message.includes('already exists')) throw error;
  }

  bucketReady = true;
}

/** Upload a buffer and return only the storage path (never a public URL). */
export async function uploadBufferToStorage(options: {
  buffer: Buffer;
  contentType: string;
  extension: string;
  folder?: string;
}): Promise<{ path: string; filename: string }> {
  await ensureStorageBucket();

  const supabase = getSupabase();
  const ext = safeExtension(options.extension);
  const folder = options.folder ?? 'lessons';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${folder}/${filename}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(storagePath, options.buffer, {
    contentType: options.contentType,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return { path: data.path, filename };
}

/**
 * Extract a storage path from either a full Supabase URL or a bare path.
 * Returns null for external (non-Supabase) URLs that we cannot sign.
 */
export function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath || !urlOrPath.startsWith('http')) return urlOrPath || null;
  const match = urlOrPath.match(/\/object\/(?:public|authenticated|sign)\/[^/]+\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
}

/**
 * Convert a list of storage paths or legacy public URLs into signed URLs using
 * a single Supabase batch call. External URLs are passed through unchanged.
 * Empty / null values are returned as null.
 */
export async function batchSignAudioUrls(
  values: (string | null | undefined)[],
  ttlSeconds: number,
): Promise<(string | null)[]> {
  const supabase = getSupabase();

  const paths = values.map(v => (v ? extractStoragePath(v) : null));
  const uniquePaths = [...new Set(paths.filter((p): p is string => !!p))];

  if (uniquePaths.length === 0) {
    return values.map((v, i) => (paths[i] === null && v ? v : null));
  }

  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(uniquePaths, ttlSeconds);
  const signedMap = new Map(data?.map(d => [d.path, d.signedUrl]) ?? []);

  return values.map((v, i) => {
    const path = paths[i];
    if (path === null) return v ?? null; // external URL — pass through as-is
    if (!path) return null;              // empty / null original
    return signedMap.get(path) ?? v ?? null;
  });
}
