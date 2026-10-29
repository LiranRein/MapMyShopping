# Architecture Review - Phase 0: Architecture decisions & foundation
Verdict: Approved with conditions
Round: 4   Date: 2026-10-29
Reviewed: shraga/reports/phase-0-report.md (Round 4, "Fix round 3 evidence") + code changes + deployed site
Baseline: shraga/prompts/phase-0-prompt.md, shraga/prompts/phase-0-fix-1.md, shraga/prompts/phase-0-fix-2.md, shraga/Plan.md (Phase 0 + change log 2026-10-29), shraga/project-arch-plan.md, shraga/DESIGN_SYSTEM.md v1.3, docs/design/README.md + home-sketch-option-3 (option-3-top.jpg / option-3-bottom.jpg), previous review (Round 3)

## 1. Summary
Fix prompt `phase-0-fix-2.md` (DESIGN_SYSTEM.md v1.3, sketch option 3) is fully implemented and independently verified: tokens equal v1.3 with v1.2 tokens removed, the home shell matches the approved sketch with static placeholder data in one module, Rubik Hebrew + Latin only, icons from `lucide-preact`, no data loading, Supabase calls, routing or behavior, and production serves the same asset hashes as the local build. No boundary is violated and no scope was pulled forward. New findings are Minor (component px literals outside tokens, ARIA on inert elements, disabled-state fading visibly differs from the sketch, a reported `.prettierignore` change). Round 3 conditions C1-C6 stand; C7 and C8 are closed.

## 2. Evidence Verified by the Reviewer
Tests: `npm test` -> 4 files, 18 passed, 0 failed, 0 skipped
Lint: `npm run lint` -> exit 0
Format: `npm run format:check` -> "All matched files use Prettier code style!"
Build + scan: `npm run build` -> built in 582ms; `dist/assets` = `index-Bh0iDCd-.js`, `index-Da46qmxE.css`, `rubik-hebrew-wght-normal-BIkpbuMU.woff2`, `rubik-latin-wght-normal-CnQIisVs.woff2` only; "Bundle secret scan passed: 3 file(s) scanned in dist, 0 findings."
Deployed site (reviewer, curl): `200`; nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy `microphone=(self)`, HSTS present. Served HTML `<html lang="he" dir="rtl">`, `theme-color #F2F3EF`, assets `index-Bh0iDCd-.js` / `index-Da46qmxE.css` (identical to the local build). Served CSS: `--color-ink:#14201b`, `--color-accent:#c6f36b`; only `url(/assets/rubik-hebrew-...)` and `url(/assets/rubik-latin-...)`. Served JS grep `service_role|sb_secret_|SERVICE_ROLE` -> 0.
Browser (reviewer, built-in browser, production, 375x812): `dir=rtl`; body bg `rgb(242, 243, 239)`; hero `rgb(20, 32, 27)`, radius 28px; H1 height 34.5px (one line); exactly one element with `box-shadow` (`.bottom-nav`); scrollWidth 375; `document.fonts.check` Rubik on Hebrew = true; 0 cross-origin resource requests; 4 stops, 3 tiles, nav with 5 children, `aria-current` on "בית"; CTA opacity 0.4, tile opacity 1. Screenshot compared with `option-3-top.jpg`: layout, type, colors, ring, route card and floating nav match; visible differences are exactly the four the report lists.
Code inspected: `tokens.css`, `base.css`, `fonts.css`, `HomeScreen.jsx`, `homePlaceholderData.js`, `he.js`, `main.jsx`, `index.html`, `.prettierignore`, `tests/unit/home-screen.test.jsx`, `tests/unit/rtl-shell.test.js`. Grep in `src/`: hard-coded hex / rgb outside `tokens.css` -> 0; physical `left` / `right` properties -> 0; `supabase|indexeddb|fetch(` in `src/presentation` and `src/application` -> 0; `box-shadow` -> 1 (`var(--shadow-nav)`). `supabase/migrations/` contains only `.gitkeep`.
Not a git repository: no diff available; files listed in the report exist.
NOT RUN by reviewer: `supabase start` (Docker absent), CI (no repo / remote).

## 3. What Matches the Architecture
- Fix item 1: all 17 `--color-*` rows equal DESIGN_SYSTEM v1.3; type scale H1 (+ -0.3px tracking), Hero, Ring, H2, Button, Body strong, Body, Meta, Caption, Micro; `--space-1..12`; radius 12 / 18 / 20 / 24 / 28 / 9999; single `--shadow-nav`; layout and motion tokens from sections 5 and 9. v1.2 tokens removed. Parity test unchanged in strictness (`> 15` rows, every row asserted) and passes.
- Fix item 2: header with static eyebrow, single-color H1 and two disabled 46px round buttons (Hebrew `aria-label`); ink hero `<section aria-label="סיכום הרשימה">` with 96px ring (stroke 10, ink-2 track, accent fill, round cap, 12 o'clock start, `role="img"` "5 מתוך 12 נאספו"), "הקנייה הבאה", "12 פריטים / ב-4 אזורים", "7 נותרו לאסוף", sync line, disabled lime CTA with ink arrow square; "המסלול בחנות" with inert "עריכת סדר" and 4 stops (first done = ink square with lime check, name in subtle); "קיצורים" with 3 inert tiles; floating `<nav aria-label="ניווט ראשי">` `1fr 1fr 76px 1fr 1fr`, "בית" `aria-current="page"`, center disabled "הוספת פריט". Dropped stats absent. Placeholder data in one module (`homePlaceholderData.js`); all strings in `src/locale/he.js`; icons from `lucide-preact`; mixed numbers in `<bdi>`.
- Fix item 3: Rubik unchanged, self-hosted, Hebrew + Latin subsets only.
- Fix item 4: production redeployed and verified by the reviewer.
- Required tests present: title, hero ring text equivalent, "7 נותרו לאסוף", 4 stops, 3 tiles, nav with single `aria-current` and center button, dropped stats absent. No tests deleted, skipped or weakened; the home test file was rewritten as the prompt required (5 -> 7 tests).
- Contrast: body-size muted text uses `--color-text-muted` #646E69 as DESIGN_SYSTEM requires; lime appears only on ink; `--color-text-subtle` only on the 17px bold done-stop name.
- No data loading, Supabase calls, routing or behavior behind placeholders. Presentation layer stays free of data access.
- `theme-color` -> `#F2F3EF` is a reported, in-scope consequence of the v1.3 canvas.
- All Round 2-3 "matches" remain true (stack, layers, secrets controls, ADRs, no product tables).

## 4. Violations
| # | Area | Type | Finding | Severity |
|---|---|---|---|---|
| V2 | Operational readiness | Unauthorized deviation (owner-accepted, reported) | No local Supabase stack; hosted `MapMyShopping` used as dev. Unchanged. | Major (owner-accepted; hard condition C1) |
| V3 | Operational readiness | Missing detail | CI never run; Vercel CLI-deployed, not Git-connected. Unchanged. | Minor |
| V4 | Documentation completeness | Deviation (owner-approved) | PRD section 8 not updated for ADR 0003 identity model. Unchanged. | Minor |
| V5 | Contract compliance | Deviation (needs decision) | ADR 0004 rotate vs PRD view recovery code. Unchanged. | Minor |
| V7 | Documentation completeness | Missing detail | ADR 0012 still names `mapmyshopping-dev` and the local CLI stack. Unchanged. | Minor |
| V11 | UI / conventions | Incomplete implementation | `base.css` uses component px literals outside tokens (hero padding 22px, gaps 18px / 14px / 6px / 3px, stop padding 14px, sizes 46 / 60 / 40 / 36px, nav-add offset -26px). Values match DESIGN_SYSTEM section 7, but `.claude/rules/project.md` says spacing only via tokens. | Minor |
| V12 | Accessibility | Missing detail | `aria-disabled="true"` is set on non-interactive `<li>` tiles and `<span>` nav items / link (no interactive role, so assistive tech ignores or flags it); the done-stop `Check` SVG has `aria-label="הושלם"` without `role="img"`, so exposure is inconsistent across screen readers. Done state is still conveyed by "4/4", so not color-only. | Minor |
| V13 | UI | Deviation (reported, DESIGN_SYSTEM-mandated) | 40% disabled opacity makes the CTA read olive and the center "+" grey, visibly unlike the approved sketch (reviewer screenshot). Correct per DESIGN_SYSTEM section 7, but the owner has rejected the shell look twice; the owner has not seen this difference. | Minor |
| V14 | Operational readiness | Deviation (reported) | `.prettierignore` gains `docs/design/` so `format:check` passes on Shraga-owned sketch files. Reasonable and reported; not in the fix prompt. | Minor |
| V8 | UI | - | Closed: real disabled buttons fade to 40%; tiles / nav items are inert per fix-2 ("disabled or inert"). | Closed |
| V9 | Documentation | - | Closed: "How to Try It" describes the current shell; sections 2-5 are explicitly labelled as Round 1 state. | Closed |
| V10 | Baseline | - | Closed: DESIGN_SYSTEM v1.3 sections 7 and 14 agree ("הוספת פריטים" for the empty hero). | Closed |

## 5. Risks
V2 - unchanged from Round 2 (six-field report there): Phase 1 RLS / RPC integration test target undecided. Approval effect: does not block Phase 0; blocks writing the Phase 1 prompt until C1 is resolved.
V11 - Minor: literals drift from the design system when it changes. Track: add component tokens or record that component dimensions from section 7 may be literal.
V12 - Minor: noisy / ignored ARIA; resolves naturally when tiles and nav items become real buttons / links in later phases. Track.
V13 - Minor: risk of a third owner rejection on looks if the owner expected the sketch's full-color CTA. Shraga to show the deployed page to the owner at close.
V14 - Minor: tooling config change; no risk to app code. Shraga to acknowledge.

## 6. Deviations Needing a User Decision
| Deviation | Consequence | Recommendation |
|---|---|---|
| Hosted `MapMyShopping` as dev instead of local CLI stack + `mapmyshopping-dev` | Changes ADR 0012 and Phase 1 test strategy | Unchanged (C1) |
| `app_users.id` != `auth.uid()` (ADR 0003, owner-approved) | PRD data model | Adopt; Shraga updates PRD section 8 (C2) |
| Recovery code "view" -> "rotate" (ADR 0004) | PRD feature text | Shraga asks the owner before Phase 9 (C3) |
| Disabled controls at 40% vs full-color sketch (V13) | Shell looks different from the approved sketch until Phase 1+ enables them | Owner confirms at phase close (C9) |

## 7. Missing Information
- No `supabase start` output (Docker absent).
- CI run evidence (no repo).
- Manual Hebrew speech device check (R5) pending by owner; required before Phase 5.

## 8. Required Corrections
None for Phase 0. Conditions below are carried by Shraga.

Conditions:
- C1 (hard gate, Phase 1 entry): Shraga records the owner's decision on the Supabase test target (local stack via Docker vs hosted dev with safeguards) in Plan.md change log and ADR 0012 before writing the Phase 1 prompt.
- C2: Shraga updates PRD section 8 for the ADR 0003 identity model (V4).
- C3: Shraga asks the owner about ADR 0004 rotate-vs-view and records it (V5), before Phase 9.
- C4: Repo pushed to GitHub, CI run green and Vercel Git-connected before or during Phase 1 (V3).
- C5: ADR 0012 updated to the real project names; prod project created before the production phase (V7).
- C6: R5 manual speech check before Phase 5.
- C9: Shraga shows the owner the deployed shell and records acceptance of the 40% disabled state (V13) at phase close.
- C10: The next phase touching `base.css` / the home shell either adds component tokens for the section 7 literals or Shraga records that they may stay literal (V11); and replaces `aria-disabled` on non-interactive elements with real disabled controls or removes it, and gives the done check `role="img"` or a visually hidden text (V12).
- C11: Shraga acknowledges the `.prettierignore` `docs/design/` exclusion in the Plan.md change log (V14).
- C7, C8: Closed.

## 9. Final Decision
Approved with conditions: fix prompt `phase-0-fix-2.md` is fully delivered and verified, AC-0.1 to AC-0.4 remain met, no boundary is violated; conditions C1-C6 and C9-C11 are carried by Shraga, with C1 a hard gate before the Phase 1 prompt.

Baseline items closed by this phase: AC-0.1, AC-0.2, AC-0.3, AC-0.4; risk gate R1 (identity ADR approved), secrets location (ADR 0012), R5 findings recorded; fix prompts phase-0-fix-1 items 1-4 and phase-0-fix-2 items 1-4; V6, V8, V9, V10.
Conditions carried to the next phase: C1-C6, C9-C11.

## Round History
| Round | Date | Verdict | Main reason |
|---|---|---|---|
| 1 | 2026-10-28 | Rejected | AC-0.2 deploy not evidenced; Supabase local stack not running |
| 2 | 2026-10-28 | Approved with conditions | V1 fixed and verified; V2 owner-accepted deviation, carried as Phase 1 entry gate C1 |
| 3 | 2026-10-28 | Approved with conditions | phase-0-fix-1 (DESIGN_SYSTEM v1.2 shell, Rubik subsets, redeploy) delivered and verified; only Minor findings added |
| 4 | 2026-10-29 | Approved with conditions | phase-0-fix-2 (DESIGN_SYSTEM v1.3 / sketch option 3 shell, redeploy) delivered and verified; C7, C8 closed; only Minor findings added |
