# Risk Register - Template

Use this structure for the "Risks & Limitations" section of the PRD and for any standalone risk register file (suggested name: `project-risk-register.md`). Technical English. Update it whenever a phase is planned, a plan is reviewed, or the user changes scope.

---

```markdown
# Risk Register - <Product Name>

Version: <n>
Last updated: <date>
Current phase: <Phase N>

## 1. Risk Summary
<2-3 sentences: overall risk profile, top 3 risks, and whether any Critical risk is open.>

## 2. Risk Drivers
<Short list of what raises the risk level of this product: real user data, PII, payments, minors, health data, external AI APIs, regulated domain, public launch, etc.>

## 3. Risk Register

| ID | Risk | Category | Prob. | Impact | Detect. | Recovery | Severity | Required Mitigation | Owner Phase | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | | Security | High | Critical | Difficult | Severe | Critical | | Phase 1 | Open |
| R-02 | | Reliability | | | | | Major | | Phase 2 | Scheduled |
| R-03 | | Maintainability | | | | | Minor | | Phase 3 | Tracked |

Field rules:
- **Risk:** direct, specific title. Not "possible security issue" but "OpenAI key exposed in client bundle".
- **Category:** Architectural / Operational / Security / Reliability / Scalability / Maintainability / Delivery / AI / Cost / Legal.
- **Prob.:** Low / Medium / High.
- **Impact:** Low / Medium / High / Critical.
- **Detect.:** Easy / Moderate / Difficult.
- **Recovery:** Easy / Moderate / Difficult / Severe.
- **Severity:** Critical / Major / Minor.
- **Required Mitigation:** concrete and testable.
- **Owner Phase:** the phase whose risk gate verifies the mitigation.
- **Status:** Open / Scheduled / Mitigated / Tolerated / Closed.

## 4. Risk Details (Critical and Major only)

### R-01: <title>
- Cause:
- Consequence:
- Severity:
- Required Mitigation:
- Approval Effect: Blocks | Blocks unless contained in Phase N | Track
- Verification: <how the risk gate tests it>

## 5. Tolerated Risks & Temporary Decisions

| ID | What is tolerated / temporary | Why | Risk introduced | Scope / max duration | End condition | Replacement |
|---|---|---|---|---|---|---|

Rule: a Critical risk cannot be tolerated in any phase that handles real users or real data.

## 6. Assumptions Under Validation

| Assumption | If wrong, affects | Validate in |
|---|---|---|

## 7. Change Log
| Date | Change | Reason |
|---|---|---|
```
