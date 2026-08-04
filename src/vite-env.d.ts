/// <reference types="vite/client" />

/**
 * Version de l'application, injectee au build depuis `package.json`
 * (voir la cle `define` dans vite.config.ts).
 *
 * Cette branche est la serie 7.x (Tauri). Ne jamais coder la version en dur
 * dans un composant : avant le 5 aout 2026, l'interface affichait "v6.5.0"
 * alors que le package.json de la branche etait deja en 7.0.0.
 */
declare const __APP_VERSION__: string
