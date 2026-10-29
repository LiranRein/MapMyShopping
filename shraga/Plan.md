# Plan - MapMyShopping
Build tool: Claude Code   Stack: JS PWA + Supabase (Postgres, Auth, RLS, Realtime, RPC / Edge Functions) + Vercel   Source of truth: shraga/project-arch-plan.md, shraga/DESIGN_SYSTEM.md
Rules: one phase at a time; tests run every phase (incl. all previous phases); independent review closes every phase; no work outside the current phase; every new table ships with RLS and RLS tests in the same phase; every phase with UI work needs an owner-approved visual sketch in `docs/design/` before its implementation prompt is written.

## Status
| Phase | Name | Status |
|---|---|---|
| 0 | Architecture decisions & foundation | Done 2026-10-29 |
| 1 | Identity, sessions & household membership | In progress |
| 2 | Shared shopping list core | Not started |
| 3 | Catalog, categories & store route | Not started |
| 4 | Favorites & idempotent bulk add | Not started |
| 5 | Add-item experience & voice input | Not started |
| 6 | Shopping mode, local collected state & print | Not started |
| 7 | PWA offline storage & sync | Not started |
| 8 | Invitations, member admin & household lifecycle | Not started |
| 9 | Recovery codes & device replacement | Not started |
| 10 | Onboarding, settings & complete UX | Not started |
| 11 | Production readiness | Not started |

## Phase 0 - Architecture decisions & foundation
Objectives: close the PRD open questions that block building; runnable skeleton deployed to Vercel.
Features: ADRs in `docs/adr/` for identity / sessions (Supabase anonymous sign-in proposal), recovery-code storage, atomic device switch, versioning / conflicts, idempotency (operation IDs), pending ops after permission change, local-data eviction, API contracts for sensitive ops, frontend framework + build tool; Hebrew speech-recognition feasibility check on target browsers (findings doc); project skeleton with layered folders (presentation / application / data-sync / security); `.claude/rules/project.md`; Supabase CLI local stack + migrations folder (no product tables yet); dev / prod env separation; lint, format, unit test runner, CI build; RTL layout shell with DESIGN_SYSTEM.md tokens and Rubik self-hosted; empty home 2x2 placeholder.
Acceptance criteria:
- AC-0.1 Every PRD open question 1-10 has an ADR with decision or an explicit "unvalidated" mark.
- AC-0.2 App builds, runs locally and deploys to Vercel; `dir="rtl"` and tokens applied.
- AC-0.3 No service-role key or secret in the client bundle (bundle grep in report).
- AC-0.4 Test command runs with at least 1 passing test; commands recorded in `.claude/rules/project.md`.
Risk gate: R1 identity ADR approved by the owner; secrets location defined; R5 feasibility findings recorded.
Tests: setup only + bundle secret scan.

## Phase 1 - Identity, sessions & household membership
Objectives: secure identity and household-scoped access model. Detailed plan: phase-1-plan.md Sketch: docs/design/onboarding-sketch-option-c.html (owner-approved 2026-10-29).
Features: identity creation per ADR; display name; create household (creator = manager); join via server-verified invite code (24h, one active, failed attempt does not consume); one household per identity; devices table; tables users, devices, households, household_members, household_invites, household_settings with RLS; abuse control on sign-up (R8); session persists across reload.
Acceptance criteria:
- AC-1.1 User of household A cannot read or write any row of household B (integration test, two households).
- AC-1.2 A member cannot make themselves manager via API.
- AC-1.3 Display-name change does not change identity or role.
- AC-1.4 Joining a second household is rejected server-side. Risk gate: R1 mitigated; R10 role checks + fixed `search_path` in every `security definer` function.
Tests: integration for RLS and RPCs (positive + negative); unit for validation; E2E create -> reload -> still signed in. Carried from Phase 0 review: C1 decided 2026-10-29 - integration tests run against hosted dev project `MapMyShopping` (see change log); C4 GitHub repo, green CI, Vercel Git-connected; C5 ADR 0012 real project names.

## Phase 2 - Shared shopping list core
Objectives: shared list with safe editing.
Features: C10 home-shell fixes first (component tokens, ARIA); shopping_items (with `version`, `list_id` seam); add / edit name, quantity, unit, category; delete row with confirm; clear list with confirm; realtime updates between members; row counter; save / error feedback; duplicate detection (increase / separate row / cancel); optimistic concurrency on `version`.
Acceptance criteria:
- AC-2.1 Changes persist after reload and appear for another member without reload.
- AC-2.2 Counter counts rows, not quantities.
- AC-2.3 Clear list leaves catalog and favorites intact.
- AC-2.4 Duplicates never merge without user choice; different packaging never merges.
- AC-2.5 Stale `version` update is rejected and surfaced.
Risk gate: R3 versioning in place; R6 delete vs clear flows distinct.
Tests: unit duplicate rules; integration CRUD + RLS + stale version; E2E two-member edit.

## Phase 3 - Catalog, categories & store route
Objectives: shared catalog and store-area ordering.
Features: catalog_products, product_aliases, variants / packaging, product_categories, store_areas, category_area_mappings (RLS); type-ahead search incl. aliases; browse by category; explicit add-to-catalog; areas create / rename / reorder; category-to-area mapping; manager-only catalog removal.
Acceptance criteria:
- AC-3.1 Search matches names and aliases.
- AC-3.2 Only manager can remove a catalog product (server-enforced); removal keeps list rows.
- AC-3.3 Free-text items are never auto-added to catalog; uncategorized stay unassigned.
- AC-3.4 Area order persists. Risk gate: removal permission tested server-side.
Tests: unit search / alias matching; integration RLS + manager-only RPC; E2E add-to-catalog.

## Phase 4 - Favorites & idempotent bulk add
Objectives: shared favorites and a retry-safe bulk add.
Features: favorites, favorites_drafts (RLS); grouped by category; multi-select; per-duplicate resolution; final confirm before insert; one resumable draft; 7-day expiry from creation; <=24h warning; cancel discards; bulk add RPC with operation ID.
Acceptance criteria:
- AC-4.1 Nothing is added before final confirm; cancel adds nothing.
- AC-4.2 Draft resumes after app restart at the same step.
- AC-4.3 Expiry computed from creation; activity does not extend it.
- AC-4.4 Repeating the same bulk-add operation ID adds nothing twice. Risk gate: idempotency verified with a forced retry.
Tests: unit expiry / warning logic; integration idempotent RPC; E2E select -> resolve -> confirm.

## Phase 5 - Add-item experience & voice input
Objectives: fast item entry by text, catalog and voice.
Features: add-items screen (stay on screen, field clears, visit counter, sticky "go to list (N)"); catalog pick; Web Speech API with feature detection; Hebrew text parser to items / quantity / unit; review sheet (edit / add / remove, uncertain flagged); mic-denied and unsupported fallbacks; privacy notice for cloud recognition.
Acceptance criteria:
- AC-5.1 Voice results never enter the list without explicit confirm; uncertain items flagged.
- AC-5.2 Unsupported browser or denied mic shows a clear message and manual entry.
- AC-5.3 Parser extracts quantity and unit for the agreed sample set.
Risk gate: R5 fallback verified on target devices (manual smoke script).
Tests: unit parser with fixed Hebrew sample set; E2E review flow with mocked recognition; manual device check.

## Phase 6 - Shopping mode, local collected state & print
Objectives: complete in-store experience.
Features: grouping by area in route order; hide empty areas; unassigned group last; local collected state in IndexedDB (basic local store, extended in Phase 7); unmark; filter not-collected; progress counter + bar; B&W print view.
Acceptance criteria:
- AC-6.1 Collecting on one device does not change the shared list or another device.
- AC-6.2 Changing an area mapping regroups items.
- AC-6.3 Filter hides without deleting; progress = collected rows / rows.
- AC-6.4 Print shows areas, quantities, units; no UI controls. Risk gate: personal vs shared state separation tested.
Tests: unit grouping / progress; E2E two devices; manual print check.

## Phase 7 - PWA offline storage & sync
Objectives: predictable behavior without connectivity. Deep dive recommended (`phase-7-plan.md`).
Features: service worker + app-shell cache; IndexedDB cache of loaded data; pending operation queue with operation IDs; sync on reconnect and on foreground; capped retries; conflict detection and resolution UI; safe field-level merge; sync status indicator; storage errors and eviction handling; server re-authorizes replayed ops.
Acceptance criteria:
- AC-7.1 Loaded data readable offline after reload.
- AC-7.2 Offline add / edit queued, visible as pending, synced on reconnect with no duplicates.
- AC-7.3 Concurrent edits detected; nothing shown as synced before server ack.
- AC-7.4 Ops queued before membership removal are rejected and surfaced.
Risk gate: R2, R9 mitigated.
Tests: integration replay / idempotency; E2E offline scenarios (Playwright offline mode) incl. timeout retry and two concurrent edits.

## Phase 8 - Invitations, member admin & household lifecycle
Objectives: full membership management.
Features: "הבית שלי" household screen (nav item); invite UI (link + code), revoke previous on new invite, manager notification on join; member list and roles; leave; remove member; atomic management transfer; manager cannot leave without transfer / delete; household deletion with preview and typed confirm (server-side, dependency handling); audit log for admin actions.
Acceptance criteria:
- AC-8.1 Expired / used / revoked invite rejected; two parallel joins on one invite resolve to at most one success.
- AC-8.2 Removed member loses access immediately (RLS test).
- AC-8.3 Transfer is atomic; household never without a manager.
- AC-8.4 Deletion removes all listed data and only that household's data.
Risk gate: ASVS L2 for invite flows; R6 deletion flow verified.
Tests: integration concurrency + RLS after membership change; E2E transfer and delete.

## Phase 9 - Recovery codes & device replacement
Objectives: secure identity recovery. Deep dive recommended (`phase-9-plan.md`).
Features: recovery code generation, save / copy / confirm screen, view after warning, rotate; hashed storage; server verify; 5 failures -> 15 min lockout; reset on success; atomic device switch revoking the old device; failure leaves prior authorization; non-cancellable after verify; lost-code path documented.
Acceptance criteria:
- AC-9.1 Lockout enforced server-side; refresh / new window does not bypass.
- AC-9.2 Failure never revokes the existing device; success revokes the old one.
- AC-9.3 No state with both devices authorized; parallel recovery attempts resolve to one.
- AC-9.4 Code never readable by other members or present in logs.
Risk gate: R4, R7 mitigated; ASVS L2.
Tests: integration lockout, atomicity with injected failure, concurrency; E2E recovery on second browser context.

## Phase 10 - Onboarding, settings & complete UX
Objectives: complete user experience. Features: first-run flow incl. mandatory recovery-code save; multi-screen tutorial (skip, resume, household-level completion, temporary home button); settings from the top bar (display name, store route, recovery code, tutorial replay); all loading / empty / error / offline states per DESIGN_SYSTEM.md section 14.
Acceptance criteria:
- AC-10.1 Tutorial completion by any member hides the button for all.
- AC-10.2 Every screen has loading, empty and error states.
- AC-10.3 RTL and basic accessibility checks pass on mobile.
Tests: E2E new user, skip tutorial, other member completes; automated a11y scan.

## Phase 11 - Production readiness
Objectives: safe to launch.
Features: full regression and E2E on all critical paths; OWASP audit (shraga-security); performance sanity; mobile / browser matrix; monitoring and logs; backup and tested restore; anonymous-user cleanup job; deployment and operations docs; secrets / env review.
Acceptance criteria:
- AC-11.1 Full regression passes; no open Critical / Major.
- AC-11.2 Backup restore performed once and documented.
- AC-11.3 Rollback path documented.
Risk gate: production readiness checklist (shraga-risk) complete; ASVS L2.
Tests: full regression + security audit.

## Change Log
| Date | Change |
|---|---|
| 2026-10-28/29 | Plan approved (from PRD v1.3); owner phases 0+1 merged into Phase 0 (owner phase N = Plan phase N-1 after it); basic invite join in Phase 1. Design system v1.0 -> v1.3 (owner-approved home sketch option 3); sketch-first rule; "הבית שלי" = household screen (Phase 8), settings in top bar (Phase 10), live date eyebrow from Phase 2 |
| 2026-10-29 | Phase 0 closed (review round 4: Approved with conditions). Owner accepted 40% disabled controls on the placeholder shell until they are enabled (C9). Acknowledged `.prettierignore` excludes Shraga-owned `docs/design/` (C11). Carried: C1, C4, C5 -> Phase 1; C10 (component tokens, ARIA on inert elements) -> next phase touching the home shell (Phase 2); C6 speech check -> before Phase 5; C3 recovery rotate vs view -> before Phase 9; C5 prod project -> before Phase 11. PRD section 8 updated for ADR 0003 (C2) |
| 2026-10-29 | C1 decided by owner: two Supabase projects (free tier) - `MapMyShopping` = dev + integration tests, separate prod project before Phase 11; no Docker / local stack. Safeguards: schema changes only via `supabase/migrations/`; tests create uniquely prefixed data and delete it after each run; test-only secrets in git-ignored `.env.test.local`, never in client code or CI logs; tests never target prod. Phase 1 updates ADR 0012 accordingly |
