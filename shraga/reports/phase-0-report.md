# Phase 0 Report - Architecture decisions & foundation
Prompt: shraga/prompts/phase-0-prompt.md (+ shraga/prompts/phase-0-fix-1.md, shraga/prompts/phase-0-fix-2.md)   Date: 2026-10-29   Round: 4

## 1. Summary
The project now has a runnable Vite + Preact skeleton with layered folders, an RTL Hebrew home shell (DESIGN_SYSTEM.md v1.3 / sketch option 3 with static placeholder data, tokens as CSS variables, Rubik self-hosted), a Supabase CLI config with an empty migrations folder, dev / prod env separation, Vercel config, lint / format / Vitest / CI, and a build-time bundle secret scan. Twelve ADRs close PRD section 13 questions 1-10 (and record test tooling and secrets location); the identity ADR (0003) was approved by the owner. Hebrew speech feasibility findings are in `docs/speech-feasibility.md`. Production is deployed at https://mapmyshopping.vercel.app (latest: fix round 3). The local Supabase stack is replaced by a recorded deviation (see sections 7-8). Sections 2-5 describe the original Round 1 state; section 9 holds the evidence for each fix round and supersedes them where they differ.

## 2. Scope Coverage
| Scope item / acceptance criterion | Status | Where (files) |
|---|---|---|
| ADRs for PRD 13 Q1-6, 9, 10 (+ Q7, Q8) | Done | `docs/adr/0001`-`0012`, `docs/adr/README.md` |
| Identity ADR against verified Supabase docs, owner approval recorded | Done | `docs/adr/0003-identity-and-sessions.md` (Status + "Owner approval") |
| Speech feasibility doc (he-IL, Chrome Android, Safari iOS, desktop Chrome, cloud processing, manual checks) | Done | `docs/speech-feasibility.md`, `docs/adr/0009-hebrew-speech-recognition.md` |
| Skeleton with framework / build tool, layered folders | Done | `package.json`, `vite.config.js`, `src/presentation`, `src/application`, `src/data-sync`, `src/security`, `src/locale` |
| Supabase CLI local stack + empty migrations folder | Deviation - local stack not started (Docker not installed); hosted dev project `MapMyShopping` verified empty instead (fix round 1, needs Shraga acceptance) | `supabase/config.toml`, `supabase/migrations/.gitkeep` |
| Dev / prod env separation via `.env.example` | Done | `.env.example`, `.gitignore`, `src/data-sync/publicConfig.js`, ADR 0012 |
| Vercel config | Done | `vercel.json` |
| RTL shell, tokens, Rubik self-hosted, 2x2 home placeholders | Done | `index.html`, `src/presentation/styles/tokens.css`, `base.css`, `screens/HomeScreen.jsx`, `src/main.jsx` |
| Lint, format, unit test runner, CI build workflow | Done | `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.github/workflows/ci.yml` |
| Bundle secret scan in build | Done | `scripts/scan-bundle-secrets.mjs`, `scripts/secret-patterns.mjs`, `npm run build` |
| `.claude/rules/project.md` | Done | `.claude/rules/project.md` |
| AC-0.1 Every PRD open question 1-10 has an ADR with decision or "unvalidated" mark | Done | Q1 0003, Q2 0004, Q3 0005, Q4 0006, Q5 0007, Q6 0008, Q7 0009 (Unvalidated), Q8 0010 (Deferred / Unvalidated), Q9 0011, Q10 0001; Q11 closed by DESIGN_SYSTEM.md |
| AC-0.2 Builds, runs locally, deploys to Vercel; `dir="rtl"` and tokens applied | Done - deployed to https://mapmyshopping.vercel.app (fix round 1) | `vercel.json`; section 9 |
| AC-0.3 No service-role key or secret in client bundle (bundle grep) | Done | section 5 |
| AC-0.4 Test command with >= 1 passing test; commands in project.md | Done | `tests/unit/*`, `.claude/rules/project.md` |
| Risk gate: R1 identity ADR approved | Done | ADR 0003 |
| Risk gate: secrets location defined | Done | ADR 0012 |
| Risk gate: R5 feasibility findings recorded | Done (manual device check pending, owner) | `docs/speech-feasibility.md` |

## 3. Files Changed
- `package.json`, `package-lock.json` - created - scripts and dependencies
- `index.html` - created - `<html lang="he" dir="rtl">` entry
- `vite.config.js` - created - Preact preset, `envPrefix: 'VITE_'`, Vitest config
- `src/main.jsx` - created - mounts app, imports Rubik and styles
- `src/presentation/App.jsx` - created - root component
- `src/presentation/screens/HomeScreen.jsx` - created - 2x2 placeholder tiles (disabled, "בקרוב")
- `src/presentation/styles/tokens.css` - created - all DESIGN_SYSTEM tokens as CSS variables
- `src/presentation/styles/base.css` - created - base RTL layout, logical properties only, focus ring, reduced motion
- `src/locale/he.js` - created - Hebrew UI strings
- `src/data-sync/publicConfig.js` - created - reads only the two allowed public env variables, throws on any other `VITE_` var
- `src/application/.gitkeep`, `src/security/.gitkeep` - created - empty layer folders
- `scripts/secret-patterns.mjs` - created - secret detection patterns
- `scripts/scan-bundle-secrets.mjs` - created - scans `dist/`, exits 1 on findings
- `tests/unit/secret-patterns.test.js` - created - 7 tests for detection logic
- `tests/unit/public-config.test.js` - created - 2 tests for env allow-list
- `tests/unit/home-screen.test.jsx` - created - home renders 4 Hebrew tiles
- `tests/unit/rtl-shell.test.js` - created - `lang="he" dir="rtl"`, color token parity with DESIGN_SYSTEM.md
- `eslint.config.js`, `.prettierrc.json`, `.prettierignore` - created - lint / format; ESLint blocks `SERVICE_ROLE` / `sb_secret_` literals in `src/`
- `.gitignore`, `.env.example` - created - env files ignored, placeholders only
- `vercel.json` - created - Vite build, SPA rewrite, security headers, `microphone=(self)`
- `.github/workflows/ci.yml` - created - lint, format check, test, build (+ scan)
- `supabase/config.toml` - created by `supabase init`; `site_url` set to `http://127.0.0.1:5173`
- `supabase/migrations/.gitkeep` - created - empty migrations folder
- `docs/adr/README.md`, `docs/adr/0001`-`0012` - created - ADRs
- `docs/speech-feasibility.md` - created - R5 findings
- `.claude/rules/project.md` - created - stack, commands, conventions
- `.claude/launch.json` - created - dev server config for the desktop app preview

## 4. Dependencies
- preact@11.1.0 - UI framework (ADR 0001)
- lucide-preact@1.63.0 - icons (DESIGN_SYSTEM section 8)
- @fontsource-variable/rubik@5.3.0 - self-hosted Rubik
- vite@8.3.5, @preact/preset-vite@2.10.6 - build tool
- vitest@5.0.5, jsdom@30.1.3, @testing-library/preact@3.2.6 - unit tests (ADR 0002)
- eslint@10.13.0, @eslint/js@10.0.1, globals@17.13.0, eslint-config-prettier@10.1.8, prettier@3.9.10 - lint / format
- supabase@2.122.0 (dev) - Supabase CLI

`npm install` reported 0 vulnerabilities.

## 5. Verification
Tests: `npm test`
```
 Test Files  4 passed (4)
      Tests  12 passed (12)
```
Added 12 tests, ran 12, passed 12, failed 0, skipped 0.

Lint: `npm run lint` -> exit 0, no findings.
Format: `npm run format:check` -> "All matched files use Prettier code style!"

Build + secret scan: `npm run build`
```
dist/index.html                     0.47 kB
dist/assets/index-CrQ4rY0S.css      4.79 kB
dist/assets/index-CEc_KnHc.js      19.33 kB
(+ Rubik woff2 subsets: hebrew, latin, latin-ext, cyrillic, cyrillic-ext, arabic)
✓ built
Bundle secret scan passed: 3 file(s) scanned in dist, 0 findings.
```
Negative check of the scanner: copied `dist/` to a scratch folder, appended `sb_secret_abcdefghijklmnop` to the JS bundle, ran `node scripts/scan-bundle-secrets.mjs <copy>` -> `SECRET FOUND: supabase-secret-key ...`, `exit=1`.

Bundle grep (AC-0.3): `grep -rEc "service_role|sb_secret_|SERVICE_ROLE|BEGIN .*PRIVATE KEY" dist --include=*.js --include=*.css --include=*.html` -> 0 matches in all 3 files.

Browser check (dev server, mobile viewport 375x812): `document.documentElement.dir = "rtl"`, `lang = "he"`, body font `"Rubik Variable", system-ui, ...`, `--color-primary = #2e7d32`, `document.fonts.check` for Rubik on Hebrew text = true; fonts loaded from the local origin (`rubik-hebrew-wght-normal.woff2`, `rubik-latin-wght-normal.woff2`), no font CDN request. 2x2 tile grid rendered right-to-left.

Local Supabase: `npx supabase start` -> `NOT AVAILABLE - Docker / Podman not installed on this machine` (`DockerLifecycleInspectError: docker: command not found`).
Vercel deploy: `NOT AVAILABLE - requires the owner's Vercel account` (agents must not create accounts or enter credentials).
CI workflow: written but not run - the folder is not a git repository and has no GitHub remote yet.

## 6. How to Try It
Run locally:
1. `cd "C:\Users\liran\claude projects\projects\MapMyShopping"`
2. `npm ci`
3. `npm run dev`
4. Open http://localhost:5173 (or the production URL https://mapmyshopping.vercel.app) in the browser's mobile view (375x812). You see, on a warm off-white page: a grey date line "יום חמישי · 29 באוק׳" above the title "הרשימה של הבית", with two round white buttons (search, settings) on the left; a dark ink card with a lime progress ring "5/12 נאספו", "הקנייה הבאה", "12 פריטים ב-4 אזורים", "7 נותרו לאסוף", a lime sync line and a lime "יוצאים לקנות" button with a dark arrow square; a white "המסלול בחנות" card with 4 stops (ירקות ופירות done with a check, then מוצרי חלב, מאפים, ניקיון) and an "עריכת סדר" link; a "קיצורים" row with 3 white tiles (הוספה קולית, מועדפים, קטלוג); and a floating white bottom bar (בית active, רשימה, a raised dark "+" in the middle, מועדפים, הבית שלי). All data is static sample data; nothing is clickable except "בית". Disabled buttons (search, settings, "יוצאים לקנות", center "+") are shown at 40% opacity.
5. Optional: `npm test`, `npm run lint`, `npm run build`.

Owner steps still open:
- Local Supabase: install Docker Desktop, start it, then run `npm run db:start` (prints the local URL and anon key; copy them into `.env.development.local` using `.env.example` as the template).
- Supabase projects: in the Supabase dashboard create `mapmyshopping-dev` and `mapmyshopping-prod` (ADR 0012). Keep the service-role / secret key out of Vercel and the repo.
- Vercel: the project `mapmyshopping` is CLI-deployed (fix rounds 1-3). Still open: `git init`, push to GitHub and connect the repo in Vercel; set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` per environment when Phase 1 needs them.

## 7. Deviations from the Plan
| Deviation | Reason | Approved by user? |
|---|---|---|
| App identity (`app_users.id`) is separate from `auth.uid()`, bound through `devices` (refines PRD section 8 "users.id = auth.uid") | Supabase cannot issue a session for an existing anonymous user on a new device, so device replacement needs a server-side binding switch | Yes - ADR 0003 approved by owner 2026-10-28 |
| "View recovery code after warning" is implemented as rotate-after-warning | PRD forbids a persistent plaintext copy; a hashed code cannot be shown again | Recorded in ADR 0004 for Shraga review; not separately asked |
| ADRs also written for Q7 (pointer to findings) and Q8 (Deferred / Unvalidated) beyond the prompt's list | AC-0.1 requires an ADR for every question 1-10 | Within AC-0.1 |
| Supabase local stack not started; the existing empty hosted project `MapMyShopping` (ref `twdpgjlyjspdrkkofyqs`, eu-central-1) is used as the dev project instead of a new `mapmyshopping-dev` | Docker not installed; owner chose to reuse the existing project rather than create one | Yes (owner, fix round 1). Needs Shraga: ADR 0012 name, Phase 1 RLS integration tests target (local stack vs hosted dev) |
| Vercel project `mapmyshopping` created by CLI under the owner's account (scope `liran16`); production deploy, no env vars set | Phase 0 code reads no Supabase env at runtime | Yes (owner-approved connectors) |

## 8. Known Issues & Open Items
- Local Supabase stack still not available (no Docker); Phase 1 RLS integration tests need either Docker or an approved hosted-dev test approach (Shraga decision).
- Vercel env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` per environment) not set yet; needed when Phase 1 code reads them. `mapmyshopping-prod` Supabase project not created.
- Vercel project is CLI-deployed, not Git-connected; no git repository yet; CI workflow untested until pushed to GitHub.
- Manual Hebrew speech check on Android Chrome / iPhone Safari / desktop Chrome pending (owner), checklist in `docs/speech-feasibility.md`.
- Unvalidated items carried forward: ADR 0003 U1-U3 (Phase 1), 0004 U1-U2 and 0005 U1 (Phase 9), 0011 U1-U2 (Phase 7), 0010 backup / monitoring (Phase 11).
- Only Hebrew + Latin Rubik subsets ship (since fix round 2).

## 9. Fix Rounds
| Round | Review items addressed | Result |
|---|---|---|
| 1 | V1 (Vercel deploy), V2 (Supabase stack) | V1 fixed; V2 replaced by a recorded deviation (see below) |
| 2 | Owner rejected the shell look; DESIGN_SYSTEM.md v1.2 (Foodnoms direction) applied; V6 (Rubik subsets) | Tokens and home shell rebuilt to v1.2; only Hebrew + Latin Rubik shipped; redeployed to production (see below) |
| 3 | Owner rejected v1.2; `phase-0-fix-2.md` (DESIGN_SYSTEM.md v1.3, sketch option 3); also C8 (40% disabled opacity) and V9 (stale "How to Try It") | Tokens rewritten to v1.3, home shell rebuilt to the sketch with static placeholders, Rubik kept, redeployed and compared at 375x812 (see below) |

### Fix round 1 evidence
V1 - Vercel deploy (Vercel CLI 65.5.0, already logged in as the owner):
- `npx vercel deploy --prod --yes --project mapmyshopping --create-if-missing` -> `readyState: READY`, deployment `dpl_ECmnFpCec9WqwSYgsWzYUH8uXGB8`, URL https://mapmyshopping.vercel.app (alias of https://mapmyshopping-eap9wmcxt-liran16.vercel.app), region fra1.
- Build log (`vercel inspect --logs`): `> vite build && node scripts/scan-bundle-secrets.mjs dist` ... `✓ built in 514ms` ... `Bundle secret scan passed: 3 file(s) scanned in dist, 0 findings.`
- `curl -sI https://mapmyshopping.vercel.app` -> `200`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), geolocation=(), microphone=(self)`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- Served HTML: `<html lang="he" dir="rtl">`. Served CSS: `--color-primary:#2e7d32`; font `url(/assets/rubik-hebrew-wght-normal-BIkpbuMU.woff2)`, no external URL in the CSS; the woff2 returns `200`, `font/woff2`, `Cache-Control: public, max-age=31536000, immutable`.
- Served JS bundle grep for `service_role|sb_secret_|SERVICE_ROLE` -> 0.
- Browser (built-in browser, production URL): `dir=rtl`, `lang=he`, `--color-primary=#2e7d32`, body font `"Rubik Variable", ...`, `document.fonts.check` Rubik on Hebrew = true, fonts loaded only from `https://mapmyshopping.vercel.app/assets/` (hebrew + latin subsets), 4 tiles rendered.
- No env vars and no secret / service-role key added to Vercel. `.vercel/` is git-ignored.

V2 - Supabase (Supabase connector):
- Docker still not installed; `supabase start` not run.
- Organization `LiranRein's Org` already had an empty project `MapMyShopping` (ref `twdpgjlyjspdrkkofyqs`, eu-central-1, Postgres 17, `ACTIVE_HEALTHY`, created 2026-10-28). Owner chose to use it as the dev project instead of creating `mapmyshopping-dev`.
- `list_tables` (schemas `public`, `app_private`) -> `[]`; `list_migrations` -> `[]`. Local `supabase/migrations/` still contains only `.gitkeep`.
- No keys retrieved or stored.
- Deviation for Shraga: (a) dev project name differs from ADR 0012; (b) the Plan's "Supabase CLI local stack" is not running, so Phase 1 must decide where RLS / RPC integration tests run.

Re-run after fixes: `npm run lint` exit 0; `npm run format:check` all files formatted; `npm test` 4 files, 12 passed; `npm run build` built, secret scan 0 findings.

### Fix round 2 evidence
Prompt: `shraga/prompts/phase-0-fix-1.md` ("Phase 0: corrections 1", DESIGN_SYSTEM.md v1.2). Sections 1-8 above describe the Round 2 state; this section supersedes them for the home shell look, tokens and font subsets.

Files changed:
- `src/presentation/styles/tokens.css` - rewritten to v1.2: all 18 `--color-*` role tokens, the six `--tint-N` / `--color-area-N` pairs, type scale (`--font-display`, `-h1`, `-h2`, `-h3`, `-body`, `-body-s`, `-caption`), `--space-1..12` incl. `--space-5`, radius 14 / 26 / 32 / 9999, single `--shadow-dialog`, layout (`--page-gutter: 20px`, `--bottom-nav-height: 68px`, 560px max width, 44px touch target), motion (150 / 250 / 400ms, ease-out). Removed v1.0 tokens: `--color-primary-soft`, `--color-secondary`, `--color-accent`, `--font-body-l`, `--font-small`, `--font-label`, `--shadow-sm/md/lg`.
- `src/presentation/screens/HomeScreen.jsx` - rebuilt: white top bar with two-tone H1 ("הרשימה של" graphite + "הבית" in `--color-brand`) and two disabled 44px round Fog icon buttons (search, settings, Hebrew `aria-label`); Fog summary card (`--radius-lg`, Display "0" + "פריטים ברשימה", disabled full-width graphite "לרשימה"; progress ring not rendered); 2x2 Fog cards (`--radius-md`, 56px icon squares with area pairs 1-4); fixed bottom `<nav>` with 4 items - "בית" is a link with `aria-current="page"` (Fog pill, brand icon, brand-strong label), רשימה / הוספה / מועדפים are disabled buttons.
- `src/presentation/styles/base.css` - rewritten for the v1.2 components; flat (no `box-shadow`), logical properties only, focus ring `--color-active`, disabled at 40% opacity, page bottom padding clears the nav.
- `src/presentation/styles/fonts.css` - created - `@font-face` for Rubik Variable Hebrew and Latin subsets only (files from `@fontsource-variable/rubik`, same `unicode-range` as the package).
- `src/main.jsx` - imports `fonts.css` instead of the full `@fontsource-variable/rubik` entry (closes V6).
- `src/locale/he.js` - added title parts, top-bar labels, summary strings, nav strings.
- `index.html` - `theme-color` changed from the old green `#2E7D32` to `#FFFFFF` (v1.2 white canvas; only colour left from v1.0).
- `tests/unit/home-screen.test.jsx` - rewritten: 5 tests (two-tone title, disabled top-bar icon buttons, summary card, 4 grid cards with area-coloured squares, `<nav>` with 4 items and a single `aria-current="page"` on "בית").

No new dependencies. No Supabase calls, no data, no behaviour behind any placeholder.

Verification:
- `npm run lint` -> exit 0.
- `npm run format:check` -> "All matched files use Prettier code style!"
- `npm test` -> `Test Files 4 passed (4)`, `Tests 16 passed (16)` (12 before; home test file now has 5 instead of 1). Token parity test (`rtl-shell.test.js`) passes against v1.2 (every `--color-*` / `--tint-*` row in DESIGN_SYSTEM.md, incl. the six area pairs).
- `npm run build`:
```
dist/index.html                                       0.47 kB
dist/assets/rubik-hebrew-wght-normal-BIkpbuMU.woff2   9.34 kB
dist/assets/rubik-latin-wght-normal-CnQIisVs.woff2   35.34 kB
dist/assets/index-B4lYJPnq.css                        5.78 kB
dist/assets/index-Dwf7Bk9-.js                        21.64 kB
✓ built
Bundle secret scan passed: 3 file(s) scanned in dist, 0 findings.
```
`dist/assets` contains only the Hebrew and Latin woff2 files (arabic, cyrillic, cyrillic-ext, latin-ext and italic files no longer emitted). Bundle grep `service_role|sb_secret_|SERVICE_ROLE` -> 0 in all 3 files.

Vercel production redeploy (same command as fix round 1, `npx vercel deploy --prod --yes --project mapmyshopping`):
- Deployment `dpl_2YxX8JRSiekAWau7PkdWpzUVrPjf`, target production, status Ready, https://mapmyshopping-i0xa54q5s-liran16.vercel.app aliased to https://mapmyshopping.vercel.app.
- Build log: `> vite build && node scripts/scan-bundle-secrets.mjs dist` ... `✓ built in 536ms` ... `Bundle secret scan passed: 3 file(s) scanned in dist, 0 findings.`
- `curl -sI https://mapmyshopping.vercel.app` -> `200`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), geolocation=(), microphone=(self)`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- Served HTML: `<html lang="he" dir="rtl">`, `theme-color` `#FFFFFF`, assets `index-Dwf7Bk9-.js` / `index-B4lYJPnq.css` (identical hashes to the local build). Served CSS: `--color-brand:#ff5406`, `--color-primary:#2f2f2f`; only `url(/assets/rubik-hebrew-...)` and `url(/assets/rubik-latin-...)`. Served JS secret grep -> 0.
- No env vars or keys added to Vercel.

Browser check (built-in browser, 375x812, both dev server and production URL): `dir=rtl`; H1 text "הרשימה של הבית", "הבית" computed colour `rgb(255, 84, 6)`; summary card background `rgb(245, 245, 245)`, radius 32px; grid cards radius 26px; primary button `rgb(47, 47, 47)`; 4 tiles; nav 4 items, `aria-current` on "בית"; 0 elements with a `box-shadow`; `document.fonts.check` Rubik on Hebrew = true; font requests only `rubik-hebrew-wght-normal` and `rubik-latin-wght-normal` from the same origin; no horizontal scroll (scrollWidth 375); no console errors.

Mobile screenshot description (375x812, production): white page. Top row: bold title "הרשימה של הבית" on the right with "הבית" in orange, and on the left two light-grey round buttons (gear, magnifier), faded as disabled. Below, a large light-grey card with rounded 32px corners: big bold "0" on the right, "פריטים ברשימה" under it, and a full-width dark-graphite pill "לרשימה" shown faded (disabled). Below that, a 2x2 grid of light-grey rounded cards, right to left: "רשימת קניות" (orange checklist icon on a peach square), "הוספת פריטים" (green plus on mint), "מועדפים" (sky-blue star on light blue), "הגדרות" (plum gear on lilac); caption "בקרוב" under the grid. Fixed white bottom bar with a hairline top edge and four items right to left: "בית" (orange house in a light-grey pill, orange label), then grey "רשימה", "הוספה", "מועדפים". No shadows anywhere.

Deviations: none beyond the `theme-color` meta update noted above (part of the shell look). Known issues: the "בקרוב" caption under the grid is kept from Round 2 as the shared description of the disabled cards.

### Fix round 3 evidence
Prompt: `shraga/prompts/phase-0-fix-2.md` ("Phase 0: corrections 2", DESIGN_SYSTEM.md v1.3, sketch option 3). Supersedes fix round 2 for tokens and the home shell.

Files changed:
- `src/presentation/styles/tokens.css` - rewritten to v1.3: all 17 `--color-*` rows (ink, ink-2, accent, accent-hover, accent-soft, bg, surface, text, text-on-ink, text-muted #646E69, text-subtle #707A75, border, success, warning, error, info, collected); type scale `--font-h1` (+ `--font-h1-tracking: -0.3px`), `-hero`, `-ring`, `-h2`, `-button`, `-body-strong`, `-body`, `-meta`, `-caption`, `-micro`; `--space-1..12`; radius 12 / 18 / 20 / 24 / 28 / 9999 (`--radius-sm` .. `--radius-2xl`, `--radius-full`); single `--shadow-nav: 0 10px 30px rgba(20,32,27,.12)`; layout from section 5 (430px column, 20px gutter, 24px top / 124px bottom padding, 26px section gap, 10px tile gap, 70px / 398px nav); motion 150 / 250 / 400ms ease-out. Removed v1.2 tokens: `--color-brand`, `-brand-strong`, `-primary`, `-primary-hover`, `-active`, `-positive`, `-positive-soft`, `-surface-strong`, all `--tint-N` / `--color-area-N`, `--font-display`, `-h3`, `-body-s`, `--shadow-dialog`.
- `src/presentation/screens/homePlaceholderData.js` - created - the single placeholder module: static date eyebrow, 12 items / 5 collected / 4 areas, 4 route stops (name, preview, collected / total).
- `src/presentation/screens/HomeScreen.jsx` - rebuilt to the sketch: `<header>` with eyebrow, single-color H1 and two disabled 46px round buttons (search, settings, Hebrew `aria-label`); `<main>` with the ink hero `<section aria-label="סיכום הרשימה">` (96px SVG ring, stroke 10, track ink-2, fill accent, round cap, from 12 o'clock, `role="img"` + aria-label "5 מתוך 12 נאספו"; "הקנייה הבאה", "12 פריטים / ב-4 אזורים", "7 נותרו לאסוף", sync line with lime `CircleCheck`; disabled lime CTA "יוצאים לקנות" with ink arrow square and `ArrowLeft`); "המסלול בחנות" section (inert "עריכת סדר" link with `ChevronLeft`, `<ol>` of 4 stops: first done = ink square with lime check, others accent-soft numbered squares, preview truncated to one line, count "x/y" at the inline end); "קיצורים" section with 3 inert tiles (Mic, Star, LayoutGrid); floating `<nav aria-label="ניווט ראשי">` with 5 slots `1fr 1fr 76px 1fr 1fr`: "בית" link with `aria-current="page"`, inert רשימה / מועדפים / הבית שלי (`aria-disabled="true"`), center disabled 60px ink button with lime `Plus`, aria-label "הוספת פריט". Mixed numbers wrapped in `<bdi>`. Icons from `lucide-preact` only.
- `src/presentation/styles/base.css` - rewritten for the v1.3 components; tokens only, logical properties only, one `box-shadow` (nav, via `--shadow-nav`), focus ring ink (lime inside the hero), disabled buttons at 40% opacity (C8).
- `src/locale/he.js` - replaced v1.2 strings with v1.3 strings (hero, route, shortcuts, nav incl. "הוספת פריט" and "הבית שלי"); numeric strings are functions of the placeholder numbers.
- `index.html` - `theme-color` `#FFFFFF` -> `#F2F3EF` (v1.3 canvas).
- `.prettierignore` - added `docs/design/`: the Shraga-owned sketch files are not Prettier-formatted and this session may not edit them, so `npm run format:check` failed on them.
- `tests/unit/home-screen.test.jsx` - rewritten: 7 tests (title; disabled search / settings; hero with `img` "5 מתוך 12 נאספו", "7 נותרו לאסוף", sync line and disabled CTA; 4 route stops with only the first done and "עריכת סדר"; 3 shortcut tiles in order; `<nav aria-label="ניווט ראשי">` with a single `aria-current="page"` on "בית", disabled center button "הוספת פריט" and inert רשימה / מועדפים / הבית שלי; "חדשים היום" / "בני בית" absent).

Unchanged: `fonts.css` (Rubik Variable, Hebrew + Latin subsets only), `main.jsx`, `rtl-shell.test.js` (token parity test, not modified). No new dependencies. No data loading, Supabase calls, routing or behavior.

Verification:
- `npm run lint` -> exit 0.
- `npm run format:check` -> "All matched files use Prettier code style!"
- `npm test` -> `Test Files 4 passed (4)`, `Tests 18 passed (18)` (16 before; home file 5 -> 7). Token parity passes against v1.3 (17 rows).
- `npm run build`:

```
dist/index.html                                       0.47 kB
dist/assets/rubik-hebrew-wght-normal-BIkpbuMU.woff2   9.34 kB
dist/assets/rubik-latin-wght-normal-CnQIisVs.woff2   35.34 kB
dist/assets/index-Da46qmxE.css                        7.16 kB
dist/assets/index-Bh0iDCd-.js                        25.25 kB
✓ built in 549ms
Bundle secret scan passed: 3 file(s) scanned in dist, 0 findings.
```

Vercel production redeploy (same command as fix rounds 1-2, `npx vercel deploy --prod --yes --project mapmyshopping`). Two deploys in this round: `dpl_5XvM4hqorvedYtsKpwGpgEWYBNqn` (first build; the 375x812 check found the H1 wrapping to two lines and route counts not at the inline end), then after fixing both `dpl_DaphsV7MqcA6xK2fiJpiUsNhCMAF` (https://mapmyshopping-4ac0enkdx-liran16.vercel.app, target production, Ready, aliased to https://mapmyshopping.vercel.app). Causes fixed: the top-bar `gap` narrowed the title below the sketch width; `margin-inline-start: auto` sat on a `<bdi>` whose resolved direction is LTR, so the logical margin flipped (moved to a wrapping `<span>`).

- `curl -sI https://mapmyshopping.vercel.app` -> `200`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), geolocation=(), microphone=(self)`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- Served page loads `assets/index-Bh0iDCd-.js` and `assets/index-Da46qmxE.css` (identical to the local build), `theme-color` `#F2F3EF`. No env vars or keys added to Vercel.

Browser check (built-in browser, production URL, 375x812): `dir=rtl`; body background `rgb(242, 243, 239)`; hero `rgb(20, 32, 27)`, radius 28px; H1 height 34.5px (one line); exactly 1 element with a `box-shadow` (nav, `rgba(20, 32, 27, 0.12) 0px 10px 30px`); scrollWidth 375 (no horizontal scroll); route count left edge 36px (inline end of the card content); ring aria-label "5 מתוך 12 נאספו"; `aria-current` on "בית"; `document.fonts.check` Rubik on Hebrew = true; font requests only `rubik-hebrew-wght-normal-BIkpbuMU.woff2` and `rubik-latin-wght-normal-CnQIisVs.woff2` from the same origin.

Side-by-side vs `docs/design/option-3-top.jpg` / `option-3-bottom.jpg` (production screenshots at 375x812, top of page and scrolled to the bottom):

- Matches: canvas, eyebrow, one-line 30px title, round white buttons, ink hero with lime ring and texts, sync line, CTA shape with arrow square, route card with done check stop, numbered lime-soft squares, hairlines, counts at the inline end, "עריכת סדר" link, 3 shortcut tiles ("הוספה קולית" wraps to two lines as in the sketch), floating nav with raised center "+", "בית" bold ink.
- Visible differences:
  1. Search, settings, "יוצאים לקנות" and the center "+" are shown at 40% opacity (DESIGN_SYSTEM section 7 disabled state; review condition C8). The CTA reads as olive on ink and the "+" as grey instead of lime-on-ink. Goes away when Phase 1+ enables them.
  2. Route item previews and counts use `--color-text-muted` #646E69 instead of the sketch's #707A75 (DESIGN_SYSTEM wins, AA); slightly darker grey.
  3. The ring caption "נאספו" uses Micro 600 (DESIGN_SYSTEM) instead of the sketch's 400; marginally bolder.
  4. The date eyebrow is a static string, as the prompt requires (DESIGN_SYSTEM describes `Intl` from the device clock for later).

Deviations: `.prettierignore` gains `docs/design/` (see above); `theme-color` updated to the v1.3 canvas. Inert elements: tiles, "עריכת סדר" and the non-current nav items are non-interactive elements with `aria-disabled="true"` rather than disabled `<button>`s, so they render at full opacity like the sketch; the four real `<button>`s are `disabled` and faded.
