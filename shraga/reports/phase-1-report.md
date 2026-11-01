# Phase 1 Report - Identity, sessions & household membership

Prompt: shraga/prompts/phase-1-prompt.md Date: 2026-11-01 Round: 1

## 1. Summary

A person can now open the app, receive a secure anonymous Supabase identity bound to an `app_users` row via a `devices` record (ADR 0003), set a display name, and either create a household (becoming its manager) or join one with a server-verified invite code. All household data is isolated by RLS from the first migration; every write goes through an idempotent `security definer` RPC (ADR 0006); invite codes are 50-bit, SHA-256 at rest, single-use, 24h, one active per household, with a 5-failure / 15-minute join lockout. The onboarding flow, success screen and minimal "הבית שלי" screen are built to approved sketch option C, and the behaviour is proven by 94 automated tests (unit, integration against the hosted dev project, and E2E).

## 2. Scope Coverage

| Scope item / acceptance criterion | Status | Where |
|---|---|---|
| Owner steps (anon sign-in, repo, Vercel, `.env.test.local`) | Done | Anon sign-in verified; repo `LiranRein/MapMyShopping`; Vercel git-connected (deploy `b3b0401`, READY); env vars set |
| ADR 0012 two-project model (C1, C5) | Done | docs/adr/0012-secrets-and-environments.md |
| Migration: tables, indexes, helpers, RLS, grants | Done | supabase/migrations/20261029081951_identity_households_schema.sql |
| Migration: RPCs, idempotency, join lockout, audit | Done | supabase/migrations/20261029082049_identity_households_rpcs.sql |
| rate_limits schema move + service_role grant (deviation) | Done | supabase/migrations/20261029082317, 20261029082702 |
| supabaseClient / session / onboarding modules | Done | src/data-sync/supabaseClient.js, src/security/session.js, src/application/onboarding.js |
| Screens per sketch C + App state gate | Done | src/presentation/screens/onboarding/*, HouseholdScreen.jsx, App.jsx, BottomNav.jsx |
| "הבית שלי" nav item active | Done | src/presentation/screens/BottomNav.jsx, HomeScreen.jsx |
| Integration harness (prefixed data + teardown) | Done | tests/integration/harness.js, globalSetup.js |
| E2E + CI | Done | tests/e2e/*, .github/workflows/ci.yml |
| AC-1.1 .. AC-1.11 | All met | See section 6 (AC coverage) |

Nothing from the "out of scope" list (recovery codes, invite link/revoke, leave/transfer/delete, display-name edit UI, list features, C10 home fixes, CAPTCHA, PWA, Realtime) was built.

## 3. Files Changed

Migrations:
- `supabase/migrations/20261029081951_identity_households_schema.sql` - created - tables, indexes, helpers, RLS, grants.
- `supabase/migrations/20261029082049_identity_households_rpcs.sql` - created - RPCs, idempotency, join lockout, audit.
- `supabase/migrations/20261029082317_rate_limits_public_schema.sql` - created - moves `rate_limits` to `public` (deviation, section 7).
- `supabase/migrations/20261029082702_rate_limits_service_role_grant.sql` - created - grants `service_role` access to `public.rate_limits` for test teardown.

Client:
- `src/data-sync/supabaseClient.js` - created - single client, `callRpc` wrapper with offline/error codes, active-invite select.
- `src/security/session.js` - created - ensure anonymous session, `get_my_context`, state gate.
- `src/application/onboarding.js` - created - validation, code normalisation, operation IDs, RPC calls, error-code -> Hebrew mapping, expiry/countdown formatting.
- `src/presentation/App.jsx` - modified - state gate (loading / error / onboarding / home / household).
- `src/presentation/screens/BottomNav.jsx` - created - shared nav; "הבית שלי" active.
- `src/presentation/screens/HouseholdScreen.jsx` - created - "הבית שלי": name, members, manager invite ticket, copy toast.
- `src/presentation/screens/onboarding/{WelcomeScreen,NameScreen,HouseholdStepScreen,SuccessScreen,OnboardingFlow,HouseholdCard,CtaButton}.jsx` - created - onboarding per sketch C.
- `src/presentation/screens/HomeScreen.jsx` - modified - uses shared BottomNav; "הבית שלי" opens household screen.
- `src/presentation/styles/onboarding.css` - created - onboarding/household/state styles, tokens only.
- `src/locale/he.js` - modified - all new strings.
- `src/main.jsx` - modified - import onboarding.css.

Tests:
- `tests/integration/harness.js`, `globalSetup.js` - created - prefixed data, teardown, 24h sweep.
- `tests/integration/rls.test.js` - created - T-1.1 .. T-1.4.
- `tests/integration/rpc.test.js` - created - T-1.5 .. T-1.12 + validation/audit.
- `tests/e2e/onboarding.spec.js`, `globalTeardown.js` - created - T-1.13, T-1.14.
- `tests/unit/onboarding.test.js`, `onboarding-screens.test.jsx`, `session.test.js`, `secret-isolation.test.js` - created - T-1.15 .. T-1.17 + session gate.
- `tests/unit/home-screen.test.jsx` - modified - one assertion updated for the now-active "הבית שלי" (section 7).
- `vitest.integration.config.js`, `playwright.config.js` - created - test runners.
- `vite.config.js` - modified - unit `include` scoped to `tests/unit/`.

Tooling / config / docs:
- `scripts/generate-test-report.mjs`, `scripts/test-report-template.html` - created - phase test report generator (deviation, section 7).
- `docs/test-reports/phase-1.html` - created - generated report, 94/94.
- `.github/workflows/ci.yml` - modified - integration/E2E job (skips with a notice if secrets absent).
- `package.json`, `package-lock.json` - modified - deps + scripts.
- `.claude/rules/project.md` - modified - test, report and migration conventions.
- `docs/adr/0012-secrets-and-environments.md` - modified - two-project model (C5).
- `.env.example`, `.gitignore`, `.prettierignore` - modified - test env vars, ignore generated reports.

## 4. Dependencies

- `@supabase/supabase-js@2.118.0` - Supabase client (ADR 0003/0006).
- `@playwright/test@1.64.1` (dev) - E2E (ADR 0002).

Both listed in the plan's stack; no other dependencies added.

## 5. Verification

Local run, 2026-11-01. Test data is prefixed `t_<runId>_` and deleted after each run; the DB was confirmed empty after the integration and E2E runs.

Unit: `npm test`
```
Test Files  8 passed (8)
     Tests  61 passed (61)
```

Integration (hosted dev project `MapMyShopping`): `npm run test:integration`
```
Test Files  2 passed (2)
     Tests  31 passed (31)
```

E2E (Playwright Chromium, 375x812, hosted dev): `npm run test:e2e`
```
2 passed
```

Lint: `npm run lint` -> clean (no output).
Format: `npm run format:check` -> `All matched files use Prettier code style!`
Build + bundle secret scan: `npm run build` -> `Bundle secret scan passed: 3 file(s) scanned in dist, 0 findings.` Also re-run with the real `SUPABASE_SERVICE_ROLE_KEY` value loaded (`node --env-file=.env.test.local scripts/scan-bundle-secrets.mjs dist`) -> 0 findings.
Production build in Vercel: git deployment of commit `b3b0401` reached state READY.
Combined report: `docs/test-reports/phase-1.html` (94/94; unit 61/61, integration 31/31, e2e 2/2).

Total: 94 tests, 94 passed, 0 failed, 0 skipped. No test was weakened, skipped or deleted.

## 6. How to Try It

Manual QA (owner, two phones or one phone + a private window), against the deployed Preview/Production:
1. On phone A, open the app. Complete onboarding: "בואו נתחיל" -> enter a display name -> "המשך".
2. Choose "בית חדש", enter a household name, "יצירת הבית". You reach "הבית מוכן" as manager.
3. Reload phone A: you land on the home screen, still signed in. Open "הבית שלי" from the bottom nav.
4. Tap "יצירת קוד הזמנה" (or "להזמנת בני הבית" from the success screen). Note the 10-char code and copy it ("הקוד הועתק" toast).
5. On phone B, complete onboarding, choose "יש לי קוד", type the code (lower case, spaces or no hyphen all work), "הצטרפות". You join as member.
6. On both phones, open "הבית שלי": both members appear with their roles (מנהל/ת / חבר/ה).
7. Negative checks: on phone B type a wrong code 5 times -> after the 5th, joining is locked with a countdown; reload does not bypass it. Re-using the same valid code from a third context returns the identical "הקוד לא תקין או שפג תוקפו" message.

AC coverage (every AC is covered; all covering tests pass):

| AC | Covered by | Result |
|---|---|---|
| AC-1.1 cross-household isolation, no direct writes | T-1.1, T-1.2, T-1.3 (rls.test.js) | Pass |
| AC-1.2 member cannot escalate / invite | T-1.4 (rls.test.js) | Pass |
| AC-1.3 display-name change keeps identity/role | T-1.5 (rpc.test.js) | Pass |
| AC-1.4 second household rejected server-side | T-1.6 (rpc.test.js) | Pass |
| AC-1.5 one join per valid code; wrong/expired/used identical; no consume on fail | T-1.7, T-1.8, T-1.10 (rpc.test.js) | Pass |
| AC-1.6 5 failures -> 15-min lockout, refresh does not bypass | T-1.9 (rpc.test.js) | Pass |
| AC-1.7 every mutating RPC idempotent by operation ID | T-1.11 (rpc.test.js) | Pass |
| AC-1.8 one active invite, one manager | T-1.12 (rpc.test.js) | Pass |
| AC-1.9 onboarding/create/join end to end, session survives reload | T-1.13, T-1.14 (onboarding.spec.js) | Pass |
| AC-1.10 screens cover loading/error/lockout/offline | T-1.15, T-1.16 (onboarding*.test) | Pass |
| AC-1.11 no secret in bundle; service-role only in tests | T-1.17 (secret-isolation.test.js) + build scan | Pass |

No AC is uncovered.

R10 - `security definer` / caller-facing function review (all set `search_path = ''`, use fully qualified names, resolve the caller via `app_private.current_app_user_id()` and never from client parameters, and are revoked from `public` / `anon`):

| Function | Security | Caller check | Execute granted to |
|---|---|---|---|
| `app_private.current_app_user_id()` | definer, stable | resolves `auth.uid()` -> active device | authenticated |
| `app_private.current_household_id()` | definer, stable | built on the above | authenticated |
| `app_private.is_manager(uuid)` | definer, stable | membership + role from DB | authenticated |
| `app_private.begin_operation / end_operation / audit` | definer | internal (idempotency, audit) | revoked from all (internal) |
| `public.create_identity` | definer | unbound caller only; one device per `auth.uid()` | authenticated |
| `public.update_display_name` | definer | bound caller; updates own row only | authenticated |
| `public.create_household` | definer | bound, no membership | authenticated |
| `public.create_invite` | definer | manager of own household only (`FORBIDDEN` otherwise) | authenticated |
| `public.join_household` | definer | bound, no membership; lockout keyed on app user | authenticated |
| `public.get_my_context()` | invoker (reads only under RLS) | resolves own context | authenticated |

Helpers `app_private.result / clean_name / normalize_invite_code / generate_invite_code` are pure/internal (not `security definer`), in the unexposed `app_private` schema, revoked from `public` / `anon` / `authenticated`.

## 7. Deviations from the Plan

| Deviation | Reason | Approved by user? |
|---|---|---|
| `rate_limits` moved from `app_private` to `public` (migrations 3 + 4), with `service_role` granted access | T-1.9 must expire a lockout through the service-role REST API, which cannot reach the unexposed `app_private` schema. Protection is unchanged: RLS on, no policies, no `anon`/`authenticated` privileges (same pattern as `sync_operations`). | Yes |
| `tests/unit/home-screen.test.jsx`: one assertion changed so "הבית שלי" is expected active (not disabled) | Required by plan section 4.5 (the nav item becomes active in this phase). Only that assertion changed; no test weakened. | Yes |
| New phase test-report tool: `scripts/generate-test-report.mjs`, `scripts/test-report-template.html`, `npm run test:report`, `docs/test-reports/`, documented in `.claude/rules/project.md` | Owner requested a saved run report per testing phase. Not in the Phase 1 plan. A binding cross-phase rule should be ratified in the Shraga session (Plan.md / constitution); this phase only sets up the tooling and documents it as a convention in the build-session-owned `.claude/rules/project.md`. | Yes |
| Migrations applied to the hosted dev project via the Supabase MCP, not `supabase db push` / local CLI stack | C1 (2026-10-29): no Docker / local stack; the hosted dev project is the single dev target. Migration files are committed under `supabase/migrations/` with file versions equal to the applied versions. | Yes (C1) |
| ADR 0012 edited | Carried condition C5; the plan assigns this edit to Phase 1. | Yes (plan) |
| `get_my_context` is `security invoker` (not `definer`) | It is read-only and should return exactly what RLS allows the caller to see; running as the caller is the safer choice and needs no definer privilege. | Build-session decision; noted here |

## 8. Known Issues & Open Items

- Supabase advisor `anon_security_definer_function_executable` flags `public.rls_auto_enable()` as executable by `anon`/`authenticated`. This function is not created by this phase (not present in any Phase 1 migration); it appears to be a platform/pre-existing object. Flagged for review; no Phase 1 code depends on it.
- Supabase advisor `rls_enabled_no_policy` on `public.sync_operations` and `public.rate_limits` is intentional: RLS is enabled with no policies and no client grants, so clients have no access at all; both are written only by `security definer` functions.
- GitHub Actions CI result for the pushed commits was not verified from this session (no GitHub access here); the workflow runs `lint`, `format:check`, `test`, `build` on every push, and the integration/E2E job runs only when the three `SUPABASE_*` secrets are present (otherwise it skips with a visible notice). Owner to confirm the run is green (C4).
- Deployment protection (Vercel SSO) is enabled on the project, so the preview/deployment URLs require Vercel login; this does not affect the production domain behaviour.
- New risks for components built this phase: none beyond those already recorded in the plan's Temporary Decisions table (no recovery code yet, no CAPTCHA on dev, invite shown once, prod uses the dev Supabase project until Phase 11).

## 9. Fix Rounds

| Round | Review items addressed | Result |
|---|---|---|
| 1 | - | Pending `/shraga-review` |
