# ADR 0012 - Secrets location and environment separation

Status: Accepted (2026-10-28, Phase 0); amended 2026-10-29 (Phase 1, C1 / C5: two hosted projects, no local stack)
Plan Phase 0 risk gate: "secrets location defined". PRD A02.

## Context

Verified against https://supabase.com/docs/guides/api/api-keys (2026-10-28): Supabase keys are `sb_publishable_...` (browser-safe, RLS applies), `sb_secret_...` (bypasses RLS, server only), and the legacy JWT keys `anon` (browser-safe) and `service_role` (bypasses RLS). Legacy keys are being deprecated by the end of 2026.

## Decision

| Secret                               | Where it lives                                                                                                                                                                             | Never in                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Supabase URL, anon / publishable key | `.env.development.local` (local), Vercel env vars as `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Preview and Production -> dev project until Phase 11, then Production -> prod project) | - (public by design)                                           |
| Service-role / `sb_secret_` key      | Dev project only: git-ignored `.env.test.local` and GitHub Actions secrets (`SUPABASE_SERVICE_ROLE_KEY`) for integration-test teardown; Supabase Edge Function secrets                     | `src/`, any `VITE_` variable, Vercel env, the repo, the bundle |
| DB password, Supabase access token   | Owner's password manager; CI secrets if needed                                                                                                                                             | repo, bundle                                                   |

- Two hosted Supabase projects (owner decision C1, 2026-10-29), no Docker / local stack:
  - `MapMyShopping` (ref `twdpgjlyjspdrkkofyqs`, eu-central-1): development, integration / RLS / E2E tests, and Vercel Preview + Production until Phase 11.
  - Production project: created by the owner before Phase 11; Vercel Production switches to it then. Tests never target it, and its secret key never leaves the owner and Supabase.
- Safeguards on the shared dev project: schema changes only from `supabase/migrations/`; every test run prefixes its display / household names with `t_<runId>_` and deletes its households, app users, devices and anonymous auth users afterwards (admin API in the test process only); a sweep removes `t_` data older than 24h; the service-role key is read only by `tests/` and never by `src/`.
- Test environment variables (`.env.test.local`, GitHub Actions secrets): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. None of them is `VITE_`-prefixed, so none can reach the bundle.
- Only `VITE_`-prefixed variables reach the bundle (`envPrefix` in `vite.config.js`). `src/data-sync/publicConfig.js` throws if any `VITE_` variable other than the two allowed ones exists.
- `.env*` files are git-ignored except `.env.example` (placeholders only).
- Enforcement: `npm run build` runs `scripts/scan-bundle-secrets.mjs dist` and fails on service-role / secret-role JWTs, `sb_secret_` keys, the `SUPABASE_SERVICE_ROLE_KEY` name, private-key blocks, Postgres URLs with passwords, and the literal values of server-only env variables present at build time. ESLint forbids `SERVICE_ROLE` / `sb_secret_` literals in `src/`.
- When the project moves to the new key format, `VITE_SUPABASE_ANON_KEY` holds the `sb_publishable_` key; the variable name stays.

## Consequences

- The owner creates both Supabase projects and the Vercel project and sets env vars (agents do not create accounts or handle credentials).
