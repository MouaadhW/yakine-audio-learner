# Chapter 2: System Requirements & Global Architecture (Sprint 0)

*(Approx. 15 pages)*

---

## 2.1 Introduction

This chapter constitutes the preliminary design phase of the Yakine Audio Learner project, corresponding to Sprint 0 in the Agile Scrum methodology adopted. It begins by presenting the chosen development methodology and its guiding principles. We then proceed to a thorough requirements analysis, encompassing the identification of system actors, the functional requirements expressed through use cases, and the non-functional requirements that define the system's quality attributes. Finally, we present the global architecture of the system, the domain model derived from the Prisma schema, and the overarching product goals that will steer the subsequent development sprints.

---

## 2.2 Methodology (Agile Scrum)

### Choice Rationale

For the development of this project, we adopted the **Agile Scrum** framework — an iterative and incremental approach particularly well-suited to the development of complex software products. Several factors motivated this choice:

- **Adaptability to change.** The e-learning domain and user needs evolve rapidly. Scrum allows us to incorporate feedback and adjust priorities at each iteration without derailing the overall plan.
- **Incremental delivery.** Each sprint produces a potentially shippable increment, enabling progressive validation of features with stakeholders.
- **Transparency and traceability.** Scrum ceremonies — sprint planning, daily stand-ups, sprint review, and retrospective — provide continuous visibility into the project's progress and health.
- **Early risk mitigation.** The iterative nature of the methodology surfaces technical risks early, when they are least costly to address.

### Sprint Organization

Development is organized into **five sprints**, sequenced according to functional dependencies:

| Sprint | Theme | Estimated Duration | Primary Objective |
|---|---|---|---|
| Sprint 0 | Design & Architecture | 1 week | Requirements specification, architecture, domain model |
| Sprint 1 | Authentication & Security | 2 weeks | Registration, login, session management, profile |
| Sprint 2 | Catalog & Content Management | 2 weeks | Subjects, chapters, lessons, access control |
| Sprint 3 | Learning Experience | 2.5 weeks | Audio player, progress tracking, downloads, home feed |
| Sprint 4 | Administrative Governance | 2 weeks | User management, moderation, announcements, feature flags |
| Sprint 5 | Content Creation & AI | 2 weeks | Teacher Composer, TTS generation, bulk import/export |

### Scrum Roles

In the context of this end-of-studies project, the standard Scrum roles were adapted as follows:

- **Product Owner:** The academic supervisor and project sponsor, responsible for defining priorities and validating each increment.
- **Scrum Master / Developer:** The student carrying out the project, responsible for both process facilitation and technical implementation.
- **Stakeholders:** Law students (end users), potential teachers, and platform administrators.

### Scrum Artifacts

- **Product Backlog:** A prioritized list of all user stories for the project, organized by themes and sprints (see Appendix A for the complete backlog).
- **Sprint Backlog:** The subset of the product backlog selected for each sprint.
- **Increment:** The functional outcome of each sprint, integrating all completed features.

---

## 2.3 Requirement Analysis

### 2.3.1 Identification of Actors (Guest, User, Teacher, Admin)

The Yakine Audio Learner system interacts with four principal categories of actors, each with distinct rights and responsibilities:

**1. Guest**

The guest is an unauthenticated user who accesses the application without having created an account. Their interactions are limited to:
- Browsing free global subjects (FREE_GLOBAL content of both BAC and LAW program types).
- Accessing the login and registration screens.
- Previewing the interface and demo content.

**2. User (Student)**

The student is an authenticated user with the STUDENT role. As the system's primary actor, the student can:
- Register with academic onboarding fields (region, university, major, academic level).
- Log in and manage their session (token refresh, logout).
- View and edit their profile.
- Browse the subject catalog, filtered automatically according to their academic profile and subscription tier.
- Listen to audio lessons using the advanced player.
- Track their learning progress across lessons.
- Download lessons for offline listening.
- View active platform announcements.
- Switch the interface language (French/English) and toggle the visual theme (light/dark).

**3. Teacher**

The teacher is an authenticated user with the TEACHER role. In addition to all student capabilities, the teacher can:
- Create lessons within the subjects to which they are assigned.
- Update their own lessons.
- Import transcripts from external documents (TXT, PDF, DOCX) via the Teacher Audio Composer.
- Record audio directly within the application.
- Launch AI-driven Text-to-Speech generation jobs for multilingual audio.
- Monitor the status of generation jobs (queued, processing, completed, failed).
- Retry failed jobs or cancel pending ones.
- Manage their audio files in cloud storage.

**4. Admin**

The administrator has unrestricted access to all system functionality:
- Full user management (search, paginate, filter, modify roles, ban/unban, delete, manage subscriptions, edit law profiles).
- Teacher permission management (Teacher Scopes for BAC and Teacher Law Subject assignments).
- Content moderation (review queue, approve/reject lessons).
- Complete CRUD on subjects, chapters, and lessons.
- Announcement management (CRUD with scheduling and activation).
- Feature flag management (CRUD with enable/disable).
- Dashboard analytics (user counts, content volumes, moderation load, activity trends).
- Bulk catalog operations (JSON export and import).
- Storage file management.

### 2.3.2 Functional Requirements (Includes Global Use Case Diagram)

*(Insert here: Figure 2.1 — Global Use Case Diagram)*

> The global use case diagram should depict the four actors (Guest, Student, Teacher, Admin) with inheritance relationships (Admin inherits from Teacher, Teacher inherits from Student, Student inherits from Guest), and the major use cases grouped into packages: Authentication, Catalog, Learning, Administration, and Content Creation.

The functional requirements are organized by domain:

| ID | Domain | Functional Requirement | Actor(s) | Priority |
|---|---|---|---|---|
| FR-01 | Authentication | Register with law onboarding (region, university, major, level) | Guest | Must |
| FR-02 | Authentication | Authenticate with email and password (JWT tokens) | All authenticated | Must |
| FR-03 | Authentication | Automatically refresh the access token via refresh token | System | Must |
| FR-04 | Authentication | Log out and revoke active refresh tokens | All authenticated | Must |
| FR-05 | Authentication | Validate stored session on application cold start | System | Must |
| FR-06 | Authentication | Enforce rate limiting on auth endpoints | System | Must |
| FR-07 | Profile | View user profile (role, subscription, language, law attributes) | All authenticated | Must |
| FR-08 | Profile | Update profile (name, email, language, law data) | All authenticated | Must |
| FR-09 | Preferences | Switch interface language between FR and EN | All authenticated | Must |
| FR-10 | Preferences | Toggle light/dark theme | All authenticated | Should |
| FR-11 | Security | Enforce single active session policy | System | Must |
| FR-12 | Security | Block banned accounts from accessing protected routes | System | Must |
| FR-13 | Catalog | Browse subjects filtered by access rules | Guest, Student, Teacher | Must |
| FR-14 | Catalog | Browse chapters within a subject | Student, Teacher | Must |
| FR-15 | Catalog | Browse published lessons within a chapter | Student, Teacher | Must |
| FR-16 | Catalog | CRUD subjects | Teacher (C), Admin (CRUD) | Must |
| FR-17 | Catalog | CRUD chapters | Admin | Must |
| FR-18 | Catalog | CRUD lessons with status workflow | Teacher (CRU), Admin (CRUD) | Must |
| FR-19 | Access | Display premium lessons as locked for free-tier students | Student (FREE) | Must |
| FR-20 | Access | Enforce teacher scope/faculty constraints on publishing | System | Must |
| FR-21 | Audio | Play, pause, seek, and control playback speed | Student, Teacher | Must |
| FR-22 | Audio | Switch audio tracks between EN, FR, and AR | Student, Teacher | Must |
| FR-23 | Audio | View and search lesson text scripts with highlighting | Student, Teacher | Must |
| FR-24 | Progress | Automatically save progress (position + completion) | System | Must |
| FR-25 | Progress | View progress library for resuming unfinished lessons | Student, Teacher | Must |
| FR-26 | Offline | Download lessons for local offline playback | Student, Teacher | Must |
| FR-27 | Home | View active announcements and recent lessons on home feed | Student, Teacher | Must |
| FR-28 | Admin | Full user management (search, roles, bans, subscriptions, deletion) | Admin | Must |
| FR-29 | Admin | Teacher Scope and Law Assignment management | Admin | Must |
| FR-30 | Admin | Content moderation (review queue, approve/reject) | Admin | Must |
| FR-31 | Admin | Announcement and feature flag management | Admin | Must |
| FR-32 | Admin | Dashboard analytics and bulk import/export | Admin | Must |
| FR-33 | Composer | Import transcripts and create lesson drafts | Teacher | Must |
| FR-34 | Composer | Generate AI audio (multilingual TTS via ElevenLabs) | Teacher | Must |
| FR-35 | Storage | Upload, list, and delete audio files | Teacher, Admin | Must |

**Table 2.1** — Functional Requirements by Actor

### 2.3.3 Non-Functional Requirements

| ID | Category | Non-Functional Requirement |
|---|---|---|
| NFR-01 | Performance | API response time under 500ms for standard CRUD operations |
| NFR-02 | Performance | Audio playback initiation within 3 seconds of lesson selection |
| NFR-03 | Security | Passwords hashed with bcrypt (cost factor ≥ 10) |
| NFR-04 | Security | Short-lived access tokens (15 min) with longer refresh tokens (7 days) and revocation support |
| NFR-05 | Security | HTTP security headers enforced via Helmet |
| NFR-06 | Security | All incoming data validated with Zod schemas |
| NFR-07 | Security | Rate limiting applied to sensitive endpoints (login, register, refresh) |
| NFR-08 | Availability | Graceful error handling (503 on database unavailability) |
| NFR-09 | Usability | Bilingual interface (French/English) with persisted language preference |
| NFR-10 | Usability | Light and dark theme support across all screens |
| NFR-11 | Usability | Tab-based navigation (Home, Subjects, Learnings, Profile) with smooth transitions |
| NFR-12 | Portability | Cross-platform support for iOS and Android from a single codebase |
| NFR-13 | Reliability | Automatic network status detection with offline mode fallback |
| NFR-14 | Reliability | Local persistence of tokens, preferences, and download metadata via MMKV |
| NFR-15 | Maintainability | Feature-based modular code organization |
| NFR-16 | Maintainability | Systematic TypeScript usage across both frontend and backend |

**Table 2.2** — Non-Functional Requirements

---

## 2.4 Global Architecture

### 2.4.1 3-Tier Architecture (Includes Global Architecture Diagram)

Yakine Audio Learner follows a **3-tier architecture** that cleanly separates concerns across three distinct layers:

*(Insert here: Figure 2.2 — Global 3-Tier Architecture Diagram)*

**Tier 1 — Presentation Layer (React Native Mobile Application)**

The presentation layer is the React Native mobile application, responsible for:
- Rendering the user interface through React Native components.
- Managing local application state via Redux Toolkit (authentication, theme, audio player).
- Caching server data via React Query (subjects, lessons, progress, announcements).
- Handling navigation through React Navigation (stack navigator and bottom tabs).
- Persisting tokens, preferences, and download metadata locally via MMKV.
- Playing audio through expo-audio (Expo Go) or react-native-track-player (native builds).
- Downloading and storing audio files locally via react-native-fs.
- Communicating with the backend through HTTP REST requests (fetch API).

The frontend follows a **feature-based** architecture: each functional domain (auth, subjects, audio, admin, home, profile, learning) is organized in its own directory containing screens, domain-specific components, and Redux slices.

**Tier 2 — Business Logic Layer (Express.js Backend API)**

The business logic layer is an Express.js server exposing a RESTful API. It implements:
- Request routing across 17 route modules.
- Authentication and authorization logic (requireAuth, optionalAuth, requireRole middleware).
- Contextual access control logic (subject access filtering, lesson access filtering, teacher post permission verification).
- File upload processing and document parsing (Multer, Mammoth, pdf-parse).
- AI audio generation task orchestration (ElevenLabs API integration).
- Input validation via Zod schemas on every route.
- Centralized error handling with typed error responses.

**Tier 3 — Data Layer (PostgreSQL + Supabase Storage)**

The data layer consists of two components:
- **PostgreSQL:** A relational database hosting the entire domain model (users, subjects, chapters, lessons, progress, tokens, etc.), accessed via Prisma ORM with a type-safe generated client.
- **Supabase Storage:** Object storage for audio files (recorded lessons, AI-generated audio), accessible via the Supabase SDK with public and signed URLs.

### 2.4.2 Domain Model (Includes ERD / schema.prisma representation)

The domain model describes the persistent entities of the system and their relationships. It is defined in `backend/prisma/schema.prisma` and serves as the single source of truth for the data structure.

*(Insert here: Figure 2.3 — Domain Model / Entity-Relationship Diagram)*

The model comprises **12 entities** and **15 enums**:

- **User** — Represents any system user. Holds identity fields (email, name, hashed password), role and access attributes (role, subscriptionTier), academic profile (educationLevel, grade, stream), law profile (lawRegion, lawUniversity, lawMajor, lawAcademicLevel), and session state (currentSessionId, banned). Related to lessons, progress, downloads, refresh tokens, teacher scopes, law subject assignments, and audio generation jobs.

- **Subject** — A curricular subject. Classified by stream (SCIENTIFIC, LITERARY, ECONOMIC, TECHNICAL, LAW), education level, program type (BAC or LAW), and content tier (FREE_GLOBAL or PREMIUM_SCOPED). Law subjects additionally carry lawUniversity, lawAcademicLevel, lawMajor, and semester for precise scoping.

- **Chapter** — A thematic grouping within a subject (nameEn, nameFr, sortOrder). Parent: Subject. Children: Lessons.

- **Lesson** — An audio learning unit. Contains multilingual content (titles, scripts, transcripts in EN/FR/AR), multiple audio URLs (audioUrl, audioUrlEn/Fr/Ar), duration, status workflow (DRAFT → PENDING_REVIEW → PUBLISHED / REJECTED), audience (FREE / PREMIUM), and composer metadata (audioSourceType, isTeacherComposer, composerAutoPublish).

- **Progress** — Tracks a user's listening progress on a specific lesson (position in seconds, completion flag). Unique constraint on (userId, lessonId).

- **Download** — Records a local file download (userId, lessonId, localPath).

- **RefreshToken** — A refresh token with expiration and revocation timestamps.

- **TeacherScope** — Defines a teacher's BAC-level teaching permissions (educationLevel, grade, universityYear, stream).

- **TeacherLawSubject** — Maps a teacher to a specific law subject they are authorized to teach.

- **AudioGenerationJob** — An AI TTS generation task, tracking provider (ELEVENLABS), status (QUEUED → PROCESSING → COMPLETED / FAILED / CANCELED), requested languages, voice selection, error messages, and attempt count.

- **Announcement** — A platform communication message (title, body, type, active flag, start/end dates).

- **FeatureFlag** — A feature toggle for progressive rollout (key, enabled, description).

---

## 2.5 Global Product Goals

The global product goals that guide all development sprints are:

1. **Identity and Security (Sprint 1):** Establish a robust authentication system with contextual law onboarding, secure session management, and protection against abuse.

2. **Content Discovery (Sprint 2):** Build a hierarchical content catalog with personalized, profile-driven access control.

3. **Audio Learning Experience (Sprint 3):** Deliver a full-featured audio player with progress tracking, offline capabilities, text scripts, and multilingual support.

4. **Platform Governance (Sprint 4):** Implement the administrative tools necessary for day-to-day platform operations — user management, moderation, announcements, analytics, and feature flags.

5. **AI-Powered Content Creation (Sprint 5):** Provide teachers with a comprehensive content creation tool integrating transcript import, manual recording, and automated multilingual TTS generation.

---

## 2.6 Conclusion

This chapter has laid the foundation for the Yakine Audio Learner project: the Agile Scrum methodology that structures our development approach, the exhaustive requirements analysis covering four distinct actors with 35 functional and 16 non-functional requirements, the 3-tier architecture that cleanly separates presentation, business logic, and data concerns, and the domain model comprising 12 entities with their interrelationships. This preliminary design serves as the bedrock upon which the five development sprints are built. The next chapter details Sprint 1, dedicated to authentication and security.
