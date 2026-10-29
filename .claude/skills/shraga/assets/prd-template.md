# shraga/project-arch-plan.md - PRD & Architecture Template

Technical English. Implementation-focused, internally consistent, production-oriented. Fill gaps with best practices and mark assumptions with `(assumption)`. Bump the version and add a change-log row on every change.

```markdown
# <App Name> - Architecture & Product Requirements

Version: <n>   Date: <date>   Build tool: Claude Code
Verified against: <platform docs, OWASP versions>, <date>

## 1. Product Overview
- Name:
- Short description:
- Primary goal:
- Target users:

## 2. Core Problem
- Problem definition:
- Why existing solutions fail:

## 3. Main User Flows
- First-time user:
- Core usage:
- Returning user:
- Admin (if any):

## 4. MVP Feature Set
| Area | Features | Phase |
|---|---|---|
| Authentication | | |
| Core logic | | |
| AI usage | | |
| Data storage | | |
| Dashboard | | |
| Admin tools | | |
Out of scope for MVP: <explicit list>

## 5. System Architecture
- Components and responsibilities: <frontend / server functions / database / storage / external services>
- Trust boundaries: <what runs in browser vs server vs third-party; where secrets live>
- Data flow: <short description or diagram in text>
- Architectural rules: <e.g. business logic only in server functions; frontend never calls AI provider directly>

## 6. Tech Stack
| Layer | Choice | Reason |
|---|---|---|
| Frontend | | |
| Backend / functions | | |
| Database | | |
| Auth | | |
| Storage | | |
| AI provider & model | | |
| Hosting | | |
| Testing | | |

## 7. AI Architecture (if applicable)
- AI platform / provider:
- Models and versions (pinned):
- Task mapping: <which task uses which model and why>
- Prompt templates: <where they live, how versioned>
- Output validation: <schemas, retries, fallbacks>
- Error handling: <timeouts, user-facing states>
- Cost control: <limits per user, max tokens, logging>

## 8. Data Structure
| Entity | Key fields | Relations | Access rule |
|---|---|---|---|
| User | | | |
| Project / Workspace | | | |
| Content / Generations | | | |
| Media | | | |
| Logs | | | |

## 9. UX / UI Guidelines
<From shraga-design: design goal, screens, flows, principles, visual language, "Full spec: DESIGN_SYSTEM.md">

## 10. Technical Requirements
- Backend logic:
- APIs / integrations:
- Performance:
- Cost control:
### Security
<From shraga-security: drivers, baseline, ASVS targets per phase, key controls, trust boundaries>
### Quality & Testing
<From shraga-qa: approach, critical paths, tools, Definition of Done>

## 11. Success Criteria
| Dimension | Metric | Target |
|---|---|---|
| Adoption | | |
| Usage | | |
| Retention | | |
| Reliability | | |
| Output quality | | |

## 12. Risks & Limitations
<From shraga-risk: summary, register (Technical / Product / AI / Legal-Compliance), accepted constraints>

## 13. Assumptions & Open Questions
- Assumptions:
- Open questions (material only):

## 14. Development Phases
See Plan.md.

## Change Log
| Version | Date | Change |
|---|---|---|
```
