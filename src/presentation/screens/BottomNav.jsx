import { House, ListChecks, Plus, Star, UserRound } from 'lucide-preact';
import { he } from '../../locale/he.js';

const NAV_START = [
  { id: 'home', label: he.nav.home, Icon: House, enabled: true },
  { id: 'list', label: he.nav.list, Icon: ListChecks },
];

const NAV_END = [
  { id: 'favorites', label: he.nav.favorites, Icon: Star },
  { id: 'household', label: he.nav.household, Icon: UserRound, enabled: true },
];

function NavItem({ id, label, Icon, enabled, current, onNavigate }) {
  const content = (
    <>
      <Icon size={22} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </>
  );
  if (current) {
    return id === 'home' ? (
      <a href="/" class="nav-item" aria-current="page" data-nav={id}>
        {content}
      </a>
    ) : (
      <span class="nav-item" aria-current="page" data-nav={id}>
        {content}
      </span>
    );
  }
  if (enabled && onNavigate) {
    return (
      <button type="button" class="nav-item" data-nav={id} onClick={() => onNavigate(id)}>
        {content}
      </button>
    );
  }
  return (
    <span class="nav-item" aria-disabled="true" data-nav={id}>
      {content}
    </span>
  );
}

export function BottomNav({ current, onNavigate }) {
  const item = (props) => (
    <NavItem key={props.id} {...props} current={props.id === current} onNavigate={onNavigate} />
  );
  return (
    <nav class="bottom-nav" aria-label={he.nav.label}>
      {NAV_START.map(item)}
      <button type="button" class="nav-add" aria-label={he.nav.add} disabled>
        <Plus size={28} strokeWidth={2} aria-hidden="true" />
      </button>
      {NAV_END.map(item)}
    </nav>
  );
}
