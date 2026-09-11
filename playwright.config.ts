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
 * UN SEUL WORKER — ET LA RAISON A CHANGÉ LE 2026-09-11
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ce n'était **pas** un choix de confort : les deux serveurs de GM-OS écoutaient
 * sur des ports fixes, et `SyncServer.listen` n'avait aucun gestionnaire
 * d'erreur — deux instances, et le processus principal mourait. *Lancer GM-OS
 * deux fois le faisait crasher.*
 *
 * ✅ **Les deux sont corrigés.** Le port occupé est désormais rattrapé, et
 * `lancerGmOs` attribue à chaque worker sa propre paire de ports par
 * `TEST_PARALLEL_INDEX`. **Rien n'interdit plus le parallèle.**
 *
 * Il reste à 1 parce qu'un worker = une application Electron complète : c'est la
 * machine qui décide, pas le code. *Monter ce nombre est désormais un réglage,
 * plus une correction à faire.*
 *
 * ⭐ Et GM-OS peut rester ouvert pendant les tests : les ports de test évitent
 * volontairement 3001/3002.
 */
export default defineConfig({
    testDir: './e2e',

    /* Voir l'en-tête : réglable, plus contraint. Une application Electron par
       worker — c'est la machine qui décide. */
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
