# ADR 0004 - Recovery-code generation, storage and verification

Status: Accepted (2026-10-28, Phase 0); implementation Phase 9. Builds on ADR 0003 (owner-approved 2026-10-28).
PRD question: 13.2 Risks: R7

## Context

The recovery code is credential-equivalent (PRD section 10, A04). Requirements: shown on creation, mandatory save step, rotate, stored only as a slow salted hash, server-side verification, 5 failures -> 15-minute lockout that refresh / new window cannot bypass, success resets counters, no plaintext persistence anywhere, never in logs.

## Options

- Code with no identifier: the server must compare against every stored hash (impossible with salted slow hashes at scale). Rejected.
- Code = public lookup ID + secret part: lookup ID finds the one row, secret is verified against its hash. **Chosen.**
- Storing an encrypted (reversible) copy so the user can "view" the code later. Rejected: contradicts PRD "no persistent plaintext copy".

## Decision

- **Format:** `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX` in Crockford Base32 (no I, L, O, U; case-insensitive; hyphens ignored). First 2 groups (8 chars, 40 bits) = lookup ID; last 4 groups (16 chars, 80 bits) = secret. Generated server-side with `gen_random_bytes` (pgcrypto).
- **Storage:** table `recovery_secrets(app_user_id pk, lookup_id unique, secret_hash, failed_attempts, locked_until, created_at, rotated_at)`. `secret_hash = crypt(secret, gen_salt('bf', 10))` (bcrypt, cost 10). RLS enabled with **no** client policies; only `security definer` functions touch it.
- **Plaintext lifetime:** returned once in the RPC response of `generate_recovery_code` / `rotate_recovery_code`; held in memory by the client for the save / copy / confirm screen; never written to localStorage, IndexedDB, logs or analytics.
- **"View code after warning" (PRD section 4):** implemented as _rotate after warning_ - the user is warned that the current code becomes invalid, then a new code is shown. Viewing the old code is impossible by design.
- **Verification:** `recover_device(code, operation_id)` (ADR 0005). Lockout is keyed on the `recovery_secrets` row, not on the device or IP, so refresh / new window / new device does not reset it: 5 consecutive failures set `locked_until = now() + 15 min`; attempts while locked return `LOCKED` with `retry_after` and do not run bcrypt. Success resets `failed_attempts = 0`, `locked_until = null`.
- **Unknown lookup ID:** returns the same `INVALID_CODE` response as a wrong secret (no account enumeration) and counts against a per-caller limit: 20 failed recovery attempts per `auth.uid()` per hour, tracked in `recovery_attempts(auth_user_id, attempted_at)`.
- **Counter writes must survive failure:** the function returns a result object instead of raising on a wrong code, so the incremented counter commits.
- **After successful recovery** the code is rotated automatically (it was typed on a possibly shared device) and the new code is shown with the mandatory save step.
- **Audit:** `audit_log` entries for generate / rotate / failed attempt / lockout / success, without the code or any hash.

## Consequences

- bcrypt cost 10 costs ~50-100 ms of DB CPU per verification; lockout and per-caller limits bound the load.
- 80-bit secret + lockout makes online brute force infeasible; the slow hash protects against offline cracking after a DB leak.
- Lost code + lost device = identity lost (PRD "lost-code path documented"): the user creates a new identity and is re-invited by the household manager.

## Unvalidated

- U1: `pgcrypto` `crypt()` / `gen_salt('bf')` availability in the `extensions` schema on the hosted Supabase project (expected, verify in Phase 9 migration).
- U2: bcrypt cost 10 latency on the chosen Supabase compute tier.
