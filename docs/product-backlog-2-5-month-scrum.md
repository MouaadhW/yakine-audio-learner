# Yakine Audio Learner - Product Backlog (2.5 Months)

This backlog is structured exactly as requested: Theme, ID, User Story, Importance.
All stories use action verbs and include detailed CRUD-oriented wording by user role.

## Sprint 1
| Theme | ID | User Story | Importance |
|---|---:|---|---|
| Authentication | 1.1 | As a guest user, I want to **register** with email, password, and law onboarding fields so I can create a valid account mapped to my region, university, major, and academic level. | Must |
| Authentication | 1.2 | As a user, I want to **authenticate** with email and password so I can securely access protected learning features. | Must |
| Authentication | 1.3 | As an authenticated member, I want to **refresh** my access token using a valid refresh token so I can continue my session without re-entering credentials. | Must |
| Authentication | 1.4 | As an authenticated member, I want to **log out** and revoke active refresh tokens so my account is protected on shared devices. | Must |
| Authentication | 1.5 | As a user, I want the app to **validate** my stored session on cold start so invalid or expired sessions are automatically cleared. | Must |
| Authentication | 1.6 | As a system admin, I want auth endpoints to **enforce** rate limits so brute-force login and abusive registration attempts are reduced. | Must |
| Profile Management (Read) | 1.7 | As a member, I want to **consult** my profile (role, subscription, language, law attributes) so I can verify account state and entitlements. | Must |
| Profile Management (Update) | 1.8 | As a member, I want to **update** my profile (name, email, language, law data) so my account remains accurate and personalized. | Must |
| Preferences | 1.9 | As a member, I want to **switch** app language between FR and EN so I can use the interface in my preferred language. | Must |
| Preferences | 1.10 | As a member, I want to **toggle** light/dark appearance so readability improves in different environments. | Should |
| Session Security | 1.11 | As a product owner, I want the backend to **invalidate** old sessions when a new login occurs so one active session policy is enforced. | Must |
| Session Security | 1.12 | As a member, I want banned-account checks to **block** protected access immediately so moderation decisions are applied consistently. | Must |

## Sprint 2
| Theme | ID | User Story | Importance |
|---|---:|---|---|
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
| Navigation Flow | 2.16 | As a learner, I want subject -> chapter -> lesson navigation to **drill down** quickly so discovery time is reduced. | Must |

## Sprint 3
| Theme | ID | User Story | Importance |
|---|---:|---|---|
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

## Sprint 4
| Theme | ID | User Story | Importance |
|---|---:|---|---|
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

## Sprint 5
| Theme | ID | User Story | Importance |
|---|---:|---|---|
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

---

## Detailed CRUD Coverage Matrix By User Role

| Entity | Guest | Student | Teacher | Admin | CRUD Coverage and Detailed Behavior |
|---|---|---|---|---|---|
| Account | **C** register | **R** consult profile | **R** consult profile | **R/U/D** manage users | Registration creates account with law onboarding validation; admins update role/ban/subscription/law profile and can delete users. |
| Session | - | **C/R/U/D** login, consult state, refresh, logout | **C/R/U/D** login, consult state, refresh, logout | **C/R/U/D** login, consult state, refresh, logout | Login creates active session, refresh rotates tokens, logout revokes tokens, invalid sessions are blocked. |
| Subject | **R** free-global scope | **R** scoped by profile/tier | **C/R** create + consult scoped catalog | **C/R/U/D** full control | Teachers can create subjects; admins maintain full lifecycle; students/guests consult filtered lists only. |
| Chapter | - | **R** consult allowed chapters | **R** consult allowed chapters | **C/R/U/D** full control | Chapter creation/update/deletion is admin-governed; read path is entitlement-filtered. |
| Lesson | - | **R** consult and play unlocked lessons | **C/R/U** create and update owned lessons | **C/R/U/D** full control | Teacher creates and updates lessons; admin can delete; students consult with premium lock awareness. |
| Progress | - | **C/R/U** save and consult progress | **C/R/U** for own learning account | **R** inspect via data endpoints | System creates/updates progress while listening; users consult progress library to resume lessons. |
| Download Metadata | - | **C/R/U** start, consult, and update download state | **C/R/U** if using learner flow | **R** operational visibility in app context | Download process creates metadata, updates status/progress, and reads local path for offline playback. |
| Teacher Scope | - | - | **R** benefits from granted permissions | **C/R/D** assign, consult, revoke | Admin explicitly grants or revokes BAC teaching scopes; no generic update route required. |
| Teacher Law Assignment | - | - | **R** consult assigned law modules | **C/R/D** assign, consult, remove | Admin maps teacher to faculty law subjects; deletions remove assignment rows when needed. |
| Moderation Queue | - | - | **R** sees resulting status on own lessons | **R/U** consult queue and update decision | Admin reads pending/rejected/published items and updates status by approve/reject actions. |
| Announcements | - | **R** consult active announcements | **R** consult active announcements | **C/R/U/D** full lifecycle | Admin creates scheduled messages, updates active state/content, deletes outdated notices; users read active window only. |
| Feature Flags | - | - | - | **C/R/U/D** full lifecycle | Admin creates, reads, toggles, edits descriptions, and deletes rollout flags. |
| Audio Generation Job | - | - | **C/R/U** enqueue, consult, retry/cancel | **C/R/U** manage all jobs | Jobs are created for AI TTS, read for status/error, and updated by retry/cancel actions. |
| Storage File | - | - | **C/R/D** upload, list, delete | **C/R/D** upload, list, delete | Teachers/admins create uploads, read file inventory/signed URLs, and delete obsolete media files. |
| Bulk Catalog Dataset | - | - | - | **C/R** import and export | Admin reads export payload and creates catalog state via validated import workflow. |

---

## Prioritization Notes
- **Must** stories are required for production readiness of current app scope.
- **Should** stories are important enhancements that improve operations and flexibility.
- Backlog sequencing follows dependency order: identity -> catalog -> learning loop -> governance -> composer/ops.
