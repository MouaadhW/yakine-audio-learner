# Yakine Audio Learner — Master Feature Roadmap

This document serves as the central hub for tracking what has been built, and detailed plans for what is remaining.

---

## ✅ COMPLETED FEATURES

### 1. Quiz Module (Completed)
- **Status:** Done & Scaled for Heavy Traffic
- **Details:** End-of-lesson quizzes, automated grading, spaced-repetition resurface logic.
- **Scale Optimizations:** 
  - Backend memory caching for quiz reads (5 min TTL).
  - Rate-limiting on submissions (5 per minute).
  - React Query implementation for frontend caching and offline resilience.

### 2. Gamification System (Completed)
- **Status:** Done & Scaled for Heavy Traffic
- **Details:** 
  - Streaks (tracked daily securely).
  - XP (earned via quizzes and finishing audio lessons).
  - Leaderboard (Top 50 ranking).
- **Scale Optimizations:** 
  - Prisma Atomic Transactions (`increment: 5`) to prevent race conditions during high load.
  - In-memory 5-minute cache on the `/leaderboard` API to prevent database bottlenecking.

---

## 🛠️ PLANNED FEATURES (TO BE ADDED)

### 3. Parent / Teacher Dashboard (Next Up)
- **Goal:** Allow parents and teachers to track student progress without overwhelming them with data.
- **Technical Plan:**
  - **Database:** Add a `PARENT` enum to the `Role` model. Create a `ParentStudentLink` table mapping `parentId` to `studentId` with a unique `inviteCode` string.
  - **Backend API:** Create `/api/parents/students` to fetch a list of linked students, and `/api/parents/stats/:studentId` to fetch simplified metrics.
  - **Frontend:** Build a lightweight Web/Mobile Dashboard for parents showing a 3-Metric View: Total XP, Current Streak, and Quiz Pass Rate.
  - **Automated Digest:** Set up a cron job (via node-cron or similar) to send a weekly summary email to parents.

### 4. Live Radio Bridge
- **Goal:** Connect live broadcasting with asynchronous learning.
- **Technical Plan:**
  - **Push Notifications:** Integrate Expo Push Notifications. When the school triggers a Live Radio session, send a mass broadcast to all students.
  - **Catch-up Podcast System:** Build an ingest endpoint where the radio station can upload MP3s of past shows, which automatically converts them into `Lesson` objects in the database.
  - **Live Quizzes:** Allow admins to broadcast real-time quiz questions via websockets (Socket.io) during the live stream.

### 5. Arabic Localization (v1.1)
- **Goal:** Full UI support for Right-to-Left (RTL) Arabic text.
- **Technical Plan:**
  - Audit all React Native screens to ensure `flexDirection` and text alignment flips properly using `I18nManager.isRTL`.
  - Complete `i18n` JSON files.

### 6. Security & Load Testing
- **Goal:** Ensure data is safe and servers can handle the school pilot load.
- **Technical Plan:**
  - JMeter / Artillery load tests simulating 500 concurrent users.
  - Audit JWT and refresh token implementation.

### 7. Subscription & Payment Module (Moved to Lowest Priority)
- **Goal:** Monetize premium content and manage school B2B logic.
- **Technical Plan:**
  - Introduce `subscriptionEndsAt` to the `User` model.
  - Webhooks for payment gateway (Flouci/Konnect) to auto-renew/expire plans.
  - Premium paywall UI on the frontend.
