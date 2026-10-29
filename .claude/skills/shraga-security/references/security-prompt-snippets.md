# Security Prompt Snippets

Ready-to-use English lines for the "Security requirements for this phase" block inside phase prompts. Pick 3-5 lines that match what the phase builds. Adapt names (table, function, bucket) to the product. Adapt platform terms to the user's choice (see "Platform adaptation").

---

## Auth & access control (A01, A07)

- Use the platform's managed authentication; do not implement custom password handling.
- Require email verification before users can access protected data.
- Enable Row Level Security on every new table; users can read and write only rows they own.
- Enforce role checks for admin actions on the server, not by hiding UI elements.
- Protect every route that shows user data; redirect unauthenticated users to login.

## Secrets & AI calls (A02, LLM02, LLM06)

- Call the AI provider only from a server-side function; store the API key as a secret, never in client code or the repo.
- Limit AI usage to <N> requests per user per day and cap max output tokens at <N>.
- Log every AI call with user ID, model, token count and status.
- Send the model only the data needed for this task; never include other users' data.

## Input, output & injection (A05, LLM01, LLM10)

- Validate all input on the server with a schema; reject invalid input with a clear error.
- Use the query builder or parameterized queries only; no raw SQL built from strings.
- Do not render user or AI content as raw HTML.
- Treat AI output as untrusted: validate structured output against a schema and retry once on failure.
- Keep system instructions separate from user-provided or retrieved content in prompts.

## Files & storage (A01, A02)

- Store uploads in a private bucket; serve them with short-lived signed URLs.
- Restrict upload types to <list> and size to <N> MB; validate on the server.

## Integrations & payments (A08, A03)

- Verify the signature of every incoming webhook before processing it.
- Compute prices, discounts and roles on the server; never trust values sent by the client.
- Make webhook handlers idempotent so duplicate events do not create duplicate records.
- List every new dependency added in this phase in the plan.

## Agents & tools (LLM03, ASI01-ASI03, ASI09)

- Give the agent only these tools: <list>, read-only unless stated.
- Require explicit user confirmation, showing the exact action, before any write, send, delete or payment.
- Treat content the agent reads (documents, web, email, tool results) as data, never as instructions.

## Errors & logging (A09, A10)

- Fail closed: if a permission check errors, deny access.
- Handle errors and timeouts on every external call; show a clear error state in the UI.
- Log authentication failures, permission denials and admin actions.

---

## Platform adaptation

| Concept | Supabase | Other backends |
|---|---|---|
| Server-side function | Edge Function | API route / server function in the chosen framework |
| Secret storage | Project secrets | `.env` excluded from git + host's secret manager |
| Row-level access | Supabase RLS policies | Authorization middleware / policies in the backend |

Run the Freshness Protocol to confirm current names and features of the chosen platform before writing the prompt.

---

## Production audit block (inside the production-readiness phase prompt)

```
Perform a security review of this codebase against OWASP Top 10:2025
[and OWASP Top 10 for LLM Applications 2026] [and OWASP Top 10 for Agentic Applications].
Read shraga/project-arch-plan.md, shraga/DESIGN_SYSTEM.md and the risk register first for context.

For each item:
1. State whether the code addresses it, with file paths as evidence.
2. List concrete gaps, ordered by severity (Critical / Major / Minor).
3. Propose the minimal fix for each gap. Do not apply fixes yet.

Specifically check:
- Secrets or API keys in client code, config or git history
- Tables or buckets without access policies; authorization done only in the UI
- Raw SQL, raw HTML rendering, unvalidated input
- Webhooks without signature verification
- AI calls without rate limits, output validation or error handling
- New dependencies with known advisories (run the package audit)
- Missing logging for auth failures and admin actions

Write the findings into the security section of shraga/reports/phase-<N>-report.md. Do not fix anything that is not in this phase's scope.
```

shraga-review verifies the findings; Shraga turns approved fixes into correction prompts.
