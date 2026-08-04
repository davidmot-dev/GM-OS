/// <reference types="vite/client" />

/**
 * Version de l'application, injectee au build depuis `package.json`
 * (voir la cle `define` dans vite.config.ts).
 *
 * Source unique de verite : ne jamais coder la version en dur dans un composant,
 * sinon les differents ecrans divergent (c'etait le cas avant le 5 aout 2026,
 * ou le lobby tablette affichait V7.0.4 alors que le reste affichait v6.5.0).
 */
declare const __APP_VERSION__: string
