# Project rules - MapMyShopping

## Stack
- Frontend: Vite 8 + Preact 11, plain JavaScript (ES modules, `.js` / `.jsx`), no TypeScript (ADR 0001).
- Icons: `lucide-preact`. Font: Rubik, self-hosted via `@fontsource-variable/rubik`.
- Backend: Supabase (Postgres + RLS, Auth anonymous sign-in, Realtime, RPC; Edge Functions only where the Auth admin API is needed) (ADR 0003, 0006).
- Hosting: Vercel (`vercel.json`), static `dist/`.
- Tests: Vitest 5 + jsdom + `@testing-library/preact` (unit); Vitest against the hosted dev project `MapMyShopping` (integration, ADR 0012 / C1); Playwright 1.64 Chromium on 375x812 (E2E) (ADR 0002).
- Lint / format: ESLint 10 flat config + Prettier 3.
- Node >= 22 (CI uses 22).

## Commands
| Task | Command |
|---|---|
| Install | `npm ci` |
| Dev server | `npm run dev` (http://localhost:5173) |
| Unit tests | `npm test` |
| Integration tests (hosted dev, needs `.env.test.local`) | `npm run test:integration` |
| E2E tests (hosted dev, needs `.env.test.local`; first run `npx playwright install chromium`) | `npm run test:e2e` |
| Lint | `npm run lint` |
| Format check / fix | `npm run format:check` / `npm run format` |
| Build (+ bundle secret scan) | `npm run build` |
| Secret scan only | `npm run scan:secrets` |
| Preview production build | `npm run preview` |
| Local Supabase (needs Docker; not used since C1, ADR 0012) | `npm run db:start` / `npm run db:stop` / `npm run db:reset` |
| New migration | add `supabase/migrations/<version>_<name>.sql`, apply to the dev project, keep the file version equal to the applied version |
| Deploy | Vercel Git integration (push) or `npx vercel` / `npx vercel --prod` by the owner |

Every phase: run `npm run lint`, `npm run format:check`, `npm test`, `npm run test:integration`, `npm run test:e2e`, `npm run build` before writing the report.

Test data on the shared dev project: names prefixed `t_<runId>_`, deleted after each run; `t_` data older than 24h swept by the integration global setup.

## Folder layout
- `src/presentation/` - screens, components, styles. No Supabase or IndexedDB calls here.
- `src/application/` - use cases, business rules, validation.
- `src/data-sync/` - Supabase client, IndexedDB, operation queue, conflicts.
- `src/security/` - session, device binding, client-side role helpers (UX only).
- `src/locale/he.js` - all UI strings.
- `supabase/migrations/` - SQL migrations; `supabase/config.toml` - local stack.
- `tests/unit/`, `tests/integration/` (harness in `harness.js`), `tests/e2e/` (Playwright).
- `docs/adr/` - architecture decisions; `docs/` - findings.
- `scripts/` - build-time tooling.

## Conventions
- RTL: logical CSS properties only (`margin-inline-start`, `padding-inline-end`, `inset-inline-*`); no `left` / `right`.
- Colors, spacing, radius, shadows, fonts only via tokens in `src/presentation/styles/tokens.css` (mirrors `shraga/DESIGN_SYSTEM.md`; a test enforces color parity).
- No hard-coded UI strings in components; use `src/locale/he.js`.
- Components: named exports, PascalCase files (`HomeScreen.jsx`); other modules camelCase.
- Prettier: single quotes, width 100, trailing commas.

## Security rules
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` may be `VITE_`-prefixed (enforced by `src/data-sync/publicConfig.js`).
- Service-role / `sb_secret_` keys never in `src/`, the repo or the bundle (ESLint rule + build-time scan) (ADR 0012).
- `.env*` git-ignored; only `.env.example` committed.
- Every table ships with RLS and RLS tests in the same phase. Policies resolve the caller via `app_private.current_app_user_id()`; never trust client-supplied household / user / device IDs (ADR 0003).
- Every `security definer` function: `set search_path = ''`, fully qualified names, explicit caller / role check, `operation_id` idempotency (ADR 0006).
- Never log codes, tokens, keys or hashes.
