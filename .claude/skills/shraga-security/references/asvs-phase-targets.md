# ASVS Phase Targets

Baseline version: OWASP Application Security Verification Standard (ASVS) 5.0.0 (owasp.org/www-project-ASVS/). Last verified: 2026-10-14.
ASVS is a catalog of testable security requirements, organized in three levels. Version 5.0 rebalanced the levels so Level 1 is easier to reach as a starting point. Requirement IDs changed from 4.x - do not cite 4.x numbers.

Use ASVS to set "how deep" verification goes per phase. Do not paste ASVS requirements into phase prompts; translate the relevant ones into the short security lines in `security-prompt-snippets.md`.

---

## Levels in plain terms

| Level | Meaning | Use for |
|---|---|---|
| L1 | First layer of defense - essential controls | Prototypes and MVPs with test data or a small closed pilot |
| L2 | Standard level for most applications with real users | Any production app with personal data, accounts or payments |
| L3 | High assurance | Health, finance, critical infrastructure, large-scale sensitive data. Requires professional security review, not only an AI-assisted one |

## Default targets per architect phase

| Phase | Target | Focus areas |
|---|---|---|
| Phase 0 - Strategy & UX Rules | Design-level | Trust boundaries, data classification, auth model, secrets location, abuse cases |
| Phase 1 - Core MVP | L1 | Managed auth, access control on every table, secrets server-side, input validation, HTTPS |
| Phase 2 - Advanced Logic | L1 for new features | Business rules on server, rate limits, file upload rules, AI usage limits |
| Phase 3 - Integrations & Multi-Modal | L1, moving to L2 | Webhook verification, third-party scopes, agent / tool permissions, dependency audit |
| Phase 4 - Production Readiness | L2 (L3 when domain requires) | Logging and alerting, error handling, session management, privacy and retention, full audit |

Raise the target earlier when: real personal data enters before Phase 4, payments are involved, users are minors, or the client requires compliance.

## When the user asks for compliance

ASVS supports, but does not equal, compliance with regulations (GDPR, Israeli Privacy Protection Law, HIPAA, PCI DSS). State that formal compliance requires professional legal / security review.

## Freshness

Before setting targets in a PRD, check owasp.org/www-project-ASVS/ for a newer version. When a specific requirement area matters (e.g. OAuth, session management), fetch the relevant ASVS chapter or Cheat Sheet instead of relying on memory.
