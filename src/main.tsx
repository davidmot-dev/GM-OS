import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initConsoleInterceptor } from './stores/useDebugStore'
import { useSessionStore } from './store/useSessionStore'

// Initialiser l'interception des logs console
initConsoleInterceptor();

// Forcer le thème sur l'élément HTML racine immédiatement
const applyTheme = (theme: string) => document.documentElement.setAttribute('data-theme', theme);
applyTheme(useSessionStore.getState().theme);
useSessionStore.subscribe((state) => applyTheme(state.theme));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
