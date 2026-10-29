import { he } from '../../../locale/he.js';

const t = he.onboarding.card;

export function HouseholdCard({ name, household, chip, done = false }) {
  return (
    <section class="household-card" aria-label={t.label}>
      <span class="household-card-deco" aria-hidden="true" />
      <div class="household-card-top">
        <span class="household-card-label">{t.label}</span>
        <span class={done ? 'household-card-chip' : 'household-card-chip household-card-chip-off'}>
          {chip}
        </span>
      </div>
      <dl class="household-card-grid">
        <div>
          <dt class="household-card-label">{t.myName}</dt>
          <dd class={name ? 'household-card-value' : 'household-card-value household-card-empty'}>
            <bdi>{name || t.empty}</bdi>
          </dd>
        </div>
        <div>
          <dt class="household-card-label">{t.household}</dt>
          <dd
            class={household ? 'household-card-value' : 'household-card-value household-card-empty'}
          >
            <bdi>{household || t.empty}</bdi>
          </dd>
        </div>
      </dl>
    </section>
  );
}
