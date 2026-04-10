import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(8),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  STORAGE_PROVIDER: z.enum(['r2', 's3', 'supabase']).default('supabase'),
  STORAGE_BUCKET: z.string().default('audio-files'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  AWS_REGION: z.string().default('auto'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_ENDPOINT: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_BASE_URL: z.string().default('https://api.elevenlabs.io'),
  ELEVENLABS_MODEL_ID: z.string().default('eleven_multilingual_v2'),
  ELEVENLABS_OUTPUT_FORMAT: z.string().default('mp3_44100_128'),
  ELEVENLABS_VOICE_EN: z.string().optional(),
  ELEVENLABS_VOICE_FR: z.string().optional(),
  ELEVENLABS_VOICE_AR: z.string().optional(),
  TTS_REQUEST_TIMEOUT_MS: z.coerce.number().default(45000),
  TEACHER_COMPOSER_MAX_CHARS: z.coerce.number().default(12000)
});

export const env = envSchema.parse(process.env);
