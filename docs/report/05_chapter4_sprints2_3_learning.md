# Chapter 4: Sprints 2 & 3 — Learning Experience & Access Governance

*(Approx. 25–28 pages)*

---

## 4.1 Introduction

This chapter covers the two most substantial sprints of the Yakine Audio Learner project — the sprints that constitute the heart of the user experience. Sprint 2 establishes the content catalog (subjects, chapters, lessons) and the profile-driven access control system. Sprint 3 delivers the actual audio learning experience: the advanced audio player, progress tracking, offline download capabilities, and the home feed. Together, these two sprints transform the application from a simple identity layer into a fully functional audio learning platform.

---

## 4.2 Sprint 2 Backlog (Catalog, Content Management, Access Governance)

Sprint 2 comprises 16 user stories centered on the content catalog and access governance.

| Theme | ID | User Story | Importance |
|---|---|---|---|
| Subject Catalog (Read) | 2.1 | As a guest/student/teacher, I want to **consult** subjects filtered by access rules so I only see content relevant to my role and academic scope. | Must |
| Chapter Catalog (Read) | 2.2 | As a user with subject access, I want to **consult** chapters for that subject so I can navigate the curriculum hierarchy. | Must |
| Lesson Catalog (Read) | 2.3 | As a user with chapter access, I want to **consult** published lessons so I can choose what to learn next. | Must |
| Lesson Detail (Read) | 2.4 | As a learner, I want to **consult** lesson detail (scripts, duration, language tracks, teacher) so I can start playback with full context. | Must |
| Subject Management (Create) | 2.5 | As a teacher/admin, I want to **create** subjects so new educational tracks can be added to the platform. | Must |
| Subject Management (Update) | 2.6 | As an admin, I want to **update** subject metadata (name, stream, icon, color) so curriculum labels remain correct. | Must |
| Subject Management (Delete) | 2.7 | As an admin, I want to **delete** obsolete subjects so outdated branches are removed with controlled governance. | Must |
| Chapter Management (Create) | 2.8 | As an admin, I want to **create** chapters under a subject so lessons can be organized pedagogically. | Must |
| Chapter Management (Update) | 2.9 | As an admin, I want to **update** chapter names and order so sequence and readability are maintained. | Must |
| Chapter Management (Delete) | 2.10 | As an admin, I want to **delete** chapters that are no longer valid so curriculum structure stays clean. | Must |
| Lesson Management (Create) | 2.11 | As a teacher/admin, I want to **create** lessons with audience and status so content can enter draft/review/publication flow. | Must |
| Lesson Management (Update) | 2.12 | As a teacher/admin, I want to **update** lesson fields (titles, scripts, audio URL, duration, status, audience) so quality can improve continuously. | Must |
| Lesson Management (Delete) | 2.13 | As an admin, I want to **delete** invalid lessons so policy-violating or wrong content is removed immediately. | Must |
| Access Governance (Read) | 2.14 | As a free student, I want premium lessons to **display** as locked so access restrictions are explicit and predictable. | Must |
| Access Governance (Authorize) | 2.15 | As an admin, I want teacher posting checks to **enforce** scope/faculty constraints so teachers publish only where authorized. | Must |
| Navigation Flow | 2.16 | As a learner, I want subject → chapter → lesson navigation to **drill down** quickly so discovery time is reduced. | Must |

**Table 4.1** — Sprint 2 Product Backlog

---

## 4.3 Sprint 3 Backlog (Audio Playback, Multilingual Learning, Progress, Offline Mode)

Sprint 3 encompasses 14 user stories focused on the learning experience.

| Theme | ID | User Story | Importance |
|---|---|---|---|
| Audio Playback (Read/Use) | 3.1 | As a learner, I want to **play** and **pause** lesson audio so I can control my listening flow. | Must |
| Audio Playback (Update State) | 3.2 | As a learner, I want to **seek** backward/forward and **change** speed so I can review difficult passages efficiently. | Must |
| Multilingual Learning | 3.3 | As a learner, I want to **switch** EN/FR/AR audio tracks when available so I can study in my preferred language. | Must |
| Script Experience (Read) | 3.4 | As a learner, I want to **search** lesson scripts with highlight so I can find key terms quickly. | Must |
| Progress Tracking (Create/Update) | 3.5 | As the system, I want to **create or update** progress periodically while playing so resume position and completion status stay accurate. | Must |
| Progress Tracking (Read) | 3.6 | As a learner, I want to **consult** my progress library so I can resume unfinished lessons from one place. | Must |
| Download Management (Create) | 3.7 | As a learner, I want to **start** a lesson download so I can prepare offline study sessions. | Must |
| Download Management (Read) | 3.8 | As a learner, I want to **consult** download status and progress so I can track completion and retry failures. | Must |
| Download Management (Update) | 3.9 | As the system, I want to **update** local download metadata (status, progress, path) so offline state remains consistent after restart. | Must |
| Offline Playback (Read) | 3.10 | As a learner, I want downloaded lessons to **play** from local file paths so I can study without network connectivity. | Must |
| Home Feed (Read) | 3.11 | As a learner, I want to **consult** active announcements and recent lessons on Home so I can react to updates and continue learning quickly. | Must |
| Home Feed (Access Guard) | 3.12 | As a free student, I want Home lesson cards to **enforce** premium lock behavior so unavailable content is clear before opening player. | Must |
| Mini Player | 3.13 | As a learner, I want a mini player to **remain visible** across tabs so I can continue playback while browsing. | Should |
| Reliability | 3.14 | As a mobile user, I want query state to **recover** on app focus/network changes so sync and refresh feel reliable. | Must |

**Table 4.2** — Sprint 3 Product Backlog

---

## 4.4 Software Design

### 4.4.1 Use Case Diagram: Catalog Browsing & Content Management

*(Insert here: Figure 4.1 — Use Case Diagram: Catalog Browsing & Content Management)*

This diagram illustrates the interactions of each actor with the content catalog system:

**Student use cases:** Browse filtered subjects → navigate chapters → view lessons (with premium lock indicators) → open lesson detail → access audio player.

**Teacher use cases:** All student use cases (via inheritance), plus: create subjects within authorized scope, create and update own lessons (DRAFT → PENDING_REVIEW submission).

**Admin use cases:** All teacher use cases (via inheritance), plus: full CRUD on subjects, chapters, and lessons; update lesson status (approve/reject via moderation); delete non-compliant content.

### 4.4.2 Access Control Logic: Premium Locks and Teacher Scopes

The access control system is one of the most sophisticated mechanisms in the application, implemented in `backend/src/lib/subjectAccess.ts` (440 lines) and `backend/src/lib/lessonAccess.ts`.

**Core principle:** Filtering is executed at the database query level itself, through the dynamic construction of Prisma `WHERE` clauses based on the user's complete profile. This guarantees that unauthorized data is never returned by the API — not filtered client-side, but never fetched in the first place.

**Subject filtering rules (`buildSubjectWhereForUser`):**

| User Profile | Access |
|---|---|
| **Guest (null)** | Only FREE_GLOBAL subjects (BAC and LAW programs) |
| **Admin** | All subjects without restriction |
| **Teacher** | All LAW subjects (constrained to own university for publishing) |
| **LAW Student, FREE tier** | LAW FREE_GLOBAL + L1 common core at own university (semesters 1-2, no major) |
| **LAW Student, PREMIUM tier** | LAW FREE_GLOBAL + PREMIUM_SCOPED at own university, own level, own semesters, own major (L2/L3) |
| **BAC Student, FREE tier** | BAC FREE_GLOBAL filtered by educationLevel, grade, stream |
| **BAC Student, PREMIUM tier** | BAC FREE_GLOBAL + PREMIUM_SCOPED filtered by profile |

**L1 special case:** At the L1 level (common core), subjects use `lawMajor: null` because there is no specialization yet. A FREE-tier L1 student at the correct university can access these subjects. From L2 onward, the major (private/public law) becomes a filtering criterion, and PREMIUM subscription is required for scoped content.

**Semester mapping:** Academic levels map to semesters: L1 → semesters 1, 2; L2 → semesters 3, 4; L3 → semesters 5, 6. This mapping is used to filter subjects by their `semester` field.

**Teacher publishing authorization (`teacherPostPermission`):** For LAW subjects, the teacher must belong to the same university as the subject. For BAC subjects, the teacher must hold a matching TeacherScope (educationLevel + grade + stream).

### 4.4.3 Sequence Diagram: Audio Playback & Progress Tracking

*(Insert here: Figure 4.3 — Sequence Diagram: Audio Playback & Progress Tracking)*

The sequence diagram traces the flow from lesson selection through automatic progress saving:

```
User             AudioContext           expo-audio         Backend API        Database
  |                   |                     |                   |                |
  |-- loadLesson() -->|                     |                   |                |
  |                   |  [Save progress for current lesson if active]             |
  |                   |-- POST /api/progress ----------------->|-- upsert ----->|
  |                   |                     |                   |                |
  |                   |  [dispatch(setCurrentLesson)]           |                |
  |                   |  [Resolve source: downloadedPath ?? audioUrl]             |
  |                   |  [setAudioModeAsync({playsInSilentMode: true})]           |
  |                   |                     |                   |                |
  |                   |-- useAudioPlayer(source) -->            |                |
  |                   |                     |  [Loading...]     |                |
  |                   |<-- status.isLoaded -|                   |                |
  |                   |                     |                   |                |
  |                   |  [Apply playbackRate]                   |                |
  |                   |  [Seek to resumePosition if provided]   |                |
  |                   |  [player.play() — auto-play on load]    |                |
  |                   |                     |                   |                |
  |                   |  [Position updates every 500ms]         |                |
  |                   |  [dispatch(syncPosition) to Redux]      |                |
  |                   |                     |                   |                |
  |                   |  [Every 15 seconds:]                    |                |
  |                   |-- POST /api/progress ----------------->|-- upsert ----->|
  |                   |   {lessonId, position, completed}       |                |
  |                   |                     |                   |                |
  |  [App backgrounds:]                     |                   |                |
  |                   |  [AppState → 'background']              |                |
  |                   |-- POST /api/progress (immediate save) ->|                |
```

**Key implementation details:**

1. **AudioContext** (`src/contexts/AudioContext.tsx`) is a React provider wrapping all audio logic, exposing: `loadLesson`, `togglePlay`, `seekTo`, `seekBy`, `cycleSpeed`, `stop`.

2. **Progress saving** occurs through three triggers: every **15 seconds** during playback (interval), when **switching lessons** (saves the previous lesson's progress first), and when the app **moves to background** (AppState listener).

3. **Completion criterion:** A lesson is marked as completed when the user has listened to at least 90% of its duration (`position / duration >= 0.9`).

4. **Speed options:** 0.75x, 1.0x, 1.25x, 1.5x, 1.75x, 2.0x — cycled sequentially.

5. **Source resolution:** If a lesson has been downloaded, the local path (`downloadedPath`) takes priority over the remote URL (`audioUrl`), enabling seamless offline playback.

### 4.4.4 State Machine Diagram: Download Management

*(Insert here: Figure 4.4 — State Machine Diagram: Download Management)*

The download lifecycle follows four states:

```
                     ┌──────────────┐
      startDownload  │              │
     ───────────────>│ DOWNLOADING  │
                     │  progress: N%│
                     └──────┬───────┘
                            │
               ┌────────────┼────────────┐
               │ (success)  │            │ (failure)
               v            │            v
     ┌─────────────┐        │   ┌──────────────┐
     │ DOWNLOADED  │        │   │   FAILED     │
     │ localPath:  │        │   │ error: msg   │
     │  /path/to/  │        │   └──────┬───────┘
     │  audio.mp3  │        │          │
     └─────────────┘        │    retry │
                            │   ──────>│
                            └──────────┘

     From any state: deleteDownload → (removes metadata and local file)
```

**Implementation:** `downloadService.ts` uses react-native-fs for filesystem downloads with progress callbacks. `downloadMetadata.ts` persists state in MMKV (status, progress, localPath, error), surviving app restarts. `enrichDownload.ts` injects `downloadedPath` into the Lesson model when a successful download exists, enabling AudioContext to automatically play from the local file.

> **Note:** Downloads are unavailable in Expo Go mode because react-native-fs requires a native build. A runtime guard in the code disables the feature when Expo Go is detected via `expo-constants`.

---

## 4.5 Implementation (Subjects, Chapters, Lessons, Audio Player, Progress Tracking, Offline Features)

### Subject Catalog

*(Insert here: Figure 4.5a — Screenshot: Subject List Screen)*

The subject list screen displays subjects accessible to the current user. Each card shows the subject's custom icon and color, its bilingual name (FR or EN based on the selected language), and the number of chapters. All filtering happens server-side: the `GET /api/subjects` route uses `optionalAuth` middleware to identify the user profile, then `buildSubjectWhereForUser()` constructs the appropriate Prisma WHERE clause. The client receives only authorized subjects — it never needs to understand the access rules.

### Chapter and Lesson Navigation

*(Insert here: Figure 4.5b — Screenshots: Chapters and Lessons)*

**ChapterListScreen** displays chapters for a subject, sorted by `sortOrder`, showing bilingual names and lesson counts.

**LessonListScreen** displays lessons within a chapter showing: bilingual title, formatted duration (mm:ss), teacher name, **premium lock indicator** (lock icon for PREMIUM lessons when the user is FREE-tier), **download badge** (downloading/downloaded/failed with progress bar), and **listening progress indicator** for partially completed lessons.

Tapping an unlocked lesson navigates to the AudioPlayerScreen. Tapping a locked lesson shows a "Premium Content" alert explaining the content requires a premium subscription.

### Audio Player

*(Insert here: Figure 4.6a — Screenshot: Audio Player Screen)*

The AudioPlayerScreen is the central learning interface, presenting:

**Playback controls:** Central play/pause button, skip -10s and +10s buttons, interactive progress slider with seek support, elapsed time and total duration display, speed control button showing the current rate (e.g., "1.5x") that cycles on tap.

**Language selection:** Buttons for available audio tracks (EN, FR, AR). Selecting a track reloads audio from the corresponding language-specific URL (`audioUrlEn`, `audioUrlFr`, `audioUrlAr`).

**Script tab:** Full text script displayed in the selected language, with a **search bar** that highlights all matching occurrences within the text.

### Mini Player

*(Insert here: Figure 4.6b — Screenshot: Mini Player)*

The MiniPlayer component (`src/components/ui/MiniPlayer.tsx`) renders above the tab bar whenever a lesson is actively playing. It shows the lesson title, a compact play/pause button, and a linear progress bar. Tapping it navigates back to the full AudioPlayerScreen. This component is rendered in `MainTabs.tsx`, ensuring persistence across the Home, Subjects, Learnings, and Profile tabs.

### Progress Library

The MyCoursesScreen displays the user's progress library: lessons in progress (with "continue listening" indicators) and completed lessons. Tapping resumes playback from the saved position.

### Home Feed

*(Insert here: Figure 4.7 — Screenshot: Home Screen)*

The HomeScreen serves as the first view after login, featuring: a welcome title with search bar (tapping navigates to SubjectList), active **announcement banners** colored by type (info/warning/success/error) with dismiss buttons, **category chips** for quick access to the first four subjects, a horizontally scrollable **subject card list** ("Top Courses"), and a horizontally scrollable **recent lessons list** with headphone icons, duration, teacher names, and premium lock indicators. Pull-to-refresh reloads all data.

---

## 4.6 Conclusion & Retrospective

### Achievements

**Sprint 2:** ✅ Complete hierarchical catalog (subjects → chapters → lessons). ✅ Full content CRUD with role constraints. ✅ Sophisticated profile-driven access control system. ✅ Editorial workflow (DRAFT → PENDING_REVIEW → PUBLISHED/REJECTED). ✅ Premium lock indicators. ✅ Teacher publishing constraints (BAC scopes and university-based LAW restrictions). ✅ Fluid drill-down navigation.

**Sprint 3:** ✅ Complete audio player (play/pause, seek ±10s, speed 0.75x–2x). ✅ Multilingual audio track switching (EN/FR/AR). ✅ Text script view with search and highlighting. ✅ Automatic progress saving (15s intervals, lesson switch, app backgrounding). ✅ Progress library with auto-resume. ✅ Offline downloads with persisted metadata. ✅ Transparent local playback for downloaded lessons. ✅ Home feed with announcements, subjects, and recent lessons. ✅ Persistent mini player across tabs. ✅ Network detection with automatic refresh recovery.

### What Went Well

- The Prisma-level WHERE clause approach for access control is both performant and inherently secure.
- The AudioContext centralizes all audio logic, making it maintainable and testable.
- The MMKV + react-native-fs download system is robust and survives app restarts.

### Areas for Improvement

- Downloads are unavailable in Expo Go — native builds are required.
- Script search does not yet synchronize with audio position.
- Automated test coverage for audio and download flows should be deepened.

Sprints 4 and 5, presented in the following chapter, will complete the platform with administrative tools and AI-powered content creation.
