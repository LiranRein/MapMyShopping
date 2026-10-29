# shraga/Plan.md - Phase Plan Template

**Hard limit: 100-150 lines of Markdown.** Plan.md is the map of the whole build. It must stay readable in one screen-scroll session and cheap for the build session to load on every phase. Anything more detailed goes into `shraga/phase-N-plan.md` (deep dive).

Rules:
- One section per phase, 15-25 lines each.
- Bullets, not prose. No code. No full test cases.
- Every phase isolated and runnable; later phases do not need to be built for earlier ones to work.
- Status line per phase, updated as the project moves.
- Reference other files instead of repeating them.

```markdown
# Plan - <App Name>
Build tool: Claude Code   Stack: <one line>   Source of truth: shraga/project-arch-plan.md, shraga/DESIGN_SYSTEM.md
Rules: one phase at a time; tests run every phase; independent review closes every phase; no work outside the current phase.

## Status
| Phase | Name | Status |
|---|---|---|
| 0 | Foundation | Not started |
| 1 | Core MVP | Not started |
| 2 | Advanced Logic | Not started |
| 3 | Integrations | Not started |
| 4 | Production Readiness | Not started |

## Phase 0 - Foundation
Objectives: project skeleton, project rules file, data model and test framework in place.
Features: project setup; `.claude/rules/project.md` (stack, run/test/lint commands, conventions - CLAUDE.md is the harness constitution and is never edited); base schema with access rules; test framework installed; layout shell following DESIGN_SYSTEM.md.
Inputs: shraga/project-arch-plan.md, shraga/DESIGN_SYSTEM.md.
Outputs: running empty app with layout and navigation shell; schema migrated.
Acceptance criteria:
- App runs; layout follows DESIGN_SYSTEM.md tokens.
- All tables exist with access rules enabled.
- Test command runs (even with 1 placeholder test).
Validation: `.claude/rules/project.md` lists the real run/test/lint commands; no secrets in client code.
Risk gate: secrets location defined; access rules on every table.
Tests: setup only.

## Phase 1 - Core MVP
Objectives: ...
Features: ...
Inputs: ...
Outputs: ...
Acceptance criteria:
- AC-1.1 ...
- AC-1.2 ...
Validation: ...
Risk gate: ...
Tests: unit for business rules; integration for access rules; 1 E2E for core journey.

## Phase 2 - Advanced Logic
...

## Phase 3 - Integrations & Multi-Modal
...

## Phase 4 - Production Readiness
Objectives: safe to launch.
Features: logging and alerts; error handling review; performance sanity; privacy and retention; backups.
Acceptance criteria:
- Full regression passes; E2E on all critical paths.
- OWASP audit findings: no open Critical / Major.
- Rollback path documented.
Risk gate: production readiness checklist (shraga-risk) complete.
Tests: full regression + security audit (shraga-security).

## Change Log
| Date | Change |
|---|---|
```

Line budget tip: if Plan.md exceeds 150 lines, move detail of the largest phase into `phase-N-plan.md` and leave a one-line pointer.
