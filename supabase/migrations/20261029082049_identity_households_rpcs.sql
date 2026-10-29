-- Phase 1 / migration 2: RPCs, idempotency, join rate limit, audit (ADR 0006 conventions).
-- Return shape: jsonb {ok, code, data}. Business failures return ok:false (counters commit).
-- Idempotency: a successful operation is stored in sync_operations and replayed for the same
-- caller and type; a failed operation is not stored, so the client may retry it.

-- Internal helpers (not executable by clients) -------------------------------

create function app_private.result(p_ok boolean, p_code text, p_data jsonb default null)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object('ok', p_ok, 'code', p_code, 'data', p_data)
$$;

create function app_private.clean_name(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_value is null then null
    when char_length(btrim(p_value)) between 1 and 40 then btrim(p_value)
    else null
  end
$$;

create function app_private.normalize_invite_code(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when normalized ~ '^[0-9A-HJKMNP-TV-Z]{10}$' then normalized
    else null
  end
  from (
    select translate(upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g')), 'ILO', '110')
      as normalized
  ) n
$$;

create function app_private.begin_operation(
  p_operation_id uuid,
  p_app_user_id uuid,
  p_op_type text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.sync_operations%rowtype;
begin
  insert into public.sync_operations (operation_id, app_user_id, op_type)
  values (p_operation_id, p_app_user_id, p_op_type)
  on conflict (operation_id) do nothing;
  if found then
    return null;
  end if;

  select * into v_existing from public.sync_operations where operation_id = p_operation_id;
  if v_existing.app_user_id = p_app_user_id
    and v_existing.op_type = p_op_type
    and v_existing.result is not null then
    return v_existing.result;
  end if;
  return app_private.result(false, 'OPERATION_ID_REUSED');
end;
$$;

create function app_private.end_operation(
  p_operation_id uuid,
  p_result jsonb,
  p_stored jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (p_result ->> 'ok')::boolean then
    update public.sync_operations
    set result = coalesce(p_stored, p_result), applied_at = now()
    where operation_id = p_operation_id;
  else
    delete from public.sync_operations where operation_id = p_operation_id and result is null;
  end if;
  return p_result;
end;
$$;

create function app_private.audit(
  p_actor uuid,
  p_household_id uuid,
  p_action text,
  p_target text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_app_user_id, household_id, action, target)
  values (p_actor, p_household_id, p_action, p_target)
$$;

create function app_private.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_bytes bytea := extensions.gen_random_bytes(7);
  v_bits bigint := 0;
  v_code text := '';
  i integer;
begin
  for i in 0..6 loop
    v_bits := (v_bits << 8) | get_byte(v_bytes, i);
  end loop;
  for i in 0..9 loop
    v_code := v_code || substr(v_alphabet, ((v_bits >> (5 * i)) & 31)::integer + 1, 1);
  end loop;
  return v_code;
end;
$$;

revoke all on function app_private.result(boolean, text, jsonb) from public, anon, authenticated;
revoke all on function app_private.clean_name(text) from public, anon, authenticated;
revoke all on function app_private.normalize_invite_code(text) from public, anon, authenticated;
revoke all on function app_private.begin_operation(uuid, uuid, text) from public, anon, authenticated;
revoke all on function app_private.end_operation(uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function app_private.audit(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function app_private.generate_invite_code() from public, anon, authenticated;

-- create_identity ------------------------------------------------------------

create function public.create_identity(p_display_name text, p_operation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth uuid := auth.uid();
  v_bound uuid;
  v_name text := app_private.clean_name(p_display_name);
  v_user uuid;
  v_result jsonb;
  v_op public.sync_operations%rowtype;
begin
  if v_auth is null then
    return app_private.result(false, 'NOT_AUTHENTICATED');
  end if;
  if p_operation_id is null then
    return app_private.result(false, 'VALIDATION_FAILED');
  end if;

  v_bound := app_private.current_app_user_id();
  if v_bound is null then
    if exists (select 1 from public.sync_operations where operation_id = p_operation_id) then
      return app_private.result(false, 'OPERATION_ID_REUSED');
    end if;
    if v_name is null then
      return app_private.result(false, 'VALIDATION_FAILED');
    end if;
    begin
      insert into public.app_users (display_name) values (v_name) returning id into v_user;
      insert into public.devices (app_user_id, auth_user_id) values (v_user, v_auth);
      v_result := app_private.result(true, 'OK',
        jsonb_build_object('app_user_id', v_user, 'display_name', v_name));
      insert into public.sync_operations (operation_id, app_user_id, op_type, result)
      values (p_operation_id, v_user, 'create_identity', v_result);
      return v_result;
    exception when unique_violation then
      v_bound := app_private.current_app_user_id();
      if v_bound is null then
        return app_private.result(false, 'OPERATION_ID_REUSED');
      end if;
    end;
  end if;

  select * into v_op from public.sync_operations where operation_id = p_operation_id;
  if found then
    if v_op.app_user_id = v_bound and v_op.op_type = 'create_identity' then
      return v_op.result;
    end if;
    return app_private.result(false, 'OPERATION_ID_REUSED');
  end if;
  return app_private.result(false, 'ALREADY_BOUND');
end;
$$;

-- update_display_name --------------------------------------------------------

create function public.update_display_name(p_display_name text, p_operation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := app_private.current_app_user_id();
  v_name text := app_private.clean_name(p_display_name);
  v_replay jsonb;
begin
  if auth.uid() is null then
    return app_private.result(false, 'NOT_AUTHENTICATED');
  end if;
  if v_user is null then
    return app_private.result(false, 'NOT_BOUND');
  end if;
  if p_operation_id is null or v_name is null then
    return app_private.result(false, 'VALIDATION_FAILED');
  end if;

  v_replay := app_private.begin_operation(p_operation_id, v_user, 'update_display_name');
  if v_replay is not null then
    return v_replay;
  end if;

  update public.app_users set display_name = v_name, updated_at = now() where id = v_user;
  return app_private.end_operation(p_operation_id,
    app_private.result(true, 'OK', jsonb_build_object('app_user_id', v_user, 'display_name', v_name)));
end;
$$;

-- create_household -----------------------------------------------------------

create function public.create_household(p_name text, p_operation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := app_private.current_app_user_id();
  v_name text := app_private.clean_name(p_name);
  v_replay jsonb;
  v_household uuid;
begin
  if auth.uid() is null then
    return app_private.result(false, 'NOT_AUTHENTICATED');
  end if;
  if v_user is null then
    return app_private.result(false, 'NOT_BOUND');
  end if;
  if p_operation_id is null or v_name is null then
    return app_private.result(false, 'VALIDATION_FAILED');
  end if;

  v_replay := app_private.begin_operation(p_operation_id, v_user, 'create_household');
  if v_replay is not null then
    return v_replay;
  end if;

  if exists (select 1 from public.household_members where app_user_id = v_user) then
    return app_private.end_operation(p_operation_id,
      app_private.result(false, 'ALREADY_IN_HOUSEHOLD'));
  end if;

  begin
    insert into public.households (name, created_by) values (v_name, v_user)
    returning id into v_household;
    insert into public.household_members (household_id, app_user_id, role)
    values (v_household, v_user, 'manager');
    insert into public.household_settings (household_id) values (v_household);
  exception when unique_violation then
    return app_private.end_operation(p_operation_id,
      app_private.result(false, 'ALREADY_IN_HOUSEHOLD'));
  end;

  perform app_private.audit(v_user, v_household, 'household.created', v_household::text);
  return app_private.end_operation(p_operation_id,
    app_private.result(true, 'OK',
      jsonb_build_object('household_id', v_household, 'name', v_name, 'role', 'manager')));
end;
$$;

-- create_invite --------------------------------------------------------------

create function public.create_invite(p_operation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := app_private.current_app_user_id();
  v_household uuid;
  v_role text;
  v_replay jsonb;
  v_code text;
  v_invite uuid;
  v_expires timestamptz := now() + interval '24 hours';
begin
  if auth.uid() is null then
    return app_private.result(false, 'NOT_AUTHENTICATED');
  end if;
  if v_user is null then
    return app_private.result(false, 'NOT_BOUND');
  end if;
  select m.household_id, m.role into v_household, v_role
  from public.household_members m where m.app_user_id = v_user;
  if v_household is null then
    return app_private.result(false, 'NOT_MEMBER');
  end if;
  if v_role <> 'manager' then
    return app_private.result(false, 'FORBIDDEN');
  end if;
  if p_operation_id is null then
    return app_private.result(false, 'VALIDATION_FAILED');
  end if;

  v_replay := app_private.begin_operation(p_operation_id, v_user, 'create_invite');
  if v_replay is not null then
    return v_replay;
  end if;

  perform 1 from public.households where id = v_household for update;

  update public.household_invites
  set revoked_at = now()
  where household_id = v_household and revoked_at is null and used_at is null;

  v_code := app_private.generate_invite_code();
  insert into public.household_invites (household_id, code_hash, created_by, expires_at)
  values (v_household, encode(extensions.digest(v_code, 'sha256'), 'hex'), v_user, v_expires)
  returning id into v_invite;

  perform app_private.audit(v_user, v_household, 'invite.created', v_invite::text);
  return app_private.end_operation(
    p_operation_id,
    app_private.result(true, 'OK', jsonb_build_object(
      'code', substr(v_code, 1, 5) || '-' || substr(v_code, 6, 5),
      'expires_at', v_expires)),
    app_private.result(true, 'ALREADY_APPLIED', jsonb_build_object('expires_at', v_expires)));
end;
$$;

-- join_household -------------------------------------------------------------

create function public.join_household(p_code text, p_operation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := app_private.current_app_user_id();
  v_replay jsonb;
  v_limit app_private.rate_limits%rowtype;
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

  insert into app_private.rate_limits (app_user_id, action)
  values (v_user, 'join_household')
  on conflict do nothing;
  select * into v_limit from app_private.rate_limits
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
      update app_private.rate_limits
      set failed_attempts = 0, locked_until = now() + c_lockout
      where app_user_id = v_user and action = 'join_household';
      perform app_private.audit(v_user, null, 'join.failed');
      perform app_private.audit(v_user, null, 'join.locked');
      return app_private.end_operation(p_operation_id,
        app_private.result(false, 'LOCKED', jsonb_build_object(
          'retry_after', extract(epoch from c_lockout)::integer)));
    end if;
    update app_private.rate_limits
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

  delete from app_private.rate_limits where app_user_id = v_user and action = 'join_household';

  select name into v_household_name from public.households where id = v_invite.household_id;
  perform app_private.audit(v_user, v_invite.household_id, 'join.succeeded', v_invite.id::text);
  return app_private.end_operation(p_operation_id,
    app_private.result(true, 'OK', jsonb_build_object(
      'household_id', v_invite.household_id, 'name', v_household_name, 'role', 'member')));
end;
$$;

-- get_my_context (read-only, runs as the caller under RLS) -------------------

create function public.get_my_context()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user uuid := app_private.current_app_user_id();
  v_app_user jsonb;
  v_household jsonb;
  v_members jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED', 'data', null);
  end if;
  if v_user is null then
    return jsonb_build_object('ok', true, 'code', 'OK', 'data', jsonb_build_object(
      'bound', false, 'app_user', null, 'household', null, 'members', '[]'::jsonb));
  end if;

  select jsonb_build_object('id', u.id, 'display_name', u.display_name) into v_app_user
  from public.app_users u where u.id = v_user;

  select jsonb_build_object('id', h.id, 'name', h.name, 'role', m.role) into v_household
  from public.household_members m
  join public.households h on h.id = m.household_id
  where m.app_user_id = v_user;

  if v_household is not null then
    select coalesce(jsonb_agg(jsonb_build_object('display_name', u.display_name, 'role', m.role)
      order by (m.role = 'manager') desc, m.joined_at), '[]'::jsonb)
    into v_members
    from public.household_members m
    join public.app_users u on u.id = m.app_user_id
    where m.household_id = (v_household ->> 'id')::uuid;
  end if;

  return jsonb_build_object('ok', true, 'code', 'OK', 'data', jsonb_build_object(
    'bound', true, 'app_user', v_app_user, 'household', v_household, 'members', v_members));
end;
$$;

-- Grants ---------------------------------------------------------------------

revoke all on function public.create_identity(text, uuid) from public, anon;
revoke all on function public.update_display_name(text, uuid) from public, anon;
revoke all on function public.create_household(text, uuid) from public, anon;
revoke all on function public.create_invite(uuid) from public, anon;
revoke all on function public.join_household(text, uuid) from public, anon;
revoke all on function public.get_my_context() from public, anon;

grant execute on function public.create_identity(text, uuid) to authenticated;
grant execute on function public.update_display_name(text, uuid) to authenticated;
grant execute on function public.create_household(text, uuid) to authenticated;
grant execute on function public.create_invite(uuid) to authenticated;
grant execute on function public.join_household(text, uuid) to authenticated;
grant execute on function public.get_my_context() to authenticated;
