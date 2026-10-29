# ADR 0003 - Identity and sessions

Status: Accepted (owner-approved 2026-10-28, Plan Phase 0 risk gate R1)
PRD question: 13.1 Risks: R1, R4, R8, R10

## Context

Users have no email or password. The PRD requires a persistent identity, household-scoped access enforced by RLS, a device record, recovery codes and atomic device replacement. A client-supplied device ID must never prove identity.

Verified against current Supabase docs (https://supabase.com/docs/guides/auth/auth-anonymous, 2026-10-28):

- `signInAnonymously()` creates a real row in `auth.users` and a normal session (access JWT + refresh token). The user gets the `authenticated` Postgres role (not `anon`), and the JWT carries `is_anonymous: true`, readable in RLS via `auth.jwt()`.
- The anonymous account is lost if the user signs out, clears browser data or changes device, unless linked to a permanent identity.
- Default rate limit: 30 anonymous sign-ins per hour per IP (configurable). Supabase strongly recommends CAPTCHA (invisible hCaptcha or Cloudflare Turnstile) to prevent database inflation.
- No automatic cleanup of anonymous users; deletion must be scheduled by us.
- RLS policies are permissive by default and combine with OR; anonymous users share the `authenticated` role, so policies must not assume "authenticated = permanent user".

## Options

1. Device ID in localStorage as identity, checked by the app. Rejected: a device ID is a bearer value with no server-side session; violates R1.
2. Supabase anonymous sign-in, with `auth.users.id` used directly as the app user ID. Simple, but device replacement then needs a session for the _old_ auth user on the new device, which Supabase cannot mint without email / phone / OAuth (admin `generateLink` requires an email). Recovery would be impossible without a custom token server.
3. Supabase anonymous sign-in per device + an app-level user identity bound to the auth user through a server-controlled device binding. **Chosen.**
4. Custom JWT issuer (Edge Function signing our own JWTs). Full control, but we would own token issuance, rotation and revocation - the riskiest part of auth. Rejected.

## Decision

- **Credential = Supabase Auth session.** Each device signs in once with `supabase.auth.signInAnonymously()` (CAPTCHA token attached once enabled, see below). `supabase-js` persists and auto-refreshes the session. The browser's auth user is called the _device principal_.
- **Identity = `app_users` row**, with its own UUID (`app_users.id`), display name, and at most one household membership. It is _not_ equal to `auth.uid()`. (This refines PRD section 8, which says `users.id = auth.uid`; the change is what makes device replacement possible.)
- **Binding = `devices` row**: `(id, app_user_id, auth_user_id unique, created_at, revoked_at)`. A partial unique index allows exactly one active device (`revoked_at is null`) per app user. Rows are written only by `security definer` server functions; clients can read only their own row.
- **Resolution in every policy:** a private helper `app_private.current_app_user_id()` returns `app_user_id` from `devices` where `auth_user_id = auth.uid()` and `revoked_at is null`, else `null`. All RLS policies and RPCs use this helper (and a `current_household_id()` helper built on it). A household ID, user ID, role or device ID sent by the client is never trusted.
- **Onboarding:** after anonymous sign-in, RPC `create_identity(display_name, operation_id)` creates `app_users` + the first `devices` row for the calling `auth.uid()`; fails if that auth user is already bound.
- **Revocation is immediate:** revoking a device sets `revoked_at`; because every policy re-resolves the binding per query, the old device's still-valid JWT stops granting access at once. The orphaned auth user is deleted later by the cleanup job (Phase 11) or an Edge Function using the service-role key server-side.
- **Abuse control (R8):** keep the 30/hour/IP default; enable Cloudflare Turnstile (or hCaptcha) for sign-ins in production before launch; scheduled deletion of anonymous auth users with no active device older than 30 days (Phase 11).
- **Session lifetime:** Supabase defaults (1h access token, rotating refresh tokens). No custom token handling in the client.
- **Policy hygiene (R10):** every `security definer` function sets `search_path = ''`, uses fully qualified names, and checks the caller via `current_app_user_id()` before any write.

## Consequences

- Device replacement becomes a single-table binding switch inside one transaction (ADR 0005), without minting tokens.
- Clearing site data or signing out loses the device binding; the recovery code (ADR 0004) is the only way back. Onboarding must make saving the code mandatory (already in PRD).
- One extra indexed lookup per policy evaluation; `devices.auth_user_id` must be indexed (unique). Wrap the helper call as `(select app_private.current_app_user_id())` in policies so Postgres evaluates it once per statement.
- Supabase Realtime `postgres_changes` authorization uses the same RLS policies.

## Unvalidated (to verify in Phase 1 with integration / manual tests)

- U1: Session persistence of anonymous sessions in an _installed_ PWA on iOS (home-screen storage partition) and Android, across days of non-use. Manual device check by the owner.
- U2: Realtime stops delivering changes to a device whose binding was revoked while its JWT is still valid (expected, since Realtime checks RLS per change; to be proven by an integration test).
- U3: CAPTCHA provider choice and its RTL / Hebrew UX on mobile.

## Owner approval

Approved by owner on 2026-10-28 in the Phase 0 build session (answer: "1 - approve as is"), no changes requested.
