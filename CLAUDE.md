# Yakine Audio Learner

Audio-based learning platform for Tunisian students. Two programs: BAC (secondary school, streams SCIENTIFIC/LITERARY/ECONOMIC/TECHNICAL) and Law faculty (L1/L2/L3, university-scoped, DROIT_PRIVE/DROIT_PUBLIC majors). Users browse subjects → chapters → lessons, stream or download audio, read transcripts, and track progress.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81.5, Expo 54 |
| Navigation | React Navigation 6 (native stack + bottom tabs) |
| Global state | Redux Toolkit — auth, theme, audio player |
| Server state | TanStack Query v5 |
| API client | `src/lib/makeApiRequest.ts` — fetch with JWT auto-refresh |
| Local storage | react-native-mmkv (encrypted on device) |
| Audio | expo-audio |
| Backend | Express 4 + TypeScript |
| ORM | Prisma 6, PostgreSQL via Supabase |
| Storage | Supabase Storage (audio files) |
| TTS | ElevenLabs `eleven_multilingual_v2` |
| Env validation | Zod (`backend/src/config/env.ts`) |

## Project Structure

```
yakine-audio-learner/
├── src/
│   ├── features/           # Feature slices + screens per domain
│   │   ├── auth/           # LoginScreen, SignupScreen, authSlice
│   │   ├── subjects/       # SubjectListScreen, ChapterListScreen, LessonListScreen
│   │   ├── audio/          # AudioPlayerScreen, audioPlayerSlice
│   │   ├── admin/          # Admin panel screens
│   │   └── ...
│   ├── lib/
│   │   ├── services/       # API call functions (BacApi.ts, AdminApi.ts)
│   │   ├── makeApiRequest.ts   # Central API client with token refresh
│   │   ├── store.ts            # Redux store
│   │   ├── models.ts           # Shared TypeScript interfaces
│   │   └── storage/mmkv.ts     # Typed MMKV wrapper + key constants
│   ├── contexts/AudioContext.tsx   # Audio playback state, progress save
│   ├── MainNavigation.tsx          # Stack navigator root + cold-start auth check
│   └── MainTabs.tsx                # Bottom tab navigator
├── backend/
│   ├── src/
│   │   ├── routes/             # One Express router per resource
│   │   ├── middleware/         # auth.ts, teacherPostPermission.ts
│   │   ├── lib/
│   │   │   ├── subjectAccess.ts    # BAC + Law subject visibility rules
│   │   │   ├── lessonAccess.ts     # Lesson audience gating
│   │   │   ├── teacherComposer.ts  # ElevenLabs TTS pipeline
│   │   │   ├── jwt.ts              # Sign/verify tokens
│   │   │   └── storageUpload.ts    # Supabase upload helper
│   │   ├── config/env.ts       # Zod-validated env (single source of truth)
│   │   └── app.ts              # Express setup + global error handler
│   └── prisma/schema.prisma    # Database schema
└── .claude/docs/               # Extended documentation (see below)
```

## Build & Run

```bash
# Backend
cd backend && npm install
npx prisma db push            # sync schema (dev)
npx prisma migrate dev        # create named migration (staging/prod)
npx tsx src/server.ts         # dev server — defaults to port 4000

# Frontend (repo root)
npm install --legacy-peer-deps
npx expo start --go --tunnel -c

# Seed data
cd backend && npx tsx prisma/seed.ts
```

## Environment

- `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ELEVENLABS_API_KEY` — see `backend/src/config/env.ts` for full schema
- `.env` (root) — `API_URL` (LAN IP:PORT of backend), `MMKV_ENCRYPTION_KEY`

## Key Concepts

- **Dual-program access control**: BAC content is scoped by `educationLevel/grade/stream`; Law content by `lawUniversity/lawAcademicLevel/lawMajor/semester`. All filtering logic lives in `backend/src/lib/subjectAccess.ts`.
- **Content tiers**: `FREE_GLOBAL` visible to everyone; `PREMIUM_SCOPED` requires subscription tier PREMIUM **and** a profile that matches the subject's university/level/stream.
- **Auth**: JWT access token (15 min) + DB-stored refresh token (7 d, rotated on use). Every request validates `currentSessionId` against the DB — a new login invalidates all other sessions. See `backend/src/middleware/auth.ts`.
- **Teacher Composer**: transcript upload → lesson create → ElevenLabs TTS job enqueue. Jobs run via `queueMicrotask` (in-process). See `backend/src/lib/teacherComposer.ts`.

## Additional Documentation

| File | When to check |
|---|---|
| `.claude/docs/architectural_patterns.md` | Before adding routes, middleware, state, or new features |
