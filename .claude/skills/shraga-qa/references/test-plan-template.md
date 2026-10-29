# Phase Test Plan - Template

This section goes inside the phase deep-dive file (e.g. `shraga/phase-2-plan.md`). Technical English.

---

```markdown
## Test Plan - Phase <N>: <name>

### Scope
In scope: <features / screens / functions built in this phase>
Regression scope: <test suites from previous phases that must still pass>
Out of scope: <explicitly not tested in this phase, and why>

### Test Approach
Method: Automated (<framework>) | Manual QA script | Both
Environment: <local / preview / test project>
Test data: <seed script / fixtures / test users per role>

### Scenarios
| ID | Acceptance criterion | Scenario (Given / When / Then) | Level | Type |
|---|---|---|---|---|
| T-<N>.1 | AC-<N>.1 | Given a logged-in user with no projects, When they open the dashboard, Then they see the empty state with a "Create project" button | E2E | Happy path |
| T-<N>.2 | AC-<N>.1 | Given user A and user B each own a project, When user A requests user B's project by ID, Then the request is denied and nothing is returned | Integration | Negative / access |
| T-<N>.3 | AC-<N>.2 | Given the AI provider times out, When the user submits a request, Then an error state with retry is shown and no partial record is saved | Integration | Failure |

Rules:
- Every acceptance criterion has at least one scenario.
- Every scenario has a level: Unit / Integration / E2E / Manual / AI eval.
- At least one negative or failure scenario per feature.

### AI Evaluation (if applicable)
Feature: <name>
Eval set: <path or table>, <N> cases
Checks: <schema / length / language / refusal / rubric>
Pass threshold: <e.g. 100% schema valid, 90% rubric>

### Exit Criteria (Definition of Done)
- [ ] All scenarios pass, with evidence (test output or completed manual script)
- [ ] Regression suites from previous phases pass
- [ ] No Critical / Major open bugs in phase scope
- [ ] No tests removed, skipped or weakened without approval
- [ ] AI eval pass rate at or above threshold (if applicable)
```

---

## Manual smoke script (UX check by the user)

```markdown
## Manual QA - Phase <N>
Tester: <name>   Date: <date>   Environment: <preview URL>

| # | Step | Expected result | Pass / Fail | Notes |
|---|---|---|---|---|
| 1 | Open the app logged out and go to /dashboard | Redirected to login | | |
| 2 | Sign up with a new email | Verification email message shown | | |
| 3 | Log in as User A, create a project named "Test A" | Project appears in list | | |
| 4 | Log out, log in as User B | "Test A" is NOT visible | | |
| 5 | Submit the form empty | Inline errors under required fields | | |
```

Write steps a non-technical user can follow. One action per step. Expected result is specific and observable. Shraga gives it to the user in chat after a UI phase; it can be in Hebrew, since it is for the user, not for the build session. Failures go to bug triage (shraga-qa Output 5).
