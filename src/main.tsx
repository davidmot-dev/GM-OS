import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { initConsoleInterceptor } from './stores/useDebugStore'
import { useSessionStore } from './store/useSessionStore'
import { appliquerLeTheme } from './theme/themeDeLInterface'

// Initialiser l'interception des logs console
initConsoleInterceptor();

/*
  **Le thème s'applique ici, et nulle part ailleurs.**

  Avant, ils étaient deux : cette ligne posait `data-theme`, et un effet de
  `Shell` reposait l'attribut PLUS cinq variables en style inline. Le style
  inline de `Shell` battait toute règle de feuille — donc la table CSS des
  thèmes n'était lue que pour la moitié qu'il ne réécrivait pas, et **aucune
  CSS de thème ne pouvait plus rien dire** sur les couleurs ni sur la police.

  Au plus tôt, avant le premier rendu, pour qu'aucune image ne passe par le
  thème par défaut avant de basculer sur le bon.
*/
const etat = useSessionStore.getState();
appliquerLeTheme(etat.theme, etat.themeColor);

/*
  **Une seule fois ici, et c'est délibéré.** La suite appartient à
  `useThemeDuJeu` (monté par `App`), qui applique le même arbitre en y ajoutant
  la peau du jeu de la campagne ouverte.

  Un abonnement au store à cet endroit repeindrait SANS les jetons du jeu à
  chaque changement d'accent, puis le hook les remettrait — l'interface
  clignoterait entre les deux. *Deux appelants du même arbitre valent mieux
  qu'un seul mal informé, à condition qu'un seul suive les changements.*
*/

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
