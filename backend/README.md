# Yakine Audio Learner Backend

Express + Prisma + PostgreSQL backend for courses, audio lessons, user progress, and downloads.

## Stack
- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT + bcrypt
- Supabase Storage (teacher uploads + AI-generated audio)
- ElevenLabs Text-to-Speech (AI generation)

## 1) Setup
1. Copy env file:
   - Windows PowerShell: `Copy-Item .env.example .env`
2. Update `.env` values (`DATABASE_URL`, `JWT_SECRET`, etc.)
3. For Teacher Composer AI, set:
   - `STORAGE_PROVIDER=supabase`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `ELEVENLABS_API_KEY`
3. Install dependencies:
   - `npm install`
4. Generate Prisma client:
   - `npm run prisma:generate`
5. Run migrations:
   - `npm run prisma:migrate`

## 2) Run
- Development: `npm run dev`
- Build: `npm run build`
- Production: `npm start`

Health check: `GET /health`

## Teacher Composer / ElevenLabs Setup

Required environment variables:

- `STORAGE_PROVIDER=supabase`
- `STORAGE_BUCKET=yakine-audio-files` (or your bucket)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `ELEVENLABS_API_KEY`

Optional tuning:

- `ELEVENLABS_MODEL_ID=eleven_multilingual_v2`
- `ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128`
- `ELEVENLABS_VOICE_EN`, `ELEVENLABS_VOICE_FR`, `ELEVENLABS_VOICE_AR`
- `TTS_REQUEST_TIMEOUT_MS=45000`
- `TEACHER_COMPOSER_MAX_CHARS=12000`

## 3) Main APIs
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/subjects`
- `POST /api/subjects` (TEACHER/ADMIN)
- `GET /api/lessons`
- `GET /api/lessons/:id`
- `POST /api/lessons` (TEACHER/ADMIN)
- `GET /api/progress`
- `POST /api/progress`
- `GET /api/downloads`
- `POST /api/downloads`
- `GET /api/storage/config`

Teacher composer APIs (TEACHER/ADMIN):

- `POST /api/teacher-composer/transcripts/upload`
- `POST /api/teacher-composer/lessons`
- `POST /api/teacher-composer/lessons/:id/manual-audio`
- `POST /api/teacher-composer/lessons/:id/ai-jobs`
- `GET /api/teacher-composer/lessons/:id/jobs`
- `GET /api/teacher-composer/ai-jobs/:id`
- `POST /api/teacher-composer/ai-jobs/:id/retry`
- `POST /api/teacher-composer/ai-jobs/:id/cancel`

Use `Authorization: Bearer <token>` for protected routes.
