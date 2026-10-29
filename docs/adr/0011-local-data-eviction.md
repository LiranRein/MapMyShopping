# ADR 0011 - Behavior when the browser evicts local data

Status: Accepted (2026-10-28, Phase 0); implementation Phase 7. Browser-specific behavior marked Unvalidated.
PRD question: 13.9 Risks: R2

## Context

The PWA keeps a cache (IndexedDB), a pending-operation queue, device-local collected marks, and the Supabase session (localStorage). Browsers may evict storage under pressure or policy (e.g. Safari's script-writable storage caps for sites not used recently). Cloud is the source of truth; only unsynced ops and collected marks exist solely on the device.

## Options

- Ignore eviction: silent loss of queued ops. Rejected (success criterion: 0 silently lost ops).
- Request persistent storage and detect eviction explicitly. **Chosen.**

## Decision

- Call `navigator.storage.persist()` after onboarding completes (and once more after PWA install); record the result; show nothing if denied.
- Write a storage marker `{ installId, createdAt }` to IndexedDB at first run. On every start:
  - Session present, marker present -> normal.
  - Session present, marker missing -> IndexedDB was evicted: rebuild cache from the server and show a one-time notice "local data was reset; unsynced changes from before may be missing". Collected marks reset.
  - Session missing -> the device principal is gone (ADR 0003): show the welcome screen with "restore with recovery code" as a primary option.
- Minimize the at-risk window: sync on reconnect, on `visibilitychange` to visible, and right after each queued op when online; show the pending count at all times.
- Never treat cached data as authoritative after eviction or long absence: refetch before showing "synced".

## Consequences

- The queue loss window equals the offline period; it cannot be eliminated in a browser, only made visible (PRD Accepted Constraints).

## Unvalidated

- U1: Whether `persist()` is granted for an installed PWA on iOS Safari and Chrome Android (manual check, Phase 7).
- U2: Whether installed iOS PWAs are exempt from Safari's 7-day storage cap in the current iOS version (manual check, Phase 7).
