import { describe, it, expect } from 'vitest';
import {
    DUREE_DE_DISPARITION_MS,
    DUREE_DE_MAINTIEN_MS,
    DUREE_DU_RESULTAT_MS,
    dureeTotaleDuJet,
    PLAFOND_DE_CHUTE_MS,
} from './choregraphieDuJet';
import SCENE from '../DiceBox3D.tsx?raw';
import HUB from '../../../components/PlayerHub.tsx?raw';

/**
 * **Ce que ces essais protègent : un joueur a cinq secondes pour lire son jet,
 * et il les a APRÈS que les dés se soient posés.**
 *
 * ⛔ Demande de David le 2026-09-17 : *« les dés doivent disparaître et le
 * résultat doit rester affiché 5 secondes supplémentaires après »*.
 *
 * L'ancien déroulé n'avait **qu'une** durée — tout disparaissait cinq secondes
 * après le lancer. Or le panneau n'apparaît qu'au bout de 1,5 s quand la 3D est
 * active : *il restait trois secondes et demie pour lire*, pendant que les dés
 * roulaient par-dessus.
 *
 * Ces essais gardent les valeurs déclarées et le branchement de la scène.
 * Les échéances et le réarmement sont exercés à horloge pilotée dans
 * `useDerouleDuJet.test.tsx`, plutôt que par des recherches dans le code des effets.
 */

describe('les durées du déroulé', () => {
    it('le résultat reste cinq secondes, comme demandé', () => {
        expect(DUREE_DU_RESULTAT_MS).toBe(5000);
    });

    /** *Un dé qui micro-rebondit ne doit pas retenir le résultat en otage.* */
    it('la chute a un plafond, et il est plus court que le résultat', () => {
        expect(PLAFOND_DE_CHUTE_MS).toBeGreaterThan(0);
        expect(PLAFOND_DE_CHUTE_MS).toBeLessThan(DUREE_DU_RESULTAT_MS);
    });

    /** Le fondu de sortie des dés doit tenir dans le temps du résultat. */
    it('la disparition des dés tient dans la fenêtre du résultat', () => {
        expect(DUREE_DE_DISPARITION_MS).toBeLessThan(DUREE_DU_RESULTAT_MS);
    });

    /** *Se poser et disparaître dans le même instant ne laisse pas voir ce qu'on vient de lancer.* */
    it('les dés restent deux secondes posés, comme demandé', () => {
        expect(DUREE_DE_MAINTIEN_MS).toBe(2000);
    });

    it('la durée totale se lit en une ligne', () => {
        expect(dureeTotaleDuJet(2500))
            .toBe(2500 + DUREE_DE_MAINTIEN_MS + DUREE_DU_RESULTAT_MS);
    });

    /** ⛔ Une chute interminable ne rallonge pas l'affichage au-delà du plafond. */
    it('borne une chute qui n’en finirait pas', () => {
        expect(dureeTotaleDuJet(60_000))
            .toBe(PLAFOND_DE_CHUTE_MS + DUREE_DE_MAINTIEN_MS + DUREE_DU_RESULTAT_MS);
    });
});

/**
 * ⭐ **Le branchement, que les constantes seules ne prouvent pas.**
 *
 * *Une durée déclarée et non branchée est une durée absente* — la leçon des
 * quatre étages de l'Oracle, écrits et inatteignables.
 */
describe('le déroulé est vraiment branché', () => {

    /** La scène doit annoncer la pose, et l'annoncer **une seule fois**. */
    it('la scène signale la pose, avec son plafond', () => {
        expect(SCENE).toContain('PLAFOND_DE_CHUTE_MS');
        expect(SCENE).toContain('onReposRef.current?.()');
        expect(SCENE).toContain('reposAnnonceRef.current = true');
    });

    /** Et le hub joueur retire les dés quand elle l'annonce. */
    it('le hub joueur retire les dés une fois posés', () => {
        expect(HUB).toContain('active={showDice && enable3D && !desPoses}');
        expect(HUB).toContain('onRepos={auReposDesDes}');
    });

});
