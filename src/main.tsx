// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { setupIonicReact } from '@ionic/react';

// Ionic Core CSS
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// Initialize Ionic React BEFORE rendering
setupIonicReact();

// Render the app with React 18 API
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

// Load Ionic PWA Elements (if needed)
defineCustomElements(window);
