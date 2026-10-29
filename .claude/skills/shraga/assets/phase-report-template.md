# shraga/reports/phase-N-report.md - Build Session Report Template

Written by the build session at the end of a phase, and updated after each fix round. Facts only, technical English. This is the evidence the reviewer and Shraga rely on: a claim without command output is not evidence.

```markdown
# Phase <N> Report - <name>
Prompt: shraga/prompts/phase-<N>-prompt.md[, phase-<N>-fix-<K>.md]   Date: <date>   Round: <1 | 2 | 3>

## 1. Summary
<2-4 sentences: what now exists that did not exist before.>

## 2. Scope Coverage
| Scope item / acceptance criterion | Status (Done / Partial / Not done) | Where (files) |
|---|---|---|

## 3. Files Changed
- <path> - <created | modified | deleted> - <one line why>

## 4. Dependencies
- <package@version> - <why> (or "None added")

## 5. Verification
Tests: `<exact command>`
<pasted output summary: passed / failed / skipped counts, and any failures verbatim>
Lint: `<exact command>`
<result>
If a check is not available: `NOT AVAILABLE - <reason>`

## 6. How to Try It
<steps the user can follow to see the phase working: URL, screen, command, request>

## 7. Deviations from the Plan
| Deviation | Reason | Approved by user? |
|---|---|---|
(or "None")

## 8. Known Issues & Open Items
- ...

## 9. Fix Rounds
| Round | Review items addressed | Result |
|---|---|---|
```
