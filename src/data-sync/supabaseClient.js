import { createClient } from '@supabase/supabase-js';
import { readPublicConfig } from './publicConfig.js';

let client;

export function getSupabase() {
  if (!client) {
    const { supabaseUrl, supabaseAnonKey } = readPublicConfig();
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return client;
}

function isNetworkError(error) {
  return /fetch|network|load failed/i.test(`${error?.name ?? ''} ${error?.message ?? ''}`);
}

export async function callRpc(fn, args) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, code: 'OFFLINE', data: null };
  }
  try {
    const { data, error } = await getSupabase().rpc(fn, args);
    if (error) {
      return { ok: false, code: isNetworkError(error) ? 'OFFLINE' : 'SERVER_ERROR', data: null };
    }
    return data;
  } catch (error) {
    return { ok: false, code: isNetworkError(error) ? 'OFFLINE' : 'SERVER_ERROR', data: null };
  }
}

export async function selectActiveInvite() {
  const { data, error } = await getSupabase()
    .from('household_invites')
    .select('id, expires_at')
    .is('revoked_at', null)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) return { ok: false, code: isNetworkError(error) ? 'OFFLINE' : 'SERVER_ERROR' };
  return { ok: true, data };
}
