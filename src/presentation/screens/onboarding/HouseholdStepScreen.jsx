import { CircleAlert, HousePlus, KeyRound, LockKeyhole, WifiOff } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import {
  NAME_MAX_LENGTH,
  createHousehold,
  errorMessage,
  formatCodeInput,
  formatCountdown,
  joinHousehold,
  normalizeInviteCode,
  validateName,
} from '../../../application/onboarding.js';
import { he } from '../../../locale/he.js';
import { BackButton, Banner, CtaButton } from './CtaButton.jsx';
import { HouseholdCard } from './HouseholdCard.jsx';

const t = he.onboarding.household;

function useCountdown(until) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);
  return until ? Math.max(0, (until - now) / 1000) : 0;
}

function ChoiceTile({ selected, Icon, label, hint, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected ? 'true' : 'false'}
      class={selected ? 'choice-tile choice-tile-selected' : 'choice-tile'}
      onClick={onSelect}
    >
      <span class="feature-tile-icon">
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
      </span>
      {label}
      <small>{hint}</small>
    </button>
  );
}

export function HouseholdStepScreen({ name, onBack, onDone }) {
  const [mode, setMode] = useState('new');
  const [householdName, setHouseholdName] = useState('');
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [loading, setLoading] = useState(false);
  const remaining = useCountdown(lockedUntil);
  const locked = mode === 'code' && remaining > 0;

  const choose = (next) => {
    setMode(next);
    setFieldError(null);
    setServerError(null);
  };

  const validate = () => {
    if (mode === 'new') {
      const result = validateName(householdName);
      setFieldError(result.ok ? null : he.onboarding.validation[result.error]);
      return result.ok ? result.value : null;
    }
    const normalized = normalizeInviteCode(code);
    setFieldError(normalized ? null : he.onboarding.validation.code);
    return normalized;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (locked) return;
    const value = validate();
    if (!value) return;
    setLoading(true);
    setServerError(null);
    const res = mode === 'new' ? await createHousehold(value) : await joinHousehold(value);
    setLoading(false);
    if (res.ok) {
      onDone(res.data);
      return;
    }
    if (res.code === 'LOCKED') {
      setLockedUntil(Date.now() + res.data.retry_after * 1000);
      return;
    }
    if (res.code === 'INVALID_CODE') {
      setFieldError(errorMessage(res.code, res.data));
      return;
    }
    setServerError({ code: res.code, message: errorMessage(res.code, res.data) });
  };

  const inputId = mode === 'new' ? 'household-name' : 'invite-code';
  const describedBy = fieldError ? `${inputId}-error` : mode === 'code' ? `${inputId}-helper` : '';

  return (
    <form class="onboarding" onSubmit={submit} noValidate>
      <BackButton onClick={onBack} />
      <div class="onboarding-card-slot onboarding-card-slot-tight">
        <HouseholdCard
          name={name}
          household={mode === 'new' ? householdName.trim() : ''}
          chip={he.onboarding.card.step(2)}
        />
      </div>
      <h2 class="onboarding-heading">{t.title}</h2>
      <div class="choice-tiles" role="radiogroup" aria-label={t.choiceLabel}>
        <ChoiceTile
          selected={mode === 'new'}
          Icon={HousePlus}
          label={t.newTile}
          hint={t.newHint}
          onSelect={() => choose('new')}
        />
        <ChoiceTile
          selected={mode === 'code'}
          Icon={KeyRound}
          label={t.codeTile}
          hint={t.codeHint}
          onSelect={() => choose('code')}
        />
      </div>

      <label class="field-label" for={inputId}>
        {mode === 'new' ? t.nameLabel : t.codeLabel}
      </label>
      {mode === 'new' ? (
        <input
          id={inputId}
          key={inputId}
          class={fieldError ? 'field field-invalid' : 'field'}
          type="text"
          maxLength={NAME_MAX_LENGTH + 10}
          value={householdName}
          aria-invalid={fieldError ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          onInput={(e) => setHouseholdName(e.currentTarget.value)}
          onBlur={() => householdName && validate()}
        />
      ) : (
        <input
          id={inputId}
          key={inputId}
          class={fieldError ? 'field field-code field-invalid' : 'field field-code'}
          type="text"
          dir="ltr"
          inputMode="text"
          autocapitalize="characters"
          autocomplete="off"
          spellcheck={false}
          value={code}
          disabled={locked}
          aria-invalid={fieldError ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          onInput={(e) => setCode(formatCodeInput(e.currentTarget.value))}
          onBlur={() => code && validate()}
        />
      )}
      {fieldError && (
        <p id={`${inputId}-error`} class="field-error" aria-live="polite">
          <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />
          {fieldError}
        </p>
      )}
      {mode === 'code' && (
        <p id={`${inputId}-helper`} class="field-helper">
          {t.codeHelper}
        </p>
      )}
      {locked && (
        <Banner kind="warning">
          <LockKeyhole size={18} strokeWidth={2} aria-hidden="true" />
          <span>{he.onboarding.locked(formatCountdown(remaining))}</span>
        </Banner>
      )}
      {serverError && (
        <Banner>
          {serverError.code === 'OFFLINE' && (
            <WifiOff size={18} strokeWidth={2} aria-hidden="true" />
          )}
          <span>{serverError.message}</span>
        </Banner>
      )}
      <div class="onboarding-spacer" />
      <CtaButton
        type="submit"
        label={mode === 'new' ? t.createCta : t.joinCta}
        loading={loading}
        disabled={locked}
      />
    </form>
  );
}
