# Risk Catalog

Use this catalog to identify risks proactively. Each category has general signals and vibe-coding checks (AI-built apps, typically Claude Code with Supabase or a similar backend). Apply only what is relevant to the product and the current phase.

---

## 1. Architectural Risk
Poor structure or invalid decomposition.

Signals: wrong boundaries; strong coupling; hidden dependencies; unclear ownership; mixed responsibilities; design that blocks future change.

Vibe-coding checks:
- Business logic lives only in frontend components instead of server functions.
- One giant page / component handles several features.
- Data model invented ad hoc per phase, with no stable schema in the PRD.
- AI-generated code duplicates the same logic across screens.

## 2. Operational Risk
The system cannot run safely in real environments.

Signals: no deployment strategy; no rollback path; weak configuration; no health checks; no production visibility; manual recovery.

Vibe-coding checks:
- No separation between test data and real user data.
- No way to roll back a bad AI edit (no version history / git commit discipline).
- Environment variables and secrets set by hand with no record.
- No error logging for server functions; failures are invisible.

## 3. Security Risk
Unauthorized access, data exposure, misuse.

Signals: unprotected sensitive data; mishandled secrets; missing access control; no audit trail; insecure integrations; excessive permissions.

Vibe-coding checks (most are Critical when real data is involved):
- Secret API keys (OpenAI, Anthropic, Gemini, Stripe secret, service-role keys) in frontend code or committed to the repo.
- Supabase / database tables without Row Level Security, or with permissive policies (`true`).
- Authorization checked only in the UI (hidden buttons) rather than enforced on the server / database.
- Admin routes protected only by a hidden URL.
- File storage buckets public by default.
- User input passed into AI prompts that can trigger tools, queries or actions (prompt injection).
- PII, health, financial or minors' data with no defined protection, retention or consent.

## 4. Reliability Risk
Unpredictable behavior under normal stress or partial failure.

Signals: no timeouts; no retry policy; no idempotency; single points of failure; missing error handling; fragile external dependencies.

Vibe-coding checks:
- AI API call with no timeout, no retry cap and no user-facing error state.
- Payment or webhook handlers that are not idempotent (double charge, double record).
- App depends on one external API with no fallback message or degraded mode.
- AI output inserted into the UI or database without validation (schema, length, format).

## 5. Scalability Risk
Cannot support growth in users, traffic, data or complexity.

Signals: synchronous bottlenecks; shared DB contention; unbounded resources; no partitioning; coupling blocking horizontal growth.

Vibe-coding checks:
- Queries fetch entire tables to the client and filter in the browser.
- No pagination on lists.
- Long AI generations run synchronously in a request with no queue or streaming.
- Free-tier limits of the platform or database not checked against expected usage.

## 6. Maintainability Risk
Too expensive, confusing or fragile to evolve.

Signals: undocumented behavior; unclear ownership; inconsistent standards; duplicated logic; hidden business rules; weak testability.

Vibe-coding checks:
- No `.claude/rules/project.md` with the real run / test / lint commands, so each build session drifts.
- No DESIGN_SYSTEM.md or architecture plan referenced by prompts.
- Prompts that ask the tool to "fix everything", producing large untracked changes.
- Business rules embedded in prompt text inside code with no documentation.

## 7. Delivery & Transition Risk
Phased rollout, migration, temporary coexistence.

Signals: unsafe migration; no backward compatibility; unclear cutover; no fallback; hidden data conversion assumptions.

Vibe-coding checks:
- Schema changes in a later phase that break data created in earlier phases.
- Moving between hosting or database providers (e.g. a hosted backend to self-managed Postgres) with no migration plan.
- Switching AI model or provider without re-validating output quality.

## 8. AI-Specific Risk (for AI-powered apps)

- **Output quality:** hallucinated or wrong content shown as fact. Mitigation: validation, citations, human review where stakes are high, clear UI disclaimers.
- **Output format:** model returns malformed JSON. Mitigation: structured output / schema validation with retry and fallback.
- **Prompt injection:** user or document content overrides system instructions. Mitigation: separate instructions from data, restrict tool permissions, never let model output directly trigger privileged actions.
- **Model / version drift:** provider changes or deprecates a model. Mitigation: pin model versions in config, keep a regression test set of prompts.
- **Content safety:** harmful or off-brand output. Mitigation: provider moderation, output filtering, reporting path.

## 9. Cost Risk

- Unbounded AI usage per user (no rate limit, no quota) - can be Critical if keys are exposed.
- Large context sent on every call (full history, full documents).
- Expensive model used for simple tasks.
- No token / cost logging per user or feature.
Mitigations: per-user limits, cost logging, model tiering, caching, context trimming, billing alerts at the provider.

## 10. Legal / Compliance Risk

- Personal data of EU / Israeli users without a privacy policy or deletion path (GDPR, Israeli Privacy Protection Law and its amendments).
- Storing data in regions that conflict with client requirements.
- Using third-party content, brands or images without rights.
- Domain-specific regulation (health, finance, education, minors).
State these as risks requiring professional legal review; the architect does not give legal advice.

---

## Production Readiness Checklist (final phase)

- [ ] No secrets in frontend or repo; all secrets in the platform's secret store
- [ ] Access control enforced at server / database level for every table and bucket
- [ ] Admin functions protected by role checks on the server
- [ ] Backups enabled and one restore tested
- [ ] Error logging and basic monitoring on server functions and AI calls
- [ ] Timeouts, retry caps and user-facing error states on every external call
- [ ] Rate limits and cost logging on AI usage; billing alert set at provider
- [ ] AI outputs validated before storage or display
- [ ] Pagination on all lists; no full-table client fetches
- [ ] Rollback path documented (version history / git tag)
- [ ] Privacy policy, data retention and deletion path defined
- [ ] All tolerated risks reviewed: still valid, or resolved
