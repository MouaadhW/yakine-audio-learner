# Front Matter

---

## Title Page / Cover Page

**Republic of Tunisia**
**Ministry of Higher Education and Scientific Research**

**[University Name]**
**[Faculty / School Name]**

---

### End of Studies Project

Submitted in partial fulfillment of the requirements for the degree of **[Bachelor's / Master's / Engineer's]**

**Major:** [Computer Science / Software Engineering / Information Technology]

---

### Yakine Audio Learner

**A Mobile Audio Learning Application for Law Students**

---

**Prepared by:** [Student Full Name]

**Academic Supervisor:** [Supervisor Full Name]

**Professional Supervisor:** [Name — if applicable]

**Academic Year:** 2025–2026

---
---

## Dedication & Acknowledgements

### Dedication

*I dedicate this work…*

*To my dear parents, whose unwavering support, patience, and sacrifice have been the cornerstone of my academic journey. No words could ever capture the depth of my gratitude for their love and devotion.*

*To my brothers and sister, for their constant encouragement and presence at every step.*

*To my teachers, who instilled in me both knowledge and a genuine passion for computer science.*

*To all my friends and colleagues, with whom I shared the joys and challenges of this program.*

*To everyone who contributed, directly or indirectly, to the completion of this project.*

### Acknowledgements

At the conclusion of this work, I wish to express my deepest gratitude to all those who contributed to the success of this end-of-studies project.

First and foremost, I would like to thank **[Supervisor Full Name]**, my academic supervisor, for their availability, insightful guidance, rigorous follow-up, and invaluable direction throughout the realization of this project.

I also extend my sincere thanks to the members of the jury for accepting to evaluate this work and for the time they have dedicated to it.

My gratitude goes to the entire teaching staff at **[Faculty / School Name]** for the quality of the education provided and the knowledge acquired throughout my academic journey.

I would also like to acknowledge **[Company / Organization Name — if applicable]** for hosting me and providing a conducive environment for the realization of this project.

Finally, I thank my family and loved ones for their unwavering moral support and constant encouragement.

---

## Abstract

The proliferation of mobile technology has created new opportunities for educational innovation, yet law students at Tunisian universities continue to rely predominantly on traditional, text-heavy learning methods. This report presents the design and development of **Yakine Audio Learner**, a cross-platform mobile application that delivers structured audio-based learning experiences tailored specifically to law students. The application organizes content through a hierarchical catalog of subjects, chapters, and lessons, with a fine-grained access control system driven by the student's university, academic level, major, and subscription tier. It features an advanced audio player with playback speed control, multilingual track selection (French, English, Arabic), synchronized text scripts with search highlighting, automatic progress tracking, and offline download capabilities. A comprehensive administrative layer provides user management, content moderation, and a Teacher Audio Composer tool that leverages artificial intelligence — specifically ElevenLabs' Text-to-Speech API — to automatically generate professional multilingual narrations from text transcripts.

The project was developed following the Agile Scrum methodology, organized across five sprints covering authentication and security, content catalog and access governance, the learning experience, administrative operations, and AI-powered content generation. The technology stack comprises React Native with Expo for the mobile frontend, Express.js with Prisma ORM and PostgreSQL for the backend API, and Supabase for cloud-based audio file storage.

**Keywords:** Mobile application, audio learning, e-learning, law education, React Native, Express.js, Prisma, PostgreSQL, Supabase, Text-to-Speech, Agile Scrum.

---

## Table of Contents

*(Auto-generated — update before final printing)*

- General Introduction
- Chapter 1: Project Context and State of the Art
- Chapter 2: System Requirements & Global Architecture (Sprint 0)
- Chapter 3: Sprint 1 — Authentication & Security
- Chapter 4: Sprints 2 & 3 — Learning Experience & Access Governance
- Chapter 5: Sprints 4 & 5 — Governance and Content Generation
- General Conclusion
- Bibliography
- Appendices

---

## List of Figures

*(Auto-generated — insert actual figure numbers and captions when finalizing)*

- Figure 2.1 — Global Use Case Diagram
- Figure 2.2 — Global 3-Tier Architecture Diagram
- Figure 2.3 — Domain Model (Entity-Relationship Diagram)
- Figure 3.1 — Use Case Diagram: Registration & Authentication
- Figure 3.2 — Sequence Diagram: JWT Authentication & Session Invalidation
- Figure 3.3 — Screenshots: Login and Registration Screens
- Figure 3.4 — Screenshot: Profile Screen
- Figure 4.1 — Use Case Diagram: Catalog Browsing & Content Management
- Figure 4.2 — Access Control Logic: Premium Locks and Teacher Scopes
- Figure 4.3 — Sequence Diagram: Audio Playback & Progress Tracking
- Figure 4.4 — State Machine Diagram: Download Management
- Figure 4.5 — Screenshots: Subjects, Chapters, and Lessons Catalog
- Figure 4.6 — Screenshots: Audio Player and Mini Player
- Figure 5.1 — Admin & Moderation Use Case Diagram
- Figure 5.2 — AI Audio Generation Pipeline Sequence Diagram
- Figure 5.3 — Screenshots: Admin Dashboard, Moderation, Teacher Audio Composer

---

## List of Tables

- Table 1.1 — Comparative Analysis of Existing Solutions
- Table 1.2 — Technology Choices and Justifications
- Table 2.1 — Functional Requirements by Actor
- Table 2.2 — Non-Functional Requirements
- Table 3.1 — Sprint 1 Product Backlog
- Table 4.1 — Sprint 2 Product Backlog
- Table 4.2 — Sprint 3 Product Backlog
- Table 5.1 — Sprint 4 Product Backlog
- Table 5.2 — Sprint 5 Product Backlog

---

## List of Acronyms

| Acronym | Meaning |
|---|---|
| API | Application Programming Interface |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| ERD | Entity-Relationship Diagram |
| HTTP | HyperText Transfer Protocol |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token |
| LMD | Licence – Master – Doctorate (Tunisian higher education system) |
| MMKV | Memory-Mapped Key-Value (local storage library) |
| ORM | Object-Relational Mapping |
| PFE | Projet de Fin d'Études (End of Studies Project) |
| REST | Representational State Transfer |
| SQL | Structured Query Language |
| TTS | Text-to-Speech |
| UI | User Interface |
| UML | Unified Modeling Language |
| UX | User Experience |
