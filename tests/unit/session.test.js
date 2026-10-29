import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = { getSession: vi.fn(), signInAnonymously: vi.fn() };
const callRpc = vi.fn();

vi.mock('../../src/data-sync/supabaseClient.js', () => ({
  getSupabase: () => ({ auth }),
  callRpc,
}));

const { ensureSession, loadAppState, stateFromContext } =
  await import('../../src/security/session.js');

beforeEach(() => {
  auth.getSession.mockReset();
  auth.signInAnonymously.mockReset();
  callRpc.mockReset();
});

describe('session state gate', () => {
  it('maps context to the three app states', () => {
    expect(stateFromContext(null)).toBe('no-identity');
    expect(stateFromContext({ bound: false })).toBe('no-identity');
    expect(stateFromContext({ bound: true, household: null })).toBe('no-household');
    expect(stateFromContext({ bound: true, household: { id: 'h' } })).toBe('member');
  });

  it('does not sign in or call the server for a first-time visitor', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    expect(await loadAppState()).toEqual({ ok: true, state: 'no-identity', context: null });
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
    expect(callRpc).not.toHaveBeenCalled();
  });

  it('restores a persisted session and loads the context', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'x' } } });
    const context = { bound: true, household: { id: 'h', name: 'בית', role: 'manager' } };
    callRpc.mockResolvedValue({ ok: true, code: 'OK', data: context });
    expect(await loadAppState()).toEqual({ ok: true, state: 'member', context });
    expect(callRpc).toHaveBeenCalledWith('get_my_context', {});
  });

  it('fails closed when the context cannot be loaded', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'x' } } });
    callRpc.mockResolvedValue({ ok: false, code: 'OFFLINE', data: null });
    expect(await loadAppState()).toEqual({ ok: false, code: 'OFFLINE' });
  });

  it('signs in anonymously only when there is no session', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({ error: null });
    expect(await ensureSession()).toEqual({ ok: true });
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);

    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'x' } } });
    await ensureSession();
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('reports the Supabase sign-in rate limit', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({ error: { status: 429 } });
    expect(await ensureSession()).toEqual({ ok: false, code: 'RATE_LIMITED' });
  });
});
