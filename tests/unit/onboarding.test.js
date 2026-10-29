import { beforeEach, describe, expect, it, vi } from 'vitest';

const callRpc = vi.fn();
const ensureSession = vi.fn();

vi.mock('../../src/data-sync/supabaseClient.js', () => ({
  callRpc,
  selectActiveInvite: vi.fn(),
}));
vi.mock('../../src/security/session.js', () => ({ ensureSession }));

const {
  createHousehold,
  createIdentity,
  createInvite,
  errorMessage,
  formatCodeInput,
  formatCountdown,
  formatExpiry,
  joinHousehold,
  normalizeInviteCode,
  validateName,
} = await import('../../src/application/onboarding.js');

describe('T-1.15 name validation (AC-1.10)', () => {
  it('rejects empty and whitespace-only names', () => {
    expect(validateName('')).toEqual({ ok: false, error: 'required' });
    expect(validateName('   ')).toEqual({ ok: false, error: 'required' });
    expect(validateName(undefined)).toEqual({ ok: false, error: 'required' });
  });

  it('rejects names over 40 characters after trimming', () => {
    expect(validateName('א'.repeat(41))).toEqual({ ok: false, error: 'tooLong' });
    expect(validateName(`  ${'א'.repeat(40)}  `)).toEqual({ ok: true, value: 'א'.repeat(40) });
  });

  it('trims valid names', () => {
    expect(validateName('  נועה ')).toEqual({ ok: true, value: 'נועה' });
  });
});

describe('T-1.15 invite code normalisation (AC-1.10)', () => {
  it('accepts lowercase, spaces and hyphens', () => {
    expect(normalizeInviteCode('k7pm4-qxd9r')).toBe('K7PM4QXD9R');
    expect(normalizeInviteCode(' K7PM4 QXD9R ')).toBe('K7PM4QXD9R');
  });

  it('maps I and L to 1 and O to 0', () => {
    expect(normalizeInviteCode('IL0O0-12345')).toBe('1100012345');
    expect(normalizeInviteCode('ilooo-abcde')).toBe('11000ABCDE');
  });

  it('rejects wrong length and characters outside Crockford Base32', () => {
    expect(normalizeInviteCode('K7PM4-QXD9')).toBeNull();
    expect(normalizeInviteCode('K7PM4-QXD9RR')).toBeNull();
    expect(normalizeInviteCode('UUUUU-UUUUU')).toBeNull();
    expect(normalizeInviteCode('K7PM4-QXD9!')).toBeNull();
    expect(normalizeInviteCode('')).toBeNull();
  });

  it('formats typed and pasted input with an automatic hyphen', () => {
    expect(formatCodeInput('k7pm')).toBe('K7PM');
    expect(formatCodeInput('k7pm4q')).toBe('K7PM4-Q');
    expect(formatCodeInput('K7PM4-QXD9R')).toBe('K7PM4-QXD9R');
    expect(formatCodeInput(' k7pm4 qxd9r extra')).toBe('K7PM4-QXD9R');
  });
});

describe('error messages and formatting', () => {
  it('uses one message for every invalid code reason, with attempts left', () => {
    expect(errorMessage('INVALID_CODE', { attempts_left: 3 })).toBe(
      'הקוד לא תקין או שפג תוקפו. נשארו 3 ניסיונות.',
    );
    expect(errorMessage('OFFLINE')).toBe('אין חיבור - נסו שוב');
    expect(errorMessage('SOMETHING_ELSE')).toBe('משהו השתבש. נסו שוב.');
  });

  it('formats the lockout countdown', () => {
    expect(formatCountdown(900)).toBe('15:00');
    expect(formatCountdown(61.2)).toBe('1:02');
    expect(formatCountdown(-5)).toBe('0:00');
  });

  it('formats invite expiry as today or tomorrow', () => {
    const now = new Date(2026, 9, 29, 14, 32);
    expect(formatExpiry(new Date(2026, 9, 30, 14, 32), now)).toBe('בתוקף עד 14:32 מחר');
    expect(formatExpiry(new Date(2026, 9, 29, 20, 5), now)).toBe('בתוקף עד 20:05 היום');
  });
});

describe('RPC use cases', () => {
  beforeEach(() => {
    callRpc.mockReset().mockResolvedValue({ ok: true, code: 'OK', data: {} });
    ensureSession.mockReset().mockResolvedValue({ ok: true });
  });

  it('signs in anonymously before creating the identity', async () => {
    await createIdentity('נועה', 'op-1');
    expect(ensureSession).toHaveBeenCalledBefore(callRpc);
    expect(callRpc).toHaveBeenCalledWith('create_identity', {
      p_display_name: 'נועה',
      p_operation_id: 'op-1',
    });
  });

  it('does not call the RPC when sign-in fails', async () => {
    ensureSession.mockResolvedValue({ ok: false, code: 'OFFLINE' });
    expect(await createIdentity('נועה')).toEqual({ ok: false, code: 'OFFLINE', data: null });
    expect(callRpc).not.toHaveBeenCalled();
  });

  it('sends a fresh UUID operation ID and never a household or user ID', async () => {
    await createHousehold('משפחת כהן');
    await joinHousehold('K7PM4QXD9R');
    await createInvite();
    const calls = callRpc.mock.calls;
    expect(calls.map(([fn]) => fn)).toEqual([
      'create_household',
      'join_household',
      'create_invite',
    ]);
    const ids = calls.map(([, args]) => args.p_operation_id);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Set(ids).size).toBe(3);
    for (const [, args] of calls) {
      expect(Object.keys(args).some((k) => /household_id|user_id|role|device/.test(k))).toBe(false);
    }
  });
});
