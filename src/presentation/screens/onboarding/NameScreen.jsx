import { CircleAlert } from 'lucide-preact';
import { useState } from 'preact/hooks';
import {
  NAME_MAX_LENGTH,
  createIdentity,
  errorMessage,
  updateDisplayName,
  validateName,
} from '../../../application/onboarding.js';
import { he } from '../../../locale/he.js';
import { BackButton, Banner, CtaButton } from './CtaButton.jsx';
import { HouseholdCard } from './HouseholdCard.jsx';

const t = he.onboarding.name;

export function NameScreen({ name, savedName, onNameChange, onBack, onSaved }) {
  const [fieldError, setFieldError] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const result = validateName(name);
    setFieldError(result.ok ? null : he.onboarding.validation[result.error]);
    return result;
  };

  const submit = async (event) => {
    event.preventDefault();
    const result = validate();
    if (!result.ok) return;
    if (savedName === result.value) {
      onSaved(result.value);
      return;
    }
    setLoading(true);
    setServerError(null);
    const res = savedName
      ? await updateDisplayName(result.value)
      : await createIdentity(result.value);
    setLoading(false);
    if (res.ok) {
      onSaved(res.data.display_name);
    } else {
      setServerError(errorMessage(res.code, res.data));
    }
  };

  return (
    <form class="onboarding" onSubmit={submit} noValidate>
      <BackButton onClick={onBack} />
      <div class="onboarding-card-slot onboarding-card-slot-tight">
        <HouseholdCard name={name.trim()} chip={he.onboarding.card.step(1)} />
      </div>
      <h2 class="onboarding-heading">{t.title}</h2>
      <label class="field-label" for="display-name">
        {t.label}
      </label>
      <input
        id="display-name"
        class={fieldError ? 'field field-invalid' : 'field'}
        type="text"
        autocomplete="nickname"
        maxLength={NAME_MAX_LENGTH + 10}
        value={name}
        aria-invalid={fieldError ? 'true' : undefined}
        aria-describedby={fieldError ? 'display-name-error' : 'display-name-helper'}
        onInput={(e) => onNameChange(e.currentTarget.value)}
        onBlur={() => name && validate()}
      />
      {fieldError ? (
        <p id="display-name-error" class="field-error" aria-live="polite">
          <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />
          {fieldError}
        </p>
      ) : (
        <p id="display-name-helper" class="field-helper">
          {t.helper}
        </p>
      )}
      {serverError && <Banner>{serverError}</Banner>}
      <div class="onboarding-spacer" />
      <CtaButton type="submit" label={t.cta} loading={loading} />
    </form>
  );
}
