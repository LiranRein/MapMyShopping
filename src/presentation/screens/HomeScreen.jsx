import {
  ArrowLeft,
  Check,
  ChevronLeft,
  CircleCheck,
  House,
  LayoutGrid,
  ListChecks,
  Mic,
  Plus,
  Search,
  Settings,
  Star,
  UserRound,
} from 'lucide-preact';
import { he } from '../../locale/he.js';
import { homePlaceholderData as data } from './homePlaceholderData.js';

const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const SHORTCUTS = [
  { id: 'voice', label: he.home.shortcuts.voice, Icon: Mic },
  { id: 'favorites', label: he.home.shortcuts.favorites, Icon: Star },
  { id: 'catalog', label: he.home.shortcuts.catalog, Icon: LayoutGrid },
];

const NAV_START = [
  { id: 'home', label: he.nav.home, Icon: House, current: true },
  { id: 'list', label: he.nav.list, Icon: ListChecks },
];

const NAV_END = [
  { id: 'favorites', label: he.nav.favorites, Icon: Star },
  { id: 'household', label: he.nav.household, Icon: UserRound },
];

function NavItem({ id, label, Icon, current }) {
  const content = (
    <>
      <Icon size={22} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </>
  );
  return current ? (
    <a href="/" class="nav-item" aria-current="page" data-nav={id}>
      {content}
    </a>
  ) : (
    <span class="nav-item" aria-disabled="true" data-nav={id}>
      {content}
    </span>
  );
}

export function HomeScreen() {
  const { totalItems, collectedItems, areaCount, routeStops } = data;
  const ringFill = (collectedItems / totalItems) * RING_CIRCUMFERENCE;

  return (
    <div class="screen">
      <div class="page">
        <header class="top-bar">
          <div>
            <p class="eyebrow">{data.dateEyebrow}</p>
            <h1 class="title">{he.home.title}</h1>
          </div>
          <div class="top-bar-actions">
            <button type="button" class="round-button" aria-label={he.home.actions.search} disabled>
              <Search size={21} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              class="round-button"
              aria-label={he.home.actions.settings}
              disabled
            >
              <Settings size={21} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main>
          <section class="hero" aria-label={he.home.hero.label}>
            <div class="hero-top">
              <div
                class="ring"
                role="img"
                aria-label={he.home.hero.ringAria(collectedItems, totalItems)}
              >
                <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
                  <circle class="ring-track" cx="48" cy="48" r={RING_RADIUS} />
                  <circle
                    class="ring-fill"
                    cx="48"
                    cy="48"
                    r={RING_RADIUS}
                    stroke-dasharray={`${ringFill} ${RING_CIRCUMFERENCE}`}
                    transform="rotate(-90 48 48)"
                  />
                </svg>
                <span class="ring-label" aria-hidden="true">
                  <bdi class="ring-number">
                    {collectedItems}/{totalItems}
                  </bdi>
                  <span class="ring-caption">{he.home.hero.ringCaption}</span>
                </span>
              </div>
              <div class="hero-text">
                <p class="hero-label">{he.home.hero.nextShop}</p>
                <p class="hero-number">
                  {he.home.hero.items(totalItems)}
                  <br />
                  {he.home.hero.areas(areaCount)}
                </p>
                <p class="hero-remaining">{he.home.hero.remaining(totalItems - collectedItems)}</p>
                <p class="hero-sync">
                  <CircleCheck size={15} strokeWidth={2} aria-hidden="true" />
                  {he.home.hero.synced}
                </p>
              </div>
            </div>
            <button type="button" class="cta" disabled>
              {he.home.hero.cta}
              <span class="cta-arrow">
                <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
              </span>
            </button>
          </section>

          <section class="section" aria-labelledby="route-title">
            <div class="section-head">
              <h2 id="route-title">{he.home.route.title}</h2>
              <span class="section-link" aria-disabled="true">
                {he.home.route.edit}
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              </span>
            </div>
            <ol class="route">
              {routeStops.map(({ id, name, preview, collected, total }, i) => {
                const done = collected === total;
                return (
                  <li key={id} class={done ? 'stop stop-done' : 'stop'} data-stop={id}>
                    <span class="stop-step">
                      {done ? (
                        <Check size={18} strokeWidth={2} aria-label={he.home.route.done} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span class="stop-text">
                      <span class="stop-name">{name}</span>
                      <span class="stop-items">{preview}</span>
                    </span>
                    <span class="stop-count">
                      <bdi>
                        {collected}/{total}
                      </bdi>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section class="section" aria-labelledby="shortcuts-title">
            <div class="section-head">
              <h2 id="shortcuts-title">{he.home.shortcuts.title}</h2>
            </div>
            <ul class="tiles">
              {SHORTCUTS.map(({ id, label, Icon }) => (
                <li key={id} class="tile" aria-disabled="true" data-tile={id}>
                  <span class="tile-icon">
                    <Icon size={20} strokeWidth={2} aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      <nav class="bottom-nav" aria-label={he.nav.label}>
        {NAV_START.map((item) => (
          <NavItem key={item.id} {...item} />
        ))}
        <button type="button" class="nav-add" aria-label={he.nav.add} disabled>
          <Plus size={28} strokeWidth={2} aria-hidden="true" />
        </button>
        {NAV_END.map((item) => (
          <NavItem key={item.id} {...item} />
        ))}
      </nav>
    </div>
  );
}
