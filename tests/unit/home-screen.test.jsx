import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { HomeScreen } from '../../src/presentation/screens/HomeScreen.jsx';

describe('HomeScreen', () => {
  afterEach(cleanup);

  it('renders the single-color title "הרשימה של הבית"', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'הרשימה של הבית' })).toBeTruthy();
  });

  it('renders disabled search and settings round buttons in the top bar', () => {
    render(<HomeScreen />);
    const header = screen.getByRole('banner');
    for (const name of ['חיפוש', 'הגדרות']) {
      expect(within(header).getByRole('button', { name }).disabled).toBe(true);
    }
  });

  it('renders the hero with a ring text equivalent, remaining count and a disabled CTA', () => {
    render(<HomeScreen />);
    const hero = screen.getByRole('region', { name: 'סיכום הרשימה' });
    expect(within(hero).getByRole('img', { name: '5 מתוך 12 נאספו' })).toBeTruthy();
    expect(within(hero).getByText('הקנייה הבאה')).toBeTruthy();
    expect(within(hero).getByText('7 נותרו לאסוף')).toBeTruthy();
    expect(within(hero).getByText('מסונכרן עם כל הבית')).toBeTruthy();
    expect(within(hero).getByRole('button', { name: 'יוצאים לקנות' }).disabled).toBe(true);
  });

  it('renders the store route with 4 stops, the first one done', () => {
    render(<HomeScreen />);
    const route = screen.getByRole('region', { name: 'המסלול בחנות' });
    const stops = within(route).getAllByRole('listitem');
    expect(stops).toHaveLength(4);
    expect(stops[0].classList.contains('stop-done')).toBe(true);
    expect(stops.slice(1).some((s) => s.classList.contains('stop-done'))).toBe(false);
    expect(within(route).getByText('עריכת סדר')).toBeTruthy();
  });

  it('renders 3 shortcut tiles', () => {
    render(<HomeScreen />);
    const shortcuts = screen.getByRole('region', { name: 'קיצורים' });
    const tiles = within(shortcuts).getAllByRole('listitem');
    expect(tiles.map((t) => t.textContent)).toEqual(['הוספה קולית', 'מועדפים', 'קטלוג']);
  });

  it('renders the main nav with "בית" current and a center "הוספת פריט" button', () => {
    render(<HomeScreen />);
    const nav = screen.getByRole('navigation', { name: 'ניווט ראשי' });
    expect(nav.tagName).toBe('NAV');
    const current = nav.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe('בית');
    expect(within(nav).getByRole('button', { name: 'הוספת פריט' }).disabled).toBe(true);
    for (const label of ['רשימה', 'מועדפים']) {
      expect(within(nav).getByText(label).closest('[aria-disabled="true"]')).toBeTruthy();
    }
  });

  it('makes "הבית שלי" active and opens the household screen (Phase 1)', () => {
    const onNavigate = vi.fn();
    render(<HomeScreen onNavigate={onNavigate} />);
    const nav = screen.getByRole('navigation', { name: 'ניווט ראשי' });
    const household = within(nav).getByRole('button', { name: 'הבית שלי' });
    expect(household.closest('[aria-disabled="true"]')).toBeNull();
    fireEvent.click(household);
    expect(onNavigate).toHaveBeenCalledWith('household');
  });

  it('does not render the dropped "חדשים היום" / "בני בית" stats', () => {
    render(<HomeScreen />);
    expect(screen.queryByText(/חדשים היום/)).toBeNull();
    expect(screen.queryByText(/בני בית/)).toBeNull();
  });
});
