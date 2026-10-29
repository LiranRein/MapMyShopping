# Review Checklist - Eight Areas

For each area: what to verify, and the drift patterns AI build tools typically produce. Apply the areas relevant to the phase; always check 1, 2, 5 and 7.

---

## 1. Architectural Alignment
Verify:
- Follows the approved decomposition (frontend / server functions / database / external services).
- Responsibilities separated as approved; no merged or relocated responsibilities.
- No unapproved components, services, libraries or platforms.
- Scope limited to the current phase.

Typical AI-tool drift:
- Builds features from later phases "while it's there".
- Switches stack pieces (state library, UI kit, auth provider) without being asked.
- Adds a second database, queue or service that the plan never mentioned.
- Replaces real data flow with mock data and does not say so.

## 2. Boundary Integrity
Verify:
- Business rules, pricing, permissions and validation live on the server, not in UI components.
- Server code does not depend on presentation behavior.
- No direct access to another component's private data without approval.
- Shared utilities are not a hidden coupling channel.

Typical AI-tool drift:
- Calculations and permission checks implemented in React components.
- AI provider called directly from the browser.
- Frontend queries tables directly where the design required a server function.

## 3. Contract Compliance
Verify:
- Tables, fields, types and relations match the approved data model.
- API / function inputs and outputs, validation rules and error model are defined.
- Breaking changes to existing tables or endpoints have a migration path.
- AI structured outputs have a defined schema.

Typical AI-tool drift:
- Renames or drops columns created in a previous phase.
- Adds fields with inconsistent naming.
- Returns ad-hoc error shapes from each function.

## 4. Non-Functional Requirements
Verify, as relevant to the phase:
- Performance targets or bounds (pagination, limits).
- Timeouts, retry caps, failure paths for external calls.
- Logging and monitoring where the phase requires them.
- Scaling assumptions stated.
- Backup / recovery for important state.

A feature-complete plan that ignores these is incomplete.

## 5. Security and Data Handling
Verify:
- Where sensitive data is stored and who can access it.
- Authentication via managed provider; authorization enforced server-side / RLS.
- Secrets in the platform's secret store, never in client code.
- Access limited by role; admin actions protected server-side.
- Audit logging where required; external exposure minimized.
- AI / agent controls per shraga-security when relevant.

Typical AI-tool drift:
- "Fixes" a permissions error by disabling RLS or using a service-role key in the client.
- Public storage buckets for user uploads.
- Hardcoded API keys "for testing".

If sensitive data exists and the plan does not explain protection, reject.

## 6. Operational Readiness
Verify, as relevant to the phase:
- How it is deployed and where configuration lives.
- Separation of test and production data / environments.
- How failures are detected; how to roll back (version history, git tag).
- External dependencies identified.

Do not approve something that only works in the preview.

## 7. Technical Debt and Temporary Decisions
Verify:
- Every shortcut is named, with reason, risk, exit condition and owner phase.
- No hidden placeholders, TODOs, mock data or disabled checks.

Typical AI-tool drift:
- "For now we'll..." with no exit condition.
- Placeholder content or stubbed functions presented as done.

"We'll fix it later" without structure is rejected. Register accepted debt through shraga-risk.

## 8. Documentation Completeness
Verify the plan / report states enough to validate:
- Component responsibilities, data flow, interfaces
- Files / tables / functions created or changed
- Dependencies added
- Risks, limitations, known deviations, unresolved issues

If the work may exist but the explanation is too vague to validate, the review is incomplete: ask the user to have the tool list the files, tables, functions and dependencies it will change.

---

## Quick scan (for short plans)

- [ ] In scope for this phase only
- [ ] No unapproved stack / component / dependency changes
- [ ] Logic and permissions on the server
- [ ] Data model matches; migrations for changes
- [ ] Secrets server-side; access control on every new table / bucket
- [ ] Error, loading and failure paths covered
- [ ] Temporary items named with exit conditions
- [ ] Plan specific enough to validate (files, tables, functions listed)
