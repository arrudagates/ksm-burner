/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import App from './App';

import { HopeProvider, HopeThemeConfig } from '@hope-ui/solid';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

const config: HopeThemeConfig = {
    initialColorMode: "dark",
    darkTheme: {
        colors: {
            neutral9: "white",
            neutral7: "white",
            primary9: "black",
            primary10: "red",
        }
    },
}

render(() => <HopeProvider config={config}><App /></HopeProvider>, root!);
