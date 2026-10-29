import { CircleCheck, Copy, RefreshCw, Settings } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import {
  createInvite,
  errorMessage,
  formatExpiry,
  getActiveInvite,
  getContext,
} from '../../application/onboarding.js';
import { he } from '../../locale/he.js';
import { BottomNav } from './BottomNav.jsx';
import { Banner } from './onboarding/CtaButton.jsx';

const t = he.household;
const TOAST_MS = 3000;

function InviteCard({ onCopied }) {
  const [invite, setInvite] = useState({ state: 'loading' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getActiveInvite().then((res) => {
      if (!active) return;
      if (!res.ok) setError(errorMessage(res.code));
      setInvite({ state: res.ok && res.data ? 'hidden' : 'none' });
    });
    return () => {
      active = false;
    };
  }, []);

  const generate = async () => {
    setBusy(true);
    setError(null);
    const res = await createInvite();
    setBusy(false);
    if (res.ok && res.data.code) {
      setInvite({ state: 'shown', code: res.data.code, expiresAt: res.data.expires_at });
    } else {
      setError(errorMessage(res.code));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invite.code);
      onCopied();
    } catch {
      setError(he.onboarding.errors.SERVER_ERROR);
    }
  };

  return (
    <section class="ticket" aria-labelledby="invite-title">
      <div class="ticket-top">
        <h2 id="invite-title">{t.invite.title}</h2>
        <p class="field-helper">{t.invite.helper}</p>
      </div>
      <div class="ticket-cut" aria-hidden="true" />
      <div class="ticket-bottom">
        {invite.state === 'shown' && (
          <>
            <p class="ticket-code" dir="ltr" data-testid="invite-code">
              {invite.code}
            </p>
            <p class="ticket-expiry">{formatExpiry(invite.expiresAt)}</p>
          </>
        )}
        {invite.state === 'hidden' && <p class="ticket-expiry">{t.invite.shown}</p>}
        {error && <Banner>{error}</Banner>}
        <div class="ticket-actions">
          {invite.state === 'shown' && (
            <button type="button" class="pill pill-ink" onClick={copy}>
              <Copy size={18} strokeWidth={2} aria-hidden="true" />
              {t.invite.copy}
            </button>
          )}
          <button
            type="button"
            class="pill pill-soft"
            onClick={generate}
            disabled={busy || invite.state === 'loading'}
            aria-busy={busy ? 'true' : undefined}
          >
            {busy ? (
              <span class="spinner" role="status" aria-label={he.common.loading} />
            ) : (
              <RefreshCw size={18} strokeWidth={2} aria-hidden="true" />
            )}
            {invite.state === 'none' ? t.invite.create : t.invite.renew}
          </button>
        </div>
      </div>
    </section>
  );
}

export function HouseholdScreen({ context: initialContext, onNavigate }) {
  const [context, setContext] = useState(initialContext);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    getContext().then((res) => {
      if (res.ok && res.data.household) setContext(res.data);
    });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const { household, members } = context;

  return (
    <div class="screen">
      <div class="page">
        <header class="top-bar">
          <div>
            <p class="eyebrow">{t.eyebrow}</p>
            <h1 class="title">
              <bdi>{household.name}</bdi>
            </h1>
          </div>
          <button type="button" class="round-button" aria-label={t.settings} disabled>
            <Settings size={21} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>
        <main>
          {household.role === 'manager' && <InviteCard onCopied={() => setToast(true)} />}
          <section class="section" aria-labelledby="members-title">
            <h2 id="members-title">{t.membersTitle}</h2>
            <ul class="members">
              {members.map((m, i) => (
                <li key={i} class="member">
                  <span class="avatar" aria-hidden="true">
                    {m.display_name.charAt(0)}
                  </span>
                  <span class="member-name">
                    <bdi>{m.display_name}</bdi>
                  </span>
                  <span class={m.role === 'manager' ? 'role-chip role-chip-manager' : 'role-chip'}>
                    {he.roles[m.role]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
      {toast && (
        <div class="toast" role="status">
          <CircleCheck size={18} strokeWidth={2} aria-hidden="true" />
          {t.invite.copied}
        </div>
      )}
      <BottomNav current="household" onNavigate={onNavigate} />
    </div>
  );
}
