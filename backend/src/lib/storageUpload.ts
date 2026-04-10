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

  if (bucketReady) {
    return;
  }

  const supabase = getSupabase();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ['audio/*', 'text/plain', 'application/pdf'],
      fileSizeLimit: 50 * 1024 * 1024,
    });

    if (error && !error.message.includes('already exists')) {
      throw error;
    }
  }

  bucketReady = true;
}

export async function uploadBufferToStorage(options: {
  buffer: Buffer;
  contentType: string;
  extension: string;
  folder?: string;
}): Promise<{ path: string; publicUrl: string; filename: string }> {
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

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
    filename,
  };
}
