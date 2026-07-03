# Chapter 5: Sprints 4 & 5 — Governance and Content Generation

*(Approx. 18–20 pages)*

---

## 5.1 Introduction

This chapter presents the final two development sprints of the Yakine Audio Learner project, dedicated to the administrative governance layer and the content creation toolchain. Sprint 4 implements the full suite of administrative capabilities required for day-to-day platform operation: user management, content moderation, teacher permission administration, announcements, feature flags, and analytics. Sprint 5 delivers the Teacher Audio Composer — a multi-step tool that enables educators to create professional audio content from text transcripts — along with the AI-powered Text-to-Speech generation pipeline, storage operations, and bulk data import/export functionality.

---

## 5.2 Sprints Backlog (Admin Operations, Feature Flags, Teacher Composer, AI TTS Tasks, Bulk Data)

### Sprint 4 Backlog — Administrative Operations

Sprint 4 covers 26 user stories organized across user administration, teacher permissions, content moderation, announcements, feature flags, and analytics.

| Theme | ID | User Story | Importance |
|---|---|---|---|
| User Administration (Read) | 4.1 | As an admin, I want to **consult** paginated users with search and role filters so I can audit accounts at scale. | Must |
| User Administration (Update Role) | 4.2 | As an admin, I want to **update** user roles (student/teacher/admin) so permissions match operational decisions. | Must |
| User Administration (Update Ban) | 4.3 | As an admin, I want to **ban/unban** users so abusive accounts are controlled immediately. | Must |
| User Administration (Update Subscription) | 4.4 | As an admin, I want to **update** student subscription tier so premium access can be granted or revoked operationally. | Must |
| User Administration (Update Law Profile) | 4.5 | As an admin, I want to **update** teacher law region/university/major/level so authorization and faculty matching remain valid. | Must |
| User Administration (Delete) | 4.6 | As an admin, I want to **delete** users when necessary so legal/compliance or cleanup actions can be performed. | Must |
| Teacher Scope (Create) | 4.7 | As an admin, I want to **create** BAC teacher scopes so teaching permissions are restricted by level, stream, and year. | Must |
| Teacher Scope (Read) | 4.8 | As an admin, I want to **consult** current BAC scopes per teacher so permission audits are transparent. | Must |
| Teacher Scope (Delete) | 4.9 | As an admin, I want to **delete** BAC scopes so incorrect permissions can be revoked quickly. | Must |
| Teacher Law Assignment (Create) | 4.10 | As an admin, I want to **assign** law subjects to teachers so faculty module ownership is explicit. | Must |
| Teacher Law Assignment (Read) | 4.11 | As an admin, I want to **consult** teacher law assignments so I can verify alignment between teacher and subject. | Must |
| Teacher Law Assignment (Delete) | 4.12 | As an admin, I want to **remove** teacher law assignments so incorrect mappings are corrected. | Must |
| Moderation (Read Queue) | 4.13 | As an admin reviewer, I want to **consult** the moderation queue by status so pending teacher submissions are visible. | Must |
| Moderation (Update Decision) | 4.14 | As an admin reviewer, I want to **approve or reject** pending lessons so publication quality is enforced. | Must |
| Content Operations (Read) | 4.15 | As an admin, I want to **consult** all lessons in one content view so I can perform cross-catalog quality checks. | Must |
| Content Operations (Update) | 4.16 | As an admin, I want to **update** lesson content from the management screen so urgent corrections can be applied quickly. | Must |
| Content Operations (Delete) | 4.17 | As an admin, I want to **delete** lesson records from content management so invalid entries are removed. | Must |
| Announcements (Create) | 4.18 | As an admin, I want to **create** announcements with type and schedule so users receive targeted platform communication. | Must |
| Announcements (Read) | 4.19 | As a member, I want to **consult** only active, in-window announcements so I receive relevant messages. | Must |
| Announcements (Update) | 4.20 | As an admin, I want to **update** announcement text, type, and active state so communication can evolve over time. | Must |
| Announcements (Delete) | 4.21 | As an admin, I want to **delete** expired or wrong announcements so notification space remains clean. | Must |
| Feature Flags (Create) | 4.22 | As an admin, I want to **create** feature flags so new capabilities can be staged safely before broad rollout. | Must |
| Feature Flags (Read) | 4.23 | As an admin, I want to **consult** all feature flags so rollout state is transparent to operations. | Must |
| Feature Flags (Update) | 4.24 | As an admin, I want to **update** flag status and description so release toggles can be controlled at runtime. | Must |
| Feature Flags (Delete) | 4.25 | As an admin, I want to **delete** deprecated feature flags so stale toggles are removed. | Should |
| Analytics (Read) | 4.26 | As an admin, I want to **consult** dashboard statistics so I can monitor users, content volume, moderation load, and activity trends. | Must |

**Table 5.1** — Sprint 4 Product Backlog

### Sprint 5 Backlog — Teacher Composer, AI Generation, and Bulk Operations

Sprint 5 covers 18 user stories focused on content creation, AI audio generation, and platform operations.

| Theme | ID | User Story | Importance |
|---|---|---|---|
| Teacher Composer (Read Transcript) | 5.1 | As a teacher, I want to **upload** transcript documents (TXT/PDF/DOCX) so lesson text can be ingested quickly. | Must |
| Teacher Composer (Create Draft) | 5.2 | As a teacher, I want to **create** a lesson draft from multilingual transcripts/scripts so I can prepare publication-ready content. | Must |
| Teacher Composer (Update with Manual Audio) | 5.3 | As a teacher, I want to **attach** uploaded manual audio to a draft so I can publish lessons without AI generation. | Must |
| Teacher Composer (Update with Recording) | 5.4 | As a teacher, I want to **record** audio in-app and attach it so I can publish without external recording tools. | Should |
| Teacher Composer (Update Metadata) | 5.5 | As a teacher, I want to **set** audience and default audio language before publication so entitlement and playback defaults are correct. | Must |
| AI Generation Jobs (Create) | 5.6 | As a teacher, I want to **create** AI TTS jobs by language and voice so multilingual narration can be automated. | Must |
| AI Generation Jobs (Read List) | 5.7 | As a teacher, I want to **consult** AI job history for a lesson so I can track generation lifecycle. | Must |
| AI Generation Jobs (Read Detail) | 5.8 | As a teacher, I want to **consult** AI job detail and error messages so I can troubleshoot failures with precision. | Must |
| AI Generation Jobs (Update Retry) | 5.9 | As a teacher, I want to **retry** failed AI jobs so temporary provider or network failures can be recovered. | Must |
| AI Generation Jobs (Update Cancel) | 5.10 | As a teacher, I want to **cancel** queued or running AI jobs so incorrect requests can be stopped. | Must |
| Storage Operations (Read Config) | 5.11 | As a teacher/admin, I want to **consult** storage configuration so upload destination and provider settings are clear. | Must |
| Storage Operations (Create Upload) | 5.12 | As a teacher/admin, I want to **upload** audio files to storage so lesson media can be hosted centrally. | Must |
| Storage Operations (Read List) | 5.13 | As a teacher/admin, I want to **consult** storage file lists so I can reuse, verify, and audit media assets. | Should |
| Storage Operations (Read Signed URL) | 5.14 | As a teacher/admin, I want to **generate** signed URLs so protected access scenarios can be supported securely. | Should |
| Storage Operations (Delete File) | 5.15 | As a teacher/admin, I want to **delete** obsolete storage files so media repositories stay clean and relevant. | Should |
| Bulk Data (Read Export) | 5.16 | As an admin, I want to **export** full catalog data (subjects, chapters, lessons) so backup and migration are possible. | Must |
| Bulk Data (Create Import) | 5.17 | As an admin, I want to **import** validated catalog JSON so large data onboarding can be performed efficiently. | Must |
| Seed Operations | 5.18 | As an operations admin, I want to **run** law curriculum seeding for supported faculties so scoped law catalog remains synchronized. | Should |

**Table 5.2** — Sprint 5 Product Backlog

---

## 5.3 Software Design

### 5.3.1 Admin & Moderation Use Case Diagram

*(Insert here: Figure 5.1 — Admin & Moderation Use Case Diagram)*

This diagram illustrates the administrator's interactions with the governance system, organized into five use case packages:

**User Management package:** Consult users (paginated, with search and role filters) → Update role → Ban/unban → Update subscription → Update law profile → Delete user.

**Teacher Permissions package:** Create/consult/delete Teacher Scopes (BAC) → Assign/consult/remove Teacher Law Subjects.

**Content Moderation package:** Consult moderation queue (filtered by status: PENDING_REVIEW, PUBLISHED, REJECTED) → Approve content (→ PUBLISHED) → Reject content (→ REJECTED).

**Communication package:** CRUD Announcements (with type, scheduling, active toggle) → CRUD Feature Flags (with key, description, enable/disable).

**Analytics package:** Consult dashboard statistics (user counts by role, content volumes, lessons by status, recent activity).

### 5.3.2 AI Audio Generation Pipeline Sequence Diagram

*(Insert here: Figure 5.2 — AI Audio Generation Pipeline Sequence Diagram)*

The sequence diagram traces the complete AI audio generation flow, from the teacher's request through automatic lesson update:

```
Teacher          Mobile App          Backend API           Database         ElevenLabs      Supabase
   |                |                     |                    |                |               |
   | [Select languages and voices]        |                    |                |               |
   |-- "Generate" ->|                     |                    |                |               |
   |                |-- POST /teacher-    |                    |                |               |
   |                |   composer/:id/     |                    |                |               |
   |                |   generate          |                    |                |               |
   |                |   {languages,       |                    |                |               |
   |                |    voiceSelection}  |                    |                |               |
   |                |                     |                    |                |               |
   |                |                     | [Validate teacher authorization]    |               |
   |                |                     | [Verify lesson exists]              |               |
   |                |                     |                    |                |               |
   |                |                     |-- CREATE job ------>|               |               |
   |                |                     |   status: QUEUED    |               |               |
   |                |                     |   requestedLanguages: [EN,FR]       |               |
   |                |                     |                    |                |               |
   |                |                     | [queueMicrotask → processJob()]    |               |
   |                |                     |                    |                |               |
   |                |<-- {job: QUEUED}    |                    |                |               |
   |<- "Job queued" |                     |                    |                |               |
   |                |                     |                    |                |               |
   |  === ASYNCHRONOUS PROCESSING ========================================     |               |
   |                |                     |                    |                |               |
   |                |                     |-- UPDATE job →     |                |               |
   |                |                     |   PROCESSING       |                |               |
   |                |                     |                    |                |               |
   |                |                     | [For each requested language:]      |               |
   |                |                     | [1. Extract transcript/script]      |               |
   |                |                     | [2. Validate length < 12000 chars]  |               |
   |                |                     | [3. Resolve voice ID]               |               |
   |                |                     |                    |                |               |
   |                |                     |-- POST /v1/text-to-speech/{voice} ->|               |
   |                |                     |   {text, model_id, output_format}   |               |
   |                |                     |                    |                |               |
   |                |                     |<-- audio/mpeg buffer --------------|               |
   |                |                     |                    |                |               |
   |                |                     |-- upload buffer ---------------------------------->|
   |                |                     |   folder: lessons/generated/{id}    |               |
   |                |                     |<-- publicUrl ----------------------------------------|
   |                |                     |                    |                |               |
   |                |                     | [Map URL → audioUrlEn/Fr/Ar]       |               |
   |                |                     | [End language loop]                 |               |
   |                |                     |                    |                |               |
   |                |                     |-- UPDATE lesson -->|                |               |
   |                |                     |   audioUrl, audioUrlEn/Fr/Ar       |               |
   |                |                     |   audioSourceType: AI_TTS           |               |
   |                |                     |   status: PUBLISHED (if autoPublish)|               |
   |                |                     |                    |                |               |
   |                |                     |-- UPDATE job →     |                |               |
   |                |                     |   COMPLETED        |                |               |
   |                |                     |                    |                |               |
   | [Teacher polls for status:]          |                    |                |               |
   |-- "Check" ---->|-- GET /:id/jobs --->|                    |                |               |
   |                |<-- [{COMPLETED}] ---|                    |                |               |
   |<-"Audio ready!"|                     |                    |                |               |
```

**Pipeline highlights:**

1. **Asynchronous processing.** The job is created as QUEUED and returned to the client immediately. Processing runs in the same Node.js process via `queueMicrotask()`, avoiding the need for an external queue worker at this scale.

2. **Multi-language generation.** A single job can produce audio for multiple languages. Each language is processed sequentially within the job.

3. **Voice resolution.** Each language can specify a voice. If unspecified, defaults are used from environment variables (`ELEVENLABS_VOICE_EN/FR/AR`), falling back to a hardcoded voice ID.

4. **Automatic upload.** Generated audio buffers are uploaded to Supabase Storage under `lessons/generated/{lessonId}`, and the public URL is retrieved.

5. **Automatic lesson update.** The lesson record is updated with the new audio URLs, source type (`AI_TTS`), and generation timestamp. If `composerAutoPublish` is enabled, the lesson status is set to PUBLISHED automatically.

6. **Error handling.** On failure (API errors, timeouts, character limit exceeded), the job transitions to FAILED with a detailed error message. Teachers can retry failed jobs (reset to QUEUED) or cancel pending ones (set to CANCELED).

---

## 5.4 Implementation (Admin Dashboard, Moderation, Teacher Composer, AI Tasks)

### Admin Panel

*(Insert here: Figure 5.3a — Screenshot: Admin Panel)*

The AdminPanelScreen serves as the central hub for all governance modules, presenting a grid of navigable cards: User Management, Teacher Permissions, Law Subject Access, Content Moderation, System Stats, Import/Export, Announcements, Feature Flags, Content Management, and Teacher Audio Composer.

### User Management

*(Insert here: Figure 5.3b — Screenshot: User Management)*

The UserManagementScreen (23,492 bytes — the most complex admin module) provides: **search** by name or email with debounce, **role filtering** (Student/Teacher/Admin/All), **pagination** for large user bases, and for each user: inline role modification, ban/unban toggle, subscription tier toggle (FREE ↔ PREMIUM), law profile editing, and account deletion with confirmation.

### Content Moderation

The ModerationScreen displays the content review queue with **status filtering** (PENDING_REVIEW by default, PUBLISHED, REJECTED). Each pending lesson shows its title, submitting teacher, and submission date. Actions include **Approve** (→ PUBLISHED) and **Reject** (→ REJECTED).

The moderation workflow: teacher creates a lesson (DRAFT) → teacher submits for review (PENDING_REVIEW) → admin approves (PUBLISHED, visible to learners) or rejects (REJECTED).

### Teacher Audio Composer

*(Insert here: Figure 5.3c — Screenshot: Teacher Audio Composer)*

The TeacherAudioComposerScreen (34,073 bytes — the largest single component in the entire application) implements a multi-step content creation workflow:

**Step 1 — Context Selection.** The teacher selects the target subject and chapter. Only subjects assigned to the teacher are shown.

**Step 2 — Transcript Import.** Upload a text file (TXT, PDF, or DOCX) via `expo-document-picker`. The backend parses the document using `transcriptParser.ts`: PDF with `pdf-parse`, DOCX with `mammoth`, TXT as direct read. Extracted text is returned for editing.

**Step 3 — Multilingual Script Editing.** The teacher enters or edits scripts and transcripts for each language (EN, FR, AR). Scripts are the learner-facing text; transcripts serve as the TTS source.

**Step 4 — Audio Configuration.** Option A: attach manually uploaded or recorded audio. Option B: configure AI generation — select target languages, optionally select voices, and launch the generation job. Set audience (FREE/PREMIUM) and default audio language.

**Step 5 — Monitoring and Publication.** Poll generation job status, view errors and retry failed jobs, and publish the lesson.

### Analytics Dashboard

The StatsScreen displays: global counters (total users, subjects, chapters, lessons), distribution by role (students, teachers, admins), lessons by status (DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED), and recent activity metrics.

### Bulk Import/Export

The BulkImportExportScreen offers: **Export** — full catalog extraction (subjects, chapters, lessons) to JSON, copyable to clipboard. **Import** — validated JSON upload to create or update catalog data in bulk.

### Announcements and Feature Flags

**AnnouncementsScreen:** Full CRUD with title, body, type (info/warning/success/error), active toggle, and optional start/end date scheduling.

**FeatureFlagsScreen:** Full CRUD with unique key, description, and enabled toggle for progressive feature rollout.

---

## 5.5 Conclusion & Retrospective

### Achievements

**Sprint 4:** ✅ Full user management (CRUD, roles, bans, subscriptions, law profiles). ✅ Teacher Scope and Law Assignment management. ✅ Content moderation with complete review workflow. ✅ Administrative content management view. ✅ Announcement CRUD with scheduling. ✅ Feature flag CRUD with toggle. ✅ Dashboard analytics.

**Sprint 5:** ✅ Multi-step Teacher Audio Composer. ✅ Transcript import (TXT/PDF/DOCX). ✅ Lesson draft creation from transcripts. ✅ Manual audio attachment (upload). ✅ AI audio generation pipeline via ElevenLabs (multilingual TTS). ✅ Full job lifecycle management (QUEUED → PROCESSING → COMPLETED/FAILED/CANCELED). ✅ Job retry and cancellation. ✅ Storage operations (upload, list, delete, signed URLs). ✅ Bulk catalog import/export (JSON).

### What Went Well

- The Teacher Audio Composer is a strong differentiator — it dramatically lowers the barrier for teachers to produce quality audio content.
- The asynchronous in-process architecture (`queueMicrotask`) for TTS generation is simple and effective for current volumes.
- The admin panel provides comprehensive coverage of all operational needs.

### Areas for Improvement

- The in-process TTS execution should migrate to a dedicated worker queue (Bull/BullMQ with Redis) for production scalability.
- In-app audio recording (user story 5.4) remains to be finalized.
- Feature flag consumption in learner-facing flows has not yet been connected.
- An audit log for administrative actions was not implemented within this sprint cycle.

These sprints conclude the planned feature development. The general conclusion provides a comprehensive assessment of the project.
