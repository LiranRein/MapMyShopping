# Architecture Decision Records

One file per decision. Status values: Proposed, Accepted, Accepted (owner-approved), Unvalidated (decision recorded, assumptions not yet verified), Deferred.

| ADR                                                 | Title                                                  | PRD section 13 question               | Status                                            |
| --------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- | ------------------------------------------------- |
| [0001](0001-frontend-framework-and-build-tool.md)   | Frontend framework and build tool                      | 10                                    | Accepted                                          |
| [0002](0002-test-tooling.md)                        | Test tooling                                           | (Plan Phase 0, PRD section 6 Testing) | Accepted                                          |
| [0003](0003-identity-and-sessions.md)               | Identity and sessions                                  | 1                                     | Accepted (owner-approved 2026-10-28)              |
| [0004](0004-recovery-codes.md)                      | Recovery-code generation, storage and verification     | 2                                     | Accepted (Unvalidated parts marked)               |
| [0005](0005-atomic-device-replacement.md)           | Atomic device replacement                              | 3                                     | Accepted (Unvalidated parts marked)               |
| [0006](0006-sensitive-operation-api-contracts.md)   | API contracts for sensitive operations and idempotency | 4                                     | Accepted                                          |
| [0007](0007-versioning-and-conflicts.md)            | Versioning and conflict model                          | 5                                     | Accepted                                          |
| [0008](0008-pending-ops-after-permission-change.md) | Pending operations after permission changes            | 6                                     | Accepted                                          |
| [0009](0009-hebrew-speech-recognition.md)           | Hebrew speech recognition                              | 7                                     | Unvalidated (manual device check)                 |
| [0010](0010-backup-monitoring-logging.md)           | Backup, monitoring and logging policy                  | 8                                     | Deferred to Phase 11 (logging rules accepted now) |
| [0011](0011-local-data-eviction.md)                 | Behavior when the browser evicts local data            | 9                                     | Accepted (Unvalidated parts marked)               |
| [0012](0012-secrets-and-environments.md)            | Secrets location and environment separation            | (Plan Phase 0 risk gate)              | Accepted                                          |

PRD question 11 (visual design direction) is closed by `shraga/DESIGN_SYSTEM.md` v1.0, approved by the owner on 2026-10-28; no separate ADR.

Sources verified on 2026-10-28:

- Supabase Anonymous Sign-ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
- MDN SpeechRecognition and @mdn/browser-compat-data 8.1.7 (2026-10-22)
