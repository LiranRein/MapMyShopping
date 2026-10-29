# Shraga Phase Prompt - Phase 0: Architecture decisions & foundation

You are a build session in the Shraga harness. Follow the "Build session rules" in CLAUDE.md.

Context: read shraga/PHASE.md (must be PHASE=0), shraga/Plan.md, shraga/project-arch-plan.md and shraga/DESIGN_SYSTEM.md before doing anything.

Task: implement Phase 0 - Architecture decisions & foundation exactly as defined in shraga/Plan.md.

Scope:
- Write ADRs in docs/adr/ (one file per decision: context, options, decision, consequences, status) for PRD section 13 open questions 1-6, 9 and 10. Identity ADR evaluates Supabase anonymous sign-in against verified current Supabase docs. Mark anything not validated as "Unvalidated".
- Write docs/speech-feasibility.md: Hebrew (he-IL) Web Speech API support on Chrome Android, Safari iOS and desktop Chrome, incl. whether recognition is cloud-processed. Record what you verified and what needs a manual device check by me.
- Create the project skeleton with the chosen frontend framework / build tool, layered folders (presentation / application / data-sync / security), Supabase CLI local stack and an empty migrations folder (no product tables in this phase), dev / prod env separation via .env.example, Vercel config.
- RTL layout shell: `<html lang="he" dir="rtl">`, DESIGN_SYSTEM.md tokens as CSS variables, Rubik self-hosted, empty home screen with the 2x2 tile grid as placeholders.
- Lint, format, unit test runner with at least one passing test, CI build workflow.
- Create .claude/rules/project.md with the stack, the exact run / test / lint / build / deploy commands and code conventions.

Do NOT:
- build anything from later phases (no product tables, no auth flows, no list features)
- change the stack in shraga/project-arch-plan.md section 6 beyond choosing the frontend framework and test tools the PRD leaves open
- edit CLAUDE.md or anything in shraga/ except your report
- create accounts or enter credentials for Supabase or Vercel; if a step needs my account (linking a Supabase project, Vercel deploy), stop and give me the exact steps
If the plan cannot be followed as written, stop and ask me before continuing.
Before finishing, show me the identity ADR summary and ask me to approve it (Plan.md Phase 0 risk gate); record my answer in the ADR status.

Security requirements for this phase:
- Only the Supabase URL and anon key may be exposed to the client; the service-role key never appears in client code, the repo or the bundle.
- .env files are git-ignored; only .env.example is committed, with placeholder values.
- Identity ADR: a device ID alone never proves identity; sessions come from Supabase Auth.
- Add a build step or test that scans the production bundle for secret patterns and fails on a match.

Testing requirements for this phase:
- Use the stack's default test runner (record the choice in an ADR); at least one passing unit test and the bundle secret scan.
- Run lint, tests and build; record the output summary in the phase report.
- Do not modify, skip or delete tests to make them pass. If a test seems wrong, stop and explain.
- Report: tests added, run, passed, failed, and any acceptance criterion (AC-0.1 to AC-0.4) not covered.
- In the report's "How to Try It" section, list exact steps to run the app locally and see the RTL home shell.

When done:
1. Run the full test suite and lint.
2. Write shraga/reports/phase-0-report.md using .claude/skills/shraga/assets/phase-report-template.md.
3. Run /shraga-review. If Rejected, fix only what it lists, update the report and run it again (max 2 rounds).
4. Tell me in Hebrew what the verdict was and what to do next.
