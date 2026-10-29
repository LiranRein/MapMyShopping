# ADR 0008 - Pending operations after permission changes

Status: Accepted (2026-10-28, Phase 0); implementation Phase 7, tests Phase 7 and 8.
PRD question: 13.6 Risks: R9, A08

## Context

A member may queue operations offline, then be removed from the household (or have the device replaced) before reconnecting. Replaying those operations must not succeed on stale permissions, and nothing may be lost silently.

## Options

- Client checks its cached role before replay. Rejected: the client is untrusted and its cache is stale by definition.
- Server stores the permission snapshot at queue time. Rejected: would authorize ops on permissions that no longer exist.
- Server re-authorizes every replayed op against current state; client surfaces rejections. **Chosen.**

## Decision

- Every replayed op is an ordinary RPC call; authorization is evaluated at execution time from `current_app_user_id()` and current membership / role (ADR 0006). No "queued at" privilege.
- Replay order: FIFO per device; replay stops at the first authorization failure (`NOT_BOUND`, `NOT_MEMBER`, `FORBIDDEN`) to avoid a burst of rejected calls.
- On `NOT_MEMBER` / `NOT_BOUND`: the client marks all remaining ops as _rejected_, shows the user what was not saved (item names and action), offers "copy as text" and "discard". Rejected ops are never retried automatically. After the user acknowledges, the local household cache is purged.
- On `FORBIDDEN` for a single op (e.g. role lost): that op is rejected and shown; the queue continues with the next op.
- On `VERSION_CONFLICT`: ADR 0007.
- Network errors and 5xx: retry with backoff, same `operation_id` (idempotent).

## Consequences

- Integration test (Phase 7 / 8): queue ops as member, remove member via manager, replay -> all rejected, no rows written.
- The UI must have a "not saved" list state (DESIGN_SYSTEM section 14 error states).
