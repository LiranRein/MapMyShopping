import { Route, UsersRound } from 'lucide-preact';
import { he } from '../../../locale/he.js';
import { CtaButton } from './CtaButton.jsx';
import { HouseholdCard } from './HouseholdCard.jsx';

const t = he.onboarding.welcome;

export function WelcomeScreen({ onStart }) {
  return (
    <main class="onboarding">
      <p class="eyebrow">{t.eyebrow}</p>
      <h1 class="title onboarding-title">{t.title}</h1>
      <p class="onboarding-lead">{t.lead}</p>
      <div class="onboarding-card-slot">
        <HouseholdCard chip={he.onboarding.card.soon} />
      </div>
      <ul class="feature-tiles">
        <li class="feature-tile">
          <span class="feature-tile-icon">
            <UsersRound size={20} strokeWidth={2} aria-hidden="true" />
          </span>
          {t.everyoneAdds}
          <small>{t.everyoneAddsHint}</small>
        </li>
        <li class="feature-tile">
          <span class="feature-tile-icon">
            <Route size={20} strokeWidth={2} aria-hidden="true" />
          </span>
          {t.oneShops}
          <small>{t.oneShopsHint}</small>
        </li>
      </ul>
      <div class="onboarding-spacer" />
      <CtaButton label={t.cta} onClick={onStart} />
    </main>
  );
}
