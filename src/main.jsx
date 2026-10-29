import { render } from 'preact';
import './presentation/styles/fonts.css';
import './presentation/styles/tokens.css';
import './presentation/styles/base.css';
import './presentation/styles/onboarding.css';
import { App } from './presentation/App.jsx';

render(<App />, document.getElementById('app'));
