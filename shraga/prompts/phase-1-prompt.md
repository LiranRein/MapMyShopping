# Shraga Phase Prompt - Phase 1: Identity, sessions & household membership

You are a build session in the Shraga harness. Follow the "Build session rules" in CLAUDE.md.

Context: read shraga/PHASE.md (must be PHASE=1), shraga/Plan.md, shraga/project-arch-plan.md, shraga/DESIGN_SYSTEM.md, shraga/phase-1-plan.md, .claude/rules/project.md, docs/adr/0003, 0006 and 0012, and the approved sketch docs/design/onboarding-sketch-option-c.html before doing anything.

Task: implement Phase 1 exactly as defined in shraga/phase-1-plan.md, in the order of its section 5.

Scope:
- Owner steps first (phase-1-plan section 3): stop and give me exact instructions to enable Anonymous Sign-ins, create the GitHub repo, connect Vercel and set env vars, and fill .env.test.local. Then update ADR 0012 for the two-project model (C1, C5).
- Migrations: tables, helpers, RLS, grants, RPCs, audit and join rate limits from sections 4.2-4.3, applied to the hosted dev project only from supabase/migrations/.
- Client: supabaseClient, session, onboarding modules; screens per sketch option C and section 4.5; App state gate; "הבית שלי" nav item active.
- Integration test harness with per-run prefixed data and teardown (section 7), CI per section 5 step 7 (C4).

Do NOT:
- build anything listed as out of scope in phase-1-plan section 2 (recovery codes, invite link / revoke, leave / transfer / delete, display-name UI, list features, C10 home fixes)
- add tables, RPCs, dependencies or folders beyond the plan, or change the stack
- introduce new colors or fonts; build new components only from DESIGN_SYSTEM.md v1.3 tokens
- run anything against a production project, or put the service-role key anywhere but .env.test.local and GitHub Actions secrets
- edit CLAUDE.md or anything in shraga/ or docs/design/ except your report
If the plan cannot be followed as written, stop and ask me before continuing.

Security requirements for this phase:
- Enable RLS on every new table in the same migration; no client insert / update / delete policies - all writes through RPCs; resolve the caller only via app_private.current_app_user_id().
- Every security definer function: set search_path = '', fully qualified names, caller / role check first, execute revoked from public and anon.
- Never trust household, user, device or role values sent by the client; fail closed on any check error.
- Invite codes: 50-bit random, SHA-256 at rest, shown once, single use, 24h, one active per household; 5 failed joins -> 15-minute lockout; identical INVALID_CODE for wrong / expired / used / revoked.
- Never log codes, hashes, tokens or keys; audit events per section 6 without them.

Testing requirements for this phase:
- Write tests for every scenario T-1.1 to T-1.17 in shraga/phase-1-plan.md, including all negative, concurrency and idempotency cases.
- Run the full suite (unit, integration against hosted dev, E2E) plus all Phase 0 tests; record counts and output in the report.
- Do not modify, skip or delete tests to make them pass. If a test seems wrong, stop and explain.
- Report: which test covers each AC-1.1 to AC-1.11, any AC not covered, and the R10 function review list.
- In "How to Try It", give the manual QA steps from section 7 for me to run on two phones.

When done:
1. Run the full test suite and lint.
2. Write shraga/reports/phase-1-report.md using .claude/skills/shraga/assets/phase-report-template.md.
3. Run /shraga-review. If Rejected, fix only what it lists, update the report and run it again (max 2 rounds).
4. Tell me in Hebrew what the verdict was and what to do next.
