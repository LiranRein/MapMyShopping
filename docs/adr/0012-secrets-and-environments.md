# ADR 0012 - Secrets location and environment separation

Status: Accepted (2026-10-28, Phase 0)
Plan Phase 0 risk gate: "secrets location defined". PRD A02.

## Context

Verified against https://supabase.com/docs/guides/api/api-keys (2026-10-28): Supabase keys are `sb_publishable_...` (browser-safe, RLS applies), `sb_secret_...` (bypasses RLS, server only), and the legacy JWT keys `anon` (browser-safe) and `service_role` (bypasses RLS). Legacy keys are being deprecated by the end of 2026.

## Decision

| Secret                               | Where it lives                                                                                                                                                          | Never in                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Supabase URL, anon / publishable key | `.env.development.local` (local), Vercel env vars per environment (Preview -> dev project, Production -> prod project) as `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | - (public by design)                                           |
| Service-role / `sb_secret_` key      | Supabase Edge Function secrets; GitHub Actions secrets only if a CI job needs it                                                                                        | `src/`, any `VITE_` variable, Vercel env, the repo, the bundle |
| DB password, Supabase access token   | Owner's password manager; CI secrets if needed                                                                                                                          | repo, bundle                                                   |

- Two Supabase projects: `mapmyshopping-dev` and `mapmyshopping-prod`; local development uses the Supabase CLI stack (`supabase start`).
- Only `VITE_`-prefixed variables reach the bundle (`envPrefix` in `vite.config.js`). `src/data-sync/publicConfig.js` throws if any `VITE_` variable other than the two allowed ones exists.
- `.env*` files are git-ignored except `.env.example` (placeholders only).
- Enforcement: `npm run build` runs `scripts/scan-bundle-secrets.mjs dist` and fails on service-role / secret-role JWTs, `sb_secret_` keys, the `SUPABASE_SERVICE_ROLE_KEY` name, private-key blocks, Postgres URLs with passwords, and the literal values of server-only env variables present at build time. ESLint forbids `SERVICE_ROLE` / `sb_secret_` literals in `src/`.
- When the project moves to the new key format, `VITE_SUPABASE_ANON_KEY` holds the `sb_publishable_` key; the variable name stays.

## Consequences

- The owner creates both Supabase projects and the Vercel project and sets env vars (agents do not create accounts or handle credentials).
