# Test Strategy

How much to test, at which level, in which phase. Proportional to product risk and phase.

---

## Default tools (confirm against the chosen stack via the Freshness Protocol)

| Stack | Unit / Integration | E2E | Notes |
|---|---|---|---|
| React / Next.js / Vite (TypeScript) | Vitest or Jest | Playwright | Testing Library for components |
| Node backend / edge functions | Vitest or Jest | - | Test functions with a test database or local emulator |
| Python backend | pytest | Playwright | |
| Supabase | Integration tests against a local or test project | Playwright | Test RLS by querying as different users |

Prefer the tool already present in the project. Do not introduce a second test framework.

---

## Per-phase scope (default architect phases)

| Phase | What to test | Minimum |
|---|---|---|
| Phase 0 - Foundation | Test framework installed and wired; critical paths, test approach, Definition of Done and test data policy defined in the PRD | Test command runs with 1 passing test; command recorded in .claude/rules/project.md |
| Phase 1 - Core MVP | Auth flow; core flow happy path; access rules (user A cannot see user B's data); input validation | Unit for business rules; integration for access rules; 1 E2E for the core journey |
| Phase 2 - Advanced Logic | New business rules incl. edge cases; error and empty states; AI output parsing | Unit + integration for each rule; negative cases; regression of Phase 1 |
| Phase 3 - Integrations | External calls with failure simulation (timeout, error, bad payload); webhooks (signature, idempotency); file uploads | Integration with mocked external services; E2E for each integration journey |
| Phase 4 - Production Readiness | Full regression; E2E on all critical paths; basic performance sanity; OWASP audit (shraga-security) | All suites green in CI or a recorded run; manual smoke test on production-like environment |

Raise depth earlier when the product handles money, health data, minors or regulated data.

---

## Negative cases to always consider

- Invalid, empty, too long, wrong-type input
- Unauthenticated user; authenticated user without permission; user accessing another user's record by ID
- External service down, slow (timeout), or returning malformed data
- Duplicate submission / double click / repeated webhook
- Empty state (no data yet) and large data (pagination)
- Hebrew / RTL text, mixed Hebrew-English, emoji, if the product is localized

---

## AI output evaluation (for any LLM feature)

LLM output is not deterministic, so exact-match unit tests are not enough. Build a small evaluation set:

1. **10-30 representative inputs** per AI feature, including edge cases and hostile inputs (prompt injection attempts, off-topic requests, empty input, very long input, Hebrew).
2. **Expected qualities**, not exact text: valid JSON against schema; required fields present; length bounds; language; no forbidden content; refuses out-of-scope requests; cites sources if required.
3. **Automated checks** for what is checkable by code (schema, length, language, banned terms); a short human review rubric for the rest (accuracy, tone).
4. **Re-run on every change** to prompt, model or model version. Record pass rate per run.
5. **Threshold**: define the acceptable pass rate before launch (e.g. 100% format validity, 90%+ rubric pass).

Store the eval set in the repo (e.g. `evals/<feature>.json`) or, for no-code platforms, in a table the user can re-run manually.

---

## Regression rules

- Every phase re-runs all previous tests.
- A bug fix comes with a test that fails before the fix and passes after.
- Tests may be changed only when the requirement changed; the change must be stated in the plan or report.

---

## Test data

- Seed data scripts, never real personal data.
- Separate test users per role (user, admin, second user for isolation tests).
- For AI features, fixed fixtures for the eval set.
