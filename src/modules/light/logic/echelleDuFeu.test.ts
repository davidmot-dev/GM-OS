import { describe, it, expect } from 'vitest';
import {
    BANDE_DE_LA_BOUGIE,
    BANDE_DU_FOYER,
    BOURRASQUE,
    BRI_CHAUD,
    BRI_FROID,
    ECHELLE_DU_FEU,
    etatDuFeu,
    tirerLaChaleur,
} from './echelleDuFeu';

/**
 * **Ce que ces essais protègent : un incendie ne doit pas ressembler à un feu
 * de camp.**
 *
 * ⛔ Défaut vu à l'écran par David le 2026-09-17 : *« j'ai l'impression que feu
 * de camp et incendie sont pareil »*. Les deux tiraient brillance et couleur
 * **indépendamment**, autour du même orange, avec des amplitudes de ±70 et ±90 —
 * *28 % d'écart, que l'œil ne voit pas.*
 *
 * ⭐ **La correction n'était pas un réglage, c'était un mécanisme** : une seule
 * variable — la chaleur — pilote les deux. *Ce qui est chaud est brillant ET
 * blanc ; ce qui refroidit est sombre ET rouge sang.*
 */

/** La luminance relative d'un `#rrggbb`, pour dire qui est « plus clair ». */
const clarte = (hex: string): number => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, v = (n >> 8) & 255, b = n & 255;
    return 0.2126 * r + 0.7152 * v + 0.0722 * b;
};

describe('l’échelle de chaleur', () => {
    /**
     * ⚠️ **L'ordre de la table EST le mécanisme.** La mélanger ne casserait rien
     * d'autre — aucune erreur, aucun autre essai rouge — *juste du bruit orange
     * qui ressemble à un feu de camp.* C'est exactement le défaut d'origine,
     * qu'aucun test ne voyait.
     */
    it('monte vraiment du sombre vers le clair', () => {
        const clartes = ECHELLE_DU_FEU.map(clarte);
        const croissante = clartes.every((c, i) => i === 0 || c > clartes[i - 1]);
        expect(croissante).toBe(true);
    });

    it('va de la braise mourante au cœur blanc', () => {
        expect(etatDuFeu(0)).toEqual({ bri: BRI_FROID, hex: ECHELLE_DU_FEU[0] });
        expect(etatDuFeu(1)).toEqual({ bri: BRI_CHAUD, hex: ECHELLE_DU_FEU[ECHELLE_DU_FEU.length - 1] });
    });

    /** ⭐ Le cœur du correctif : les deux montent **ensemble**, jamais séparément. */
    it('fait monter la brillance et la clarté de la couleur ensemble', () => {
        const pas = [0, 0.2, 0.4, 0.6, 0.8, 1];
        const etats = pas.map(etatDuFeu);
        etats.forEach((e, i) => {
            if (i === 0) return;
            expect(e.bri).toBeGreaterThan(etats[i - 1].bri);
            expect(clarte(e.hex)).toBeGreaterThanOrEqual(clarte(etats[i - 1].hex));
        });
    });

    /** Une valeur hors bornes ou abîmée ne doit pas sortir de l'échelle. */
    it('borne ce qu’on lui donne', () => {
        expect(etatDuFeu(-5).bri).toBe(BRI_FROID);
        expect(etatDuFeu(42).bri).toBe(BRI_CHAUD);
        expect(etatDuFeu(Number.NaN).bri).toBe(BRI_FROID);
        expect(ECHELLE_DU_FEU).toContain(etatDuFeu(42).hex);
    });
});

describe('le tirage de la chaleur', () => {
    /** *Un incendie rage, il n'hésite pas.* */
    it('penche nettement vers le chaud', () => {
        const echantillon = Array.from({ length: 20_000 }, () => tirerLaChaleur());
        const moyenne = echantillon.reduce((a, b) => a + b, 0) / echantillon.length;
        expect(moyenne).toBeGreaterThan(0.6);
        expect(moyenne).toBeLessThan(0.7);
    });

    /**
     * Mais il **descend quand même** : la fumée qui passe devant fait partie de
     * ce qu'on reconnaît. Un incendie toujours au maximum serait un projecteur.
     */
    it('passe tout de même par le sombre, de temps en temps', () => {
        const echantillon = Array.from({ length: 20_000 }, () => tirerLaChaleur());
        const sombres = echantillon.filter(c => etatDuFeu(c).bri < 175).length;
        expect(sombres / echantillon.length).toBeGreaterThan(0.1);
        expect(sombres / echantillon.length).toBeLessThan(0.35);
    });
});

/**
 * ⭐ **L'essai qui dit vraiment « ils ne se ressemblent pas ».**
 *
 * Les deux effets doivent occuper des **plages de lumière différentes** — c'est
 * la seule garantie qui tienne à l'œil. *Deux amplitudes différentes autour de
 * la même moyenne ne se distinguent pas ; deux bandes séparées, si.*
 */
describe('le foyer et l’incendie ne vivent pas dans la même lumière', () => {
    it('l’incendie est en moyenne bien plus haut que la bande du foyer', () => {
        const echantillon = Array.from({ length: 20_000 }, () => etatDuFeu(tirerLaChaleur()).bri);
        const moyenne = echantillon.reduce((a, b) => a + b, 0) / echantillon.length;
        expect(moyenne).toBeGreaterThan(BANDE_DU_FOYER.haut + 20);
    });

    /**
     * ⚠️ **Et surtout : le foyer ne monte JAMAIS au blanc.** C'est ce qui
     * l'empêche d'être confondu même quand l'incendie retombe dans sa bande :
     * à brillance égale, l'un est ambre et l'autre rouge sang.
     */
    it('les couleurs chaudes de l’incendie sont hors de portée d’un foyer', () => {
        const ambreDuFoyer = clarte('#ff8a1e');
        const coeur = clarte(ECHELLE_DU_FEU[ECHELLE_DU_FEU.length - 1]);
        const braise = clarte(ECHELLE_DU_FEU[0]);
        expect(coeur).toBeGreaterThan(ambreDuFoyer);
        expect(braise).toBeLessThan(ambreDuFoyer);
    });
});

/**
 * ⭐ **LES TROIS FEUX, ET NON DEUX.**
 *
 * ⛔ Le défaut que ce fichier n'a pas vu la première fois : il comparait le
 * foyer et l'incendie, et **oubliait la bougie** — qui était justement celle
 * encore branchée sur la brillance courante de la lampe. Sur une lampe à 254,
 * elle donnait une bougie de 254.
 *
 * *Un essai qui couvre deux cas sur trois ressemble à un essai qui couvre le
 * sujet.* Il portait même un titre au pluriel. Le troisième était le cassé.
 */
describe('les trois feux occupent trois bandes de lumière', () => {
    it('la bougie vit sous le foyer, sans le toucher', () => {
        expect(BANDE_DE_LA_BOUGIE.haut).toBeLessThan(BANDE_DU_FOYER.bas);
        expect(BANDE_DE_LA_BOUGIE.bas).toBeGreaterThanOrEqual(1);
        expect(BANDE_DE_LA_BOUGIE.haut).toBeGreaterThan(BANDE_DE_LA_BOUGIE.bas);
    });

    /** *Ce qu'on reconnaît d'une bougie, ce n'est pas son tremblement, c'est sa fragilité.* */
    it('la bourrasque tombe sous la bougie, sans jamais éteindre', () => {
        expect(BOURRASQUE).toBeLessThan(BANDE_DE_LA_BOUGIE.bas);
        expect(BOURRASQUE).toBeGreaterThanOrEqual(1);
    });

    /**
     * L'incendie peut redescendre dans la bande du foyer — c'est la fumée qui
     * passe. Mais il ne descend **jamais** jusqu'à la bougie : à ce niveau-là,
     * ce ne serait plus un incendie.
     */
    it('l’incendie ne descend jamais au niveau d’une bougie', () => {
        expect(BRI_FROID).toBeGreaterThan(BANDE_DE_LA_BOUGIE.haut);
    });
});
