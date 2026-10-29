# ADR 0002 - Test tooling

Status: Accepted (2026-10-28, Phase 0)

## Context

PRD section 10 (Quality & Testing) requires unit, integration (incl. RLS against a local Supabase) and E2E tests on a mobile viewport with offline simulation. Default proposal: Vitest, Supabase CLI local stack, Playwright.

## Options

- Unit: Vitest (Vite-native, same config/transform) vs Jest (needs separate JSX/ESM transform).
- Integration / RLS: Vitest + `@supabase/supabase-js` against `supabase start`, signing in real test users vs pgTAP via `supabase test db`.
- E2E: Playwright (offline mode, mobile emulation, multiple browser contexts) vs Cypress (single-tab model, weaker multi-context support).

## Decision

- Unit: Vitest 5 with `jsdom` as default environment (per-file `// @vitest-environment node` where DOM is not needed) and `@testing-library/preact`. Tests in `tests/unit/`.
- Integration / RLS (from Phase 1): Vitest in `tests/integration/`, calling the local Supabase stack with real anonymous sessions per test user, so RLS is exercised exactly as the browser would. pgTAP may be added for pure SQL invariants.
- E2E (from Phase 1): Playwright, mobile viewport, `context.setOffline()` for offline scenarios. Installed when the first E2E test is written.
- Bundle secret scan: `scripts/scan-bundle-secrets.mjs`, run as part of `npm run build` (fails the build on a match); pattern logic unit-tested in `tests/unit/secret-patterns.test.js`.

## Consequences

- Integration tests require Docker for `supabase start` (not installed on the owner's machine as of 2026-10-28; see ADR 0012 and the Phase 0 report).
- CI runs lint, format check, unit tests and build; integration tests join CI when they exist (Supabase CLI in GitHub Actions).
