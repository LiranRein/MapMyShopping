import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRun, opId, readTestEnv, rpc } from './harness.js';

const run = createRun();
let p;
let q;
let j;

beforeAll(async () => {
  p = await run.manager('P');
  q = await run.manager('Q');
  j = await run.member('J', p);
});

afterAll(() => run.teardown());

const join = (user, code, operationId = opId()) =>
  rpc(user.client, 'join_household', { p_code: code, p_operation_id: operationId });

const invite = (user, operationId = opId()) =>
  rpc(user.client, 'create_invite', { p_operation_id: operationId });

async function inviteRow(householdId, extra = {}) {
  let query = run.admin.from('household_invites').select('*').eq('household_id', householdId);
  for (const [key, value] of Object.entries(extra)) query = query.eq(key, value);
  const { data } = await query.order('created_at', { ascending: false });
  return data;
}

async function membersOf(householdId) {
  const { data } = await run.admin
    .from('household_members')
    .select('app_user_id, role')
    .eq('household_id', householdId);
  return data;
}

describe('validation and caller checks', () => {
  it('rejects invalid display and household names', async () => {
    const user = await run.anonymousUser();
    for (const name of ['', '   ', 'x'.repeat(41), null]) {
      const res = await rpc(user.client, 'create_identity', {
        p_display_name: name,
        p_operation_id: opId(),
      });
      expect(res).toMatchObject({ ok: false, code: 'VALIDATION_FAILED' });
    }
    const notBound = await rpc(user.client, 'create_household', {
      p_name: `${run.prefix}x`,
      p_operation_id: opId(),
    });
    expect(notBound).toMatchObject({ ok: false, code: 'NOT_BOUND' });
    const notBoundInvite = await invite(user);
    expect(notBoundInvite).toMatchObject({ ok: false, code: 'NOT_BOUND' });
    const ctx = await rpc(user.client, 'get_my_context');
    expect(ctx.data).toEqual({ bound: false, app_user: null, household: null, members: [] });
  });

  it('trims names and rejects a second identity for the same device', async () => {
    const user = await run.anonymousUser();
    const first = await rpc(user.client, 'create_identity', {
      p_display_name: `  ${run.prefix}trim  `,
      p_operation_id: opId(),
    });
    expect(first.data.display_name).toBe(`${run.prefix}trim`);
    const second = await rpc(user.client, 'create_identity', {
      p_display_name: `${run.prefix}again`,
      p_operation_id: opId(),
    });
    expect(second).toMatchObject({ ok: false, code: 'ALREADY_BOUND' });
    for (const name of ['   ', 'x'.repeat(41)]) {
      const res = await rpc(user.client, 'create_household', {
        p_name: name,
        p_operation_id: opId(),
      });
      expect(res).toMatchObject({ ok: false, code: 'VALIDATION_FAILED' });
    }
  });

  it('rejects a second household for a manager', async () => {
    const res = await rpc(p.client, 'create_household', {
      p_name: `${run.prefix}second`,
      p_operation_id: opId(),
    });
    expect(res).toMatchObject({ ok: false, code: 'ALREADY_IN_HOUSEHOLD' });
  });

  it('get_my_context returns the household and its members', async () => {
    const ctx = await rpc(j.client, 'get_my_context');
    expect(ctx.ok).toBe(true);
    expect(ctx.data.bound).toBe(true);
    expect(ctx.data.app_user).toEqual({ id: j.appUserId, display_name: j.name });
    expect(ctx.data.household).toEqual({
      id: p.householdId,
      name: p.householdName,
      role: 'member',
    });
    expect(ctx.data.members).toEqual([
      { display_name: p.name, role: 'manager' },
      { display_name: j.name, role: 'member' },
    ]);
  });
});

describe('T-1.5 display name change keeps identity and role (AC-1.3)', () => {
  it('changes only the name', async () => {
    const before = await rpc(j.client, 'get_my_context');
    const res = await rpc(j.client, 'update_display_name', {
      p_display_name: `${run.prefix}J_renamed`,
      p_operation_id: opId(),
    });
    expect(res).toMatchObject({ ok: true, data: { app_user_id: j.appUserId } });
    const after = await rpc(j.client, 'get_my_context');
    expect(after.data.app_user).toEqual({
      id: j.appUserId,
      display_name: `${run.prefix}J_renamed`,
    });
    expect(after.data.household).toEqual(before.data.household);
    expect(await membersOf(p.householdId)).toContainEqual({
      app_user_id: j.appUserId,
      role: 'member',
    });
  });
});

describe('T-1.6 a member cannot join a second household (AC-1.4)', () => {
  it('returns ALREADY_IN_HOUSEHOLD and does not consume the invite', async () => {
    const { data } = await invite(q);
    const res = await join(j, data.code);
    expect(res).toMatchObject({ ok: false, code: 'ALREADY_IN_HOUSEHOLD' });
    expect(await membersOf(q.householdId)).toHaveLength(1);
    const [row] = await inviteRow(q.householdId);
    expect(row.used_at).toBeNull();
  });
});

describe('T-1.7 a valid code joins exactly one person (AC-1.5)', () => {
  it('joins with a normalised code and rejects the second user', async () => {
    const { data } = await invite(p);
    const j1 = await run.boundUser('J1');
    const typed = ` ${data.code.toLowerCase().replace('-', ' ')} `;
    const res = await join(j1, typed);
    expect(res).toMatchObject({
      ok: true,
      data: { household_id: p.householdId, name: p.householdName, role: 'member' },
    });
    const [row] = await inviteRow(p.householdId);
    expect(row.used_by).toBe(j1.appUserId);
    expect(row.used_at).not.toBeNull();

    const j2 = await run.boundUser('J2');
    expect(await join(j2, data.code)).toMatchObject({ ok: false, code: 'INVALID_CODE' });
    expect((await membersOf(p.householdId)).map((r) => r.app_user_id)).not.toContain(j2.appUserId);
  });
});

describe('T-1.8 wrong, expired and revoked codes are rejected identically (AC-1.5)', () => {
  it('returns the same response and never consumes an invite', async () => {
    const k = await run.boundUser('K');
    const shape = (res) => ({ ok: res.ok, code: res.code, keys: Object.keys(res.data).sort() });

    const wrong = await join(k, 'ABCDE-FGHJK');

    const { data: expired } = await invite(p);
    const [expiredRow] = await inviteRow(p.householdId);
    await run.admin
      .from('household_invites')
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq('id', expiredRow.id);
    const expiredRes = await join(k, expired.code);

    const { data: revoked } = await invite(p);
    const { data: valid } = await invite(p);
    const revokedRes = await join(k, revoked.code);

    expect(shape(wrong)).toEqual({ ok: false, code: 'INVALID_CODE', keys: ['attempts_left'] });
    expect(shape(expiredRes)).toEqual(shape(wrong));
    expect(shape(revokedRes)).toEqual(shape(wrong));
    expect([wrong, expiredRes, revokedRes].map((r) => r.data.attempts_left)).toEqual([4, 3, 2]);

    const rows = await inviteRow(p.householdId);
    expect(rows.slice(0, 3).every((r) => r.used_at === null)).toBe(true);

    const ok = await join(k, valid.code);
    expect(ok).toMatchObject({ ok: true, code: 'OK' });
    const { data: limits } = await run.admin
      .from('rate_limits')
      .select('*')
      .eq('app_user_id', k.appUserId);
    expect(limits).toEqual([]);
  });
});

describe('T-1.9 five failures lock joining for 15 minutes (AC-1.6)', () => {
  it('locks, survives a fresh client, and unlocks after the lockout', async () => {
    const l = await run.boundUser('L');
    const { data: valid } = await invite(q);
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await join(l, 'ZZZZZ-ZZZZZ'));
    expect(results.slice(0, 4).map((r) => r.data.attempts_left)).toEqual([4, 3, 2, 1]);
    expect(results[4]).toMatchObject({ ok: false, code: 'LOCKED', data: { retry_after: 900 } });

    const correctWhileLocked = await join(l, valid.code);
    expect(correctWhileLocked.code).toBe('LOCKED');
    expect(correctWhileLocked.data.retry_after).toBeGreaterThan(0);
    expect(correctWhileLocked.data.retry_after).toBeLessThanOrEqual(900);

    const { data: session } = await l.client.auth.getSession();
    const { url, anonKey } = readTestEnv();
    const fresh = createClient(url, anonKey, { auth: { persistSession: false } });
    await fresh.auth.setSession({
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
    });
    expect((await join({ client: fresh }, valid.code)).code).toBe('LOCKED');

    const [row] = await inviteRow(q.householdId);
    expect(row.used_at).toBeNull();

    const { data: audit } = await run.admin
      .from('audit_log')
      .select('action')
      .eq('actor_app_user_id', l.appUserId);
    expect(audit.map((a) => a.action)).toContain('join.locked');

    await run.admin
      .from('rate_limits')
      .update({ locked_until: new Date(Date.now() - 1000).toISOString() })
      .eq('app_user_id', l.appUserId);
    expect(await join(l, valid.code)).toMatchObject({ ok: true, code: 'OK' });
    const { data: limits } = await run.admin
      .from('rate_limits')
      .select('*')
      .eq('app_user_id', l.appUserId);
    expect(limits).toEqual([]);
  });
});

describe('T-1.10 concurrent joins with one code (AC-1.5)', () => {
  it('lets exactly one user in', async () => {
    const c1 = await run.boundUser('C1');
    const c2 = await run.boundUser('C2');
    const { data } = await invite(p);
    const before = (await membersOf(p.householdId)).length;
    const results = await Promise.all([join(c1, data.code), join(c2, data.code)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => r.code === 'INVALID_CODE')).toHaveLength(1);
    expect(await membersOf(p.householdId)).toHaveLength(before + 1);
  });
});

describe('T-1.11 every mutating RPC is idempotent by operation ID (AC-1.7)', () => {
  let r;
  let other;

  it('create_identity', async () => {
    r = await run.anonymousUser();
    other = await run.anonymousUser();
    const id = opId();
    const args = { p_display_name: `${run.prefix}R`, p_operation_id: id };
    const first = await rpc(r.client, 'create_identity', args);
    const second = await rpc(r.client, 'create_identity', args);
    expect(second).toEqual(first);
    const { count } = await run.admin
      .from('devices')
      .select('id', { count: 'exact', head: true })
      .eq('auth_user_id', r.authUserId);
    expect(count).toBe(1);
    const reused = await rpc(other.client, 'create_identity', {
      p_display_name: `${run.prefix}other`,
      p_operation_id: id,
    });
    expect(reused).toMatchObject({ ok: false, code: 'OPERATION_ID_REUSED' });
    const bound = await rpc(other.client, 'create_identity', {
      p_display_name: `${run.prefix}other`,
      p_operation_id: opId(),
    });
    expect(bound.ok).toBe(true);
  });

  it('create_household', async () => {
    const id = opId();
    const args = { p_name: `${run.prefix}h_R`, p_operation_id: id };
    const first = await rpc(r.client, 'create_household', args);
    const second = await rpc(r.client, 'create_household', args);
    expect(first.ok).toBe(true);
    expect(second).toEqual(first);
    const { count } = await run.admin
      .from('households')
      .select('id', { count: 'exact', head: true })
      .eq('name', `${run.prefix}h_R`);
    expect(count).toBe(1);
    const reused = await rpc(other.client, 'create_household', {
      p_name: `${run.prefix}h_other`,
      p_operation_id: id,
    });
    expect(reused).toMatchObject({ ok: false, code: 'OPERATION_ID_REUSED' });
  });

  it('create_invite returns the code once', async () => {
    const id = opId();
    const first = await invite(r, id);
    const second = await invite(r, id);
    expect(first).toMatchObject({ ok: true, code: 'OK' });
    expect(first.data.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/);
    expect(second).toEqual({
      ok: true,
      code: 'ALREADY_APPLIED',
      data: { expires_at: first.data.expires_at },
    });
    const ctx = await rpc(r.client, 'get_my_context');
    expect(await inviteRow(ctx.data.household.id)).toHaveLength(1);
  });

  it('join_household', async () => {
    const ctx = await rpc(r.client, 'get_my_context');
    const { data } = await invite(r);
    const joiner = await run.boundUser('J3');
    const id = opId();
    const first = await join(joiner, data.code, id);
    const second = await join(joiner, data.code, id);
    expect(first.ok).toBe(true);
    expect(second).toEqual(first);
    expect(await membersOf(ctx.data.household.id)).toHaveLength(2);
    expect(await join(other, data.code, id)).toMatchObject({
      ok: false,
      code: 'OPERATION_ID_REUSED',
    });
  });

  it('update_display_name', async () => {
    const id = opId();
    const args = { p_display_name: `${run.prefix}R_one`, p_operation_id: id };
    await rpc(r.client, 'update_display_name', args);
    await rpc(r.client, 'update_display_name', {
      p_display_name: `${run.prefix}R_two`,
      p_operation_id: opId(),
    });
    const replay = await rpc(r.client, 'update_display_name', args);
    expect(replay.data.display_name).toBe(`${run.prefix}R_one`);
    const ctx = await rpc(r.client, 'get_my_context');
    expect(ctx.data.app_user.display_name).toBe(`${run.prefix}R_two`);
    expect(await rpc(other.client, 'update_display_name', args)).toMatchObject({
      ok: false,
      code: 'OPERATION_ID_REUSED',
    });
  });
});

describe('T-1.12 one active invite per household (AC-1.8)', () => {
  it('revokes the previous invite', async () => {
    await invite(p);
    const [prev] = await inviteRow(p.householdId);
    await invite(p);
    const rows = await inviteRow(p.householdId);
    const active = rows.filter((r) => r.revoked_at === null && r.used_at === null);
    expect(active).toHaveLength(1);
    expect(active[0].id).not.toBe(prev.id);
    expect(rows.find((r) => r.id === prev.id).revoked_at).not.toBeNull();
  });
});

describe('audit log (A09)', () => {
  it('records events without codes or hashes', async () => {
    const { data } = await run.admin
      .from('audit_log')
      .select('action, target')
      .eq('household_id', p.householdId);
    const actions = data.map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining(['household.created', 'invite.created', 'join.succeeded']),
    );
    const { data: hashes } = await run.admin
      .from('household_invites')
      .select('code_hash')
      .eq('household_id', p.householdId);
    const targets = data.map((a) => a.target ?? '');
    for (const { code_hash } of hashes) expect(targets).not.toContain(code_hash);
    expect(targets.every((t) => !/^[0-9A-Z]{5}-?[0-9A-Z]{5}$/.test(t))).toBe(true);
  });
});
