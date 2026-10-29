# ADR 0001 - Frontend framework and build tool

Status: Accepted (2026-10-28, Phase 0)
PRD question: 13.10

## Context

PRD section 6 fixes a JavaScript PWA and leaves the framework and build tool to Phase 0 (default proposal: Vite + vanilla JS or a light framework). The app has ~10 screens with many UI states (loading / empty / error / offline / pending / conflict), bottom sheets, realtime updates and an offline queue, used on mid-range phones.

## Options

1. Vite + vanilla JS (DOM by hand). Smallest runtime; state-to-DOM sync for many states becomes hand-written and error-prone.
2. Vite + Preact (JSX, hooks). ~4 kB runtime, React-compatible model, mature testing support (`@testing-library/preact`), works with `vite-plugin-pwa` later.
3. Vite + Svelte. Small output, but a compiler and a second language; less shared knowledge with the React ecosystem.
4. Vite + React. Familiar, but ~10x Preact's runtime with no feature we need beyond Preact.

## Decision

Vite 8 + Preact 11, plain JavaScript (ES modules, `.js` / `.jsx`), no TypeScript. Lucide icons via `lucide-preact`. Rubik self-hosted via `@fontsource-variable/rubik` (font files are bundled into `dist/assets`, no font CDN at runtime). The PWA layer (service worker, manifest) is added in Phase 7 with `vite-plugin-pwa` or a hand-written service worker, decided then.

Code layers map to folders (PRD section 5):

- `src/presentation/` - components, screens, styles. No Supabase calls.
- `src/application/` - use cases, business validation, duplicate rules.
- `src/data-sync/` - Supabase access, IndexedDB, operation queue, conflict handling.
- `src/security/` - identity, session, device binding, role checks on the client side (UX only; enforcement is server-side).
- `src/locale/` - all UI strings (Hebrew).

## Consequences

- JSX requires the Preact Vite preset; ESLint parses JSX via `ecmaFeatures.jsx`.
- No type checker; contracts are documented in ADR 0006 and covered by tests.
- Switching to React later is low-cost (`preact/compat`).
