import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/preact';

const api = vi.hoisted(() => ({
  createIdentity: vi.fn(),
  updateDisplayName: vi.fn(),
  createHousehold: vi.fn(),
  joinHousehold: vi.fn(),
  createInvite: vi.fn(),
  getContext: vi.fn(),
  getActiveInvite: vi.fn(),
}));

vi.mock('../../src/application/onboarding.js', async (importOriginal) => ({
  ...(await importOriginal()),
  ...api,
}));

const { WelcomeScreen } =
  await import('../../src/presentation/screens/onboarding/WelcomeScreen.jsx');
const { NameScreen } = await import('../../src/presentation/screens/onboarding/NameScreen.jsx');
const { HouseholdStepScreen } =
  await import('../../src/presentation/screens/onboarding/HouseholdStepScreen.jsx');
const { SuccessScreen } =
  await import('../../src/presentation/screens/onboarding/SuccessScreen.jsx');
const { HouseholdScreen } = await import('../../src/presentation/screens/HouseholdScreen.jsx');

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};

const flush = () => act(() => Promise.resolve());

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('WelcomeScreen', () => {
  it('shows the empty household card and starts the flow', () => {
    const onStart = vi.fn();
    render(<WelcomeScreen onStart={onStart} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'בונים את כרטיס הבית שלכם' }),
    ).toBeTruthy();
    const card = screen.getByRole('region', { name: 'כרטיס הבית' });
    expect(within(card).getByText('עוד רגע')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'בואו נתחיל' }));
    expect(onStart).toHaveBeenCalled();
  });
});

describe('T-1.16 NameScreen states (AC-1.10)', () => {
  const renderName = (props = {}) =>
    render(
      <NameScreen
        name=""
        savedName=""
        onNameChange={vi.fn()}
        onBack={vi.fn()}
        onSaved={vi.fn()}
        {...props}
      />,
    );

  it('fills the card live and shows step 1 of 2', () => {
    renderName({ name: 'נועה' });
    const card = screen.getByRole('region', { name: 'כרטיס הבית' });
    expect(within(card).getByText('נועה')).toBeTruthy();
    expect(within(card).getByText('שלב 1 מתוך 2')).toBeTruthy();
  });

  it('shows an inline validation error for an empty name and does not call the server', () => {
    renderName({ name: '   ' });
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));
    expect(screen.getByText('צריך למלא שם.')).toBeTruthy();
    expect(screen.getByLabelText('שם תצוגה').getAttribute('aria-invalid')).toBe('true');
    expect(api.createIdentity).not.toHaveBeenCalled();
  });

  it('shows a spinner and keeps the label while saving, then reports success', async () => {
    const pending = deferred();
    api.createIdentity.mockReturnValue(pending.promise);
    const onSaved = vi.fn();
    renderName({ name: ' נועה ', onSaved });
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));
    const button = screen.getByRole('button', { name: /המשך/ });
    expect(button.disabled).toBe(true);
    expect(within(button).getByRole('status', { name: 'טוען' })).toBeTruthy();
    expect(api.createIdentity).toHaveBeenCalledWith('נועה');
    await act(async () => pending.resolve({ ok: true, data: { display_name: 'נועה' } }));
    expect(onSaved).toHaveBeenCalledWith('נועה');
  });

  it('shows the offline banner', async () => {
    api.createIdentity.mockResolvedValue({ ok: false, code: 'OFFLINE', data: null });
    renderName({ name: 'נועה' });
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));
    await flush();
    expect(screen.getByRole('alert').textContent).toContain('אין חיבור - נסו שוב');
  });
});

describe('T-1.16 HouseholdStepScreen states (AC-1.10)', () => {
  const renderStep = (onDone = vi.fn()) =>
    render(<HouseholdStepScreen name="אבי" onBack={vi.fn()} onDone={onDone} />);

  const switchToCode = () => fireEvent.click(screen.getByRole('radio', { name: /יש לי קוד/ }));

  const typeCode = (value) =>
    fireEvent.input(screen.getByLabelText('קוד (10 תווים)'), { target: { value } });

  it('offers new household and code tiles with step 2 of 2', () => {
    renderStep();
    expect(screen.getByRole('radio', { name: /בית חדש/ }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByText('שלב 2 מתוך 2')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'יצירת הבית' })).toBeTruthy();
  });

  it('validates the household name inline', () => {
    renderStep();
    fireEvent.input(screen.getByLabelText('שם הבית'), { target: { value: 'א'.repeat(41) } });
    fireEvent.click(screen.getByRole('button', { name: 'יצירת הבית' }));
    expect(screen.getByText('עד 40 תווים.')).toBeTruthy();
    expect(api.createHousehold).not.toHaveBeenCalled();
  });

  it('creates the household and passes the result on', async () => {
    const onDone = vi.fn();
    api.createHousehold.mockResolvedValue({
      ok: true,
      data: { household_id: 'h', name: 'משפחת כהן', role: 'manager' },
    });
    renderStep(onDone);
    fireEvent.input(screen.getByLabelText('שם הבית'), { target: { value: ' משפחת כהן ' } });
    expect(screen.getByRole('region', { name: 'כרטיס הבית' }).textContent).toContain('משפחת כהן');
    fireEvent.click(screen.getByRole('button', { name: 'יצירת הבית' }));
    await flush();
    expect(api.createHousehold).toHaveBeenCalledWith('משפחת כהן');
    expect(onDone).toHaveBeenCalledWith({ household_id: 'h', name: 'משפחת כהן', role: 'manager' });
  });

  it('renders the code field LTR with an automatic hyphen', () => {
    renderStep();
    switchToCode();
    const input = screen.getByLabelText('קוד (10 תווים)');
    expect(input.getAttribute('dir')).toBe('ltr');
    expect(input.getAttribute('autocapitalize')).toBe('characters');
    typeCode('k7pm4qx');
    expect(input.value).toBe('K7PM4-QX');
    expect(screen.getByRole('button', { name: 'הצטרפות' })).toBeTruthy();
  });

  it('rejects a short code without calling the server', () => {
    renderStep();
    switchToCode();
    typeCode('K7PM4');
    fireEvent.click(screen.getByRole('button', { name: 'הצטרפות' }));
    expect(screen.getByText('הקוד צריך להכיל 10 תווים.')).toBeTruthy();
    expect(api.joinHousehold).not.toHaveBeenCalled();
  });

  it('shows INVALID_CODE with the attempts left', async () => {
    api.joinHousehold.mockResolvedValue({
      ok: false,
      code: 'INVALID_CODE',
      data: { attempts_left: 3 },
    });
    renderStep();
    switchToCode();
    typeCode('k7pm4-qxd9b');
    fireEvent.click(screen.getByRole('button', { name: 'הצטרפות' }));
    await flush();
    expect(api.joinHousehold).toHaveBeenCalledWith('K7PM4QXD9B');
    expect(screen.getByText('הקוד לא תקין או שפג תוקפו. נשארו 3 ניסיונות.')).toBeTruthy();
  });

  it('shows the LOCKED countdown and disables joining until it ends', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    api.joinHousehold.mockResolvedValue({ ok: false, code: 'LOCKED', data: { retry_after: 900 } });
    renderStep();
    switchToCode();
    typeCode('K7PM4QXD9B');
    fireEvent.click(screen.getByRole('button', { name: 'הצטרפות' }));
    await flush();
    expect(screen.getByRole('status').textContent).toContain('15:00');
    expect(screen.getByRole('button', { name: 'הצטרפות' }).disabled).toBe(true);
    await act(() => vi.advanceTimersByTime(61000));
    expect(screen.getByRole('status').textContent).toContain('13:59');
    await act(() => vi.advanceTimersByTime(900000));
    expect(screen.getByRole('button', { name: 'הצטרפות' }).disabled).toBe(false);
  });

  it('shows the offline banner on join', async () => {
    api.joinHousehold.mockResolvedValue({ ok: false, code: 'OFFLINE', data: null });
    renderStep();
    switchToCode();
    typeCode('K7PM4QXD9B');
    fireEvent.click(screen.getByRole('button', { name: 'הצטרפות' }));
    await flush();
    expect(screen.getByRole('alert').textContent).toContain('אין חיבור - נסו שוב');
  });
});

describe('SuccessScreen', () => {
  it('offers invite and later for a manager', () => {
    const onInvite = vi.fn();
    const onHome = vi.fn();
    render(
      <SuccessScreen
        name="נועה"
        household="משפחת כהן"
        role="manager"
        onInvite={onInvite}
        onHome={onHome}
      />,
    );
    expect(screen.getByRole('heading', { name: 'הבית מוכן' })).toBeTruthy();
    expect(screen.getByText('מנהל/ת')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'להזמנת בני הבית' }));
    fireEvent.click(screen.getByRole('button', { name: 'אחר כך, למסך הבית' }));
    expect(onInvite).toHaveBeenCalled();
    expect(onHome).toHaveBeenCalled();
  });

  it('sends a joiner home with the member role', () => {
    render(<SuccessScreen name="אבי" household="משפחת כהן" role="member" onHome={vi.fn()} />);
    expect(screen.getByText('חבר/ה')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'להזמנת בני הבית' })).toBeNull();
    expect(screen.getByRole('button', { name: 'למסך הבית' })).toBeTruthy();
  });
});

describe('HouseholdScreen', () => {
  const managerContext = {
    bound: true,
    app_user: { id: 'u1', display_name: 'נועה' },
    household: { id: 'h', name: 'משפחת כהן', role: 'manager' },
    members: [
      { display_name: 'נועה', role: 'manager' },
      { display_name: 'אבי', role: 'member' },
    ],
  };

  beforeEach(() => {
    api.getContext.mockResolvedValue({ ok: true, data: managerContext });
    api.getActiveInvite.mockResolvedValue({ ok: true, data: null });
  });

  it('lists members with roles and makes "הבית שלי" current', async () => {
    render(<HouseholdScreen context={managerContext} onNavigate={vi.fn()} />);
    await flush();
    expect(screen.getByRole('heading', { level: 1, name: 'משפחת כהן' })).toBeTruthy();
    const members = within(screen.getByRole('region', { name: 'בני הבית' })).getAllByRole(
      'listitem',
    );
    expect(members.map((m) => m.textContent)).toEqual(['ננועהמנהל/ת', 'אאביחבר/ה']);
    const nav = screen.getByRole('navigation', { name: 'ניווט ראשי' });
    expect(nav.querySelector('[aria-current="page"]').textContent).toBe('הבית שלי');
  });

  it('creates a code, shows it once with its expiry, and copies it', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    api.createInvite.mockResolvedValue({
      ok: true,
      code: 'OK',
      data: { code: 'K7PM4-QXD9R', expires_at: new Date(Date.now() + 3600000).toISOString() },
    });
    render(<HouseholdScreen context={managerContext} onNavigate={vi.fn()} />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'יצירת קוד הזמנה' }));
    await flush();
    const code = screen.getByTestId('invite-code');
    expect(code.textContent).toBe('K7PM4-QXD9R');
    expect(code.getAttribute('dir')).toBe('ltr');
    expect(screen.getByText(/^בתוקף עד/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'העתקה' }));
    await flush();
    expect(writeText).toHaveBeenCalledWith('K7PM4-QXD9R');
    expect(screen.getByText('הקוד הועתק')).toBeTruthy();
  });

  it('does not show an existing code again after leaving the screen', async () => {
    api.getActiveInvite.mockResolvedValue({ ok: true, data: { id: 'i', expires_at: 'x' } });
    render(<HouseholdScreen context={managerContext} onNavigate={vi.fn()} />);
    await flush();
    expect(screen.getByText('הקוד הוצג - צרו קוד חדש כדי לראות שוב')).toBeTruthy();
    expect(screen.queryByTestId('invite-code')).toBeNull();
    expect(screen.getByRole('button', { name: 'קוד חדש' })).toBeTruthy();
  });

  it('hides the invite card from a member', async () => {
    const memberContext = {
      ...managerContext,
      household: { ...managerContext.household, role: 'member' },
    };
    api.getContext.mockResolvedValue({ ok: true, data: memberContext });
    render(<HouseholdScreen context={memberContext} onNavigate={vi.fn()} />);
    await flush();
    expect(screen.queryByRole('region', { name: 'הזמנה לבית' })).toBeNull();
    expect(api.getActiveInvite).not.toHaveBeenCalled();
  });
});
