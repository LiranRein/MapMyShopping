import { useCallback, useEffect, useState } from 'preact/hooks';
import { loadAppState } from '../security/session.js';
import { errorMessage } from '../application/onboarding.js';
import { he } from '../locale/he.js';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { HouseholdScreen } from './screens/HouseholdScreen.jsx';
import { Banner } from './screens/onboarding/CtaButton.jsx';
import { OnboardingFlow } from './screens/onboarding/OnboardingFlow.jsx';

export function App() {
  const [app, setApp] = useState({ status: 'loading' });
  const [screen, setScreen] = useState('home');

  const load = useCallback(async () => {
    setApp({ status: 'loading' });
    const res = await loadAppState();
    setApp(res.ok ? { status: 'ready', ...res } : { status: 'error', code: res.code });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (app.status === 'loading') {
    return (
      <main class="boot" aria-busy="true">
        <span class="spinner spinner-large" role="status" aria-label={he.common.loading} />
      </main>
    );
  }

  if (app.status === 'error') {
    return (
      <main class="onboarding">
        <Banner>
          {he.boot.error} {errorMessage(app.code)}
        </Banner>
        <button type="button" class="ghost-button" onClick={load}>
          {he.common.retry}
        </button>
      </main>
    );
  }

  if (app.state !== 'member') {
    return (
      <OnboardingFlow
        context={app.context}
        onFinish={async (target) => {
          setScreen(target);
          await load();
        }}
      />
    );
  }

  if (screen === 'household') {
    return <HouseholdScreen context={app.context} onNavigate={setScreen} />;
  }
  return <HomeScreen onNavigate={setScreen} />;
}
