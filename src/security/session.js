import { callRpc, getSupabase } from '../data-sync/supabaseClient.js';

export async function hasSession() {
  const { data } = await getSupabase().auth.getSession();
  return Boolean(data.session);
}

export async function ensureSession() {
  if (await hasSession()) return { ok: true };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, code: 'OFFLINE' };
  }
  try {
    const { error } = await getSupabase().auth.signInAnonymously();
    if (error) return { ok: false, code: error.status === 429 ? 'RATE_LIMITED' : 'SERVER_ERROR' };
    return { ok: true };
  } catch {
    return { ok: false, code: 'OFFLINE' };
  }
}

export function stateFromContext(context) {
  if (!context?.bound) return 'no-identity';
  if (!context.household) return 'no-household';
  return 'member';
}

export async function loadAppState() {
  if (!(await hasSession())) return { ok: true, state: 'no-identity', context: null };
  const res = await callRpc('get_my_context', {});
  if (!res.ok) return { ok: false, code: res.code };
  return { ok: true, state: stateFromContext(res.data), context: res.data };
}
