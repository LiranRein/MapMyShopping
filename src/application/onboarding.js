import { callRpc, selectActiveInvite } from '../data-sync/supabaseClient.js';
import { ensureSession } from '../security/session.js';
import { he } from '../locale/he.js';

export const NAME_MAX_LENGTH = 40;
export const CODE_LENGTH = 10;
const CODE_PATTERN = /^[0-9A-HJKMNP-TV-Z]{10}$/;

export function validateName(value) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return { ok: false, error: 'required' };
  if (trimmed.length > NAME_MAX_LENGTH) return { ok: false, error: 'tooLong' };
  return { ok: true, value: trimmed };
}

export function normalizeInviteCode(raw) {
  const normalized = (raw ?? '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0');
  return CODE_PATTERN.test(normalized) ? normalized : null;
}

export function formatCodeInput(raw) {
  const chars = (raw ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, CODE_LENGTH);
  return chars.length > 5 ? `${chars.slice(0, 5)}-${chars.slice(5)}` : chars;
}

export const newOperationId = () => crypto.randomUUID();

export async function createIdentity(displayName, operationId = newOperationId()) {
  const session = await ensureSession();
  if (!session.ok) return { ok: false, code: session.code, data: null };
  return callRpc('create_identity', { p_display_name: displayName, p_operation_id: operationId });
}

export function updateDisplayName(displayName, operationId = newOperationId()) {
  return callRpc('update_display_name', {
    p_display_name: displayName,
    p_operation_id: operationId,
  });
}

export function createHousehold(name, operationId = newOperationId()) {
  return callRpc('create_household', { p_name: name, p_operation_id: operationId });
}

export function joinHousehold(code, operationId = newOperationId()) {
  return callRpc('join_household', { p_code: code, p_operation_id: operationId });
}

export function createInvite(operationId = newOperationId()) {
  return callRpc('create_invite', { p_operation_id: operationId });
}

export function getContext() {
  return callRpc('get_my_context', {});
}

export function getActiveInvite() {
  return selectActiveInvite();
}

export function errorMessage(code, data) {
  const messages = he.onboarding.errors;
  if (code === 'INVALID_CODE') {
    const left = data?.attempts_left;
    return left ? `${messages.INVALID_CODE} ${messages.attemptsLeft(left)}` : messages.INVALID_CODE;
  }
  return messages[code] ?? messages.SERVER_ERROR;
}

export function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function formatExpiry(expiresAt, now = new Date()) {
  const date = new Date(expiresAt);
  const time = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' }).format(
    date,
  );
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
  const { today, tomorrow } = he.household.invite;
  return he.household.invite.validUntil(time, days === 0 ? today : tomorrow);
}
