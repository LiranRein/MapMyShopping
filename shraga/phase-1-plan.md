# Phase 1 - Identity, sessions & household membership - Detailed Plan
Parent: shraga/Plan.md (Phase 1)   Baseline: shraga/project-arch-plan.md v1.8, shraga/DESIGN_SYSTEM.md v1.3, docs/adr/0003, 0006, 0012
Status: Approved   Date: 2026-10-29 (sketch option C approved by owner)

## 1. Goal
A person opens the app on a phone, gets a secure anonymous identity with a display name, and either creates a household (becoming its manager) or joins one with a server-verified invite code. All household data is isolated by RLS from the first table, every sensitive write goes through an idempotent `security definer` RPC, and this is proven by integration tests against the hosted dev project.

## 2. Scope
In scope:
- Supabase client setup in `src/data-sync/` (public URL + anon key only) and session handling in `src/security/`.
- Anonymous sign-in + `create_identity`; display name; session persists across reload.
- Tables, helpers and RLS: `app_users`, `devices`, `households`, `household_members`, `household_invites`, `household_settings`, `sync_operations`, `app_private.rate_limits`, `audit_log` (append-only, server-written).
- RPCs: `create_identity`, `update_display_name`, `create_household`, `create_invite`, `join_household`, `get_my_context`.
- Screens per approved sketch option C (`docs/design/onboarding-sketch-option-c.html`): welcome, display name, household step (new household or invite code on one screen), success ("הבית מוכן" / joined), join errors and lockout, minimal "הבית שלי" screen (household name, members with roles, manager-only ticket-style invite card that shows the code once with its expiry, copy toast).
- App-state gate: no session / no identity -> onboarding; identity without household -> choice; member -> home placeholder shell.
- Integration test harness against hosted dev with per-run prefixed data and cleanup.
- Carried conditions: C1 implementation, C4 (GitHub, CI, Vercel Git), C5 (ADR 0012 project names).

Out of scope (do NOT build in this phase):
- Recovery codes, device replacement, mandatory recovery-code step (Phase 9 / 10).
- Invite link, revoke button, manager notification, leave / remove / transfer / delete household (Phase 8).
- Display-name edit UI (Phase 10; RPC only in this phase).
- Shopping list, catalog, home live data, C10 home-shell fixes (Phase 2+).
- CAPTCHA (before launch, Phase 11), PWA install / offline (Phase 7), Realtime (Phase 2).

## 3. Preconditions
- Phase 0 closed (2026-10-29); home shell v1.3 deployed; ADR 0003 approved.
- Owner steps (build session stops and gives exact instructions): enable Anonymous Sign-ins in the `MapMyShopping` dashboard; create a GitHub repo and push (C4); connect Vercel to the repo and set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for Preview and Production (dev project values until Phase 11); place test secrets in git-ignored `.env.test.local`.
- Owner-approved Phase 1 sketch in `docs/design/` (sketch-first rule).

## 4. Design
### 4.1 Components & responsibilities
| Component | Type | Responsibility |
|---|---|---|
| `src/data-sync/supabaseClient.js` | module | Single client from `publicConfig.js`; session persisted by supabase-js (localStorage) |
| `src/security/session.js` | module | Ensure anonymous session, call `get_my_context`, expose `{state: 'no-identity' | 'no-household' | 'member', context}` |
| `src/application/onboarding.js` | module | Validation (display name, household name, code normalisation), operation IDs (`crypto.randomUUID()`), RPC calls, error-code -> Hebrew message mapping |
| `src/presentation/screens/onboarding/*` | screens | Welcome, Name, HouseholdStep (new / code toggle), Success; shared persistent HouseholdCard |
| `src/presentation/screens/HouseholdScreen.jsx` | screen | Minimal "הבית שלי": name, members, invite card (manager) |
| `src/presentation/App.jsx` | root | State gate between onboarding, home, household screen (no router dependency) |
| `supabase/migrations/*` | SQL | Schema, helpers, RLS, RPCs, grants |
| `tests/integration/*` | tests | RLS and RPC tests against hosted dev |

### 4.2 Data model changes
| Table | Fields | Access rule (RLS) | Notes |
|---|---|---|---|
| `app_users` | id uuid pk default gen_random_uuid(), display_name text (trimmed, 1-40 chars), created_at, updated_at | select: self or same household; no direct insert / update / delete | Written by RPCs only |
| `devices` | id, app_user_id fk, auth_user_id uuid unique fk auth.users on delete cascade, created_at, revoked_at | select: own row (`auth_user_id = auth.uid()`); no writes | Partial unique index `(app_user_id) where revoked_at is null` |
| `households` | id, name (1-40), created_by, created_at | select: members; no direct writes | |
| `household_members` | household_id fk on delete cascade, app_user_id fk unique, role check ('manager','member'), joined_at; pk (household_id, app_user_id) | select: members of the same household; no direct writes | Unique `app_user_id` = one household per identity; partial unique `(household_id) where role = 'manager'` = exactly one manager |
| `household_invites` | id, household_id, code_hash text unique, created_by, created_at, expires_at, revoked_at, used_at, used_by | select: manager of that household, columns without `code_hash`; no direct writes | Partial unique `(household_id) where revoked_at is null and used_at is null` |
| `household_settings` | household_id pk fk, created_at | select: members | Created with the household; columns added in later phases |
| `sync_operations` | operation_id pk, app_user_id, op_type, result jsonb, applied_at | RLS on, no client policies | ADR 0006 idempotency |
| `app_private.rate_limits` | app_user_id, action, failed_attempts, locked_until; pk (app_user_id, action) | not exposed | Join lockout |
| `audit_log` | id, actor_app_user_id, household_id, action, target, created_at | select: manager of that household; no client writes | No codes, hashes or tokens |

Helpers (schema `app_private`, `security definer`, `stable`, `search_path = ''`): `current_app_user_id()`, `current_household_id()`, `is_manager(household_id)`. Policies call them as `(select app_private.current_app_user_id())`.
Grants: revoke all on new tables from `anon`; RPCs `revoke execute from public, anon; grant execute to authenticated`.

### 4.3 Contracts (ADR 0006 conventions: `p_operation_id`, `jsonb {ok, code, data}`)
- `create_identity(p_display_name, p_operation_id)` - caller: authenticated, unbound. Creates `app_users` + active `devices` row for `auth.uid()`. Errors: `ALREADY_BOUND`, `VALIDATION_FAILED`, `OPERATION_ID_REUSED`. Data: `{app_user_id, display_name}`.
- `update_display_name(p_display_name, p_operation_id)` - caller: bound. Updates name only. Errors: `NOT_BOUND`, `VALIDATION_FAILED`.
- `create_household(p_name, p_operation_id)` - caller: bound, no membership. Creates household, manager membership, settings, audit entry. Errors: `NOT_BOUND`, `ALREADY_IN_HOUSEHOLD`, `VALIDATION_FAILED`. Data: `{household_id, name, role: 'manager'}`.
- `create_invite(p_operation_id)` - caller: manager. Revokes any active invite, creates a new one: 10 chars Crockford Base32 from `gen_random_bytes` (50 bits), shown as `XXXXX-XXXXX`, stored as `encode(digest(normalised_code, 'sha256'), 'hex')`, `expires_at = now() + 24h`. Returns the plaintext code once; a replay with the same operation ID returns `{ok:true, code:'ALREADY_APPLIED', data:{expires_at}}` without the code. Errors: `NOT_BOUND`, `NOT_MEMBER`, `FORBIDDEN`. Data: `{code, expires_at}`.
- `join_household(p_code, p_operation_id)` - caller: bound, no membership. Order: lockout check (`LOCKED` + `retry_after`, no lookup) -> normalise (uppercase, strip hyphens / spaces, map I/L -> 1, O -> 0) -> lookup by hash among invites not revoked, not used, not expired -> on miss: increment failures, 5 consecutive -> `locked_until = now() + 15 min`, return `INVALID_CODE` (expired / used / revoked return the same code, no oracle) -> on hit: lock the invite row (`for update`), insert membership as `member`, set `used_at` / `used_by`, reset failures, audit entry. Errors: `NOT_BOUND`, `ALREADY_IN_HOUSEHOLD`, `INVALID_CODE`, `LOCKED`, `VALIDATION_FAILED`. Data: `{household_id, name, role: 'member'}`.
- `get_my_context()` - caller: authenticated (read-only, no operation ID). Data: `{bound: bool, app_user: {id, display_name} | null, household: {id, name, role} | null, members: [{display_name, role}] }`.

### 4.5 UI
- Screens and states exactly as in approved sketch option C (`docs/design/onboarding-sketch-option-c.html`); tokens and components from DESIGN_SYSTEM.md v1.3 only.
- Persistent ink "כרטיס הבית" at the top of every onboarding step, filling live: השם שלי, הבית, role chip ("שלב 1 מתוך 2" / "שלב 2 מתוך 2" until done, then "מנהל/ת" or "חבר/ה"). Two steps only: name, then household (two selectable tiles "בית חדש" / "יש לי קוד" with the matching field below). Success screen "הבית מוכן" with "להזמנת בני הבית" (manager) and "אחר כך, למסך הבית"; joiners see the same card with their role and go home.
- Invite card on "הבית שלי": ticket style (perforated divider), code centered `dir="ltr"`, expiry, "העתקה" (ink, lime text) + "קוד חדש"; toast "הקוד הועתק".
- Elements the sketch shows that are not in DESIGN_SYSTEM.md v1.3 (household card, selectable tiles, ticket, toast styling) are added as components built only from existing tokens; no new colors.
- States: loading (button spinner, label kept), validation error inline under the field, server error banner, `INVALID_CODE` ("הקוד לא תקין או שפג תוקפו"), `LOCKED` with countdown, offline notice ("אין חיבור - נסו שוב").
- Code input: one field, Latin uppercase, `dir="ltr"` inside RTL layout, `inputmode="text"`, `autocapitalize="characters"`, auto-hyphen after 5 chars, paste accepted.
- Invite card: code in large tabular text, expiry ("בתוקף עד 14:32 מחר"), copy button; after leaving the screen the code is not shown again (state "הקוד הוצג - צרו קוד חדש כדי לראות שוב").
- Home placeholder shell stays as Phase 0 except: the "הבית שלי" nav item becomes active and opens the household screen.

## 5. Implementation Order
1. Owner steps (section 3); update ADR 0012 (C5) with real project names and the C1 two-project model.
2. Migration 1: schema, indexes, helpers, RLS, grants. Integration harness + RLS tests (empty-data and direct-write denial).
3. Migration 2: RPCs + audit + rate limits. RPC integration tests (positive, negative, replay).
4. `supabaseClient`, `session`, `onboarding` modules with unit tests.
5. Screens + App gate per sketch; unit tests per screen state.
6. E2E: create -> reload -> still member; join flow with second browser context.
7. CI: lint, format, unit, build; integration job with GitHub secrets (skipped with a visible notice if secrets absent); deploy via Vercel Git.

## 6. Security Requirements
- A01: RLS enabled on every new table in the same migration; no client insert / update / delete policies at all - every write via RPC; policies resolve the caller through `app_private.current_app_user_id()`, never a client-supplied ID.
- A01 / R10: every `security definer` function sets `search_path = ''`, uses fully qualified names, checks the caller first, and is not executable by `anon`.
- A07: device / user / household IDs from the client are never trusted; anonymous session is the only credential; Supabase default sign-in rate limit stays on (CAPTCHA tracked for Phase 11).
- A04 / A07: invite codes 50-bit random, stored as SHA-256 only, single use, 24h, one active per household; join lockout 5 failures / 15 min keyed on the app user; identical error for wrong / expired / used / revoked.
- A09: audit `household.created`, `invite.created`, `join.succeeded`, `join.failed`, `join.locked` without codes or hashes; no codes, tokens or keys in client logs.
- A02: service-role key only in `.env.test.local` and GitHub Actions secrets for test cleanup; never imported from `src/`; bundle secret scan stays in the build.

## 7. Test Plan
Scope: everything in section 2. Regression: all Phase 0 unit tests and the token parity test.
Approach: Vitest unit; Vitest integration against hosted dev (`MapMyShopping`); Playwright E2E on 375x812 against the local dev server pointed at hosted dev.
Test data: each run uses prefix `t_<runId>_` for display and household names; teardown deletes the run's households (cascade), app users, devices and anonymous auth users via the admin API in the test process only; a sweep deletes `t_` data older than 24h.

| ID | AC | Scenario (Given / When / Then) | Level | Type |
|---|---|---|---|---|
| T-1.1 | AC-1.1 | Given users A and B in households HA and HB, When A selects from every household table, Then only HA rows return | Integration | Negative / access |
| T-1.2 | AC-1.1 | Given A in HA, When A calls insert / update / delete directly on any table, Then it is denied | Integration | Negative / access |
| T-1.3 | AC-1.1 | Given a bound user, When they call RPCs with another household's ID anywhere in input, Then nothing outside their household changes | Integration | Negative |
| T-1.4 | AC-1.2 | Given member M, When M updates `household_members.role` directly or calls `create_invite`, Then denied / `FORBIDDEN` | Integration | Negative |
| T-1.5 | AC-1.3 | Given a member, When `update_display_name` runs, Then name changes and app_user_id, role, household are unchanged | Integration | Happy path |
| T-1.6 | AC-1.4 | Given a member of HA with a valid invite to HB, When they call `join_household`, Then `ALREADY_IN_HOUSEHOLD` and no membership added | Integration | Negative |
| T-1.7 | AC-1.5 | Given a valid code, When an unaffiliated user joins, Then member role, invite used; a second user with the same code gets `INVALID_CODE` | Integration | Happy + negative |
| T-1.8 | AC-1.5 | Given expired / revoked / wrong codes, When joining, Then `INVALID_CODE`, invite not consumed, same response for all | Integration | Negative |
| T-1.9 | AC-1.6 | Given 5 wrong codes, When a 6th attempt (even correct) is made within 15 min, Then `LOCKED` with `retry_after`; after reset time (simulated by setting `locked_until` in the past) a correct code succeeds and resets counters | Integration | Negative |
| T-1.10 | AC-1.5 | Given two users join with the same valid code concurrently, Then exactly one succeeds | Integration | Concurrency |
| T-1.11 | AC-1.7 | Given any mutating RPC, When repeated with the same operation ID, Then no second effect; a different caller with that ID gets `OPERATION_ID_REUSED` | Integration | Idempotency |
| T-1.12 | AC-1.8 | Given a new manager invite, Then the previous active invite is revoked and only one active remains | Integration | Rule |
| T-1.13 | AC-1.9 | Given a new visitor, When they complete name + create household and reload, Then they land on home as manager | E2E | Happy path |
| T-1.14 | AC-1.9 | Given a manager creates a code, When a second browser context joins with it, Then both see each other in "הבית שלי" | E2E | Happy path |
| T-1.15 | AC-1.10 | Display / household name validation (empty, spaces only, > 40 chars) and code normalisation (lowercase, spaces, I/L/O) | Unit | Validation |
| T-1.16 | AC-1.10 | Each screen renders loading, validation error, `INVALID_CODE`, `LOCKED` countdown and offline states | Unit | UI states |
| T-1.17 | AC-1.11 | Bundle scan finds no service-role / secret key; `src/` never reads `.env.test.local` variables | Unit / build | Security |

Manual QA (owner, phone): sign up on the deployed Preview, create a household, create a code, join from a second phone or private window, reload both, check "הבית שלי" lists both with roles.

Exit criteria: all scenarios pass with output in the report; Phase 0 tests pass; no tests skipped or weakened; manual QA completed or explicitly listed as pending by the owner.

## 8. Acceptance Criteria
- AC-1.1 A user of household A cannot read or write any row of household B, and no client can write any table directly.
- AC-1.2 A member cannot make themselves manager or create invites.
- AC-1.3 Display-name change does not change identity or role.
- AC-1.4 Joining a second household is rejected server-side.
- AC-1.5 A valid code joins exactly one person; wrong / expired / used / revoked codes are rejected identically and a failed attempt does not consume the invite.
- AC-1.6 Five failed joins lock the user for 15 minutes; refresh does not bypass it.
- AC-1.7 Every mutating RPC is idempotent by operation ID.
- AC-1.8 A household has at most one active invite and exactly one manager.
- AC-1.9 Onboarding, create and join work end to end, and the session survives reload.
- AC-1.10 Screens match the approved sketch and cover loading / error / lockout / offline states.
- AC-1.11 No secret in the bundle; service-role key used only by the test process.

## 9. Risk Gate
- [ ] R1: identity enforced as ADR 0003 (T-1.1 to T-1.6 pass).
- [ ] R10: every `security definer` function reviewed for `search_path`, caller check and grants (list in report).
- [ ] R8: sign-in rate limit confirmed on; CAPTCHA tracked.
- [ ] C1 safeguards in place (prefixed data, teardown, no prod); C4 CI green; C5 ADR 0012 updated.
- [ ] No Critical risks open for components built in this phase; new risks added to the report.

## 10. Temporary Decisions & Debt
| Item | Why | Risk | Exit condition | Exit phase |
|---|---|---|---|---|
| No recovery code yet | Recovery is Phase 9 | Clearing site data loses the identity (dev / test users only) | `generate_recovery_code` + mandatory save step | 9 / 10 |
| No CAPTCHA | Dev only; Supabase IP rate limit active | Bot sign-ups on dev project | CAPTCHA enabled before launch | 11 |
| Invite code shown once, no link / revoke UI | Minimal join for Phases 2-7 testing | Manager must create a new code to re-share | Full invite UI | 8 |
| Vercel Production uses the dev Supabase project | Prod project only before Phase 11 | Real data mixed with test data if real users join | Prod project + env switch | 11 |
| Installed-PWA session persistence (ADR 0003 U1) not testable yet | No manifest until Phase 7 | Sessions may drop on iOS home-screen apps | Owner device check | 7 |

## 11. Open Questions
- None blocking. ADR 0003 U2 (Realtime after revocation) moves to Phase 2, where Realtime is introduced.
