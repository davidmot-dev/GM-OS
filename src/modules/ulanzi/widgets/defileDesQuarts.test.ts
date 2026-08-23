import { describe, it, expect } from 'vitest';
import {
    QUARTS,
    SEUIL_SANS_PAUSE,
    PASTILLES,
    COULEURS,
    LARGEUR,
    ETAT_INITIAL,
    quartSuivant,
    pause,
    stressDuQuart,
    dessinerDefile,
    composerDefile,
} from './defileDesQuarts';

/**
 * Ce que ces tests protègent : **la règle du livre**, pas le dessin.
 *
 * Les couleurs peuvent changer sans que rien ne casse ; le seuil à trois, le
 * fait qu'une pause consomme un Quart, et le retour au matin après la nuit sont
 * des faits du corpus. Ce sont eux qu'on tient.
 */
describe('le défilé des quarts — la règle', () => {
    it('enchaîne les quatre Quarts puis revient au matin', () => {
        let e = ETAT_INITIAL;
        expect(e.quartDuJour).toBe(0);

        e = quartSuivant(e); // journée
        e = quartSuivant(e); // soirée
        e = quartSuivant(e); // nuit
        expect(e.quartDuJour).toBe(3);

        // Une enquête dure plusieurs jours : après la nuit, il refait matin.
        e = quartSuivant(e);
        expect(e.quartDuJour).toBe(0);
        expect(e.consecutifs).toBe(4);
    });

    it('compte les Quarts enchaînés sans pause', () => {
        let e = ETAT_INITIAL;
        for (let i = 0; i < 5; i++) e = quartSuivant(e);
        expect(e.consecutifs).toBe(5);
    });

    /**
     * **Le détail qu'on aurait raté en codant de mémoire.** Le livre dit
     * « Pause d'un Quart » : elle ne remet pas seulement le compteur à zéro,
     * elle fait aussi avancer la journée.
     */
    it('une pause consomme elle-même un Quart', () => {
        const apres = pause({ quartDuJour: 1, consecutifs: 3 });
        expect(apres.consecutifs).toBe(0);
        expect(apres.quartDuJour).toBe(2);
    });

    it('une pause prise la nuit ramène au matin', () => {
        expect(pause({ quartDuJour: 3, consecutifs: 4 }).quartDuJour).toBe(0);
    });

    it('ne coûte aucun stress dans les trois premiers Quarts', () => {
        for (let n = 0; n <= SEUIL_SANS_PAUSE; n++) {
            expect(stressDuQuart({ quartDuJour: 0, consecutifs: n })).toBe(0);
        }
    });

    it('coûte un point de stress au-delà du seuil', () => {
        expect(stressDuQuart({ quartDuJour: 0, consecutifs: 4 })).toBe(1);
        expect(stressDuQuart({ quartDuJour: 0, consecutifs: 9 })).toBe(1);
    });

    /** « Bourreau de travail » repousse le seuil à quatre. */
    it('respecte un seuil relevé', () => {
        expect(stressDuQuart({ quartDuJour: 0, consecutifs: 4 }, 4)).toBe(0);
        expect(stressDuQuart({ quartDuJour: 0, consecutifs: 5 }, 4)).toBe(1);
    });
});

describe("le défilé des quarts — ce qui part vers l'afficheur", () => {
    it('nomme le moment en toutes lettres, sans accent', () => {
        expect(composerDefile({ quartDuJour: 0, consecutifs: 0 }).text).toBe('MATIN');
        expect(composerDefile({ quartDuJour: 1, consecutifs: 0 }).text).toBe('JOURNEE');
        expect(composerDefile({ quartDuJour: 2, consecutifs: 0 }).text).toBe('SOIREE');
        expect(composerDefile({ quartDuJour: 3, consecutifs: 0 }).text).toBe('NUIT');
    });

    /**
     * **Les accents sont bannis exprès.** Rien ne garantit que la fonte de
     * l'appareil porte un « É », et un caractère manquant ne se verrait qu'à la
     * table. Ce test tient la décision.
     */
    it("n'envoie jamais d'accent à la matrice", () => {
        for (const q of QUARTS.keys()) {
            expect(composerDefile({ quartDuJour: q, consecutifs: 0 }).text).toMatch(/^[A-Z]+$/);
        }
    });

    it('colore le mot selon le moment du jour', () => {
        expect(composerDefile({ quartDuJour: 3, consecutifs: 0 }).color).toBe(COULEURS.moment[3]);
    });

    /** *Un texte qui défile n'est pas consultable d'un coup d'œil* — § 1 du plan. */
    it('interdit le défilement et centre le mot', () => {
        const c = composerDefile(ETAT_INITIAL);
        expect(c.noScroll).toBe(true);
        expect(c.center).toBe(true);
    });
});

describe('le défilé des quarts — la barre des Quarts consécutifs', () => {

    it('rend six pastilles, et rien de plus', () => {
        expect(dessinerDefile(ETAT_INITIAL)).toHaveLength(PASTILLES);
    });

    /** Elle occupe les deux dernières lignes : le mot prend tout le reste. */
    it('tient sur les deux pixels du bas', () => {
        for (const { df: [, y, , h] } of dessinerDefile(ETAT_INITIAL)) {
            expect(y).toBe(6);
            expect(h).toBe(2);
        }
    });

    it('ne déborde jamais de la matrice', () => {
        // Un état extrême : dernier Quart du jour, huit enchaînés.
        for (const etat of [ETAT_INITIAL, { quartDuJour: 3, consecutifs: 8 }]) {
            for (const { df } of dessinerDefile(etat)) {
                const [x, y, l, h] = df;
                expect(x + l).toBeLessThanOrEqual(LARGEUR);
                expect(y + h).toBeLessThanOrEqual(8);
            }
        }
    });

    /**
     * **Le passage au rouge est tout le message** : à partir de la quatrième
     * pastille, chaque Quart coûte un point de stress.
     */
    it('passe la quatrième pastille au rouge, et pas la troisième', () => {
        const pastilles = (n: number) => dessinerDefile({ quartDuJour: 0, consecutifs: n });

        const aTrois = pastilles(3);
        expect(aTrois.map(p => p.df[4])).toEqual([
            COULEURS.sous, COULEURS.sous, COULEURS.sous,
            COULEURS.vide, COULEURS.vide, COULEURS.vide,
        ]);

        const aQuatre = pastilles(4);
        expect(aQuatre[3].df[4]).toBe(COULEURS.au_dela);
        expect(aQuatre[2].df[4]).toBe(COULEURS.sous);
    });

    it('sature en rouge au-delà de ce que la largeur peut compter', () => {
        const d = dessinerDefile({ quartDuJour: 0, consecutifs: 12 });
        expect(d.filter(p => p.df[4] === COULEURS.au_dela)).toHaveLength(PASTILLES - SEUIL_SANS_PAUSE);
        expect(d.some(p => p.df[4] === COULEURS.vide)).toBe(false);
    });

    /** Le seuil relevé doit se voir à l'écran, pas seulement dans le calcul. */
    it('décale le rouge quand le seuil est relevé', () => {
        const d = dessinerDefile({ quartDuJour: 0, consecutifs: 4 }, 4);
        expect(d[3].df[4]).toBe(COULEURS.sous);
    });
});
