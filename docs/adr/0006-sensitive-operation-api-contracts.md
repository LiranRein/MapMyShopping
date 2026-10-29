# ADR 0006 - API contracts for sensitive operations and idempotency

Status: Accepted (2026-10-28, Phase 0). Signatures may be refined in the implementing phase; changes recorded in that phase report.
PRD question: 13.4 Risks: R6, R9, R10

## Context

PRD section 5: all sensitive and multi-step operations run server-side; every retryable operation carries a client-generated operation ID and is idempotent.

## Options

- Edge Functions (Deno, HTTP) for every operation: extra hop, separate auth handling, no shared transaction with RLS helpers.
- Postgres functions exposed as RPC via PostgREST: run inside a transaction, reuse RLS helpers, called with `supabase.rpc()`. **Chosen as default.**
- Edge Functions only where Postgres cannot do the job: anything needing the Auth admin API or service-role key (deleting orphaned auth users, scheduled cleanup).

## Decision

### Conventions (all RPCs)

- Defined in schema `public` (exposed); helpers in schema `app_private` (not exposed).
- `security definer`, `set search_path = ''`, fully qualified names, `revoke execute ... from public, anon; grant execute ... to authenticated`.
- First statement resolves the caller with `app_private.current_app_user_id()` (except `create_identity` and `recover_device`, which require an _unbound_ caller) and checks membership / role from the database, never from parameters.
- Every mutating RPC takes `p_operation_id uuid`. Table `sync_operations(operation_id pk, app_user_id, op_type, result jsonb, applied_at)`: the function inserts the row first (`on conflict do nothing`); if it already exists with the same caller and type, it returns the stored `result` without re-executing; a different caller or type returns `OPERATION_ID_REUSED`.
- Return shape: `jsonb { "ok": boolean, "code": text, "data": object|null }`. Business failures return `ok:false` with a code (so counters commit); programming errors raise.
- Error codes: `NOT_AUTHENTICATED`, `NOT_BOUND`, `ALREADY_BOUND`, `NOT_MEMBER`, `FORBIDDEN`, `ALREADY_IN_HOUSEHOLD`, `INVALID_CODE`, `EXPIRED`, `LOCKED`, `VERSION_CONFLICT`, `NOT_FOUND`, `VALIDATION_FAILED`, `CONFIRMATION_MISMATCH`, `OPERATION_ID_REUSED`, `RATE_LIMITED`.

### Contracts

| RPC                                                       | Params                                                        | Caller                    | Effect                                                                    | Phase |
| --------------------------------------------------------- | ------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------- | ----- |
| `create_identity`                                         | display_name, operation_id                                    | unbound auth user         | app_users + first device                                                  | 1     |
| `update_display_name`                                     | display_name, operation_id                                    | self                      | name only                                                                 | 1     |
| `create_household`                                        | name, operation_id                                            | bound, no household       | household + manager membership + settings                                 | 1     |
| `create_invite`                                           | operation_id                                                  | manager                   | revokes active invite, returns code once (hashed at rest), 24h expiry     | 1 / 8 |
| `join_household`                                          | code, operation_id                                            | bound, no household       | verifies invite, adds member, marks invite used; failure does not consume | 1     |
| `add_item` / `update_item` / `delete_item` / `clear_list` | item fields incl. client UUID, expected_version, operation_id | member                    | see ADR 0007                                                              | 2     |
| `remove_catalog_product`                                  | product_id, operation_id                                      | manager                   | removes product, keeps list rows                                          | 3     |
| `bulk_add_favorites`                                      | items[] with resolution choice, draft_id, operation_id        | member                    | all-or-nothing insert                                                     | 4     |
| `revoke_invite`                                           | operation_id                                                  | manager                   | revoke                                                                    | 8     |
| `leave_household`                                         | operation_id                                                  | member (not sole manager) | remove membership                                                         | 8     |
| `remove_member`                                           | member_app_user_id, operation_id                              | manager                   | remove membership                                                         | 8     |
| `transfer_management`                                     | member_app_user_id, operation_id                              | manager                   | swap roles in one transaction                                             | 8     |
| `preview_household_deletion`                              | -                                                             | manager                   | counts per data type                                                      | 8     |
| `delete_household`                                        | confirm_name, operation_id                                    | manager                   | deletes all household data; checks result                                 | 8     |
| `generate_recovery_code` / `rotate_recovery_code`         | operation_id                                                  | self                      | returns code once (ADR 0004)                                              | 9     |
| `recover_device`                                          | code, operation_id                                            | unbound auth user         | ADR 0005                                                                  | 9     |

Edge Functions (service role server-side only): `cleanup-orphan-auth-users` (scheduled, Phase 11).

## Consequences

- Every RPC needs positive and negative integration tests (role, cross-household, replay with same operation ID).
- `sync_operations` grows; prune rows older than 30 days (longer than any offline queue lifetime, ADR 0011).
