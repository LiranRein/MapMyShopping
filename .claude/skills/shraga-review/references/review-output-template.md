# Review Output Template

Four parts. Part 2 is the content of `shraga/reviews/phase-N-review.md`. Parts 1, 3 and 4 are returned to the session that ran the review (Part 3 only when there are corrections).

---

## Part 1 - Hebrew summary (2-4 lines)

```
החלטה: <מאושר / מאושר בתנאים / נדחה>
הסיבה העיקרית: <משפט אחד>
מה עושים עכשיו: <משפט אחד>
```

## Part 2 - Review file (English) - `shraga/reviews/phase-N-review.md`

```markdown
# Architecture Review - Phase <N>: <phase name>
Verdict: Approved | Approved with conditions | Rejected
Round: <1 | 2 | 3>   Date: <date>
Reviewed: shraga/reports/phase-<N>-report.md + code changes
Baseline: shraga/prompts/phase-<N>-prompt.md[, fix prompts], shraga/Plan.md (Phase <N>)[, shraga/phase-<N>-plan.md], shraga/project-arch-plan.md v<x>[, shraga/DESIGN_SYSTEM.md][, risk register]

## 1. Summary
<2-4 sentences: what is aligned, what is not, whether it is acceptable.>

## 2. Evidence Verified by the Reviewer
Tests: `<command>` -> <passed / failed / skipped counts>
Lint: `<command>` -> <result>   (or NOT RUN - <reason>)
Changes inspected: <git diff | files listed in report>

## 3. What Matches the Architecture
- ...

## 4. Violations
| # | Area | Type | Finding | Severity |
|---|---|---|---|---|
| V1 | Boundary integrity | Direct contradiction | Discount calculation implemented in CheckoutPage component; baseline requires server function | Critical |

## 5. Risks
<shraga-risk six-field reports for Critical / Major; one line each for Minor. Include OWASP IDs where relevant.>

## 6. Deviations Needing a User Decision
| Deviation | Consequence | Recommendation |
|---|---|---|
(or "None")

## 7. Missing Information
- <What the report or code does not show, and why it matters>

## 8. Required Corrections
1. <Concrete, testable action per violation / gap>

## 9. Final Decision
<One unambiguous sentence. If conditional, list the conditions. If rejected, state what must change.>

Baseline items closed by this phase: <acceptance criteria / risk gate items, only if approved>
Conditions carried to the next phase: <only if Approved with conditions>

## Round History
| Round | Date | Verdict | Main reason |
|---|---|---|---|
```

## Part 3 - Corrections for the build session (English)

```
Fix exactly these items, nothing else:
1. <imperative correction>
2. <imperative correction>
Do not add features outside Phase <N>.
Then run the tests and lint, update shraga/reports/phase-<N>-report.md (Fix Rounds section), and run /shraga-review again.
```

Rules: numbered, imperative, one change per line, scoped to this phase.

## Part 4 - Next step (Hebrew, one line)

- Rejected, round 1: "סשן הבנייה יתקן את הסעיפים האלה ויריץ שוב /shraga-review."
- Rejected, round 2 or later: "עצרו כאן. חזרו לסשן של שרגא וכתבו לו שהבדיקה נדחתה פעמיים - הוא יחליט אם לתקן את המימוש או את התוכנית."
- Approved / with conditions: "חזרו לסשן של שרגא וכתבו 'סיימתי' כדי לסגור את הפאזה."
- Inline review (Shraga session): the next step Shraga proposes.
