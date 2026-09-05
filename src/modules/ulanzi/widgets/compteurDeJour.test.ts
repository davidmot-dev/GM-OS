import { describe, it, expect } from 'vitest';
import {
    ETAT_INITIAL, QUARTS, quartSuivant, pause, jourDe,
    texteDuJour, couleurDuJour, dessinerLeJour, composerLeJour, COULEURS, LARGEUR,
    type EtatDesQuarts,
} from './defileDesQuarts';

/**
 * **Le compteur de jour d'enquête.**
 *
 * Demandé par David le 2026-09-05 : *« en plus de faire progresser les Quarts,
 * je voudrais un compteur du jour — Jour 1, Jour 2… »*. Le défilé repassait au
 * matin après la nuit sans que rien ne dise **quelle** journée : une enquête de
 * *Blade Runner* en dure plusieurs, et le nombre écoulé s'annonce à la table.
 */

/** Enchaîne `n` Quarts de travail depuis l'état initial. */
const apres = (n: number, depuis: EtatDesQuarts = ETAT_INITIAL): EtatDesQuarts => {
    let etat = depuis;
    for (let i = 0; i < n; i++) etat = quartSuivant(etat);
    return etat;
};

describe('quand le jour se lève', () => {
    it('commence au premier', () => {
        expect(jourDe(ETAT_INITIAL)).toBe(1);
    });

    it('ne bouge pas tant que la nuit n’est pas passée', () => {
        /* matin → journée → soirée → nuit : toujours le jour 1. */
        expect([1, 2, 3].map(n => jourDe(apres(n)))).toEqual([1, 1, 1]);
    });

    it('avance quand la nuit se referme sur le matin', () => {
        const quatre = apres(QUARTS.length);
        expect(quatre.quartDuJour).toBe(0);
        expect(jourDe(quatre)).toBe(2);
    });

    it('compte juste sur trois journées', () => {
        expect(jourDe(apres(QUARTS.length * 3))).toBe(4);
    });

    it('UNE PAUSE fait lever le jour aussi — elle consomme un Quart', () => {
        /*
          C'est le détail qu'on aurait raté en codant de mémoire : le livre dit
          « Pause d'un Quart ». Une pause prise dans la nuit fait donc aussi
          lever le soleil.
        */
        const nuit = apres(3);
        const apresPause = pause(nuit);

        expect(apresPause.quartDuJour).toBe(0);
        expect(jourDe(apresPause)).toBe(2);
        expect(apresPause.consecutifs).toBe(0);
    });

    it('une pause en milieu de journée ne change pas le jour', () => {
        expect(jourDe(pause(apres(1)))).toBe(1);
    });
});

describe('un état enregistré avant ce champ', () => {
    it('se lit comme le premier jour, pas comme une erreur', () => {
        /* « JOUR NaN » sur l'afficheur serait pire que « JOUR 1 ». */
        const ancien = { quartDuJour: 2, consecutifs: 1 } as EtatDesQuarts;
        expect(jourDe(ancien)).toBe(1);
        expect(texteDuJour(ancien)).toBe('JOUR 1');
    });

    it('repart correctement dès le Quart suivant', () => {
        const ancien = { quartDuJour: 3, consecutifs: 1 } as EtatDesQuarts;
        expect(jourDe(quartSuivant(ancien))).toBe(2);
    });

    it('refuse un jour absurde plutôt que de l’afficher', () => {
        expect(jourDe({ quartDuJour: 0, consecutifs: 0, jour: 0 })).toBe(1);
        expect(jourDe({ quartDuJour: 0, consecutifs: 0, jour: -3 })).toBe(1);
    });
});

describe('ce qui part vers la matrice', () => {
    it('écrit « JOUR n », sans accent', () => {
        expect(texteDuJour(apres(4))).toBe('JOUR 2');
        expect(texteDuJour(ETAT_INITIAL)).toBe('JOUR 1');
    });

    it('prend la couleur du moment — les deux applications se succèdent', () => {
        /* Deux teintes différentes pour un même instant se liraient comme deux
           informations sans rapport. */
        for (let n = 0; n < QUARTS.length; n++) {
            expect(couleurDuJour(apres(n))).toBe(COULEURS.moment[apres(n).quartDuJour]);
        }
    });

    it('refuse le défilement de texte', () => {
        expect(composerLeJour(ETAT_INITIAL).noScroll).toBe(true);
        expect(composerLeJour(ETAT_INITIAL).center).toBe(true);
    });
});

describe('la barre des quatre Quarts', () => {
    it('en dessine quatre, sur la largeur exacte', () => {
        const barre = dessinerLeJour(ETAT_INITIAL);
        expect(barre).toHaveLength(QUARTS.length);

        const dernier = barre[barre.length - 1].df;
        expect(dernier[0] + dernier[2]).toBeLessThanOrEqual(LARGEUR);
    });

    it('allume celui du moment, éteint ceux à venir, estompe les passés', () => {
        const [m, j, s, n] = dessinerLeJour(apres(2)).map(r => r.df[4]);

        expect(m).toBe(COULEURS.passe);
        expect(j).toBe(COULEURS.passe);
        expect(s).toBe(COULEURS.moment[2]);
        expect(n).toBe(COULEURS.aVenir);
    });

    it('tient dans les huit pixels de haut', () => {
        for (const { df: [, y, , h] } of dessinerLeJour(apres(1))) {
            expect(y + h).toBeLessThanOrEqual(8);
        }
    });
});
