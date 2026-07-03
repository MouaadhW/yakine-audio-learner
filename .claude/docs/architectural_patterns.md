
# Architectural Patterns

## 1. Auth Middleware Chain

Routes compose three middleware in sequence: `optionalAuth | requireAuth` → `requireRole(...)` → domain permission middleware.

- `requireAuth` (`backend/src/middleware/auth.ts:17`) — validates JWT, checks `currentSessionId` + `banned` against DB, populates `req.auth`
- `optionalAuth` (`backend/src/middleware/auth.ts:58`) — same flow but does not reject unauthenticated callers; `req.auth` stays `undefined`
- `requireRole(...roles)` (`backend/src/middleware/auth.ts:85`) — checks `req.auth.role` against allowed list; always placed after `requireAuth`
- `requireTeacherPostPermission` (`backend/src/middleware/teacherPostPermission.ts`) — validates BAC scope or Law university assignment before a teacher can create content; always last in the chain

Pattern in use: `lesson.routes.ts:199`, `teacher-composer.routes.ts:125`, `teacher-scopes.routes.ts`.

## 2. Pagination Envelope

All list endpoints return the same shape:

```typescript
{
  contents: T[],
  currentPage: number,
  totalPage: number,
  pageSize: number,
  totalElements: number,
}
```

Built via `prisma.X.findMany({ take: limit, skip: (page-1)*limit })` paired with `prisma.X.count()` in `Promise.all`. Pattern in use: `subject.routes.ts:108`, `lesson.routes.ts:100`, `admin-users.routes.ts`.

Default page size is 50 for subjects, 15 for lessons.

## 3. Zod Validation at Route Boundaries

Every write endpoint (POST/PUT) defines a Zod schema at the top of the route file and calls `schema.parse(req.body)` as the first line inside the handler. Validation errors are passed to `next(error)` and caught by the global handler in `app.ts:62`, which returns HTTP 400 with `{ message, errors }`.

Never add manual field checks — use Zod refinements (`.superRefine`, `.refine`) for cross-field validation. Pattern in use across all route files.

## 4. Subject Access Control — Builder + Checker Split

Two separate functions handle subject visibility:

- **`buildSubjectWhereForUser`** (`backend/src/lib/subjectAccess.ts:39`) — returns a `Prisma.SubjectWhereInput` for use in `findMany` list queries
- **`canRequestAccessSubject`** (`backend/src/lib/subjectAccess.ts:257`) — checks a single subject against user profile for individual access (GET /:id, lesson detail)

Never inline subject-gating logic in a route — call these functions. The list route uses the builder; the detail route uses the checker.

## 5. Lesson Audience Gating

Three functions in `backend/src/lib/lessonAccess.ts`:

- `lessonListAudienceWhereInput(auth)` — returns Prisma where clause to pre-filter by audience at query time
- `loadLessonListViewer(prisma, auth)` — fetches the subscription tier snapshot used for `locked` flags
- `isLessonLockedForViewer(viewer, audience)` — pure function used in the response mapping to set `locked: boolean`

`locked: true` means the lesson is included in list responses but audio URLs must be stripped (not sent to client). See `lesson.routes.ts:123-146`.

## 6. Redux vs TanStack Query Split

| What | Where |
|---|---|
| Auth tokens, user profile, login state | Redux (`src/features/auth/authSlice.ts`) — persisted in MMKV |
| Theme (dark/light) | Redux (`src/features/themeSlice.ts`) — persisted in MMKV |
| Audio player (currentLesson, position, speed) | Redux (`src/features/audioPlayerSlice.ts`) — in-memory |
| All server data (subjects, lessons, progress, etc.) | TanStack Query via service functions in `src/lib/services/` |

Never put server-fetched data in Redux. Never put auth state in TanStack Query.

## 7. Central API Client

All HTTP calls from the frontend go through `makeApiRequest` (`src/lib/makeApiRequest.ts`). It handles:
- Attaching `Authorization: Bearer <token>` from MMKV
- 10-second timeout per phase (request / refresh / retry)
- Token refresh on 401 using a shared in-flight promise (prevents concurrent refresh races)
- Force-logout on "Session expired" or failed refresh

Never call `fetch` directly from screens or service files — always use `makeApiRequest`.

## 8. Environment Config

All env vars are parsed and validated once at startup via Zod in `backend/src/config/env.ts:6-31`. The exported `env` object is the single source of truth for config values throughout the backend.

Never read `process.env.X` directly in route or lib files — import from `env`.

## 9. TTS Job Lifecycle

`AudioGenerationJob` status transitions: `QUEUED → PROCESSING → COMPLETED | FAILED | CANCELED`

Jobs are created synchronously in the API response, then processed via `queueMicrotask` in `backend/src/lib/teacherComposer.ts:273`. If `PROCESSING` is seen on startup (server crashed mid-job), jobs must be manually retried via `POST /api/teacher-composer/ai-jobs/:id/retry`. There is no automatic recovery.

## 10. CMS Compatibility Shim

List responses for subjects and lessons include extra fields (`name`, `slug`, `courseCount`, `title`, `excerpt`, `publishedAt`, `meta`) that map domain objects to a CMS-compatible shape consumed by `HomeScreen`. These fields are computed inline in the route mapper and are not stored in the database. When adding new list endpoints, include this shim only if the screen consuming it uses CMS components.
