# QA Prompt Snippets

Ready-to-use English blocks for phase prompts and follow-ups. Adapt file names and phase numbers.

---

## Testing block

```
Testing requirements for this phase:
- Write tests for each acceptance criterion in shraga/phase-<N>-plan.md (or shraga/Plan.md), including the negative cases listed there.
- Use the existing test framework in the project; do not add a new one.
- Run the full test suite, including tests from previous phases, and record the output summary in the phase report.
- Do not modify, skip or delete existing tests to make them pass. If a test seems wrong, stop and explain.
- Report: tests added, tests run, passed, failed, and any acceptance criterion not covered.
```

## UI quality block (phases with screens)

```
Quality requirements for this phase:
- Implement empty, loading, success and error states for every screen in this phase.
- Validate all form input and show clear inline error messages.
- In the report's "How to Try It" section, list the exact steps to verify each acceptance criterion manually.
```

---

## Test-first variant (for business rules and bug fixes)

```
Before implementing <rule / fix>:
1. Write a failing test that captures the expected behavior.
2. Show that it fails.
3. Implement the change.
4. Show that it passes and that the full suite still passes.
```

## Evidence request (when the tool only claims success)

```
Show the actual test run output for this phase: number of tests run, passed, failed, skipped.
List which test covers each acceptance criterion in shraga/phase-<N>-plan.md (or shraga/Plan.md).
List any test files you modified or deleted in this phase and why.
```

## Bug-fix prompt

```
Bug: <one-line title>
Steps to reproduce: <numbered steps>
Expected: <...>
Actual: <... include error text>
Phase: <N>

Fix this without changing unrelated behavior:
1. Reproduce it with a failing test.
2. Identify the root cause and explain it in 2-3 sentences before changing code.
3. Fix it and re-run the full test suite; record the output in shraga/reports/phase-<N>-report.md.
4. Do not refactor unrelated code in this change.
5. Run /shraga-review.
```

## AI eval prompt

```
Create an evaluation set for the <feature> AI function:
- <N> test inputs in evals/<feature>.json covering typical cases, edge cases, Hebrew input, empty input, very long input and prompt-injection attempts.
- For each input, define expected qualities (schema validity, required fields, length bounds, language, must-refuse cases), not exact text.
- Write a script that runs all cases against the function and reports pass/fail per check and overall pass rate.
- Run it and show the results.
```

## Regression check before phase sign-off

```
Before we close Phase <N>:
- Run all test suites (unit, integration, E2E) and show the summary.
- Confirm no tests were skipped or removed since Phase <N-1>.
- List any known bugs still open, with severity.
```
