import { describe, it, expect } from 'vitest';
import { fondDuPlayerHub } from './fondDuPlayerHub';

/**
 * **Le fond de l'écran des joueurs — l'écran noir du 2026-09-13.**
 *
 * `Ctrl+0` devait fermer la carte de projection. Il posait `null`, et **tout
 * l'écran passait au noir**, décor compris. David : *« je voulais que la fenêtre
 * encadrée en rouge se ferme, pas le background derrière cette fenêtre »*.
 *
 * ⛔ La cause tenait dans un ternaire d'une ligne, sans commentaire, où
 * `undefined` et `null` ne veulent pas dire la même chose. *L'un est une
 * absence, l'autre une décision.*
 */

const DECOR = 'm-papier-peint';
const PROJETE = 'm-image-projetee';

describe('ce que le fond devient', () => {
    /*
      ⛔ **LE TEST DE LA RÉGRESSION.** Rien n'est projeté : le décor reprend la
      main. C'est ce que `FULL_RESET` doit produire.
    */
    it('sans rien de projeté, le décor de la campagne reprend la main', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: undefined,
            papierPeintDeLaCampagne: DECOR,
        })).toBe(DECOR);
    });

    /*
      ⚠️ **`null` reste une extinction délibérée.** On ne supprime pas ce cas :
      il faut une porte vers le noir, comme `extinguishAll` en garde une pour
      Light-OS. *Un geste nommé « éteindre » doit éteindre.*
    */
    it('mais `null` éteint vraiment — c’est une décision, pas une absence', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: null,
            papierPeintDeLaCampagne: DECOR,
        })).toBeNull();
    });

    it('une image projetée passe devant tout', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: PROJETE,
            projectionVersLeHub: 'm-autre',
            papierPeintDeLaCampagne: DECOR,
        })).toBe(PROJETE);
    });

    /*
      Sans image en direct, la projection connue du magasin vaut mieux que le
      papier peint : c'est ce que le meneur a choisi de montrer.
    */
    it('à défaut, la projection connue du magasin', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: undefined,
            projectionVersLeHub: PROJETE,
            papierPeintDeLaCampagne: DECOR,
        })).toBe(PROJETE);
    });

    it('et le décor en dernier recours', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: undefined,
            projectionVersLeHub: null,
            papierPeintDeLaCampagne: DECOR,
        })).toBe(DECOR);
    });

    /* Une campagne sans papier peint donne un fond vide, pas une exception. */
    it('sans rien du tout, le fond est vide', () => {
        expect(fondDuPlayerHub({ imageEnDirect: undefined })).toBeNull();
    });

    /*
      ⭐ **La distinction en une assertion.** Si un jour quelqu'un remplace le
      `!== undefined` par un `??`, ce test est le seul à s'en apercevoir — et
      c'est exactement la substitution qui a noirci l'écran.
    */
    it('⛔ `undefined` et `null` ne donnent PAS le même fond', () => {
        const commun = { projectionVersLeHub: null, papierPeintDeLaCampagne: DECOR };

        expect(fondDuPlayerHub({ ...commun, imageEnDirect: undefined }))
            .not.toBe(fondDuPlayerHub({ ...commun, imageEnDirect: null }));
    });
});
