import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { OverlayPage } from './pages/OverlayPage';
import { detectAppView } from './services/overlayWindow';
import { initTheme } from './services/theme';
import './index.css';

// Theme variables are written to <html> before React renders so neither window
// flashes the default palette on start-up.
initTheme();

// The same bundle backs both windows: the Tauri overlay window opens with
// `?view=overlay` and renders the HUD, everything else renders the dashboard.
const view = detectAppView();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{view === 'overlay' ? <OverlayPage /> : <App />}</React.StrictMode>,
);
