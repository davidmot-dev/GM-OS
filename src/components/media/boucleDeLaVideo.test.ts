import { describe, it, expect } from 'vitest';
import { laVideoBoucle, boucleApresBascule } from './boucleDeLaVideo';

/**
 * Ce que ces essais protègent : **le réglage neuf ne change rien à ce qui
 * existait**, et les deux lecteurs disent la même chose.
 */

describe('une vidéo boucle-t-elle', () => {
    /**
     * ⭐ **Le point qui compte le plus.** Toutes les vidéos déjà rangées n'ont
     * pas ce champ : les lire comme « joue une fois » changerait d'un coup le
     * comportement de toutes les ambiances existantes. *Un champ neuf ne doit
     * jamais rendre faux ce qui marchait avant lui.*
     */
    it('boucle quand le réglage n’a jamais été posé', () => {
        expect(laVideoBoucle({})).toBe(true);
        expect(laVideoBoucle({ boucler: undefined })).toBe(true);
    });

    it('boucle quand on le lui demande', () => {
        expect(laVideoBoucle({ boucler: true })).toBe(true);
    });

    /** Seul un refus explicite arrête : c'est un choix que le meneur a posé. */
    it('ne joue qu’une fois sur un false explicite', () => {
        expect(laVideoBoucle({ boucler: false })).toBe(false);
    });

    /** ⚠️ Un média introuvable boucle : *on ne change pas un comportement
     *  parce qu'une donnée manque.* */
    it('boucle quand le média est introuvable', () => {
        expect(laVideoBoucle(null)).toBe(true);
        expect(laVideoBoucle(undefined)).toBe(true);
    });
});

describe('l’interrupteur', () => {
    it('part de la boucle et arrête', () => {
        expect(boucleApresBascule({})).toBe(false);
        expect(boucleApresBascule({ boucler: true })).toBe(false);
    });

    it('et remet la boucle', () => {
        expect(boucleApresBascule({ boucler: false })).toBe(true);
    });
});
