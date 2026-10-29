-- Phase 1 / migration 1: identity, devices, households, invites; helpers, RLS, grants (ADR 0003, 0006).
-- Clients get SELECT only (through RLS). Every write goes through security definer RPCs (migration 2).

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

-- Tables ---------------------------------------------------------------------

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null
    check (char_length(display_name) between 1 and 40 and display_name = btrim(display_name)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index devices_one_active_per_user on public.devices (app_user_id)
  where revoked_at is null;

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40 and name = btrim(name)),
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  app_user_id uuid not null unique references public.app_users (id) on delete cascade,
  role text not null check (role in ('manager', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, app_user_id)
);
create unique index household_members_one_manager on public.household_members (household_id)
  where role = 'manager';

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  code_hash text not null unique,
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  used_at timestamptz,
  used_by uuid references public.app_users (id) on delete set null
);
create unique index household_invites_one_active on public.household_invites (household_id)
  where revoked_at is null and used_at is null;

create table public.household_settings (
  household_id uuid primary key references public.households (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.sync_operations (
  operation_id uuid primary key,
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  op_type text not null,
  result jsonb,
  applied_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_app_user_id uuid references public.app_users (id) on delete set null,
  household_id uuid references public.households (id) on delete cascade,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);
create index audit_log_household on public.audit_log (household_id, created_at);

create table app_private.rate_limits (
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  action text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  primary key (app_user_id, action)
);

-- Helpers --------------------------------------------------------------------

create function app_private.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.app_user_id
  from public.devices d
  where d.auth_user_id = auth.uid()
    and d.revoked_at is null
$$;

create function app_private.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.household_id
  from public.household_members m
  where m.app_user_id = app_private.current_app_user_id()
$$;

create function app_private.is_manager(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = p_household_id
      and m.app_user_id = app_private.current_app_user_id()
      and m.role = 'manager'
  )
$$;

revoke all on function app_private.current_app_user_id() from public, anon;
revoke all on function app_private.current_household_id() from public, anon;
revoke all on function app_private.is_manager(uuid) from public, anon;
grant execute on function app_private.current_app_user_id() to authenticated;
grant execute on function app_private.current_household_id() to authenticated;
grant execute on function app_private.is_manager(uuid) to authenticated;

-- RLS ------------------------------------------------------------------------

alter table public.app_users enable row level security;
alter table public.devices enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.household_settings enable row level security;
alter table public.sync_operations enable row level security;
alter table public.audit_log enable row level security;
alter table app_private.rate_limits enable row level security;

create policy app_users_select on public.app_users
  for select to authenticated
  using (
    id = (select app_private.current_app_user_id())
    or id in (
      select m.app_user_id
      from public.household_members m
      where m.household_id = (select app_private.current_household_id())
    )
  );

create policy devices_select_own on public.devices
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy households_select_member on public.households
  for select to authenticated
  using (id = (select app_private.current_household_id()));

create policy household_members_select_member on public.household_members
  for select to authenticated
  using (household_id = (select app_private.current_household_id()));

create policy household_invites_select_manager on public.household_invites
  for select to authenticated
  using ((select app_private.is_manager(household_id)));

create policy household_settings_select_member on public.household_settings
  for select to authenticated
  using (household_id = (select app_private.current_household_id()));

create policy audit_log_select_manager on public.audit_log
  for select to authenticated
  using ((select app_private.is_manager(household_id)));

-- Grants: no client writes on any table; SELECT only where a policy exists ---

revoke all on public.app_users, public.devices, public.households, public.household_members,
  public.household_invites, public.household_settings, public.sync_operations, public.audit_log
  from anon, authenticated;
revoke all on app_private.rate_limits from public, anon, authenticated;

grant select on public.app_users, public.devices, public.households, public.household_members,
  public.household_settings, public.audit_log
  to authenticated;
grant select (id, household_id, created_by, created_at, expires_at, revoked_at, used_at, used_by)
  on public.household_invites to authenticated;
