# ADR 0007 - Versioning and conflict model

Status: Accepted (2026-10-28, Phase 0); implementation Phase 2 (online) and Phase 7 (offline).
PRD question: 13.5 Risks: R3

## Context

Several members edit the same list, sometimes offline. PRD: row `version` with optimistic concurrency; field-level merge only when safe; conflict UI; never show unsynced data as synced; no duplicates from retries.

## Options

- Last write wins (timestamp). Silent loss. Rejected.
- CRDT per field. Overkill for a shopping list; complex to audit. Rejected.
- Integer row version with compare-and-set, server-side, plus a narrow safe-merge rule. **Chosen.**

## Decision

- `shopping_items.version integer not null default 1`, incremented by a trigger on every update. Same pattern for any other table edited concurrently (catalog, areas, favorites).
- **Create:** client generates the row UUID; `add_item` inserts with `on conflict (id) do nothing` -> retries never duplicate.
- **Update:** `update_item(id, expected_version, changed_fields, operation_id)` updates only where `version = expected_version`. On mismatch it returns `VERSION_CONFLICT` with the current server row.
- **Safe auto-merge (client, Phase 7):** on conflict, if the fields the local op changed are disjoint from the fields changed on the server since `expected_version` (server returns the current row; client compares with its base copy), the client re-sends the op with the new version automatically. Same field changed on both sides, or quantity changed on both sides -> conflict UI (keep mine / keep theirs). Quantities are never summed automatically.
- **Delete:** `delete_item(id, expected_version)`. Deleting an already-deleted row returns `ok` (idempotent). Edit vs delete: if the row was deleted on the server, the local edit is surfaced as "item was deleted by another member" with re-add option; never silently re-created.
- **Clear list:** server-side bulk delete of the household's current list rows; offline edits to cleared rows follow the delete rule.
- **UI states:** each row shows saved locally / synced / failed / conflict; a row is "synced" only after the server ack for its latest op.

## Consequences

- All list writes go through RPCs (not direct PostgREST `update`), so conflict responses are uniform for the offline queue.
- Realtime events carry `version`; the client ignores events older than its known version.
