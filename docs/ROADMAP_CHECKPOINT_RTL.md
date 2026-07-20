# Checkpoint: Arabic Localization (RTL) — v1.1

Date: 2026-07-20

Summary:
- Scope: repo-wide RTL sweep and Arabic i18n (v1.1) wiring.
- Current status: automated replacement of literal `flexDirection: 'row'` usages with `dirRow()` helper; Arabic translation file added; i18n wired to persist language and apply RTL via `I18nManager`.

What was changed (high level):
- Added `src/lib/rtl.ts` helper (centralizes `dirRow()` and `textAlign()` logic).
- Added Arabic translations: `src/lib/i18n/ar.ts` and wired in `src/lib/i18n/index.ts`.
- Converted many layout rows across screens/components to use `dirRow()` (examples below).

Representative files edited:
- `src/lib/rtl.ts` (new helper)
- `src/lib/i18n/ar.ts`, `src/lib/i18n/index.ts`
- `src/features/*` : HomeScreen, ProfileScreen, Admin screens, Moderation, Stats, Announcements, Teacher composer, ContentManagement, UserManagement, etc.

Remaining work:
- Replace explicit `textAlign: 'left'|'right'` usages with `textAlign()` helper or conditional values.
- Replace absolute `left`/`right` offsets with `start`/`end` or conditional logic where appropriate.
- Arabic typography: add Arabic-capable fonts and tune `letterSpacing`/`lineHeight`.
- Visual QA: run the app on device/emulator, switch language to Arabic, and perform full visual verification (app restart required after forcing RTL).
- Run `npm run lint` and `tsc` locally and fix any issues.

How to test this checkpoint locally:
1. Install deps and start backend and app as usual (see project `README.md`).
2. In-app: open settings → Language → choose `Arabic (العربية)`.
3. Restart the app (Expo requires a reload/restart to apply forced RTL). If using `expo-updates`, `applyRTLForLanguage()` attempts `Updates.reloadAsync()` otherwise fully quit and restart Expo.
4. Verify UI flips: header/navigation, card rows, icon positions, alignment and spacing.

Notes & Next Actions:
- This checkpoint focuses on low-risk, mechanical changes using `dirRow()` to make RTL flipping easy to revert.
- I recommend addressing `textAlign` and absolute offsets in a follow-up sweep and then perform visual QA with screenshots for core screens.

Files linked:
- Roadmap reference: ../docs/ROADMAP.md

-- End of checkpoint --
