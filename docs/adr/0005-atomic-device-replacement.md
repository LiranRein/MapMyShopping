# ADR 0005 - Atomic device replacement

Status: Accepted (2026-10-28, Phase 0); implementation Phase 9. Builds on ADR 0003 (owner-approved 2026-10-28).
PRD question: 13.3 Risks: R4

## Context

PRD: recovery code on a new device -> server verifies -> atomic switch of device authorization; old device loses access; failure never revokes the existing device; no state with both devices authorized; parallel attempts resolve to one; not cancellable once verified.

## Options

1. Client-orchestrated steps (verify, then revoke old, then bind new). Rejected: partial states on network failure.
2. Edge Function performing several PostgREST calls with the service-role key. Rejected: no single transaction.
3. One Postgres `security definer` function doing everything in one transaction with row locks. **Chosen.**

## Decision

New device: fresh anonymous sign-in (ADR 0003) with no binding, then calls `recover_device(p_code text, p_operation_id uuid)`:

1. Reject if the caller's `auth.uid()` already has a device binding (`ALREADY_BOUND`), or if `p_operation_id` was already applied (return the stored result, see ADR 0006).
2. Apply the per-caller attempt limit (ADR 0004).
3. `select ... from recovery_secrets where lookup_id = $1 for update` - row lock serializes parallel attempts for the same identity.
4. If locked -> `LOCKED`. If the secret does not match -> increment counter (lock at 5), return `INVALID_CODE`. Nothing else changes; the old device stays authorized.
5. On match, in the same transaction:
   - `update devices set revoked_at = now() where app_user_id = X and revoked_at is null`
   - `insert into devices (app_user_id, auth_user_id) values (X, auth.uid())`
   - reset counters, rotate the code, write `audit_log`, record the operation result.
6. Commit. The partial unique index "one active device per app user" makes a double-authorized state impossible even if the logic had a bug.

The client treats a `SUCCESS` response as final (no cancel). If the response is lost, the client retries with the same `operation_id`; the server answers from the stored result, or reports `ALREADY_BOUND` to the same app user, which the client treats as success (the new code is then obtained via rotate).

Old device: its next request fails RLS (no active binding) -> client shows "this device was replaced" and signs out locally. The orphaned anonymous auth user is deleted by the cleanup job.

## Consequences

- Testable with an injected failure (raise after the revoke step -> whole transaction rolls back, old device still active) and parallel calls (exactly one success).
- Requires the integration test harness against local Supabase (Docker).

## Unvalidated

- U1: Behavior of an open Realtime channel on the old device after revocation (covered by ADR 0003 U2).
