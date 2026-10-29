import { useState } from 'preact/hooks';
import { HouseholdStepScreen } from './HouseholdStepScreen.jsx';
import { NameScreen } from './NameScreen.jsx';
import { SuccessScreen } from './SuccessScreen.jsx';
import { WelcomeScreen } from './WelcomeScreen.jsx';

export function OnboardingFlow({ context, onFinish }) {
  const savedFromContext = context?.app_user?.display_name ?? '';
  const [step, setStep] = useState(context?.bound ? 'household' : 'welcome');
  const [name, setName] = useState(savedFromContext);
  const [savedName, setSavedName] = useState(savedFromContext);
  const [household, setHousehold] = useState(null);

  if (step === 'welcome') return <WelcomeScreen onStart={() => setStep('name')} />;

  if (step === 'name') {
    return (
      <NameScreen
        name={name}
        savedName={savedName}
        onNameChange={setName}
        onBack={() => setStep('welcome')}
        onSaved={(value) => {
          setName(value);
          setSavedName(value);
          setStep('household');
        }}
      />
    );
  }

  if (step === 'household') {
    return (
      <HouseholdStepScreen
        name={savedName}
        onBack={() => setStep('name')}
        onDone={(result) => {
          setHousehold(result);
          setStep('success');
        }}
      />
    );
  }

  return (
    <SuccessScreen
      name={savedName}
      household={household.name}
      role={household.role}
      onInvite={() => onFinish('household')}
      onHome={() => onFinish('home')}
    />
  );
}
