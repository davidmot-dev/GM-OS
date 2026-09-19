import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tuilesDurables, CHAMPS_DURABLES_LUMIERE } from '../../light/logic/donneesDurables';
import { construireLaSauvegarde } from '../../../store/SessionService';
import { useLightStore } from '../../light/useLightStore';

/**
 * Ce que ces tests protègent : **ce qui entre dans la sauvegarde est ce qui
 * l'arme.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE PIÈGE, PAYÉ DEUX FOIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Light-OS et Sound-OS sont entrés dans la charge utile le 2026-09-19. Ça ne
 * suffisait pas : **seul `useSessionOSStore` armait la sauvegarde**. Capturer
 * une tuile ou ranger seize pads n'écrivait donc rien — il fallait toucher par
 * ailleurs à sa campagne, ou fermer l'application.
 *
 * *C'est le même piège que `databases/` le 15/09 : on vérifie ce qui entre dans
 * le fichier, on oublie de vérifier qui appuie sur le bouton.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ ET L'ERREUR SYMÉTRIQUE, QUI SERAIT PIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * S'abonner au magasin **entier** paraîtrait plus sûr. Ce serait l'inverse :
 * `useLightStore` change à chaque battement d'effet, et armer relâche **deux
 * minutes de repos** avant d'écrire. Un abonnement large remettrait le compteur
 * à zéro en permanence, et la sauvegarde ne partirait **plus jamais** pendant
 * une séance. *Un déclencheur trop sensible ne déclenche rien.*
 */

const LAMPE = { '1': { id: '1', name: 'L1', type: 'Color', state: { on: true, bri: 200 } } };

beforeEach(() => {
    useLightStore.getState().reset();
});

describe('les champs qui arment la sauvegarde de Light-OS', () => {
    /**
     * ⛔ **La garde contre deux listes.** Une liste pour construire la charge,
     * une pour armer : recopiées à la main, elles divergent — et l'écart est
     * muet dans les deux sens.
     */
    it('sont exactement ceux que la sauvegarde emporte', () => {
        const { light } = construireLaSauvegarde().modules;

        expect(Object.keys(light!).sort()).toEqual([...CHAMPS_DURABLES_LUMIERE].sort());
    });

    it('et la charge utile lit la même fonction que l’abonnement', () => {
        useLightStore.getState().saveSceneSnapshot('SCENE_01', LAMPE);

        const { light } = construireLaSauvegarde().modules;
        const durables = tuilesDurables(useLightStore.getState());

        expect(light!.scenes, 'la charge et l’abonnement ne lisent pas la même chose')
            .toBe(durables.scenes);
    });
});

/**
 * L'abonnement lui-même vit dans `session/store/index.ts`, au milieu du
 * magasin : on l'éprouve ici par sa **condition**, qui est pure — *les
 * références ont-elles bougé ?*
 */
describe('ce qui doit armer, et ce qui ne doit pas', () => {
    const aArme = (action: () => void) => {
        const avant = tuilesDurables(useLightStore.getState());
        action();
        const apres = tuilesDurables(useLightStore.getState());
        return CHAMPS_DURABLES_LUMIERE.some(champ => apres[champ] !== avant[champ]);
    };

    it('capturer une tuile arme', () => {
        expect(aArme(() => useLightStore.getState().saveSceneSnapshot('SCENE_01', LAMPE))).toBe(true);
    });

    it('rattacher une tuile à une campagne arme', () => {
        expect(aArme(() => useLightStore.getState().assignerLaTuile('SCENE_01', 'camp-a'))).toBe(true);
    });

    it('désigner l’éclairage normal arme', () => {
        useLightStore.getState().saveSceneSnapshot('SCENE_01', LAMPE);
        expect(aArme(() => useLightStore.getState().setDefaultScene('SCENE_01'))).toBe(true);
    });

    it('créer une ambiance arme', () => {
        expect(aArme(() => useLightStore.getState().creerUneVariante('candle', 'Bougie'))).toBe(true);
    });

    it('effacer une tuile arme', () => {
        useLightStore.getState().saveSceneSnapshot('SCENE_01', LAMPE);
        expect(aArme(() => useLightStore.getState().clearScene('SCENE_01'))).toBe(true);
    });

    /**
     * ⚠️ **Le cas qui compte le plus.** Ce que le pont rapporte change dix fois
     * par seconde sous un effet. S'il armait, les deux minutes de repos ne
     * seraient jamais atteintes et **plus aucune sauvegarde ne partirait
     * pendant une séance.**
     */
    it('l’état des lampes venu du pont n’arme PAS', () => {
        expect(
            aArme(() => useLightStore.getState().setLights({
                '1': { id: '1', name: 'L1', type: 'Color', state: { on: true, bri: 42 } },
            })),
            'le battement d’un effet remettrait le compteur à zéro en permanence',
        ).toBe(false);
    });

    it('le curseur global n’arme pas : il décrit la pièce, pas l’univers', () => {
        expect(aArme(() => useLightStore.getState().setGlobalBrightness(50))).toBe(false);
    });

    it('la synchro des modules n’arme pas non plus', () => {
        expect(aArme(() => useLightStore.getState().setSyncEnabled(false))).toBe(false);
    });

    it('et garnir un râtelier déjà plein n’arme rien', () => {
        useLightStore.getState().garnirLeRatelier(null);
        expect(
            aArme(() => useLightStore.getState().garnirLeRatelier(null)),
            'une ouverture d’écran écrirait une sauvegarde pour rien',
        ).toBe(false);
    });
});

/* Un garde-fou muet : l'abonnement ne doit pas exploser si le magasin est neuf. */
describe('la robustesse de la condition', () => {
    it('ne bronche pas sur un magasin qui vient d’être remis à zéro', () => {
        const lire = vi.fn(() => tuilesDurables(useLightStore.getState()));
        useLightStore.getState().reset();

        expect(() => lire()).not.toThrow();
        expect(lire().defaultSceneId).toBeNull();
    });
});
