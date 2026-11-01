# Architecture Review - Phase 1: Identity, sessions & household membership
Verdict: Approved with conditions
Round: 1   Date: 2026-11-01
Reviewed: shraga/reports/phase-1-report.md + code changes (commit 6969328 and working tree)
Baseline: shraga/prompts/phase-1-prompt.md, shraga/Plan.md (Phase 1), shraga/phase-1-plan.md, shraga/project-arch-plan.md, shraga/DESIGN_SYSTEM.md v1.3, .claude/rules/project.md

## 1. Summary
The implementation matches the approved Phase 1 architecture and scope closely and with high quality. Identity, device binding, household membership, invites and the join flow are enforced entirely server-side through RLS plus idempotent `security definer` RPCs, exactly as ADR 0003 / 0006 and section 6 require; the integration tests prove isolation, no-oracle invalid-code handling, lockout, concurrency and idempotency with real assertions, and I independently reproduced the unit, integration, lint, format and build results. No Critical or Major violation is open. What remains are tracked conditions: CI green (C4) could not be verified from here, the cross-phase test-report tooling is a deviation that Shraga still needs to ratify into the plan/constitution, and a pre-existing Supabase advisor finding is to be reviewed. These do not block the phase.

## 2. Evidence Verified by the Reviewer
Tests (re-run on a clean tree, 2026-11-01):
- Unit: `npm test` -> 8 files, 61 passed, 0 failed, 0 skipped.
- Integration (hosted dev `MapMyShopping`): `npm run test:integration` -> 2 files, 31 passed, 0 failed, 0 skipped.
- E2E: `npm run test:e2e` -> NOT RUN by the reviewer (Playwright browser + dev server not provisioned in this context). Report claims 2 passed; the security-critical ACs are also covered by the integration suite, which I did run.
Lint: `npm run lint` -> clean. Format: `npm run format:check` -> clean.
Build + bundle secret scan: `npm run build` -> built; "Bundle secret scan passed: 3 file(s) scanned in dist, 0 findings."
Changes inspected: all four migrations, `onboarding.js`, `session.js`, `supabaseClient.js`, the onboarding/household screens and styles, locale, and the integration/unit tests. Every file the report lists exists; no claimed file is missing.

## 3. What Matches the Architecture
- RLS enabled on every new table in the schema migration; no client INSERT/UPDATE/DELETE policy on any table; `anon`/`authenticated` have SELECT only where a policy exists, and `household_invites` SELECT is column-scoped to exclude `code_hash`. T-1.1/T-1.2 prove reads are household-scoped and all direct writes return 42501.
- Every `security definer` function sets `search_path = ''`, uses fully qualified names, resolves the caller via `app_private.current_app_user_id()` (never a client-supplied ID), checks caller/role before acting, and is revoked from `public`/`anon`. The R10 list in the report is accurate against the code.
- Caller IDs are untrusted: fixed RPC signatures make `p_household_id`/`p_app_user_id` injection attempts fail at PostgREST (T-1.3), and the member escalation paths are closed (T-1.4, FORBIDDEN + 42501).
- Invite codes: 50-bit from `gen_random_bytes`, SHA-256 at rest, shown once (`ALREADY_APPLIED` replay returns no code), single-use, 24h, one active per household (partial unique index + revoke-then-create under row lock). Wrong/expired/revoked/used all return an identical `INVALID_CODE` shape with no oracle (T-1.7/T-1.8).
- Join lockout: 5 failures -> 15-minute lock keyed on the app user, survives a fresh client, counters reset on success (T-1.9). Concurrency gives exactly one winner via `FOR UPDATE` re-qualification (T-1.10).
- Idempotency through `sync_operations`: successful ops replay, failed ops are not stored (retryable), cross-caller reuse returns `OPERATION_ID_REUSED` (T-1.11).
- Audit records `household.created`/`invite.created`/`join.*` with no codes or hashes (verified by test and by inspection).
- UI built from DESIGN_SYSTEM v1.3 tokens only: no raw hex colors and no physical left/right in `onboarding.css`; all Hebrew strings are in `src/locale/he.js` (none hard-coded in JSX); presentation layer contains no Supabase/data-sync calls (enforced by T-1.17).
- Secret handling: no service-role/`sb_secret_` reference in `src/`; bundle scan clean; `src/` reads only the two `VITE_` vars.

## 4. Violations
| # | Area | Type | Finding | Severity |
|---|---|---|---|---|
| - | - | - | No Critical or Major violation found. | - |

## 5. Risks
Minor / tracked only:
- CI (C4) not confirmed green from this session; no GitHub access here. The workflow runs lint/format/test/build on push and gates integration/E2E on secrets. Owner to confirm the run is green.
- Pre-existing Supabase advisor `anon_security_definer_function_executable` on `public.rls_auto_enable()` — confirmed not created by any Phase 1 migration (grep of `supabase/` finds no definition); appears to pre-date this phase. To be reviewed, not a Phase 1 defect.
- Advisor `rls_enabled_no_policy` on `sync_operations` and `rate_limits` is intentional (RLS on, no policies, no client grants); accepted.

## 6. Deviations Needing a User Decision
| Deviation | Consequence | Recommendation |
|---|---|---|
| `rate_limits` moved `app_private` -> `public` (migrations 3+4), `service_role` granted | Table is now in an API-exposed schema; protection relies on RLS-on + no `anon`/`authenticated` grants (same pattern as `sync_operations`), verified by T-1.1. Low risk. | Adopt. Protection is equivalent and the join_household function was correctly recreated to reference `public.rate_limits`. |
| New cross-phase test-report tooling (`scripts/generate-test-report.mjs`, `npm run test:report`, `docs/test-reports/`) + convention written into `.claude/rules/project.md` | Introduces a binding per-phase process that lives in a build-session-owned file but affects every future phase. | Adopt, but Shraga should ratify it in Plan.md / the constitution so it is an agreed cross-phase rule, not just a build-session convention. |
| `get_my_context` is `security invoker`, not `definer` | Read-only; returns exactly what RLS permits the caller. Safer than definer here. | Adopt as noted. No action. |

## 7. Missing Information
- E2E result (T-1.13/T-1.14) is from the report only; reviewer could not re-run Playwright here. Integration coverage mitigates, but the E2E evidence is the builder's, not independently reproduced.
- GitHub Actions run status (C4) is not evidenced on disk.

## 8. Required Corrections
None required for approval. See Section 9 conditions.

## 9. Final Decision
Approved with conditions. The phase meets its acceptance criteria and security requirements with independently reproduced evidence; the following conditions are tracked and carried forward, none blocking:
1. Owner confirms the GitHub Actions run for the pushed commits is green (C4).
2. Shraga ratifies the per-phase test-report rule into Plan.md / the constitution (it is currently only in `.claude/rules/project.md`).
3. The Supabase advisor finding on `public.rls_auto_enable()` is reviewed as a platform/pre-existing object.

Baseline items closed by this phase: AC-1.1 .. AC-1.11 (AC-1.9 E2E portion on builder evidence); risk gate R1, R10, R8, C1 safeguards, C5 (ADR 0012). C4 remains open pending CI confirmation.
Conditions carried to the next phase: items 1-3 above.

## Round History
| Round | Date | Verdict | Main reason |
|---|---|---|---|
| 1 | 2026-11-01 | Approved with conditions | Architecture, scope and security met with reproduced evidence; only tracked conditions (CI confirmation, test-report rule ratification, pre-existing advisor finding) remain. |
