# Yakine Audio Learner - Implemented Features Notes

## Context
These notes summarize features that are currently implemented in the repository (mobile app + backend).
The objective is to capture real, code-backed capabilities before drafting a Scrum product backlog.

## Product Scope Snapshot
- Mobile app: React Native + Expo with Redux Toolkit and React Query.
- Backend API: Express + Prisma + PostgreSQL + Supabase storage.
- Core domain: law-focused audio learning with multilingual lessons, role-based access, and admin governance.

## Implemented Feature Inventory

### 1) Authentication and session management
Implemented capabilities:
- User registration and login with JWT access + refresh tokens.
- Refresh token rotation and persisted token revocation support.
- One active session policy using currentSessionId (new login invalidates prior sessions).
- Banned-user enforcement at login and protected-route checks.
- Profile retrieval and profile update endpoint.

Key evidence:
- backend/src/routes/auth.routes.ts
- backend/src/middleware/auth.ts
- backend/src/lib/jwt.ts
- src/features/auth/LoginScreen.tsx
- src/features/auth/SignupScreen.tsx
- src/features/auth/authSlice.ts
- src/lib/makeApiRequest.ts

Notes:
- Signup is currently law-onboarding-centric in UI and API payload validation.
- Auth endpoints include rate limits.

### 2) Law onboarding and profile domain
Implemented capabilities:
- Region -> university mapping for Tunisian law faculties.
- Law major and academic level capture (L1/L2/L3, droit public/prive).
- Profile editing from mobile, including law fields.
- Admin-side editing of law profile fields for users.

Key evidence:
- backend/src/constants/lawOnboarding.ts
- backend/src/routes/auth.routes.ts
- src/features/profile/ProfileScreen.tsx
- backend/src/routes/admin-users.routes.ts

### 3) Subject/chapter/lesson catalog
Implemented capabilities:
- Hierarchical content model: Subject -> Chapter -> Lesson.
- Multilingual lesson fields (EN/FR/AR scripts and language-specific audio URLs).
- Lesson audience model (FREE vs PREMIUM).
- Status model for editorial flow (DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED).
- Subject/chapter/lesson CRUD paths with role constraints.

Key evidence:
- backend/prisma/schema.prisma
- backend/src/routes/subject.routes.ts
- backend/src/routes/chapter.routes.ts
- backend/src/routes/lesson.routes.ts
- src/features/subjects/SubjectListScreen.tsx
- src/features/subjects/ChapterListScreen.tsx
- src/features/subjects/LessonListScreen.tsx

### 4) Access control and entitlement rules
Implemented capabilities:
- Access filtering by role, subscription tier, program type, and law faculty attributes.
- Guest access limited to FREE_GLOBAL content.
- Premium gating for PREMIUM audience lessons.
- Teacher posting authorization by BAC scopes and law faculty/subject assignment.

Key evidence:
- backend/src/lib/subjectAccess.ts
- backend/src/lib/lessonAccess.ts
- backend/src/middleware/teacherPostPermission.ts
- backend/src/routes/subject.routes.ts
- backend/src/routes/lesson.routes.ts

### 5) Audio playback experience
Implemented capabilities:
- In-app audio player with play/pause, seek, skip +/-10s, speed cycling.
- Multi-language audio selection (EN/FR/AR where available).
- Script tab with in-text search highlighting.
- Resume from saved progress when opening a lesson.
- Mini-player shown above bottom tabs when a lesson is active.

Key evidence:
- src/features/audio/AudioPlayerScreen.tsx
- src/contexts/AudioContext.tsx
- src/components/ui/MiniPlayer.tsx
- src/MainTabs.tsx
- src/features/audioPlayerSlice.ts

Notes:
- Playback uses expo-audio runtime context.
- Track player setup/service is present for non-Expo-Go builds.

### 6) Progress tracking
Implemented capabilities:
- Per-user per-lesson upserted progress (position + completion flag).
- Periodic progress autosave during playback and on app background.
- Learning library screen showing continue-listening and completion states.

Key evidence:
- backend/src/routes/progress.routes.ts
- backend/prisma/schema.prisma
- src/contexts/AudioContext.tsx
- src/features/learning/MyCoursesScreen.tsx

### 7) Offline downloads
Implemented capabilities:
- Lesson download to local filesystem (native RNFS path).
- Download status metadata persisted in MMKV (downloading/downloaded/failed + progress).
- Download badges and progress bars in lesson list.
- Downloaded local path injected back into playback lesson model.

Key evidence:
- src/lib/audio/downloadService.ts
- src/lib/storage/downloadMetadata.ts
- src/lib/storage/enrichDownload.ts
- src/features/subjects/LessonListScreen.tsx
- __tests__/downloadMetadata.test.ts

Notes:
- Download feature is unavailable inside Expo Go (guarded in code).

### 8) Home and learner navigation
Implemented capabilities:
- Logged-in app shell with tabbed navigation: Home, Subjects, Learnings, Profile.
- Home feed showing active announcements, featured subjects, and recent lessons.
- Premium lock handling with user prompts for restricted lessons.
- Pull-to-refresh across key learner lists.

Key evidence:
- src/MainNavigation.tsx
- src/MainTabs.tsx
- src/features/home/HomeScreen.tsx
- src/features/subjects/SubjectListScreen.tsx

### 9) Admin panel and governance features
Implemented capabilities:
- Central admin panel linking to operational modules.
- User management: search, role changes, ban/unban, delete, premium toggles.
- Teacher BAC scope assignment and revocation.
- Teacher law-subject assignment and revocation.
- Content moderation queue with approve/reject actions.
- Content management listing with lesson edit/delete and audio upload.
- Dashboard stats and role distributions.
- Bulk JSON export/import tooling.
- Announcement CRUD and active toggle.
- Feature flag CRUD and toggle.

Key evidence:
- src/features/admin/AdminPanelScreen.tsx
- src/features/admin/UserManagementScreen.tsx
- src/features/admin/TeacherScopesScreen.tsx
- src/features/admin/TeacherLawSubjectsScreen.tsx
- src/features/admin/ModerationScreen.tsx
- src/features/admin/ContentManagementScreen.tsx
- src/features/admin/StatsScreen.tsx
- src/features/admin/BulkImportExportScreen.tsx
- src/features/admin/AnnouncementsScreen.tsx
- src/features/admin/FeatureFlagsScreen.tsx
- backend/src/routes/admin-users.routes.ts
- backend/src/routes/teacher-scopes.routes.ts
- backend/src/routes/admin-teacher-law.routes.ts
- backend/src/routes/moderation.routes.ts
- backend/src/routes/admin-content.routes.ts
- backend/src/routes/stats.routes.ts
- backend/src/routes/bulk.routes.ts
- backend/src/routes/announcements.routes.ts
- backend/src/routes/feature-flags.routes.ts

### 10) Teacher Audio Composer workflow
Implemented capabilities:
- Transcript import from TXT/PDF/DOCX.
- Composer lesson draft creation with transcript/script payloads.
- Manual audio attach flow (upload and in-app recording options).
- AI generation enqueue per selected languages + voice selection.
- Job polling, retry, and cancel from the app.
- Automatic lesson update on successful AI generation.

Key evidence:
- src/features/admin/TeacherAudioComposerScreen.tsx
- src/lib/services/BacApi.ts
- backend/src/routes/teacher-composer.routes.ts
- backend/src/lib/teacherComposer.ts
- backend/src/lib/transcriptParser.ts
- backend/src/lib/storageUpload.ts

Notes:
- AI job processing currently runs in-process (microtask-based) in the API runtime.

### 11) Storage integration
Implemented capabilities:
- Supabase bucket ensure/create behavior.
- Audio upload endpoint and public URL retrieval.
- Storage list/delete/signed-url endpoints.
- Teacher/admin role checks for storage management endpoints.

Key evidence:
- backend/src/routes/storage.routes.ts
- backend/src/lib/storageUpload.ts
- backend/src/lib/supabase.ts

### 12) Localization and theming
Implemented capabilities:
- EN/FR i18n bootstrap with persisted language selection.
- Theme slice with light/dark modes used across screens.
- Language toggles available in auth and profile flows.

Key evidence:
- src/lib/i18n/index.ts
- src/lib/i18n/en.ts
- src/lib/i18n/fr.ts
- src/features/themeSlice.ts
- src/features/profile/ProfileScreen.tsx
- src/features/auth/LoginScreen.tsx
- src/features/auth/SignupScreen.tsx

### 13) Reliability and security enablers
Implemented capabilities:
- Request validation with Zod across many backend routes.
- Standard middleware stack (helmet, cors, morgan, centralized error handling).
- Prisma-backed persistence and constraints.
- Token refresh fallback and forced logout on invalid refresh.
- Basic automated tests for app render and download metadata storage.

Key evidence:
- backend/src/app.ts
- backend/src/config/env.ts
- src/lib/makeApiRequest.ts
- __tests__/App.test.tsx
- __tests__/downloadMetadata.test.ts

## Partially Implemented or Transitional Areas
- Push notifications:
  - setup utility exists, but no observed runtime integration call path.
  - Evidence: src/lib/notifications/notifee.ts
- Feature flags consumption:
  - CRUD and admin UI are implemented, but no broad runtime gating in learner flows.
  - Evidence: backend/src/routes/feature-flags.routes.ts, src/features/admin/FeatureFlagsScreen.tsx
- Legacy blog/course UI stack:
  - CMS-style blog/course screens and APIs exist, but primary app navigation is focused on subject/chapter/lesson audio flow.
  - Evidence: src/features/blog/*, src/features/course/*, src/MainTabs.tsx

## Data and Seed Notes Relevant to Product Scope
- Seed script currently removes BAC catalog and seeds law-oriented subject trees.
- Includes free global law demo subjects and premium scoped faculty-specific law subjects.

Key evidence:
- backend/prisma/seed.ts
- docs/law-faculties-tracking.md

## Quality Snapshot
- Strongest areas:
  - Access control design
  - Admin governance workflows
  - Audio + progress + download learner loop
  - Teacher composer pipeline breadth
- Weaker areas:
  - Automated test coverage breadth
  - Notification integration completeness
  - Legacy CMS screens coherence with main navigation

## Conclusion
The implemented product is a law-focused audio learning platform with robust role-based governance, content access controls, and a meaningful teacher publishing toolchain (manual + AI-assisted). The current codebase supports a production-oriented feature set for authentication, learning consumption, admin control, and curated content delivery, with some areas still maturing around runtime feature-flag usage, notification wiring, and test depth.
