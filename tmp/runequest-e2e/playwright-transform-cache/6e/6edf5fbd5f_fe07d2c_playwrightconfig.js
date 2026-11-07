// cdfbe4eace50b83b931942d07883d3e57a46a2b7
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
  expect: {
    timeout: 10000
  },
  /* Une capture et une trace **seulement sur échec** : c'est ce qu'on regarde
     pour comprendre un test rouge, et ça ne sert à rien quand il est vert. */
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  /* ⛔ **Le rapport HTML VIDE son dossier à chaque lancement.** Posé sur
     `e2e-resultats/` lui-même, il a effacé le 2026-09-29 les 65 captures de la
     vitrine (`e2e-resultats/vitrine/`) et les demandes de `themes-a-reparer/`.
     Il a donc son sous-dossier à lui, où il n'y a rien d'autre à perdre. */
  reporter: [['list'], ['html', {
    open: 'never',
    outputFolder: 'e2e-resultats/rapport'
  }]]
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkZWZpbmVDb25maWciLCJ0ZXN0RGlyIiwid29ya2VycyIsImZ1bGx5UGFyYWxsZWwiLCJleHBlY3QiLCJ0aW1lb3V0IiwidXNlIiwic2NyZWVuc2hvdCIsInRyYWNlIiwicmVwb3J0ZXIiLCJvcGVuIiwib3V0cHV0Rm9sZGVyIl0sInNvdXJjZXMiOlsicGxheXdyaWdodC5jb25maWcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAnQHBsYXl3cmlnaHQvdGVzdCc7XHJcblxyXG4vKipcclxuICogKipMZXMgdGVzdHMgZGUgYm91dCBlbiBib3V0IOKAlCBsZSBnZXN0ZSwgcGFzIGxlIGNvZGUuKipcclxuICpcclxuICogRGVtYW5kw6kgcGFyIERhdmlkIGxlIDIwMjYtMDktMTEgOiAqwqsgbGUgYnV0IGVzdCBkZSB0ZXN0ZXIgbGUgZ2VzdGUgcGFzXHJcbiAqIHNww6ljaWFsZW1lbnQgbGUgY29kZSDCuyouIEMnZXN0IGV4YWN0ZW1lbnQgbGUgdHJvdSBxdWUgbGVzIDQgMTIwIHRlc3RzIGRlXHJcbiAqIFZpdGVzdCBuZSBjb3V2cmVudCBwYXMg4oCUIGlscyBleGVyY2VudCBkZXMgZm9uY3Rpb25zIGV0IGxpc2VudCBkZXMgc291cmNlcyA7XHJcbiAqICoqYXVjdW4gbidvdXZyZSBsJ2FwcGxpY2F0aW9uKiouIFRvdXMgbGVzIGTDqWZhdXRzIHF1ZSBEYXZpZCBhIHRyb3V2w6lzIGNlIG1vaXMtY2lcclxuICogbCdvbnQgw6l0w6kgw6AgbCfDqWNyYW4uXHJcbiAqXHJcbiAqIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxyXG4gKiBVTiBTRVVMIFdPUktFUiDigJQgRVQgTEEgUkFJU09OIEEgQ0hBTkfDiSBMRSAyMDI2LTA5LTExXHJcbiAqIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxyXG4gKlxyXG4gKiBDZSBuJ8OpdGFpdCAqKnBhcyoqIHVuIGNob2l4IGRlIGNvbmZvcnQgOiBsZXMgZGV1eCBzZXJ2ZXVycyBkZSBHTS1PUyDDqWNvdXRhaWVudFxyXG4gKiBzdXIgZGVzIHBvcnRzIGZpeGVzLCBldCBgU3luY1NlcnZlci5saXN0ZW5gIG4nYXZhaXQgYXVjdW4gZ2VzdGlvbm5haXJlXHJcbiAqIGQnZXJyZXVyIOKAlCBkZXV4IGluc3RhbmNlcywgZXQgbGUgcHJvY2Vzc3VzIHByaW5jaXBhbCBtb3VyYWl0LiAqTGFuY2VyIEdNLU9TXHJcbiAqIGRldXggZm9pcyBsZSBmYWlzYWl0IGNyYXNoZXIuKlxyXG4gKlxyXG4gKiDinIUgKipMZXMgZGV1eCBzb250IGNvcnJpZ8Opcy4qKiBMZSBwb3J0IG9jY3Vww6kgZXN0IGTDqXNvcm1haXMgcmF0dHJhcMOpLCBldFxyXG4gKiBgbGFuY2VyR21Pc2AgYXR0cmlidWUgw6AgY2hhcXVlIHdvcmtlciBzYSBwcm9wcmUgcGFpcmUgZGUgcG9ydHMgcGFyXHJcbiAqIGBURVNUX1BBUkFMTEVMX0lOREVYYC4gKipSaWVuIG4naW50ZXJkaXQgcGx1cyBsZSBwYXJhbGzDqGxlLioqXHJcbiAqXHJcbiAqIElsIHJlc3RlIMOgIDEgcGFyY2UgcXUndW4gd29ya2VyID0gdW5lIGFwcGxpY2F0aW9uIEVsZWN0cm9uIGNvbXBsw6h0ZSA6IGMnZXN0IGxhXHJcbiAqIG1hY2hpbmUgcXVpIGTDqWNpZGUsIHBhcyBsZSBjb2RlLiAqTW9udGVyIGNlIG5vbWJyZSBlc3QgZMOpc29ybWFpcyB1biByw6lnbGFnZSxcclxuICogcGx1cyB1bmUgY29ycmVjdGlvbiDDoCBmYWlyZS4qXHJcbiAqXHJcbiAqIOKtkCBFdCBHTS1PUyBwZXV0IHJlc3RlciBvdXZlcnQgcGVuZGFudCBsZXMgdGVzdHMgOiBsZXMgcG9ydHMgZGUgdGVzdCDDqXZpdGVudFxyXG4gKiB2b2xvbnRhaXJlbWVudCAzMDAxLzMwMDIuXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gICAgdGVzdERpcjogJy4vZTJlJyxcclxuXHJcbiAgICAvKiBWb2lyIGwnZW4tdMOqdGUgOiByw6lnbGFibGUsIHBsdXMgY29udHJhaW50LiBVbmUgYXBwbGljYXRpb24gRWxlY3Ryb24gcGFyXHJcbiAgICAgICB3b3JrZXIg4oCUIGMnZXN0IGxhIG1hY2hpbmUgcXVpIGTDqWNpZGUuICovXHJcbiAgICB3b3JrZXJzOiAxLFxyXG4gICAgZnVsbHlQYXJhbGxlbDogZmFsc2UsXHJcblxyXG4gICAgLypcclxuICAgICAgRWxlY3Ryb24gbWV0IHF1ZWxxdWVzIHNlY29uZGVzIMOgIG91dnJpciBzYSBmZW7DqnRyZSwgZXQgbGUgcHJlbWllciByZW5kdVxyXG4gICAgICBhdHRlbmQgbGEgcsOpaHlkcmF0YXRpb24gZCdJbmRleGVkREIuIExlIGTDqWxhaSBwYXIgZMOpZmF1dCBkZSBQbGF5d3JpZ2h0XHJcbiAgICAgICgzMCBzKSBzdWZmaXQsIG1haXMgbCdhdHRlbnRlIGQndW5lIGFzc2VydGlvbiBtw6lyaXRlIGQnw6p0cmUgcGx1cyBnw6luw6lyZXVzZVxyXG4gICAgICBxdSdlbiB0ZXN0IGRlIG5hdmlnYXRldXIuXHJcbiAgICAqL1xyXG4gICAgZXhwZWN0OiB7IHRpbWVvdXQ6IDEwXzAwMCB9LFxyXG5cclxuICAgIC8qIFVuZSBjYXB0dXJlIGV0IHVuZSB0cmFjZSAqKnNldWxlbWVudCBzdXIgw6ljaGVjKiogOiBjJ2VzdCBjZSBxdSdvbiByZWdhcmRlXHJcbiAgICAgICBwb3VyIGNvbXByZW5kcmUgdW4gdGVzdCByb3VnZSwgZXQgw6dhIG5lIHNlcnQgw6AgcmllbiBxdWFuZCBpbCBlc3QgdmVydC4gKi9cclxuICAgIHVzZToge1xyXG4gICAgICAgIHNjcmVlbnNob3Q6ICdvbmx5LW9uLWZhaWx1cmUnLFxyXG4gICAgICAgIHRyYWNlOiAncmV0YWluLW9uLWZhaWx1cmUnLFxyXG4gICAgfSxcclxuXHJcbiAgICAvKiDim5QgKipMZSByYXBwb3J0IEhUTUwgVklERSBzb24gZG9zc2llciDDoCBjaGFxdWUgbGFuY2VtZW50LioqIFBvc8OpIHN1clxyXG4gICAgICAgYGUyZS1yZXN1bHRhdHMvYCBsdWktbcOqbWUsIGlsIGEgZWZmYWPDqSBsZSAyMDI2LTA5LTI5IGxlcyA2NSBjYXB0dXJlcyBkZSBsYVxyXG4gICAgICAgdml0cmluZSAoYGUyZS1yZXN1bHRhdHMvdml0cmluZS9gKSBldCBsZXMgZGVtYW5kZXMgZGUgYHRoZW1lcy1hLXJlcGFyZXIvYC5cclxuICAgICAgIElsIGEgZG9uYyBzb24gc291cy1kb3NzaWVyIMOgIGx1aSwgb8O5IGlsIG4neSBhIHJpZW4gZCdhdXRyZSDDoCBwZXJkcmUuICovXHJcbiAgICByZXBvcnRlcjogW1snbGlzdCddLCBbJ2h0bWwnLCB7IG9wZW46ICduZXZlcicsIG91dHB1dEZvbGRlcjogJ2UyZS1yZXN1bHRhdHMvcmFwcG9ydCcgfV1dLFxyXG59KTtcclxuIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUFTQSxZQUFZLFFBQVEsa0JBQWtCOztBQUUvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZUEsWUFBWSxDQUFDO0VBQ3hCQyxPQUFPLEVBQUUsT0FBTztFQUVoQjtBQUNKO0VBQ0lDLE9BQU8sRUFBRSxDQUFDO0VBQ1ZDLGFBQWEsRUFBRSxLQUFLO0VBRXBCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNJQyxNQUFNLEVBQUU7SUFBRUMsT0FBTyxFQUFFO0VBQU8sQ0FBQztFQUUzQjtBQUNKO0VBQ0lDLEdBQUcsRUFBRTtJQUNEQyxVQUFVLEVBQUUsaUJBQWlCO0lBQzdCQyxLQUFLLEVBQUU7RUFDWCxDQUFDO0VBRUQ7QUFDSjtBQUNBO0FBQ0E7RUFDSUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtJQUFFQyxJQUFJLEVBQUUsT0FBTztJQUFFQyxZQUFZLEVBQUU7RUFBd0IsQ0FBQyxDQUFDO0FBQzNGLENBQUMsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==