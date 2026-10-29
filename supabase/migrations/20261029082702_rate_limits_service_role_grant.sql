-- Phase 1 / migration 4: the moved table kept its app_private privileges (none for service_role).
-- service_role (test teardown and T-1.9 lockout expiry only) gets the same access it has on every
-- other public table. anon / authenticated still have none.

grant select, insert, update, delete on public.rate_limits to service_role;
