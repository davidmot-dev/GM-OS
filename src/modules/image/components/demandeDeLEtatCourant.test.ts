import { describe, it, expect } from 'vitest';
import PROJECTEUR from './ProjectorView.tsx?raw';
import PRELOAD from '../../../../electron/preload.ts?raw';
import MAIN from '../../../../electron/main.ts?raw';

/**
 * **Une fenêtre qui s'ouvre demande ce qu'elle doit afficher.**
 *
 * Trouvé par David le 2026-09-06 : *« quand je projette, l'image ne se charge
 * pas »*, sur le bouton de projection d'un lieu ajouté le matin même.
 *
 * ⛔ **Le mécanisme, en deux temps.** Une fenêtre de projection reçoit son image
 * sur `did-finish-load`, c'est-à-dire **avant que React n'ait attaché son
 * écouteur** : *un message émis avant que la fenêtre ne sache écouter est perdu,
 * pas en retard.* C'est mot pour mot la leçon du 02/09 sur le titre projeté, qui
 * avait pour remède `requestCurrentTitle`.
 *
 * L'image avait le même trou — et le processus principal **répondait déjà** à
 * `image:request-current-display`, une demande que **personne ne lui faisait**.
 * *Un récepteur sans émetteur ne lève aucune erreur.*
 *
 * ⚠️ **Ce qui l'a caché des mois durant.** Le projecteur retombait sur le
 * magasin, dont `projections` porte la **marque** — *ce qui occupe l'écran*, pas
 * *où le trouver*. Les deux coïncident pour une image d'Image-OS, et **divergent**
 * pour un lieu ou un PNJ, dont la marque est l'identifiant de la fiche. Le défaut
 * dormait donc derrière une coïncidence, et le premier appelant qui ne la
 * respectait pas l'a réveillé.
 *
 * ⚠️ Ces tests lisent le source. Ils gardent que **les trois maillons existent** —
 * la réponse, le pont, l'appel — pas qu'ils s'enchaînent à l'exécution : monter
 * une vraie fenêtre de projection demanderait Electron.
 */

describe('les trois maillons de la demande', () => {
    it('le processus principal répond à la demande', () => {
        expect(MAIN).toContain("ipcMain.on('image:request-current-display'");
    });

    it('le pont sait la formuler', () => {
        /* C'est le maillon qui manquait : la réponse existait, l'émetteur non. */
        expect(PRELOAD).toContain("ipcRenderer.send('image:request-current-display'");
        expect(PRELOAD).toContain('requestCurrentDisplay');
    });

    it('le projecteur la fait, après avoir posé ses écouteurs', () => {
        /*
          L'ordre compte : demander avant d'écouter, c'est perdre la réponse
          exactement comme on perdait le message d'origine.
        */
        const poseDesEcouteurs = PROJECTEUR.indexOf("on('image:update-display'");
        const demande = PROJECTEUR.indexOf('requestCurrentDisplay');

        expect(poseDesEcouteurs, 'le projecteur écoute `image:update-display`').toBeGreaterThan(-1);
        expect(demande, 'le projecteur demande l’état courant').toBeGreaterThan(-1);
        expect(demande).toBeGreaterThan(poseDesEcouteurs);
    });
});

describe('la même précaution existe pour le titre', () => {
    it('et elle reste en place', () => {
        /*
          Le titre a payé ce défaut le 02/09 et porte son remède depuis. Le garder
          ici évite qu'on le retire un jour en croyant à un doublon : *les deux
          flux arrivent par des messages différents, et se perdent séparément.*
        */
        expect(PRELOAD).toContain("ipcRenderer.send('image:request-current-title'");
        expect(MAIN).toContain("ipcMain.on('image:request-current-title'");
    });
});
