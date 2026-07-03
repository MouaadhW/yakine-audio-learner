# Chapter 3: Sprint 1 — Authentication & Security

*(Approx. 12 pages)*

---

## 3.1 Introduction

This chapter presents the first development sprint of the Yakine Audio Learner project, focused entirely on authentication and security. This sprint establishes the foundational identity layer upon which every subsequent feature depends — without robust user identification, neither personalized access control nor progress tracking nor administrative governance would be feasible. We begin with the sprint backlog, proceed to the software design through UML diagrams (use case and sequence), and conclude with the implementation details of the login, registration, and profile management features.

---

## 3.2 Sprint 1 Backlog (User Stories 1.1 to 1.12)

Sprint 1 encompasses twelve user stories organized across four themes: authentication, profile management, user preferences, and session security.

| Theme | ID | User Story | Importance |
|---|---|---|---|
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

**Table 3.1** — Sprint 1 Product Backlog

---

## 3.3 Software Design

### 3.3.1 Use Case Diagram: Registration & Authentication

*(Insert here: Figure 3.1 — Use Case Diagram: Registration & Authentication)*

This use case diagram involves three actor categories and nine primary use cases:

**Actors:**
- **Guest** — Can register and log in.
- **Member (Student / Teacher / Admin)** — Can log in, log out, refresh their session, view and edit their profile, change language, and toggle theme.
- **System** — Validates sessions on startup, applies rate limiting, and invalidates stale sessions.

**Primary Use Cases:**

1. **Register.** The guest creates an account by providing their email, password, name, and law onboarding data (region, university, major, level). The system validates inputs with Zod, hashes the password with bcrypt, creates the user record, generates a JWT access/refresh token pair, and returns the tokens to the client.

2. **Log In.** The user provides email and password. The system verifies credentials, generates a new session identifier (`currentSessionId` via UUID), invalidating any previous sessions, creates new tokens, and returns them to the client.

3. **Refresh Session.** The client sends a refresh token. The system verifies validity, revokes the consumed token (rotation), generates a new token pair, and returns the fresh tokens.

4. **Log Out.** The member revokes all active refresh tokens for their account.

5. **Validate Session.** On cold start, the app calls `GET /api/auth/me` to verify that the stored token remains valid and that the session has not been superseded by a login from another device.

6. **View Profile.** The member retrieves their complete profile information via the API.

7. **Edit Profile.** The member updates personal and academic information.

8. **Change Language.** The member switches between FR and EN, with the preference persisted locally in MMKV.

9. **Toggle Theme.** The member switches between light and dark modes, stored in the Redux theme slice and persisted locally.

### 3.3.2 Sequence Diagram: JWT Authentication & Session Invalidation

*(Insert here: Figure 3.2 — Sequence Diagram: JWT Authentication & Session Invalidation)*

The sequence diagram illustrates the complete authentication flow — from login through resource access — including the automatic token refresh mechanism and the single-session enforcement policy.

**Scenario 1 — Login and Resource Access:**

```
Client (App)                Backend API                 Database
    |                            |                          |
    |--- POST /api/auth/login -->|                          |
    |    {email, password}       |                          |
    |                            |-- findUnique(email) ---->|
    |                            |<--- user record ---------|
    |                            |                          |
    |                            |  [bcrypt.compare password]
    |                            |  [Verify banned === false]
    |                            |  [Generate sessionId (uuid)]
    |                            |  [Update currentSessionId + lastLoginAt]
    |                            |                          |
    |                            |-- update user ---------->|
    |                            |  [Sign accessToken (JWT, 15min)]
    |                            |  [Sign refreshToken (JWT, 7d)]
    |                            |-- create refreshToken -->|
    |                            |                          |
    |<-- {accessToken,           |                          |
    |     refreshToken, user} ---|                          |
    |                            |                          |
    |  [Store tokens in MMKV]                               |
    |  [Update Redux authSlice]                             |
    |                            |                          |
    |--- GET /api/subjects ----->|                          |
    |    Authorization: Bearer   |                          |
    |                            |  [requireAuth middleware] |
    |                            |  [verifyAccessToken]      |
    |                            |  [Check currentSessionId match]
    |                            |  [Check banned === false]  |
    |                            |                          |
    |<-- {subjects data} --------|                          |
```

**Scenario 2 — Automatic Token Refresh:**

When a request returns 401, the `makeApiRequest` client-side utility intercepts the response, attempts to refresh the token via `POST /api/auth/refresh`, stores the new tokens, and retries the original request transparently. If the refresh also fails, the user is force-logged out.

**Scenario 3 — Session Invalidation (Login from Another Device):**

When the `requireAuth` middleware detects that the token's `sessionId` does not match the user's `currentSessionId` in the database, it returns a 401 with the message "Session expired. Your account was logged in on another device." The client-side `makeApiRequest` detects this specific message and immediately dispatches a `logout()` action, clearing tokens from MMKV and resetting the Redux state.

---

## 3.4 Implementation (Login, Registration, Profile Management)

### Login Screen

*(Insert here: Figure 3.3a — Screenshot: Login Screen)*

The Login screen (`src/features/auth/LoginScreen.tsx`) presents a clean interface with:
- Text fields for **email** and **password** with client-side validation.
- A **Log In** button that triggers `POST /api/auth/login`.
- A link to the registration screen for new users.
- A **language selector** (FR/EN) enabling language switching before authentication.
- Full **dark mode** support with automatic color adaptation.

Upon successful authentication, tokens are stored in MMKV, the Redux `authSlice` is updated with the user object and `isLoggedIn = true`, and the `MainNavigation` component automatically transitions from the auth screens (Login/Signup) to the authenticated app shell (MainTabs).

### Registration Screen

*(Insert here: Figure 3.3b — Screenshot: Registration Screen)*

The Registration screen (`src/features/auth/SignupScreen.tsx`) is a multi-step form collecting:

**Step 1 — Personal Information:** Full name, email address, password with confirmation.

**Step 2 — Law Onboarding:** Region selection (TUNIS, SOUSSE, SFAX, JENDOUBA, KAIROUAN, GABES, NABEUL, BIZERTE), which dynamically filters the university list; university selection from the filtered options; major (Private Law / Public Law) applicable from L2; and academic level (L1 / L2 / L3).

The region-to-university mapping is defined in `backend/src/constants/lawOnboarding.ts`, maintaining consistency between the mobile interface and the backend validation. The backend validates all fields with Zod, checks email uniqueness, hashes the password, creates the user with the full law profile, generates tokens, and returns the authenticated session.

### Profile Management

*(Insert here: Figure 3.4 — Screenshot: Profile Screen)*

The Profile screen (`src/features/profile/ProfileScreen.tsx`) allows the member to:
- **View** their information: name, email, role, subscription tier, region, university, major, level.
- **Edit** personal and academic fields via `PUT /api/auth/profile`.
- **Change language** using `i18next.changeLanguage()` with MMKV persistence.
- **Toggle theme** via the Redux `themeSlice`.
- **Log out** via `dispatch(logout())`, which clears MMKV tokens and resets Redux state.
- **Access the admin panel** (visible only for ADMIN and TEACHER roles).

### Security Implementation

The backend security implementation is layered and defense-in-depth:

**`requireAuth` middleware** extracts the Bearer token, verifies the JWT signature, loads the user from the database, checks that the account is not banned, confirms that the token's session ID matches the current session, and injects `req.auth` with `userId`, `role`, and `sessionId`.

**`optionalAuth` middleware** operates identically but does not fail when no token is present — used for routes accessible to guests with enriched content for authenticated users (e.g., the subject list with personalized filtering).

**`requireRole` middleware** verifies that the authenticated user's role is within the allowed set — used to restrict routes to admins (`requireRole('ADMIN')`) or teachers (`requireRole('TEACHER', 'ADMIN')`).

**`makeApiRequest` client utility** automatically attaches the Bearer token to every request, handles 401 responses with transparent token refresh and retry, detects session-expired messages for immediate forced logout, and applies a 10-second timeout with AbortController support.

---

## 3.5 Conclusion & Retrospective

### Achievements

Sprint 1 delivered a complete and secure authentication system covering all twelve planned user stories:

- ✅ Registration with contextual law onboarding (Tunisian regions, universities, majors).
- ✅ Secure login with JWT access and refresh token generation.
- ✅ Automatic, transparent token refresh with rotation.
- ✅ Logout with refresh token revocation.
- ✅ Cold-start session validation to detect invalidated sessions.
- ✅ Rate limiting on authentication endpoints.
- ✅ Single active session policy (new login invalidates previous sessions).
- ✅ Banned-account enforcement on every protected request.
- ✅ Profile viewing and editing.
- ✅ Bilingual language switching (FR/EN) with persistence.
- ✅ Light/dark theme toggle with persistence.

### What Went Well

- The clean separation of `requireAuth`, `optionalAuth`, and `requireRole` establishes a modular authorization foundation that every subsequent sprint leverages.
- The transparent token refresh in `makeApiRequest` is invisible to the rest of the application, preventing auth concerns from leaking into feature code.
- The law onboarding data captured at registration directly feeds the Sprint 2 access control system.

### Areas for Improvement

- Automated test coverage for authentication flows should be expanded.
- Password reset ("forgot password") functionality was identified as a future user story.
- Push notifications for session events (forced logout) remain to be connected.

Sprint 2 will build upon this foundation to construct the content catalog and the profile-driven access control system.
