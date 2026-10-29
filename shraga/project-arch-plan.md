# MapMyShopping - Shared Household Shopping List - Architecture & Product Requirements

Version: 1.8   Date: 2026-10-28   Build tool: Claude Code
Source: translated and restructured from the owner's Hebrew PRD v1.1 (`shraga/project-arch-plan.he.md`, reference only; this file is authoritative).
Verified against: Supabase Auth docs (Anonymous Sign-ins, Identity Linking, RLS), OWASP Top 10:2025, ASVS 5.0.0, 2026-10-28

## 1. Product Overview
- Name: MapMyShopping (working name)
- Short description: A mobile-first Hebrew (RTL) PWA for managing a household's shared shopping list over time, with a shared catalog and favorites, and a shopping mode ordered by the physical areas of the supermarket.
- Primary goal: One reliable place where all household members add items, and one person shops efficiently in store-route order, including with poor or no connectivity.
- Target users: families, couples, roommates; households where several people add items and usually one person shops.

## 2. Core Problem
- Problem definition: Lists are scattered across messages, notes and apps; changes are lost after closing the browser; duplicates and inconsistent quantities; list order does not match the store layout; slow item entry (voice wanted); no connectivity in store; catalog and favorites are lost when the list is cleared; membership, permissions and recovery are not managed securely.
- Why existing solutions fail: (assumption) generic list apps lack store-route ordering, per-device collection state and household-scoped catalog / favorites that survive clearing the list.

## 3. Main User Flows
- First-time user: create identity (no email / password) -> set display name -> create a household or join via invite -> save the initial recovery code (mandatory step) -> home screen. Optional onboarding tutorial.
- Core usage: add items (free text / catalog / voice with review) -> household members see shared changes -> shopper opens shopping mode grouped by store area -> marks items collected (local to device) -> clears the list explicitly when done.
- Returning user: session persists across restarts; previously loaded data available offline; pending offline operations sync on reconnect.
- Device replacement: enter recovery code on a new device -> server verifies -> atomic switch of device authorization -> old device loses access.
- Admin (household manager): invitations, member removal, management transfer, catalog item removal, store route configuration, household deletion.

## 4. MVP Feature Set
| Area | Features | Phase (owner PRD numbering) |
|---|---|---|
| Foundation | JS PWA shell, Hebrew RTL, Supabase + Vercel, env / secrets, lint / test / build pipeline | 1 |
| Identity & household | Identity without email / password, display name, create / join household, manager / member roles, one household per identity, authorized devices, RLS | 2 |
| Shared list | CRUD items, quantity + unit, name / category edit, delete row with confirm, clear list with confirm, row counter, realtime sharing, duplicate resolution | 3 |
| Catalog & store route | Shared catalog, aliases, variants / packaging, categories, type-ahead search, browse by category, explicit add-to-catalog, store areas (create / rename / reorder), category-to-area mapping, manager-only removal | 4 |
| Favorites | Shared favorites grouped by category, multi-select bulk add, duplicate resolution, single resumable draft, 7-day expiry from creation, 24h warning, idempotent bulk add | 5 |
| Add-item experience | Free text, catalog pick, voice dictation with parse to items / quantity / unit, review screen before commit, uncertain items flagged, unsupported-browser fallback, success feedback and visit counter | 6 |
| Shopping mode & print | Grouping and ordering by route, hide empty areas, unassigned group, local collected state, unmark, filter not-collected, progress counter and bar, B&W print view | 7 |
| Offline & sync | Service worker, IndexedDB cache, pending operation queue, sync on reconnect / foreground, operation IDs, version-based conflict detection, sync status UI, storage-eviction handling | 8 |
| Household admin | Invite (24h, one active, link + code), join validation, manager notification, member list, leave / remove, management transfer, household deletion with preview | 9 |
| Recovery & devices | Personal recovery code, save / copy / confirm, view after warning, rotate, server-side verify, 5 failures -> 15 min lockout, atomic device replacement | 10 |
| Onboarding & settings | Multi-screen tutorial (household-level completion), 2x2 home, settings, all loading / empty / error / offline states | 11 |
| Production readiness | Integration / E2E / RLS / offline / conflict / recovery tests, monitoring, backups, deployment docs, security audit | 12 |

Out of scope for MVP: multiple lists per household, multiple supermarkets per household (architecture must allow both later), product images, purchase history, AI-based automatic classification, email / password login, native apps.

## 5. System Architecture
- Components and responsibilities:
  - Frontend PWA (browser): presentation, local collected state, IndexedDB cache, pending-operation queue, service worker.
  - Supabase Postgres: source of truth for all shared data; RLS on every household table.
  - Supabase server-side logic (Postgres functions / RPC with `security definer` where justified, or Edge Functions): all sensitive and multi-step operations - invites, join, role changes, management transfer, catalog removal, recovery-code verification and lockout, device replacement, household deletion, idempotent bulk add.
  - Supabase Realtime: propagation of shared list changes between members.
  - Vercel: static hosting of the PWA; no secrets beyond the public anon key.
  - Browser Web Speech API (third-party, browser-vendor dependent): voice recognition.
- Layers (enforced in code structure): Presentation / Application (use cases, business validation, duplicate handling) / Data & Sync (Supabase access, local storage, queue, conflicts, retry) / Security (identity, sessions, roles, RLS, invite and recovery verification). No sensitive logic in UI components only.
- Trust boundaries: the browser is untrusted. Household ID, role and device ID from the client are never trusted without server verification. The service-role key never leaves the server. Recovery codes are stored only as slow salted hashes on the server.
- Data source model:

| Data | Source of truth | Local use |
|---|---|---|
| Membership and roles | Supabase | Limited cache |
| Shared shopping list | Supabase | Local copy + pending operations |
| Catalog | Supabase | Offline read cache |
| Categories and route | Supabase | Offline read cache |
| Favorites | Supabase | Cache + local draft |
| Collected marks | Device only | IndexedDB |
| Tutorial status | Supabase, household level | Display cache |
| Recovery code | Server (hashed) | No persistent plaintext copy |

- Architectural rules:
  - Cloud is the source of truth; local data is never promoted to shared truth without server confirmation.
  - The UI always distinguishes saved locally / synced / failed.
  - No destructive action on shared data without an explicit action and confirmation.
  - Every sensitive or retryable operation carries a client-generated operation ID and is idempotent on the server.
  - No silent AI classification.
  - Data model keeps a `list_id` / `store_id` seam so multiple lists / stores can be added later without migration of semantics (assumption).

## 6. Tech Stack
| Layer | Choice | Reason |
|---|---|---|
| Frontend | JavaScript PWA; framework and build tool to be fixed in Phase 0 (default proposal: Vite + vanilla JS or a light framework) | Owner decision: JS PWA |
| Backend / functions | Supabase Postgres functions (RPC) + Edge Functions where needed | Owner decision; keeps sensitive logic server-side |
| Database | Supabase Postgres with RLS | Owner decision |
| Auth | Supabase Auth Anonymous Sign-ins as base identity (proposal, to be confirmed in Phase 0); device authorization and recovery codes as app-level layer | No email / password requirement |
| Storage | None in MVP (no images) | - |
| AI provider & model | None in MVP | No AI classification in v1 |
| Hosting | Vercel | Owner decision |
| Testing | Unit + integration (incl. RLS tests against local Supabase) + E2E; tools fixed in Phase 0 (default proposal: Vitest, Supabase CLI local stack, Playwright) | Stack defaults |

## 7. AI Architecture
Not applicable in MVP. Voice dictation uses the browser speech API and deterministic parsing; no LLM. Any future AI feature requires a PRD change.

## 8. Data Structure
Logical model; exact fields, keys, indexes and relations are fixed per phase. Identity model per ADR 0003: Supabase anonymous auth user = device principal; `app_users` = person; `devices` binds them, so device replacement switches the binding server-side.

| Entity | Key fields | Relations | Access rule |
|---|---|---|---|
| app_users | id (own UUID, not auth.uid - ADR 0003), display_name | 1 household via household_members; devices | Self read / update own display name; resolved via `app_private.current_app_user_id()` |
| devices | id, app_user_id, auth_user_id (unique), created_at, revoked_at; one active device per app user | app_users, auth.users | Self read only; written only by `security definer` functions; revocation immediate (policies re-resolve per query) |
| households | id, name, created_at | members, all household data | Members read; manager updates; delete via server function |
| household_members | household_id, user_id, role (manager / member) | users, households | Members read; changes only via server functions; one household per user |
| household_invites | household_id, code_hash, expires_at, revoked_at, used_at | households | Manager creates via server function; join verified server-side |
| household_settings | household_id, ... | households | Members read; manager writes |
| tutorial_status | household_id, completed_at | households | Members read / complete |
| shopping_items | id, household_id, name, quantity, unit, category_id, catalog_product_id, version, created/updated by/at | households, catalog, categories | Members CRUD within own household |
| catalog_products | id, household_id, name, variant / packaging attrs | aliases, categories | Members create / edit; manager removes |
| product_aliases | product_id, alias | catalog_products | As catalog |
| product_categories | id, household_id, name | - | Members read; edit rules in Phase 4 |
| store_areas | id, household_id, name, sort_order | - | Members read; edit rules in Phase 4 |
| category_area_mappings | category_id, area_id | categories, areas | As store_areas |
| favorites | household_id, product_id / name | catalog | Members CRUD |
| favorites_drafts | household_id, user_id, payload, created_at, expires_at | - | Owner only; one active draft (assumption: per user) |
| sync_operations (or equivalent) | operation_id, user_id, applied_at, result | - | Server-written; used for idempotency |
| recovery_secrets | user_id, code_hash, failed_attempts, locked_until | users | No client read; server functions only |
| audit_log | actor, action, target, at | - | Server-written; manager read (assumption) |

Collected state is not a column of `shopping_items`; it lives in device IndexedDB.

## 9. UX / UI Guidelines
## UI/UX & Product Design
1. Design Goal - Fast, calm, one-handed mobile use in Hebrew. Adding an item takes seconds; in store, the list reads top to bottom in walking order and the shopper always knows what is left.
2. Main Screens / Views - Home per approved sketch option 3 (`docs/design/home-sketch-option-3.html`): date eyebrow (device date via Intl he-IL), title, search + settings buttons; dark hero card (collected ring X/Y, item and area counts, "N נותרו לאסוף", sync line, "יוצאים לקנות" CTA to shopping mode); "המסלול בחנות" card (areas in walking order with item preview and per-area progress, "עריכת סדר" link); shortcuts (voice add, favorites, catalog); floating bottom nav: בית, רשימה, center add, מועדפים, הבית שלי. Home data ownership: row / area counts Phase 2-3, collected ring and per-area progress Phase 6, sync line Phase 7, shortcuts in the phase that builds each target (catalog 3, favorites 4, voice 5), live date eyebrow Phase 2; Phase 0 renders all of it as static placeholders. Shopping list / shopping mode (grouped by area, progress); Add items (text, voice, catalog; sticky "go to list" button with row count); Voice review; Catalog; Favorites (+ duplicate resolution, draft resume); "הבית שלי" household screen from the nav (household name, members and roles, invites, leave, management transfer, delete household) - Phase 8; Settings from the top-bar button (display name, store route, recovery code, tutorial replay) - Phase 10; Onboarding (identity, create / join, recovery code save, tutorial); Print view.
3. Main User Flows - see section 3; plus duplicate resolution (increase quantity / separate row / drop from selection) wherever items are added.
4. UX Principles - one primary action per screen; never commit uncertain input silently (review before commit); explicit confirmation for every destructive action, with clear scope; always show save / sync state; stay in context after adding (field clears, counter updates); personal state (collected) never looks shared.
5. Visual Language - calm, grown-up household tool per sketch option 3: off-white canvas, white cards, dark ink hero, single lime accent for progress and the main action, Rubik; no pastels, product photos or promotions.
6. Design System - v1.3 approved by owner 2026-10-29; full spec: `shraga/DESIGN_SYSTEM.md`. Every UI phase needs an owner-approved sketch in `docs/design/` before its prompt.
7. Responsive Behavior - mobile-first; tablet / desktop as centered single column (assumption).
8. Accessibility - full RTL (layout, icon mirroring, mixed Hebrew / numbers / Latin text), touch targets >= 44px, visible focus, never color alone for collected / sync / error status, readable B&W print.
9. UI States - loading, empty list, empty catalog, offline, pending sync, sync failed, conflict, voice unsupported / mic denied, lockout countdown, expired invite, expiring draft warning.
10. Open Design Questions - app name and icon.

## 10. Technical Requirements
- Backend logic: all rules in sections 10.1-10.6 are enforced server-side.
- APIs / integrations: Supabase JS client; server functions for sensitive operations with explicit contracts defined in Phase 0; Web Speech API with feature detection.
- Performance: list and shopping mode usable on mid-range phones with a few hundred items (assumption); type-ahead search responsive offline from cache.
- Cost control: Supabase free / pro tier limits; periodic cleanup of abandoned anonymous users (Supabase has no automatic cleanup).

### 10.1 Business rules
- Duplicates: adding an existing item offers increase quantity / separate row / cancel. Items with different attributes (packaging, volume) never merge.
- Free-text items stay off the catalog unless the user explicitly adds them and picks a category.
- Category and store area are distinct concepts; mapping is a household setting.
- Clear list requires confirmation; does not touch catalog or favorites; creates no history.
- Catalog removal (manager only) does not delete list rows and does not remove favorites without an explicit rule.
- Leaving / removed member loses access; data stays. A manager must transfer management or delete the household before leaving. A household is never left without a manager.
- Favorites draft: one active; expires 7 days from creation (activity does not extend); warning when <= 24h left (continue / cancel); cancel adds nothing.
- Invites: valid 24h; one active per household; new invite revokes previous; failed join does not consume; success revokes; all server-side.
- Recovery: 5 wrong attempts -> 15 min lockout enforced server-side (refresh / new window does not bypass); success resets counters; failure never revokes an existing authorization; once the code is verified the recovery cannot be cancelled; device switch is atomic (all or nothing).
- Household deletion shows a preview of everything deleted (list, catalog, favorites, areas, members, invites, drafts) and executes server-side with dependency handling and result check.
- Home badge counts rows, not summed quantities.

### Security
Security drivers: multi-tenant household data; custom identity without email / password; recovery codes (credential-equivalent); invite codes; admin roles; offline queue replaying operations after permission changes; microphone access.
Standards baseline: OWASP Top 10:2025; ASVS 5.0.0 target per phase. No LLM / agent features, so LLM and Agentic Top 10 do not apply.
ASVS targets: Phase 0: design-level (trust boundaries, auth model, abuse cases). Phases 1-8: L1. Phases 9-10 (invites, recovery, device replacement): L2 for those features. Phase 12 production: L2.
Key controls:
| OWASP item | Control | Owner phase |
|---|---|---|
| A01 Broken Access Control | RLS on every household table; membership checked from `auth.uid()`, never from client-supplied household ID; role changes only in server functions; RLS tests with two households | 2 (+ every phase adding tables) |
| A07 Authentication Failures | Identity model decided in Phase 0 (proposal: Supabase anonymous sign-in + device record + recovery code); device ID alone never proves identity; CAPTCHA or rate limit on anonymous sign-up | 0, 2, 10 |
| A04 Cryptographic Failures | Recovery and invite codes high-entropy, stored as salted slow hashes; no plaintext persistence | 9, 10 |
| A06 Insecure Design | Server-side lockout counters; atomic device switch and management transfer in one transaction; idempotency via operation IDs | 5, 8, 9, 10 |
| A02 Security Misconfiguration | Service-role key server-only; separate dev / prod Supabase projects; no secrets in client bundle | 1 |
| A05 Injection | Parameterized queries / RPC only; validate all inputs server-side | 3 onward |
| A09 Logging & Alerting Failures | Audit log for admin actions and recovery attempts; no codes or tokens in logs | 9, 10, 12 |
| A08 Software / Data Integrity | Pending offline operations re-authorized by the server on replay; rejected ops surfaced to the user | 8 |
Trust boundaries: see section 5.
Privacy: data is low-sensitivity (shopping items, display names) but personal; voice recognition may be processed by the browser vendor's cloud - disclose to the user and require explicit mic permission.
Open security questions: final identity / session model; recovery-code storage and verification design; behavior of pending ops after membership loss.
Verified against: OWASP Top 10:2025, ASVS 5.0.0, Supabase Auth docs (Anonymous Sign-ins, Identity Linking, RLS), 2026-10-28

### Quality & Testing
Approach: automated-first; tests written and run by the build session every phase, re-run by the reviewer.
Critical paths (must always work): cross-household isolation (RLS); add / edit / delete / clear on the shared list with realtime visibility; offline add / edit then reconnect without duplicates or silent loss; idempotent favorites bulk add; invite join lifecycle; recovery-code lockout and atomic device replacement.
Test levels and tools: unit (business rules, quantity / unit parsing, voice text parsing, duplicate detection, draft expiry); integration against local Supabase (RLS, server functions, concurrency); E2E on mobile viewport (core journeys, offline simulation); manual smoke script per UI phase, including Hebrew voice on target devices.
Definition of Done (every phase): acceptance criteria verified with evidence; previous-phase tests pass; no Critical / Major open bugs in phase scope; tests not weakened or removed; independent review Approved.
Test data: seed households and users only; never real personal data.
Test environment (owner decision 2026-10-29): two Supabase projects - hosted `MapMyShopping` for development and integration / RLS tests, a separate production project created before Phase 11. Migrations only from `supabase/migrations/`; each test run uses uniquely prefixed households / users and deletes them afterwards; test-only secrets in git-ignored `.env.test.local`; tests never run against production.

## 11. Success Criteria
| Dimension | Metric | Target |
|---|---|---|
| Usage | Household manages its shared list end to end (add, shop by route, clear) | All flows in section 3 work on target phones |
| Reliability | Offline operations lost silently | 0 |
| Reliability | Duplicate rows created by retries | 0 |
| Security | Cross-household data access in tests | 0 |
| Security | Partial authorization state after failed device replacement | 0 |
| Quality | Voice items added without explicit confirmation | 0 |
| Operations | Deployment, monitoring and backup restore | Documented and tested once |

## 12. Risks & Limitations
### Risk Summary
The main risks are architectural rather than feature-level: a custom identity model without email / password, offline sync with conflicts and idempotency, and atomic device replacement. All three must be decided in Phase 0 and enforced server-side.
### Risk Register
| ID | Risk | Category | Severity | Mitigation | Owner Phase | Status |
|---|---|---|---|---|---|---|
| R1 | Identity without email / password; device ID treated as proof of identity enables impersonation | Security | Critical | Use Supabase Auth session (anonymous sign-in) as identity; device record and recovery code as extra layers; decision record in Phase 0 | 0, 1 | Mitigated in design (ADR 0003, owner-approved); enforced in Phase 1 |
| R2 | Offline sync: browser storage eviction, no reliable background sync, silent loss | Reliability | Major | Sync on foreground / reconnect, visible pending queue, eviction detection | 8 | Open |
| R3 | Concurrent edits overwrite each other | Reliability | Major | Row `version` with optimistic concurrency; field-level merge only when safe; conflict UI | 3, 8 | Open |
| R4 | Device replacement leaves partial or double authorization | Security | Critical | Single server transaction; idempotent; tests for failure mid-switch and parallel attempts | 10 | Open |
| R5 | Hebrew speech recognition unsupported or cloud-processed on target browsers | Product / Privacy | Major | Feasibility check in Phase 0; feature detection; manual fallback; privacy notice | 0, 6 | Open |
| R6 | Destructive actions confused (row delete / clear list / catalog removal / household delete) | Product | Major | Distinct flows, confirmations with scope preview, server-side execution | 3, 4, 9 | Open |
| R7 | Recovery-code brute force | Security | Critical | Server-side counters and lockout, hashed codes, rate limit, audit log | 10 | Open |
| R8 | Abuse of anonymous sign-up (bot accounts, DB growth) | Security / Cost | Minor | CAPTCHA or rate limit; scheduled cleanup of stale anonymous users | 2, 12 | Open |
| R9 | Pending offline ops replayed after member removal | Security | Major | Server re-authorizes every replayed op; rejected ops shown to user | 8 | Open |
| R10 | Admin-protected RPC with `security definer` bypasses RLS if written carelessly | Security | Major | Explicit role checks inside every definer function, fixed `search_path`, dedicated tests | 2 onward | Open |
### Accepted Constraints
- Offline availability is limited by browser storage and lifecycle policies.
- Voice dictation may be unavailable on some browsers; manual entry is the guaranteed path.
### Assumptions Under Validation
- Supabase anonymous sign-in sessions persist reliably in an installed PWA on iOS and Android.
- Hebrew speech recognition works in the target mobile browsers.

## 13. Assumptions & Open Questions
- Assumptions: single list and single store per household in MVP; one household per identity; favorites draft is per user; mobile-first single column on larger screens.
- Open questions (decided in Phase 0 before the relevant implementation):
  1. Exact identity and session mechanism.
  2. Recovery-code generation, storage and verification.
  3. Atomic device-replacement mechanism.
  4. API contracts for sensitive operations.
  5. Versioning and conflict model.
  6. Behavior of pending operations after permission changes.
  7. Hebrew speech recognition support on target browsers.
  8. Backup, monitoring and logging policy.
  9. Behavior when the browser evicts local data.
  10. Frontend framework and build tool.
  11. Visual design direction.

## 14. Development Phases
See `shraga/Plan.md` (authoritative once written). The owner's PRD v1.1 defines 13 phases (0-12) in this order: 0 Architecture & technical validation; 1 Foundation & deployment; 2 Identity, sessions & membership; 3 Shared list core; 4 Catalog, categories & store route; 5 Favorites & safe bulk add; 6 Add-item & voice; 7 Shopping mode, local collected state & print; 8 PWA offline & sync; 9 Invitations, members & household lifecycle; 10 Recovery codes & device replacement; 11 Onboarding, settings & complete UX; 12 Production readiness. Detailed scope, acceptance criteria and checklists per phase are in the Hebrew source and will be carried into Plan.md.

Process note: the Shraga harness flow in `CLAUDE.md` (phase prompt -> build session -> report -> `/shraga-review` -> close) replaces the manual review process in section 16 of the Hebrew source.

## Change Log
| Version | Date | Change |
|---|---|---|
| 1.1 | - | Owner's Hebrew PRD |
| 1.2 | 2026-10-28 | Translated to technical English on the Shraga template; moved to `shraga/`; added Security (OWASP / ASVS), Quality & Testing, risk register, data access rules; proposed Supabase anonymous sign-in as identity base (pending Phase 0 decision) |
| 1.3 | 2026-10-28 | Visual direction set from owner's grocery-app references; `shraga/DESIGN_SYSTEM.md` draft v1.0 created. Hebrew source kept as non-authoritative reference |
| 1.4 | 2026-10-28 | Design system v1.1: owner rejected the Phase 0 look; follow the grocery-app reference closely; bottom navigation added. Correction prompt `shraga/prompts/phase-0-fix-1.md` |
| 1.5 | 2026-10-28 | Design system v1.2: owner rejected v1.1 and chose the Foodnoms direction; `prompts/phase-0-fix-1.md` rewritten before use |
| 1.6 | 2026-10-29 | Owner approved home sketch option 3 (revised); DESIGN_SYSTEM.md v1.3. Decided: bottom-nav item "הבית שלי" opens the household screen (members, invites, lifecycle; Phase 8) while settings stays in the top bar (display name, store route, recovery code, tutorial replay; Phase 10); date eyebrow shows the device date via Intl he-IL (live from Phase 2). Home sections mapped to owning phases. Sketch-first rule for UI phases |
| 1.7 | 2026-10-29 | Phase 0 closed. Section 8 updated for ADR 0003 identity model (`app_users` separate from `auth.uid()`, `devices` binding); R1 status updated. Open: C1 test target, C3 recovery rotate vs view |
| 1.8 | 2026-10-29 | C1: test environment = hosted dev project with safeguards; two-project model (dev+test, prod) |
