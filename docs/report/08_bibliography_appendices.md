# Bibliography & Appendices

*(Approx. 5–8 pages)*

---

## Bibliography

### Books and Academic Publications

[1] K. Schwaber and J. Sutherland, *The Scrum Guide: The Definitive Guide to Scrum — The Rules of the Game*, Scrum.org, 2020. Available: https://scrumguides.org/

[2] R. C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*, Prentice Hall, 2017.

[3] M. Fowler, *Patterns of Enterprise Application Architecture*, Addison-Wesley Professional, 2002.

[4] S. Newman, *Building Microservices: Designing Fine-Grained Systems*, 2nd ed., O'Reilly Media, 2021.

[5] A. Osmani, *Learning JavaScript Design Patterns*, 2nd ed., O'Reilly Media, 2023.

[6] R. E. Mayer, *Multimedia Learning*, 3rd ed., Cambridge University Press, 2020.

[7] J. Sweller, P. Ayres, and S. Kalyuga, *Cognitive Load Theory*, Springer, 2011.

[8] M. Ally, *Mobile Learning: Transforming the Delivery of Education and Training*, AU Press, Athabasca University, 2009.

### Official Technical Documentation

[9] Meta Platforms, Inc., "React Native Documentation," 2025. [Online]. Available: https://reactnative.dev/docs/getting-started

[10] Expo, Inc., "Expo Documentation," 2025. [Online]. Available: https://docs.expo.dev/

[11] OpenJS Foundation, "Express.js — Fast, Unopinionated, Minimalist Web Framework for Node.js," 2025. [Online]. Available: https://expressjs.com/

[12] Prisma Data, Inc., "Prisma Documentation," 2025. [Online]. Available: https://www.prisma.io/docs/

[13] The PostgreSQL Global Development Group, "PostgreSQL 15 Documentation," 2025. [Online]. Available: https://www.postgresql.org/docs/15/

[14] Supabase, Inc., "Supabase Documentation," 2025. [Online]. Available: https://supabase.com/docs

[15] ElevenLabs, Inc., "ElevenLabs API Documentation," 2025. [Online]. Available: https://docs.elevenlabs.io/

[16] Redux Team, "Redux Toolkit Documentation," 2025. [Online]. Available: https://redux-toolkit.js.org/

[17] TanStack, "TanStack Query (React Query) Documentation," 2025. [Online]. Available: https://tanstack.com/query/latest

[18] React Navigation Contributors, "React Navigation Documentation," 2025. [Online]. Available: https://reactnavigation.org/docs/getting-started

[19] i18next Contributors, "i18next — Internationalization Framework," 2025. [Online]. Available: https://www.i18next.com/

[20] Zod Contributors, "Zod — TypeScript-first Schema Validation," 2025. [Online]. Available: https://zod.dev/

[21] Microsoft Corporation, "TypeScript Documentation," 2025. [Online]. Available: https://www.typescriptlang.org/docs/

### Standards and Protocols

[22] M. Jones, J. Bradley, and N. Sakimura, "RFC 7519 — JSON Web Token (JWT)," Internet Engineering Task Force, May 2015. [Online]. Available: https://tools.ietf.org/html/rfc7519

[23] D. Hardt, Ed., "RFC 6749 — The OAuth 2.0 Authorization Framework," Internet Engineering Task Force, October 2012. [Online]. Available: https://tools.ietf.org/html/rfc6749

[24] R. T. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Ph.D. dissertation, University of California, Irvine, 2000.

### Tunisian Educational Context

[25] Ministry of Higher Education and Scientific Research of Tunisia, "LMD Reform — Implementation Framework," 2006.

[26] UNESCO, "Open and Distance Learning: Trends, Policy and Strategy Considerations," UNESCO Publishing, 2002.

---

## Appendix A: Complete Detailed Product Backlog (Sprints 1 through 5)

### Sprint 1 — Authentication & Security (12 User Stories)

| Theme | ID | User Story | Priority |
|---|---:|---|---|
| Authentication | 1.1 | As a guest, I want to **register** with email, password, and law onboarding fields (region, university, major, level) so I can create a valid account. | Must |
| Authentication | 1.2 | As a user, I want to **authenticate** with email and password so I can access protected features. | Must |
| Authentication | 1.3 | As an authenticated member, I want to **refresh** my access token via a valid refresh token so I can continue my session seamlessly. | Must |
| Authentication | 1.4 | As an authenticated member, I want to **log out** and revoke all refresh tokens so my account is secure. | Must |
| Authentication | 1.5 | As a user, I want the app to **validate** my session on cold start so stale sessions are cleaned up. | Must |
| Authentication | 1.6 | As a system admin, I want auth endpoints to **enforce** rate limits to mitigate brute-force attacks. | Must |
| Profile | 1.7 | As a member, I want to **view** my profile (role, subscription, language, law attributes). | Must |
| Profile | 1.8 | As a member, I want to **update** my profile (name, email, language, law data). | Must |
| Preferences | 1.9 | As a member, I want to **switch** the app language between FR and EN. | Must |
| Preferences | 1.10 | As a member, I want to **toggle** between light and dark mode. | Should |
| Session Security | 1.11 | As a product owner, I want **single active session** enforcement on new login. | Must |
| Session Security | 1.12 | As a member, I want **banned account blocking** on all protected routes. | Must |

### Sprint 2 — Catalog & Content Management (16 User Stories)

| Theme | ID | User Story | Priority |
|---|---:|---|---|
| Subject Catalog | 2.1 | **Browse** subjects filtered by access rules. | Must |
| Chapter Catalog | 2.2 | **Browse** chapters within a subject. | Must |
| Lesson Catalog | 2.3 | **Browse** published lessons within a chapter. | Must |
| Lesson Detail | 2.4 | **View** lesson detail (scripts, duration, tracks, teacher). | Must |
| Subject Mgmt | 2.5 | **Create** subjects (teacher/admin). | Must |
| Subject Mgmt | 2.6 | **Update** subject metadata (admin). | Must |
| Subject Mgmt | 2.7 | **Delete** obsolete subjects (admin). | Must |
| Chapter Mgmt | 2.8 | **Create** chapters under a subject (admin). | Must |
| Chapter Mgmt | 2.9 | **Update** chapter names and order (admin). | Must |
| Chapter Mgmt | 2.10 | **Delete** invalid chapters (admin). | Must |
| Lesson Mgmt | 2.11 | **Create** lessons with audience and status (teacher/admin). | Must |
| Lesson Mgmt | 2.12 | **Update** lesson fields (teacher/admin). | Must |
| Lesson Mgmt | 2.13 | **Delete** invalid lessons (admin). | Must |
| Access | 2.14 | **Display** premium lessons as locked for free students. | Must |
| Access | 2.15 | **Enforce** teacher scope/faculty constraints on publishing. | Must |
| Navigation | 2.16 | **Drill-down** subject → chapter → lesson navigation. | Must |

### Sprint 3 — Learning Experience (14 User Stories)

| Theme | ID | User Story | Priority |
|---|---:|---|---|
| Audio Playback | 3.1 | **Play** and **pause** lesson audio. | Must |
| Audio Playback | 3.2 | **Seek** and **change** playback speed. | Must |
| Multilingual | 3.3 | **Switch** between EN/FR/AR audio tracks. | Must |
| Script | 3.4 | **Search** lesson scripts with highlighting. | Must |
| Progress | 3.5 | **Save** progress periodically (position + completion). | Must |
| Progress | 3.6 | **View** progress library for resuming lessons. | Must |
| Download | 3.7 | **Start** a lesson download for offline use. | Must |
| Download | 3.8 | **View** download status and progress. | Must |
| Download | 3.9 | **Update** download metadata (status, path, error). | Must |
| Offline | 3.10 | **Play** downloaded lessons from local files. | Must |
| Home | 3.11 | **View** announcements and recent lessons on Home. | Must |
| Home | 3.12 | **Enforce** premium lock on Home lesson cards. | Must |
| Mini Player | 3.13 | **Persist** mini player across tabs during playback. | Should |
| Reliability | 3.14 | **Recover** query state on app focus/network changes. | Must |

### Sprint 4 — Administrative Governance (26 User Stories)

| Theme | ID | User Story | Priority |
|---|---:|---|---|
| User Admin | 4.1 | **Browse** paginated users with search and role filters. | Must |
| User Admin | 4.2 | **Update** user roles (student/teacher/admin). | Must |
| User Admin | 4.3 | **Ban/unban** users. | Must |
| User Admin | 4.4 | **Update** student subscription tier (FREE/PREMIUM). | Must |
| User Admin | 4.5 | **Update** teacher law profile (region, university, major). | Must |
| User Admin | 4.6 | **Delete** user accounts. | Must |
| Teacher Scope | 4.7 | **Create** BAC teacher scopes. | Must |
| Teacher Scope | 4.8 | **View** BAC scopes per teacher. | Must |
| Teacher Scope | 4.9 | **Delete** BAC scopes. | Must |
| Teacher Law | 4.10 | **Assign** law subjects to teachers. | Must |
| Teacher Law | 4.11 | **View** teacher law assignments. | Must |
| Teacher Law | 4.12 | **Remove** teacher law assignments. | Must |
| Moderation | 4.13 | **Browse** moderation queue by status. | Must |
| Moderation | 4.14 | **Approve or reject** pending lessons. | Must |
| Content Ops | 4.15 | **Browse** all lessons in management view. | Must |
| Content Ops | 4.16 | **Update** lesson content from management. | Must |
| Content Ops | 4.17 | **Delete** lessons from management. | Must |
| Announcements | 4.18 | **Create** announcements with type and schedule. | Must |
| Announcements | 4.19 | **View** active, in-window announcements (member). | Must |
| Announcements | 4.20 | **Update** announcement text, type, and state. | Must |
| Announcements | 4.21 | **Delete** expired announcements. | Must |
| Feature Flags | 4.22 | **Create** feature flags. | Must |
| Feature Flags | 4.23 | **View** all feature flags. | Must |
| Feature Flags | 4.24 | **Update** flag status and description. | Must |
| Feature Flags | 4.25 | **Delete** deprecated flags. | Should |
| Analytics | 4.26 | **View** dashboard statistics. | Must |

### Sprint 5 — Content Creation & AI (18 User Stories)

| Theme | ID | User Story | Priority |
|---|---:|---|---|
| Composer | 5.1 | **Import** transcript documents (TXT/PDF/DOCX). | Must |
| Composer | 5.2 | **Create** lesson drafts from multilingual transcripts. | Must |
| Composer | 5.3 | **Attach** uploaded manual audio to drafts. | Must |
| Composer | 5.4 | **Record** audio in-app and attach. | Should |
| Composer | 5.5 | **Set** audience and default audio language. | Must |
| AI Jobs | 5.6 | **Create** TTS jobs by language and voice. | Must |
| AI Jobs | 5.7 | **View** AI job history for a lesson. | Must |
| AI Jobs | 5.8 | **View** AI job detail and error messages. | Must |
| AI Jobs | 5.9 | **Retry** failed AI jobs. | Must |
| AI Jobs | 5.10 | **Cancel** queued or running AI jobs. | Must |
| Storage | 5.11 | **View** storage configuration. | Must |
| Storage | 5.12 | **Upload** audio files to storage. | Must |
| Storage | 5.13 | **List** storage files. | Should |
| Storage | 5.14 | **Generate** signed URLs. | Should |
| Storage | 5.15 | **Delete** obsolete storage files. | Should |
| Bulk Data | 5.16 | **Export** full catalog to JSON. | Must |
| Bulk Data | 5.17 | **Import** validated catalog JSON. | Must |
| Seed | 5.18 | **Run** law curriculum seeding. | Should |

---

## Appendix B: API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register with law onboarding | No |
| POST | `/api/auth/login` | Login (email + password) | No |
| POST | `/api/auth/refresh` | Refresh token pair | No |
| POST | `/api/auth/logout` | Logout and revoke tokens | Yes |
| GET | `/api/auth/me` | Current user profile | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |

### Content Catalog (`/api/subjects`, `/api/chapters`, `/api/lessons`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/subjects` | List subjects (filtered by access) | Optional |
| POST | `/api/subjects` | Create a subject | Teacher/Admin |
| PUT | `/api/subjects/:id` | Update a subject | Admin |
| DELETE | `/api/subjects/:id` | Delete a subject | Admin |
| GET | `/api/chapters?subjectId=` | List chapters | Yes |
| POST | `/api/chapters` | Create a chapter | Admin |
| PUT | `/api/chapters/:id` | Update a chapter | Admin |
| DELETE | `/api/chapters/:id` | Delete a chapter | Admin |
| GET | `/api/lessons?chapterId=` | List lessons | Yes |
| POST | `/api/lessons` | Create a lesson | Teacher/Admin |
| PUT | `/api/lessons/:id` | Update a lesson | Teacher/Admin |
| DELETE | `/api/lessons/:id` | Delete a lesson | Admin |

### Progress & Downloads (`/api/progress`, `/api/downloads`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/progress` | Create or update progress | Yes |
| GET | `/api/progress` | List user's progress records | Yes |
| POST | `/api/downloads` | Register a download | Yes |

### User Administration (`/api/admin/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/admin/users` | List users (paginated, searchable, filterable) | Admin |
| PATCH | `/api/admin/users/:id` | Update a user (role, ban, subscription, law profile) | Admin |
| DELETE | `/api/admin/users/:id` | Delete a user | Admin |

### Content Moderation (`/api/admin/moderation`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/admin/moderation` | List moderation queue | Admin |
| PATCH | `/api/admin/moderation/:id` | Approve or reject a lesson | Admin |

### Content Management (`/api/admin/content`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/admin/content` | List all lessons (admin view) | Admin |
| PATCH | `/api/admin/content/:id` | Update lesson from admin view | Admin |
| DELETE | `/api/admin/content/:id` | Delete lesson from admin view | Admin |

### Analytics (`/api/admin/stats`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/admin/stats` | Dashboard statistics | Admin |

### Bulk Operations (`/api/admin/bulk`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/admin/bulk/export` | Export full catalog as JSON | Admin |
| POST | `/api/admin/bulk/import` | Import catalog from JSON | Admin |

### Teacher Scopes (`/api/admin/teacher-scopes`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/admin/teacher-scopes` | Create a Teacher Scope | Admin |
| GET | `/api/admin/teacher-scopes/:teacherId` | List scopes for a teacher | Admin |
| DELETE | `/api/admin/teacher-scopes/:id` | Delete a scope | Admin |

### Teacher Law Assignments (`/api/admin/teacher-law`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/admin/teacher-law` | Assign a law subject to a teacher | Admin |
| GET | `/api/admin/teacher-law/:teacherId` | List assignments for a teacher | Admin |
| DELETE | `/api/admin/teacher-law/:id` | Remove an assignment | Admin |

### Announcements (`/api/announcements`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/announcements/active` | List active announcements | Yes |
| GET | `/api/announcements` | List all announcements | Admin |
| POST | `/api/announcements` | Create an announcement | Admin |
| PUT | `/api/announcements/:id` | Update an announcement | Admin |
| DELETE | `/api/announcements/:id` | Delete an announcement | Admin |

### Feature Flags (`/api/feature-flags`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/feature-flags` | List all flags | Admin |
| POST | `/api/feature-flags` | Create a flag | Admin |
| PUT | `/api/feature-flags/:id` | Update a flag | Admin |
| DELETE | `/api/feature-flags/:id` | Delete a flag | Admin |

### Storage (`/api/storage`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/storage/upload` | Upload an audio file | Teacher/Admin |
| GET | `/api/storage/list` | List stored files | Teacher/Admin |
| GET | `/api/storage/signed-url` | Generate a signed URL | Teacher/Admin |
| DELETE | `/api/storage/:path` | Delete a file | Teacher/Admin |

### Teacher Composer (`/api/teacher-composer`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/teacher-composer/parse-transcript` | Parse a document (TXT/PDF/DOCX) | Teacher/Admin |
| POST | `/api/teacher-composer/drafts` | Create a lesson draft | Teacher/Admin |
| PUT | `/api/teacher-composer/:id/audio` | Attach manual audio | Teacher/Admin |
| POST | `/api/teacher-composer/:id/generate` | Launch AI TTS generation | Teacher/Admin |
| GET | `/api/teacher-composer/:id/jobs` | List generation jobs | Teacher/Admin |
| POST | `/api/teacher-composer/jobs/:jobId/retry` | Retry a failed job | Teacher/Admin |
| POST | `/api/teacher-composer/jobs/:jobId/cancel` | Cancel a job | Teacher/Admin |

---

## Appendix C: Database Schema Overview

The complete database schema is defined in `backend/prisma/schema.prisma`. It comprises **12 models** and **15 enums**.

### Models

| Model | Description | Key Fields |
|---|---|---|
| **User** | System user | email, name, password, role, subscriptionTier, lawRegion, lawUniversity, lawMajor, lawAcademicLevel, currentSessionId, banned |
| **RefreshToken** | Refresh token with revocation | token, userId, expiresAt, revokedAt |
| **Subject** | Curricular subject | nameEn, nameFr, stream, educationLevel, programType, contentTier, lawUniversity, lawMajor, lawAcademicLevel, semester |
| **Chapter** | Chapter within a subject | nameEn, nameFr, sortOrder, subjectId |
| **Lesson** | Audio lesson | titleEn, titleFr, scriptEn/Fr/Ar, audioUrl, audioUrlEn/Fr/Ar, duration, status, audience, audioSourceType, teacherId, chapterId |
| **Progress** | Listening progress | userId, lessonId, position, completed |
| **Download** | Download record | userId, lessonId, localPath |
| **TeacherScope** | BAC teaching scope | teacherId, educationLevel, grade, universityYear, stream |
| **TeacherLawSubject** | Teacher-to-law-subject mapping | teacherId, subjectId |
| **AudioGenerationJob** | TTS generation task | lessonId, teacherId, provider, status, requestedLanguages, voiceSelection, errorMessage, attemptCount |
| **Announcement** | Platform announcement | title, body, type, active, startsAt, endsAt |
| **FeatureFlag** | Feature toggle | key, enabled, description |

### Enums

| Enum | Values |
|---|---|
| Role | STUDENT, TEACHER, ADMIN |
| SubscriptionTier | FREE, PREMIUM |
| EducationLevel | BAC, UNIVERSITY |
| Stream | SCIENTIFIC, LITERARY, ECONOMIC, TECHNICAL, LAW |
| ProgramType | BAC, LAW |
| ContentTier | FREE_GLOBAL, PREMIUM_SCOPED |
| LawRegion | TUNIS, SOUSSE, SFAX, JENDOUBA, KAIROUAN, GABES, NABEUL, BIZERTE |
| LawMajor | PRIVATE, PUBLIC |
| LawAcademicLevel | L1, L2, L3 |
| LessonStatus | DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED |
| LessonAudience | FREE, PREMIUM |
| ComposerLanguage | EN, FR, AR |
| LessonAudioSourceType | LEGACY, MANUAL_UPLOAD, MANUAL_RECORDING, AI_TTS |
| TtsProvider | ELEVENLABS |
| AudioGenerationStatus | QUEUED, PROCESSING, COMPLETED, FAILED, CANCELED |

*(The complete schema with all field types, constraints, relations, and indexes is available in the project repository at `backend/prisma/schema.prisma`.)*
