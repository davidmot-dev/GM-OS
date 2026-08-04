import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { initConsoleInterceptor } from './stores/useDebugStore'
import { useSessionStore } from './store/useSessionStore'

// Initialiser l'interception des logs console
initConsoleInterceptor();

// Forcer le thème sur l'élément HTML racine immédiatement
const applyTheme = (theme: string) => document.documentElement.setAttribute('data-theme', theme);
applyTheme(useSessionStore.getState().theme);
useSessionStore.subscribe((state) => applyTheme(state.theme));

// Enregistrement de la PWA (uniquement pour le Tablet Hub / Navigateur, pas pour Electron)
if (!window.appBridge && 'serviceWorker' in navigator) {
  // @ts-ignore : virtual module from vite-plugin-pwa
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
    console.log('[PWA] Service Worker registered for Tablet Hub');
  }).catch((err) => {
    console.error('[PWA] Service Worker registration failed', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
