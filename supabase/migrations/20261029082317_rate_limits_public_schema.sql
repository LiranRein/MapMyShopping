-- Phase 1 / migration 3: move rate_limits from app_private to public (owner decision 2026-10-29).
-- Reason: integration test T-1.9 must expire a lockout through the service-role REST API, which
-- cannot reach the unexposed app_private schema. Protection is unchanged: RLS on, no policies,
-- no privileges for anon / authenticated (same pattern as public.sync_operations).

alter table app_private.rate_limits set schema public;
revoke all on public.rate_limits from public, anon, authenticated;

create or replace function public.join_household(p_code text, p_operation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := app_private.current_app_user_id();
  v_replay jsonb;
  v_limit public.rate_limits%rowtype;
  v_code text;
  v_invite public.household_invites%rowtype;
  v_household_name text;
  v_failures integer;
  c_max_failures constant integer := 5;
  c_lockout constant interval := interval '15 minutes';
begin
  if auth.uid() is null then
    return app_private.result(false, 'NOT_AUTHENTICATED');
  end if;
  if v_user is null then
    return app_private.result(false, 'NOT_BOUND');
  end if;
  if p_operation_id is null then
    return app_private.result(false, 'VALIDATION_FAILED');
  end if;

  v_replay := app_private.begin_operation(p_operation_id, v_user, 'join_household');
  if v_replay is not null then
    return v_replay;
  end if;

  if exists (select 1 from public.household_members where app_user_id = v_user) then
    return app_private.end_operation(p_operation_id,
      app_private.result(false, 'ALREADY_IN_HOUSEHOLD'));
  end if;

  insert into public.rate_limits (app_user_id, action)
  values (v_user, 'join_household')
  on conflict do nothing;
  select * into v_limit from public.rate_limits
  where app_user_id = v_user and action = 'join_household'
  for update;

  if v_limit.locked_until is not null and v_limit.locked_until > now() then
    return app_private.end_operation(p_operation_id,
      app_private.result(false, 'LOCKED', jsonb_build_object(
        'retry_after', ceil(extract(epoch from v_limit.locked_until - now()))::integer)));
  end if;

  v_code := app_private.normalize_invite_code(p_code);
  if v_code is null then
    return app_private.end_operation(p_operation_id, app_private.result(false, 'VALIDATION_FAILED'));
  end if;

  select * into v_invite
  from public.household_invites
  where code_hash = encode(extensions.digest(v_code, 'sha256'), 'hex')
    and revoked_at is null
    and used_at is null
    and expires_at > now()
  for update;

  if v_invite.id is null then
    v_failures := v_limit.failed_attempts + 1;
    if v_failures >= c_max_failures then
      update public.rate_limits
      set failed_attempts = 0, locked_until = now() + c_lockout
      where app_user_id = v_user and action = 'join_household';
      perform app_private.audit(v_user, null, 'join.failed');
      perform app_private.audit(v_user, null, 'join.locked');
      return app_private.end_operation(p_operation_id,
        app_private.result(false, 'LOCKED', jsonb_build_object(
          'retry_after', extract(epoch from c_lockout)::integer)));
    end if;
    update public.rate_limits
    set failed_attempts = v_failures, locked_until = null
    where app_user_id = v_user and action = 'join_household';
    perform app_private.audit(v_user, null, 'join.failed');
    return app_private.end_operation(p_operation_id,
      app_private.result(false, 'INVALID_CODE', jsonb_build_object(
        'attempts_left', c_max_failures - v_failures)));
  end if;

  begin
    insert into public.household_members (household_id, app_user_id, role)
    values (v_invite.household_id, v_user, 'member');
  exception when unique_violation then
    return app_private.end_operation(p_operation_id,
      app_private.result(false, 'ALREADY_IN_HOUSEHOLD'));
  end;

  update public.household_invites
  set used_at = now(), used_by = v_user
  where id = v_invite.id;

  delete from public.rate_limits where app_user_id = v_user and action = 'join_household';

  select name into v_household_name from public.households where id = v_invite.household_id;
  perform app_private.audit(v_user, v_invite.household_id, 'join.succeeded', v_invite.id::text);
  return app_private.end_operation(p_operation_id,
    app_private.result(true, 'OK', jsonb_build_object(
      'household_id', v_invite.household_id, 'name', v_household_name, 'role', 'member')));
end;
$$;

revoke all on function public.join_household(text, uuid) from public, anon;
grant execute on function public.join_household(text, uuid) to authenticated;
