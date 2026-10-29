# shraga/phase-N-plan.md - Phase Deep Dive Template

Use when the user asks for a deep dive on a phase, or when a phase is complex or high-risk and the user accepts the offer. Technical English. Precise enough that the build session has nothing important left to invent. No padding.

```markdown
# Phase <N> - <Name> - Detailed Plan
Parent: shraga/Plan.md (Phase <N>)   Baseline: shraga/project-arch-plan.md v<x>, shraga/DESIGN_SYSTEM.md
Status: Draft | Approved   Date: <date>

## 1. Goal
<2-3 sentences: what exists at the end of this phase that did not exist before.>

## 2. Scope
In scope:
- ...
Out of scope (do NOT build in this phase):
- ...

## 3. Preconditions
- Phases completed: ...
- Existing tables / functions / screens relied on: ...

## 4. Design
### 4.1 Components & responsibilities
| Component | Type (screen / server function / table / job) | Responsibility |
|---|---|---|

### 4.2 Data model changes
| Table | Change | Fields | Access rule | Migration notes |
|---|---|---|---|---|

### 4.3 Contracts
For each server function / API:
- Name, input schema, output schema, error model, auth requirement.

### 4.4 AI behavior (if applicable)
- Model, prompt template location, output schema, validation, retries, fallback, limits.

### 4.5 UI
- Screens in scope, components used (from DESIGN_SYSTEM.md), states: empty / loading / success / error, responsive and RTL notes.

## 5. Implementation Order
1. ...
2. ...
(Each step leaves the app in a working state.)

## 6. Security Requirements
<From shraga-security, only for assets touched in this phase, with OWASP IDs.>

## 7. Test Plan
<From shraga-qa test-plan-template: scenarios per acceptance criterion, levels, negative cases, regression scope, AI evals.>

## 8. Acceptance Criteria
- AC-<N>.1 ...
- AC-<N>.2 ...

## 9. Risk Gate
- [ ] ...
- [ ] No Critical risks open for components built in this phase

## 10. Temporary Decisions & Debt
| Item | Why | Risk | Exit condition | Exit phase |
|---|---|---|---|---|

## 11. Open Questions
- ...
```

After delivering it, update the matching phase in Plan.md with a one-line pointer: "Detailed plan: phase-<N>-plan.md".
