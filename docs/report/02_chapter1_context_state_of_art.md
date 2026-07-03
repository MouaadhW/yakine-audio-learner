# Chapter 1: Project Context and State of the Art

*(Approx. 10 pages)*

---

## 1.1 Introduction

This opening chapter lays the groundwork for the Yakine Audio Learner project. It begins by defining the broader context within which this work is situated, identifies the specific problem it seeks to address, and characterizes the target audience in detail. We then conduct a state-of-the-art survey of existing solutions in the audio learning and e-learning space, highlighting their strengths and shortcomings through a structured comparative analysis. Finally, we justify the technological choices that underpin the project's implementation.

---

## 1.2 Project Context (The Problematic and Target Audience)

### The Problematic

Legal education at Tunisian universities follows a pedagogical model that has remained largely unchanged for decades: in-person lectures delivered in large amphitheaters, supplemented by tutorials and assessed through written examinations. While this model has proven its merits over time, it presents significant limitations in the contemporary context.

**Information overload.** Law students are expected to internalize a substantial volume of textual material — statutory codes, legislation, case law, and legal doctrine — distributed across six semesters in the LMD (Licence-Master-Doctorat) cycle. The density of the curriculum, combined with large class sizes at many faculties, makes real-time comprehension and thorough note-taking particularly challenging.

**The absence of structured audio resources.** Unlike technical or scientific disciplines that benefit from a wealth of multimedia learning aids — video lectures, simulations, interactive platforms — the legal field has remarkably few audio-based educational resources. Students who wish to study by listening must typically record lectures themselves, resulting in recordings of inconsistent quality and organization.

**Inter-university disparity.** Tunisia's higher education landscape includes several law faculties distributed across the national territory: in Tunis (FDSPT, FSJPST), Sousse (FDSEPS), Sfax (FDSF), Jendouba (FSJEGJ), Kairouan (ISEJPK), Gabès (ISEJG), Nabeul (FSEGN), and Bizerte (FSEGB), as well as private institutions such as LBS, UC, ULT, MIT, ISPDA, IHES, UPS, UIMA, and IIT. Although the LMD system aims for curricular harmonization, actual programs diverge in practice — particularly from the second year onward, where tracks split into private law and public law with variations between institutions. For instance, FSJPST maintains a broader common core through L2, whereas other faculties following the standard LMD matrix introduce specialization earlier.

**Mobility and fragmented time.** Modern students spend significant time in transit, between classes, or in waiting situations. This "dead time" represents untapped learning potential that the audio format is uniquely positioned to exploit — students can listen and learn during these moments without needing to focus on a visual medium.

**The need for flexible pacing.** Not all students learn at the same speed. Some benefit from repetition, from slowing down the delivery, or from the ability to revisit a specific passage. An audio player with speed control and precise seeking offers a flexibility that no lecture hall can match.

### Target Audience

The Yakine Audio Learner project targets four distinct categories of users, each with specific needs and system interactions:

**Law students (primary users).** These are learners enrolled at Tunisian law faculties, from L1 through L3. Their academic profile determines the content they can access: their region and university determine the institution-specific premium catalog; their academic level (L1, L2, L3) filters subjects by semester; their major (private law or public law), applicable from L2 onward, determines specialized module visibility; and their subscription tier (free or premium) governs access to premium-scoped content.

**Teachers (content creators).** Law educators affiliated with partner universities who can publish audio content within their authorized scope. Their access is regulated through Teacher Scopes (defining BAC-level permissions) and Teacher Law Subject assignments (direct mappings between a teacher and the law subjects they are authorized to teach). Teachers also have access to the Teacher Audio Composer for content creation.

**Administrators (platform managers).** Administrators handle the holistic governance of the platform: account management, role assignments, subscription management, content moderation, announcements, feature flags, analytics, and bulk data operations.

**Guests (unauthenticated visitors).** Before registering, visitors can browse a limited selection of free global content, offering a preview of the platform.

---

## 1.3 State of the Art (Existing Solutions and Comparative Analysis)

### Existing Solutions

To position our project within the current technological landscape, we analyzed the principal categories of solutions available in the audio learning and e-learning domains:

**1. Generalist e-learning platforms (Coursera, Udemy, edX).** These platforms offer courses across a broad range of disciplines, sometimes including legal content. They typically deliver video-centric instruction with quizzes and certificates. However, their content is predominantly in English and does not cover Tunisian curricula; they offer no personalization by university or academic level; pricing is often prohibitive for Tunisian students; and they lack robust offline mobile support.

**2. Educational podcast applications (Spotify, Apple Podcasts).** Audio streaming applications host educational podcasts, including some legal content. However, the content is not pedagogically structured (there is no subject-chapter-lesson hierarchy); there is no progress tracking tied to an academic program; no access control based on the student's profile; no synchronized text script accompanying the audio; and no creation tools for educators.

**3. Learning Management Systems — LMS (Moodle, Google Classroom).** LMS platforms are widely deployed in universities for resource distribution, assignment management, and grade tracking. Their limitations include a suboptimal native mobile experience (often web wrappers); basic audio playback without speed control or a persistent mini player; absent or very limited offline mode; no integrated AI audio generation; and user interfaces that feel dated and uninspiring to students.

**4. Flashcard and revision tools (Anki, Quizlet).** These tools focus on memorization through spaced repetition, which is useful for certain aspects of legal study (memorizing definitions, articles of law), but they do not provide structured audio content or course-level progress tracking.

**5. Local Tunisian solutions.** At present, no Tunisian mobile application specifically offers structured audio learning for law students, with a catalog aligned to the LMD programs of the country's universities. Existing local efforts are largely informal — Facebook groups, YouTube channels, and shared PDF files.

### Comparative Analysis Table

The following table synthesizes the comparison across key criteria:

| Criterion | Coursera / Udemy | Spotify / Podcasts | Moodle / LMS | Anki / Quizlet | **Yakine Audio Learner** |
|---|---|---|---|---|---|
| Structured audio content | ❌ Video-centric | ⚠️ Unstructured | ⚠️ Basic | ❌ | ✅ Hierarchical (subject → chapter → lesson) |
| Aligned with Tunisian programs | ❌ | ❌ | ⚠️ Institution-dependent | ❌ | ✅ LMD-aligned catalog |
| Profile-based access control | ❌ | ❌ | ⚠️ Per-course | ❌ | ✅ University, level, major, subscription |
| Native mobile application | ⚠️ | ✅ | ⚠️ Web wrapper | ✅ | ✅ React Native (iOS + Android) |
| Advanced audio player | ❌ | ✅ Basic | ❌ | ❌ | ✅ Speed, seek, mini player, multilingual |
| Synchronized text script | ❌ | ❌ | ❌ | ❌ | ✅ With search and highlighting |
| Progress tracking | ✅ Per-course | ❌ | ✅ | ⚠️ | ✅ Per-lesson with auto-resume |
| Offline mode | ⚠️ Limited | ⚠️ Premium required | ❌ | ✅ | ✅ Native local download |
| AI audio generation | ❌ | ❌ | ❌ | ❌ | ✅ Multilingual TTS via ElevenLabs |
| Integrated teacher tools | ⚠️ | ❌ | ✅ | ✅ | ✅ Teacher Audio Composer |
| Content moderation | ✅ | N/A | ⚠️ | N/A | ✅ Approval/rejection workflow |
| Multilingual interface | ✅ | ✅ | ✅ | ✅ | ✅ French / English |
| Cost | 💰 Paid | Free / Premium | Free / Institution | Free / Premium | Free / Premium |

**Table 1.1** — Comparative Analysis of Existing Solutions

The analysis reveals a clear gap in the market: no existing solution combines a structured audio catalog aligned with Tunisian university programs, granular profile-based access control, an advanced audio player with offline support, and an AI-assisted content creation tool. Yakine Audio Learner is designed to occupy precisely this unserved position.

---

## 1.4 Technological Choices (React Native, Express, PostgreSQL)

The technology stack was selected based on several criteria: development productivity, cross-platform compatibility, ecosystem maturity, performance characteristics, and alignment with the project's functional requirements.

### Frontend — React Native with Expo

React Native 0.81, paired with Expo SDK 54, enables the development of truly native mobile applications for both iOS and Android from a single TypeScript codebase. Expo simplifies the build process and provides ready-to-use APIs for audio playback (`expo-audio`), document picking (`expo-document-picker`), and more. TypeScript adds static type safety, catching errors at compile time rather than runtime.

Key libraries include: **Redux Toolkit** for centralized state management (authentication, theme, audio player state); **React Query (TanStack)** for API data caching, automatic refetching, and network synchronization; **React Navigation** for stack and tab-based navigation; **expo-audio** for audio playback in Expo Go environments; **react-native-track-player** for native audio in production builds; **react-native-fs** for filesystem access (offline downloads); **react-native-mmkv** for ultra-fast local key-value storage; **i18next** for internationalization; and **lucide-react-native** for modern iconography.

### Backend — Express.js with Prisma and PostgreSQL

Express.js 4 serves as the backend framework — the most mature and flexible option in the Node.js ecosystem for building RESTful APIs. Prisma ORM 6 provides type-safe database access through a declarative schema, auto-generated client, and migration tooling. PostgreSQL delivers the robust relational database capabilities required by the complex domain model.

Supporting libraries include: **Zod** for input validation on every API route; **jsonwebtoken** and **bcryptjs** for JWT authentication and secure password hashing; **Helmet** for HTTP security headers; **express-rate-limit** for brute-force protection; **Multer** for file upload processing; **Mammoth** and **pdf-parse** for extracting text from DOCX and PDF transcript uploads.

### Cloud Storage — Supabase

Supabase provides S3-compatible object storage with a straightforward API, public URLs, signed URLs for secure access, and native Node.js integration via `@supabase/supabase-js`. It centralizes both the PostgreSQL database hosting and audio file storage within a single ecosystem.

### AI Audio Generation — ElevenLabs

ElevenLabs' Text-to-Speech API, using the `eleven_multilingual_v2` model, delivers high-quality, natural-sounding multilingual speech synthesis across the project's three target languages (French, English, Arabic). Integration is achieved through a simple REST API compatible with the Teacher Audio Composer pipeline.

### Technology Summary

| Layer | Technology | Version |
|---|---|---|
| Mobile Frontend | React Native + Expo | 0.81 / SDK 54 |
| Language | TypeScript | 5.9 |
| State Management | Redux Toolkit | 2.2 |
| API Cache | React Query (TanStack) | 5.55 |
| Navigation | React Navigation | 6.x |
| Audio (Expo Go) | expo-audio | 1.1 |
| Audio (Native) | react-native-track-player | 4.1 |
| Local Storage | react-native-mmkv | 4.1 |
| Local Files | react-native-fs | 2.20 |
| Internationalization | i18next + react-i18next | 25.x / 16.x |
| Backend API | Express.js | 4.21 |
| ORM | Prisma | 6.4 |
| Database | PostgreSQL | 15+ |
| Input Validation | Zod | 3.24 |
| Authentication | jsonwebtoken + bcryptjs | 9.0 / 2.4 |
| Cloud Storage | Supabase Storage | 2.98 |
| TTS (AI) | ElevenLabs API | v1 |
| Document Parsing | Mammoth + pdf-parse | 1.8 / 1.1 |

**Table 1.2** — Technology Choices and Versions

---

## 1.5 Conclusion

This chapter has situated the Yakine Audio Learner project within its broader context: a Tunisian legal education landscape that sorely lacks structured, personalized audio learning resources. The state-of-the-art analysis confirmed the absence of any existing solution addressing the full spectrum of identified needs — a hierarchical catalog aligned with LMD programs, profile-driven access control, an advanced audio player with offline capabilities, and AI-assisted content creation. The technology choices — React Native with Expo, Express.js with Prisma and PostgreSQL, Supabase, and ElevenLabs — constitute a modern, performant stack well-suited to the project's requirements.

The following chapter will present the detailed system requirements specification and the global architecture of the proposed solution.
