import { env } from '../config/env';
import { getSupabase } from './supabase';
import { prisma } from './prisma';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import stream from 'stream';
import { promisify } from 'util';

const pipeline = promisify(stream.pipeline);

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
  // Optional ownership metadata to persist for later authorization checks
  ownerId?: string;
  ownerType?: string;
  lessonId?: string;
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

  // Persist ownership metadata if provided
  if (options.ownerId || options.lessonId) {
    try {
      await prisma.storedFile.create({ data: { path: data.path, ownerId: options.ownerId, ownerType: options.ownerType, lessonId: options.lessonId } });
    } catch (e) {
      // Do not fail the upload if metadata persistence fails; just log
      // eslint-disable-next-line no-console
      console.warn('Failed to persist StoredFile metadata', e);
    }
  }

  return { path: data.path, filename };
}

// Download a file from storage and return a Buffer
export async function downloadBufferFromStorage(filePath: string): Promise<Buffer> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
  if (error) throw new Error(`Failed to download ${filePath}: ${error.message}`);

  // data is a ReadableStream or Blob depending on environment; convert to buffer
  if (typeof (data as any).arrayBuffer === 'function') {
    const ab = await (data as any).arrayBuffer();
    return Buffer.from(ab);
  }

  // Fallback: stream to buffer
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    const stream = data as NodeJS.ReadableStream;
    stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Stream a storage file into a temp file and return its path and a cleanup function.
export async function downloadToTempFile(filePath: string): Promise<{ path: string; cleanup: () => Promise<void> }> {
  await ensureStorageBucket();
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
  if (error) throw new Error(`Failed to download ${filePath}: ${error.message}`);

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'yakine-'));
  const filename = path.basename(filePath) || `input-${Date.now()}`;
  const outPath = path.join(tmpDir, filename);

  // If we received a blob-like object with arrayBuffer, write it directly
  if (typeof (data as any).arrayBuffer === 'function') {
    const ab = await (data as any).arrayBuffer();
    await fsp.writeFile(outPath, Buffer.from(ab));
  } else {
    const readStream = data as NodeJS.ReadableStream;
    const writeStream = fs.createWriteStream(outPath);
    await pipeline(readStream, writeStream);
  }

  return {
    path: outPath,
    cleanup: async () => {
      try {
        await fsp.rm(tmpDir, { recursive: true, force: true });
      } catch (e) {
        // ignore cleanup errors
      }
    },
  };
}

/** Upload a file from local path to storage using a stream. Returns storage path and filename. */
export async function uploadFileToStorage(options: {
  filePath: string;
  contentType: string;
  extension: string;
  folder?: string;
  ownerId?: string;
  ownerType?: string;
  lessonId?: string;
}): Promise<{ path: string; filename: string }> {
  await ensureStorageBucket();
  const supabase = getSupabase();
  const ext = safeExtension(options.extension);
  const folder = options.folder ?? 'lessons';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${folder}/${filename}`;

  const readStream = fs.createReadStream(options.filePath);

  // Supabase Node client accepts ReadableStream for uploads
  const { data, error } = await supabase.storage.from(BUCKET).upload(storagePath, readStream, {
    contentType: options.contentType,
    cacheControl: '3600',
    upsert: false,
  } as any);

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  // Persist ownership metadata if provided
  if ((options as any).ownerId || (options as any).lessonId) {
    try {
      await prisma.storedFile.create({ data: { path: data.path, ownerId: (options as any).ownerId, ownerType: (options as any).ownerType, lessonId: (options as any).lessonId } });
    } catch (e) {
      console.warn('Failed to persist StoredFile metadata', e);
    }
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
