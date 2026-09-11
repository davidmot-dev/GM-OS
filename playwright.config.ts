import { defineConfig } from '@playwright/test';

/**
 * **Les tests de bout en bout — le geste, pas le code.**
 *
 * Demandé par David le 2026-09-11 : *« le but est de tester le geste pas
 * spécialement le code »*. C'est exactement le trou que les 4 120 tests de
 * Vitest ne couvrent pas — ils exercent des fonctions et lisent des sources ;
 * **aucun n'ouvre l'application**. Tous les défauts que David a trouvés ce mois-ci
 * l'ont été à l'écran.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ EXÉCUTION EN SÉRIE, ET CE N'EST PAS UN CHOIX DE CONFORT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * GM-OS ouvre deux serveurs sur des ports fixes — 3001 pour le SyncServer, 3002
 * pour les fiches. Deux instances simultanées se les disputent, et
 * `SyncServer.listen` n'a **aucun gestionnaire d'erreur** : le port occupé émet
 * un `error` non géré qui tue le processus principal.
 *
 * *C'est un vrai défaut de l'application, pas seulement une gêne de test :
 * lancer GM-OS deux fois le fait crasher aujourd'hui.* Tant qu'il n'est pas
 * corrigé et les ports rendus réglables, un seul worker.
 *
 * ⚠️ **Et il faut que GM-OS soit fermé** pour lancer ces tests, pour la même
 * raison.
 */
export default defineConfig({
    testDir: './e2e',

    /* Voir l'en-tête : les ports sont fixes, donc une instance à la fois. */
    workers: 1,
    fullyParallel: false,

    /*
      Electron met quelques secondes à ouvrir sa fenêtre, et le premier rendu
      attend la réhydratation d'IndexedDB. Le délai par défaut de Playwright
      (30 s) suffit, mais l'attente d'une assertion mérite d'être plus généreuse
      qu'en test de navigateur.
    */
    expect: { timeout: 10_000 },

    /* Une capture et une trace **seulement sur échec** : c'est ce qu'on regarde
       pour comprendre un test rouge, et ça ne sert à rien quand il est vert. */
    use: {
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },

    reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-resultats' }]],
});
