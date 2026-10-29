import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };

export function readTestEnv() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      'Integration tests need SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY ' +
        '(.env.test.local locally, GitHub Actions secrets in CI).',
    );
  }
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    throw new Error('SUPABASE_URL must point to the hosted dev project.');
  }
  return { url, anonKey, serviceKey };
}

export function adminClient() {
  const { url, serviceKey } = readTestEnv();
  return createClient(url, serviceKey, NO_SESSION);
}

export const opId = () => randomUUID();

export function escapeLike(value) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function createRun() {
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const prefix = `t_${runId}_`;
  const authUserIds = [];
  const { url, anonKey } = readTestEnv();
  const admin = adminClient();

  async function anonymousUser() {
    const client = createClient(url, anonKey, NO_SESSION);
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    authUserIds.push(data.user.id);
    return { client, authUserId: data.user.id };
  }

  async function boundUser(label) {
    const user = await anonymousUser();
    const name = `${prefix}${label}`;
    const res = await rpc(user.client, 'create_identity', {
      p_display_name: name,
      p_operation_id: opId(),
    });
    if (!res.ok) throw new Error(`create_identity failed: ${res.code}`);
    return { ...user, name, appUserId: res.data.app_user_id };
  }

  async function manager(label) {
    const user = await boundUser(label);
    const householdName = `${prefix}h_${label}`;
    const res = await rpc(user.client, 'create_household', {
      p_name: householdName,
      p_operation_id: opId(),
    });
    if (!res.ok) throw new Error(`create_household failed: ${res.code}`);
    return { ...user, householdId: res.data.household_id, householdName };
  }

  async function invite(managerUser) {
    const res = await rpc(managerUser.client, 'create_invite', { p_operation_id: opId() });
    if (!res.ok) throw new Error(`create_invite failed: ${res.code}`);
    return res.data.code;
  }

  async function member(label, managerUser) {
    const user = await boundUser(label);
    const code = await invite(managerUser);
    const res = await rpc(user.client, 'join_household', { p_code: code, p_operation_id: opId() });
    if (!res.ok) throw new Error(`join_household failed: ${res.code}`);
    return { ...user, householdId: res.data.household_id };
  }

  async function teardown() {
    const pattern = `${escapeLike(prefix)}%`;
    const { data: users } = await admin
      .from('app_users')
      .select('id')
      .like('display_name', pattern);
    const ids = (users ?? []).map((u) => u.id);
    if (ids.length) await admin.from('audit_log').delete().in('actor_app_user_id', ids);
    await admin.from('households').delete().like('name', pattern);
    await admin.from('app_users').delete().like('display_name', pattern);
    for (const id of authUserIds) {
      await admin.auth.admin.deleteUser(id);
    }
  }

  return { prefix, admin, anonymousUser, boundUser, manager, member, invite, teardown };
}

export async function rpc(client, fn, args) {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.code} ${error.message}`);
  return data;
}

export async function deleteTestData(admin, pattern, before) {
  const older = (query) => (before ? query.lt('created_at', before) : query);
  const { data: users } = await older(
    admin.from('app_users').select('id, devices(auth_user_id)').like('display_name', pattern),
  );
  const ids = (users ?? []).map((u) => u.id);
  const authIds = (users ?? []).flatMap((u) => u.devices.map((d) => d.auth_user_id));
  if (ids.length) await admin.from('audit_log').delete().in('actor_app_user_id', ids);
  await older(admin.from('households').delete().like('name', pattern));
  if (ids.length) await admin.from('app_users').delete().in('id', ids);
  for (const id of authIds) await admin.auth.admin.deleteUser(id);
}

export function sweepStaleTestData(admin = adminClient()) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return deleteTestData(admin, `${escapeLike('t_')}%`, cutoff);
}
