import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from 'zustand';
import { createTrameSlice, type TrameSlice } from '../session/store/trameSlice';
import { useClockStore, type TensionClock } from '../../store/useClockStore';

/**
 * **Une fin de scène coûte ses rations — et une seule fois.**
 *
 * *Portée demandée par David le 2026-09-15 :* une jauge peut déclarer ce qu'une
 * scène lui coûte, et la trame l'applique quand le meneur ferme réellement une
 * scène.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ POURQUOI CES ESSAIS, ET PAS SEULEMENT CEUX DU CALCUL
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `usureDeLaScene` est pure et déjà éprouvée. Ce qui se joue ici est le
 * **branchement**, et c'est là qu'est le risque :
 *
 * 1. ⛔ **L'usure n'est pas idempotente, `terminerLaScene` l'est.** Une scène
 *    déjà close se rend telle quelle — mais sans garde, recliquer « Terminer »
 *    mangerait une seconde ration **en silence**. *Le mode d'échec le plus cher
 *    de ce dépôt est celui qui ne dit rien.*
 * 2. **Le branchement doit être sur la trame, pas sur un second bouton.** Le
 *    panneau des réserves en portait un, écrit le 2026-08-15 sous le commentaire
 *    « rien dans l'application ne sait quand une scène se termine » — vrai ce
 *    jour-là, faux deux jours plus tard. *Deux gestes pour « fin de scène »
 *    garantissent qu'un soir on presse l'un et pas l'autre.*
 */

/** Le journal n'est pas le sujet : on l'écarte pour ne rien mesurer d'autre. */
vi.mock('../journal/useJournalStore', () => ({
    useJournalStore: { getState: () => ({ isRecording: false, addEvent: vi.fn() }) },
}));

const nouveauStore = () => createStore<TrameSlice>()((...a) => createTrameSlice(...a));

const poserLesJauges = (tensions: TensionClock[]) => useClockStore.setState({ tensions });

const jauges = () => useClockStore.getState().tensions;

describe('l’usure des jauges à la fin d’une scène', () => {
    let store: ReturnType<typeof nouveauStore>;
    let sceneId: string;

    beforeEach(() => {
        store = nouveauStore();
        const acteId = store.getState().ajouterActe('c1', 'Acte I');
        sceneId = store.getState().ajouterScene(acteId, 'La traversée');
        store.getState().ouvrirLaScene(sceneId);
        useClockStore.setState({ tensions: [] });
    });

    it('retire son pas à un consommable quand la scène se ferme', () => {
        poserLesJauges([{
            id: 'rations', name: 'Rations', totalSegments: 6, filledSegments: 4,
            sens: 'epuisement', pasParScene: 1,
        }]);

        store.getState().terminerLaScene(sceneId);

        expect(jauges()[0].filledSegments).toBe(3);
    });

    /**
     * ⛔ **Le test qui justifie la garde.** `terminerLaScene` est idempotente ;
     * l'usure ne l'est pas. Sans la garde, ce second appel mangerait une ration
     * de plus sans que rien ne le dise.
     */
    it('ne mange PAS une seconde ration si on referme une scène déjà close', () => {
        poserLesJauges([{
            id: 'rations', name: 'Rations', totalSegments: 6, filledSegments: 4,
            sens: 'epuisement', pasParScene: 1,
        }]);

        store.getState().terminerLaScene(sceneId);
        store.getState().terminerLaScene(sceneId);
        store.getState().terminerLaScene(sceneId);

        expect(jauges()[0].filledSegments).toBe(3);
    });

    it('fait avancer une jauge qui monte, du même nombre', () => {
        poserLesJauges([{
            id: 'rituel', name: 'Rituel', totalSegments: 8, filledSegments: 2, pasParScene: 1,
        }]);

        store.getState().terminerLaScene(sceneId);

        expect(jauges()[0].filledSegments).toBe(3);
    });

    /** Le cas courant : la plupart des tables ne déclareront aucun pas. */
    it('ne touche à rien quand aucune jauge ne déclare de pas', () => {
        const avant = [{ id: 'alerte', name: 'Alerte', totalSegments: 6, filledSegments: 2 }];
        poserLesJauges(avant);

        store.getState().terminerLaScene(sceneId);

        expect(jauges(), 'la liste elle-même ne doit pas être réécrite').toBe(avant);
    });

    it('ne descend jamais sous zéro', () => {
        poserLesJauges([{
            id: 'rations', name: 'Rations', totalSegments: 6, filledSegments: 1,
            sens: 'epuisement', pasParScene: 3,
        }]);

        store.getState().terminerLaScene(sceneId);

        expect(jauges()[0].filledSegments).toBe(0);
    });

    /** Fermer une scène ne doit pas toucher aux jauges des autres campagnes. */
    it('use toutes les jauges déclarées, et elles seules', () => {
        poserLesJauges([
            { id: 'a', name: 'A', totalSegments: 6, filledSegments: 3, pasParScene: 2 },
            { id: 'b', name: 'B', totalSegments: 6, filledSegments: 3 },
            { id: 'c', name: 'C', totalSegments: 6, filledSegments: 3, sens: 'epuisement', pasParScene: 1 },
        ]);

        store.getState().terminerLaScene(sceneId);

        expect(jauges().map(j => j.filledSegments)).toEqual([5, 3, 2]);
    });
});
