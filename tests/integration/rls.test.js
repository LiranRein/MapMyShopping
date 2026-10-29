import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRun, opId, readTestEnv, rpc } from './harness.js';

const PERMISSION_DENIED = '42501';

const HOUSEHOLD_TABLES = [
  'households',
  'household_members',
  'household_invites',
  'household_settings',
  'audit_log',
];
const ALL_TABLES = ['app_users', 'devices', ...HOUSEHOLD_TABLES, 'sync_operations', 'rate_limits'];

const run = createRun();
let a;
let m;
let b;

beforeAll(async () => {
  a = await run.manager('A');
  b = await run.manager('B');
  m = await run.member('M', a);
  await run.invite(a);
  await run.invite(b);
});

afterAll(() => run.teardown());

describe('T-1.1 cross-household reads (AC-1.1)', () => {
  it('returns only the caller household from every household table', async () => {
    for (const table of HOUSEHOLD_TABLES) {
      const column = table === 'households' ? 'id' : 'household_id';
      const { data, error } = await a.client.from(table).select(column);
      expect(error, table).toBeNull();
      expect(data.length, table).toBeGreaterThan(0);
      expect(
        data.every((row) => row[column] === a.householdId),
        table,
      ).toBe(true);
    }
  });

  it('shows app users of the own household only', async () => {
    const { data, error } = await a.client.from('app_users').select('id');
    expect(error).toBeNull();
    expect(data.map((r) => r.id).sort()).toEqual([a.appUserId, m.appUserId].sort());
  });

  it('shows only the caller own device', async () => {
    const { data, error } = await a.client.from('devices').select('auth_user_id');
    expect(error).toBeNull();
    expect(data).toEqual([{ auth_user_id: a.authUserId }]);
  });

  it('member sees the household but not its invites or audit log', async () => {
    const members = await m.client.from('household_members').select('household_id');
    expect(members.data.length).toBe(2);
    const invites = await m.client.from('household_invites').select('id');
    expect(invites.data).toEqual([]);
    const audit = await m.client.from('audit_log').select('id');
    expect(audit.data).toEqual([]);
  });

  it('never exposes invite code hashes, sync operations or rate limits', async () => {
    const hash = await a.client.from('household_invites').select('code_hash');
    expect(hash.error?.code).toBe(PERMISSION_DENIED);
    for (const table of ['sync_operations', 'rate_limits']) {
      const { error } = await a.client.from(table).select('*');
      expect(error?.code, table).toBe(PERMISSION_DENIED);
    }
  });

  it('gives a client without a session nothing', async () => {
    const { url, anonKey } = readTestEnv();
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    for (const table of ALL_TABLES) {
      const { data, error } = await anon.from(table).select('*');
      expect(error?.code ?? (data.length === 0 ? 'empty' : 'rows'), table).toMatch(/42501|empty/);
    }
    const { error } = await anon.rpc('get_my_context');
    expect(error).not.toBeNull();
  });
});

describe('T-1.2 direct writes are denied (AC-1.1)', () => {
  it('denies insert on every table', async () => {
    const rows = {
      app_users: { display_name: `${run.prefix}x` },
      devices: { app_user_id: a.appUserId, auth_user_id: a.authUserId },
      households: { name: `${run.prefix}x` },
      household_members: { household_id: b.householdId, app_user_id: a.appUserId, role: 'member' },
      household_invites: {
        household_id: a.householdId,
        code_hash: 'x',
        expires_at: new Date().toISOString(),
      },
      household_settings: { household_id: a.householdId },
      audit_log: { action: 'x' },
      sync_operations: { operation_id: opId(), app_user_id: a.appUserId, op_type: 'x' },
      rate_limits: { app_user_id: a.appUserId, action: 'x' },
    };
    for (const table of ALL_TABLES) {
      const { error } = await a.client.from(table).insert(rows[table]);
      expect(error?.code, table).toBe(PERMISSION_DENIED);
    }
  });

  it('denies update and delete on every table', async () => {
    const changes = {
      app_users: ['display_name', `${run.prefix}x`],
      devices: ['revoked_at', new Date().toISOString()],
      households: ['name', `${run.prefix}x`],
      household_members: ['role', 'manager'],
      household_invites: ['revoked_at', new Date().toISOString()],
      household_settings: ['created_at', new Date().toISOString()],
      audit_log: ['action', 'x'],
      sync_operations: ['op_type', 'x'],
      rate_limits: ['failed_attempts', 0],
    };
    for (const table of ALL_TABLES) {
      const [column, value] = changes[table];
      const update = await a.client
        .from(table)
        .update({ [column]: value })
        .not(column, 'is', null);
      expect(update.error?.code, `update ${table}`).toBe(PERMISSION_DENIED);
      const del = await a.client.from(table).delete().not(column, 'is', null);
      expect(del.error?.code, `delete ${table}`).toBe(PERMISSION_DENIED);
    }
  });

  it('left the data unchanged', async () => {
    const { data } = await run.admin
      .from('household_members')
      .select('app_user_id, role')
      .eq('household_id', a.householdId);
    expect(data).toHaveLength(2);
    const { count } = await run.admin
      .from('households')
      .select('id', { count: 'exact', head: true })
      .like('name', `${run.prefix.replace(/_/g, '\\_')}%`);
    expect(count).toBe(2);
  });
});

describe('T-1.3 client-supplied household IDs are ignored (AC-1.1)', () => {
  it('rejects RPC calls that try to pass a household or user ID', async () => {
    const attempts = [
      ['create_invite', { p_operation_id: opId(), p_household_id: b.householdId }],
      ['join_household', { p_code: 'X', p_operation_id: opId(), p_household_id: b.householdId }],
      ['create_household', { p_name: 'x', p_operation_id: opId(), p_app_user_id: b.appUserId }],
      ['update_display_name', { p_display_name: 'x', p_operation_id: opId(), p_id: b.appUserId }],
    ];
    for (const [fn, args] of attempts) {
      const { error } = await a.client.rpc(fn, args);
      expect(error?.code, fn).toBe('PGRST202');
    }
  });

  it('acts only on the caller household when a household ID is used as a name', async () => {
    const before = await run.admin
      .from('household_invites')
      .select('id')
      .eq('household_id', b.householdId)
      .is('revoked_at', null);
    const res = await rpc(a.client, 'update_display_name', {
      p_display_name: `${run.prefix}${b.householdId.slice(0, 8)}`,
      p_operation_id: opId(),
    });
    expect(res.ok).toBe(true);
    await rpc(a.client, 'create_invite', { p_operation_id: opId() });
    const after = await run.admin
      .from('household_invites')
      .select('id')
      .eq('household_id', b.householdId)
      .is('revoked_at', null);
    expect(after.data).toEqual(before.data);
    const { data: bName } = await run.admin
      .from('app_users')
      .select('display_name')
      .eq('id', b.appUserId)
      .single();
    expect(bName.display_name).toBe(b.name);
  });
});

describe('T-1.4 a member cannot escalate (AC-1.2)', () => {
  it('denies a direct role update', async () => {
    const { error } = await m.client
      .from('household_members')
      .update({ role: 'manager' })
      .eq('app_user_id', m.appUserId);
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it('returns FORBIDDEN from create_invite', async () => {
    const res = await rpc(m.client, 'create_invite', { p_operation_id: opId() });
    expect(res).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('keeps exactly one manager and the member role', async () => {
    const { data } = await run.admin
      .from('household_members')
      .select('app_user_id, role')
      .eq('household_id', a.householdId);
    expect(data.filter((r) => r.role === 'manager')).toEqual([
      { app_user_id: a.appUserId, role: 'manager' },
    ]);
    expect(data.find((r) => r.app_user_id === m.appUserId).role).toBe('member');
  });
});
