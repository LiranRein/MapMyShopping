# ADR 0010 - Backup, monitoring and logging policy

Status: Deferred to Phase 11 (production readiness) - Unvalidated. Logging rules below are Accepted now and apply from Phase 1.
PRD question: 13.8

## Context

Plan.md Phase 11 owns monitoring, backups with a tested restore and the anonymous-user cleanup job. The Supabase plan tier (which decides daily backups / PITR availability) has not been chosen.

## Options (to decide in Phase 11)

- Backups: Supabase managed daily backups (paid tiers) vs PITR add-on vs scheduled `pg_dump` to external storage from CI.
- Monitoring: Supabase dashboard logs + log drains vs an external error tracker for the client (would need a privacy review and CSP entry).

## Decision (accepted now)

- Never log recovery codes, invite codes, access / refresh tokens, API keys or code hashes - client or server.
- `audit_log` (server-written) records admin actions and recovery events with actor app user ID, action, target and timestamp only.
- Client errors are not sent to any third party until Phase 11 decides on a tool.

## Decision (deferred, Unvalidated)

- Backup mechanism, retention, restore drill, monitoring / alerting tool: Phase 11, recorded in this ADR.
