import { he } from '../../../locale/he.js';
import { CtaButton } from './CtaButton.jsx';
import { HouseholdCard } from './HouseholdCard.jsx';

const t = he.onboarding.success;

export function SuccessScreen({ name, household, role, onInvite, onHome }) {
  const manager = role === 'manager';
  return (
    <main class="onboarding onboarding-success">
      <div class="onboarding-card-slot">
        <HouseholdCard name={name} household={household} chip={he.roles[role]} done />
      </div>
      <h1 class="title onboarding-title">{manager ? t.createdTitle : t.joinedTitle}</h1>
      <p class="onboarding-lead">{manager ? t.createdLead : t.joinedLead}</p>
      <div class="onboarding-spacer" />
      {manager ? (
        <>
          <CtaButton label={t.inviteCta} onClick={onInvite} />
          <button type="button" class="ghost-button" onClick={onHome}>
            {t.later}
          </button>
        </>
      ) : (
        <CtaButton label={t.homeCta} onClick={onHome} />
      )}
    </main>
  );
}
