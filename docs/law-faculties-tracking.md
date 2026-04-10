# Law faculties — curriculum & seed tracking

Use this file to see which institutions have **premium law subjects** seeded in the database and which are only **selectable at signup** (no module catalogue yet).

**Source of truth in code**

- Seeded list: `backend/prisma/seed.ts` → `LAW_CURRICULUM_BY_UNIVERSITY`
- University strings must match `backend/src/constants/lawOnboarding.ts` → `LAW_UNIVERSITIES_BY_REGION` (exact spelling).
- Official programme structure for FDSEPS, FDSF, FDSPT, and FSJPST is reflected in `standardLawLmdCurriculum.ts` and `fsjpstLawCurriculum.ts` (aligned with faculty LMD PDFs).

**BAC (high school) catalogue:** not seeded. `seed.ts` calls `deleteBacCatalog()` so only `programType: BAC` subjects (and their chapters/lessons) are removed; law rows are not deleted by that step.

**Global law demos (all students):** two `FREE_GLOBAL` subjects (`law-free-*`), not tied to a faculty.

---

## Done — subjects seeded (`PREMIUM_SCOPED` law subjects)

| Faculty (exact app string) | Region | Curriculum file | ID prefix | Notes |
|----------------------------|--------|-----------------|-----------|--------|
| Faculte de Droit et des Sciences Economiques et Politiques de Sousse (FDSEPS) | SOUSSE | `standardLawLmdCurriculum.ts` | `fdseps-` | National LMD matrix (L2 split privé/public) |
| Faculte de Droit de Sfax (FDSF) | SFAX | `standardLawLmdCurriculum.ts` | `fdsf-` | Same matrix as FDSEPS/FDSPT |
| Faculte de Droit et des Sciences Politiques de Tunis (FDSPT) | TUNIS | `standardLawLmdCurriculum.ts` | `fdspt-` | Same matrix |
| Faculte des Sciences Juridiques, Politiques et Sociales de Tunis (FSJPST) | TUNIS | `fsjpstLawCurriculum.ts` | `fsjpst-` | L1+L2 common; L3 split only |

---

## Not seeded yet — in onboarding only

Students can pick these at registration, but **no faculty-specific subject tree** exists until you add a row to `LAW_CURRICULUM_BY_UNIVERSITY` (and usually a curriculum file + `lawUniversityConstants.ts` entry).

### Tunis

- Law & Business School (LBS)
- Universite Centrale (UC)
- Universite Libre de Tunis (ULT)
- Mediterranean Institute of Technology (MIT)
- Ecole Internationale Superieure Privee de Droit et des Affaires (ISPDA)

### Sousse

- IHE Sousse Business & Law School (IHES)
- Universite Privee de Sousse (UPS)

### Sfax

- International Private Business Management University (UIMA)
- North-American Private University of Sfax (IIT)

### Other regions

- Jendouba: FSJEGJ  
- Kairouan: ISEJPK  
- Gabes: ISEJG  
- Nabeul: FSEGN  
- Bizerte: FSEGB  

---

## When you add a new faculty

1. Add a constant in `backend/src/constants/lawUniversityConstants.ts` (and `LAW_UNIVERSITIES_SEED_ORDER` if you want delete-on-reseed to include it).
2. Add or reuse a curriculum array (`standardLawLmdCurriculum`, or a new file if the programme differs).
3. Append `{ prefix, university, rows }` to `LAW_CURRICULUM_BY_UNIVERSITY` in `backend/prisma/seed.ts`.
4. Run `npx prisma generate` if schema changed, then `npx tsx prisma/seed.ts` (seed deletes existing premium law rows for universities in `LAW_UNIVERSITIES_SEED_ORDER` before re-inserting).

---

## Suggested app changes & next features

### High impact, aligns with current design

1. **Subscription payments** — Replace manual admin Premium switch with Stripe (or similar) webhooks that set `subscriptionTier` and expiry; keep admin override for support.
2. **Refresh user after admin changes** — On app resume or Profile focus, call `GET /api/auth/me` so `subscriptionTier` updates without re-login.
3. **Teacher accounts without law fields** — If a teacher is promoted from a non-law path, enforce `lawUniversity` (and region) via admin edit or a dedicated onboarding step so law posting rules always work.
4. **Premium lesson UX** — In lesson lists, show a lock or “Premium” label for `audience: PREMIUM` when the user is on FREE, with a CTA to upgrade (even if upgrade is “contact admin” until payments exist).
5. **Audit log** — Log admin actions (premium toggles, bans, teacher law assignments) for accountability.

### Product / content

6. **Real audio per module** — Placeholder chapters exist; prioritise recording/upload per subject and use **Access** (free vs paid) on each lesson.
7. **Per-faculty validation** — Private schools may use a different matrix than the public LMD standard; confirm with each institution before reusing `STANDARD_LMD_LAW_CURRICULUM`.
8. **Search / filters** — Filter subjects by semester, level, or major inside the app for large catalogues.

### Technical

9. **E2E tests** — Critical paths: student visibility by university/level/tier, teacher post permission, lesson audience filtering.
10. **Migrations vs `db push`** — For production, prefer `prisma migrate` with reviewed SQL instead of only `db push`.

Update the **Done** table above whenever you ship a new seeded faculty.
