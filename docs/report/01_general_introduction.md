# General Introduction

*(Approx. 3–4 pages)*

---

## Context and Problematic

Higher education in Tunisia — and the legal disciplines in particular — faces a set of structural challenges that directly affect the quality of student learning. Tunisian law faculties, spread across cities including Tunis (FDSPT, FSJPST), Sousse (FDSEPS), Sfax (FDSF), Jendouba, Kairouan, Gabès, Nabeul, and Bizerte, welcome growing numbers of students into lecture halls that are often overcrowded, making thorough note-taking and real-time comprehension difficult to reconcile.

The nature of legal studies is inherently text-heavy and demands the memorization of legislation, case law, and doctrine across dense semesters. Students pursuing their law degree — whether at the first-year common core (L1), or the specialized tracks in private law or public law at the second (L2) and third (L3) year levels — must absorb a substantial body of knowledge within compressed timelines. Yet the pedagogical resources available to them remain largely traditional: printed handouts, legal textbooks, and face-to-face lectures.

These traditional methods present several notable limitations. First, they are almost exclusively text-based and fail to leverage the well-documented benefits of multimodal learning. Audio as a learning medium offers a unique flexibility — it allows students to study during commutes, waiting periods, or alongside other activities, transforming otherwise idle time into productive learning sessions. Second, access to pedagogical resources varies considerably from one university to another. Although the LMD system (Licence-Master-Doctorat) aims for curricular harmonization across institutions, a student at the Faculty of Law and Economic and Political Sciences of Sousse (FDSEPS) may not have the same resources available as a student at the Faculty of Juridical, Political, and Social Sciences of Tunis (FSJPST). This fragmentation creates inequalities in access to legal knowledge. Third, no platform currently exists that is specifically designed to deliver structured audio learning for Tunisian law students — with a catalog aligned to their actual university programs, an access control system based on their academic profile, and professionally produced audio content in their languages of instruction.

It is within this context that the **Yakine Audio Learner** project was conceived, with the goal of bridging this gap by providing a modern, purpose-built technological solution.

---

## Proposed Solution

To address these challenges, we propose **Yakine Audio Learner** — a mobile application designed from the ground up for audio-based learning among law students at Tunisian universities.

Yakine Audio Learner is built on a modern client-server architecture, with a cross-platform mobile app developed in React Native (supporting both iOS and Android) and a RESTful backend powered by Express.js, Prisma ORM, and PostgreSQL. The application delivers an audio course catalog organized in a clear hierarchy: **subjects** (organized by university, academic level, and major), **chapters** (thematic groupings within a subject), and **lessons** (individual audio units accompanied by text scripts).

The core differentiator of the platform lies in its **intelligent, profile-driven access control system**. During registration, each student provides their region, university, legal major (private or public law), and academic level (L1, L2, or L3). The application then automatically filters the catalog to display only the subjects relevant to the student's specific academic path. Free-tier content is accessible to all, while premium content mapped to a specific university, level, and major requires a paid subscription — with the notable exception that the L1 common core remains freely accessible to students at the corresponding institution.

The application integrates an **advanced audio player** offering essential learning features: play/pause, fast-forward and rewind (±10 seconds), adjustable playback speed (0.75x to 2x), multilingual track selection (French, English, Arabic), a text script view with in-text search and highlighting, automatic progress saving, and downloadable lessons for offline listening.

On the governance side, a **comprehensive administration panel** supports user management (roles, bans, subscriptions), content moderation through an approval workflow, and an innovative tool — the **Teacher Audio Composer** — that enables educators to create audio content from text transcripts, leveraging artificial intelligence (Text-to-Speech via ElevenLabs) to automatically generate multilingual audio narrations.

---

## Objectives and Contributions

The primary objectives of this project are:

1. **Design and develop a cross-platform mobile application** for audio learning, targeting law students at Tunisian universities, with a modern, intuitive, and bilingual interface (French/English).

2. **Implement a fine-grained access control system** driven by the student's academic profile (university, level, major, subscription), ensuring each user sees only the content relevant to their program.

3. **Build a full-featured audio player** with progress tracking, offline downloads, multilingual playback, and adjustable speed — delivering an optimized learning experience.

4. **Establish a robust governance framework** comprising user and role management, content moderation, teacher permission systems, and advanced administrative tools (analytics, announcements, feature flags, bulk import/export).

5. **Integrate an AI-powered audio generation pipeline** that enables teachers to convert text transcripts into professional multilingual audio content, significantly reducing the time and cost of content production.

6. **Apply sound software engineering practices** by following Agile Scrum, employing a clean 3-tier architecture, enforcing data validation with Zod, and implementing comprehensive security measures (JWT, refresh tokens, rate limiting).

The key contributions of this work include:

- A learning tool **tailored to the Tunisian legal education context**, with a catalog aligned to the actual LMD curricula of several faculties (FDSEPS, FDSF, FDSPT, FSJPST).
- A **modular and extensible software architecture** designed to accommodate future additions — new universities, new education levels (baccalaureate, master's), and new features (quizzes, online payments).
- An **AI-assisted content creation tool** (Teacher Audio Composer) that lowers the barrier to entry for producing audio lessons, requiring no technical expertise from the educator.

---

## Report Organization

This report is structured into five chapters, preceded by this general introduction and followed by a general conclusion:

**Chapter 1 — Project Context and State of the Art.** This chapter explores the detailed project context, analyzes the needs of the target audience, surveys existing solutions through a comparative analysis, and justifies the technological choices made (React Native, Express.js, PostgreSQL, Supabase).

**Chapter 2 — System Requirements & Global Architecture (Sprint 0).** This chapter presents the Agile Scrum methodology adopted, the detailed functional and non-functional requirements analysis, the identification of system actors, the global 3-tier architecture, the domain model, and the overall product goals.

**Chapter 3 — Sprint 1: Authentication & Security.** This chapter covers the first development sprint, dedicated to implementing the authentication system, session management, profile management, and security mechanisms (JWT, refresh tokens, rate limiting, single-session policy).

**Chapter 4 — Sprints 2 & 3: Learning Experience & Access Governance.** This chapter details the sprints dedicated to the content catalog (subjects, chapters, lessons), access control and premium governance, the audio player with progress tracking, and offline learning features.

**Chapter 5 — Sprints 4 & 5: Governance and Content Generation.** This chapter presents the sprints covering advanced administrative operations (user management, moderation, teacher permissions, announcements, feature flags) as well as the Teacher Audio Composer and the AI-powered audio generation pipeline.

The report concludes with a **General Conclusion** summarizing the achievements, identifying limitations, and proposing future perspectives. **Appendices** include the detailed product backlog, API endpoints, and the complete database schema.
