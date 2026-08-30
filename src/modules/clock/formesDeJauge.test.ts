import { describe, it, expect } from 'vitest';
import {
    FORMES_DE_JAUGE,
    FORME_PAR_DEFAUT,
    REPERE,
    aiguilleDuCadran,
    arcDuCadran,
    arcsDeLAnneau,
    boiteDeLaForme,
    casesDeLaBarre,
    fractionRemplie,
    pastillesDeLaJauge,
    traitsDuCadran,
} from './components/formesDeJauge';

/**
 * **Les quatre formes de jauge — demandées par David le 2026-08-30.**
 *
 * Une géométrie fausse ne lève jamais d'erreur : elle produit un dessin faux,
 * et un dessin faux se découvre en séance, quand plus rien ne se rattrape.
 * D'où deux exigences tenues ici pour toutes les tailles de jauge que
 * l'interface permet de créer (4, 6, 8, 10 et 12 segments) :
 *
 * - **rien ne sort du repère** — c'est précisément le défaut qui a coupé
 *   l'anneau du minuteur ;
 * - **une entrée absurde rend une liste vide, jamais des coordonnées `NaN`**,
 *   qui traverseraient tout le rendu pour ne rien dessiner du tout.
 */

const TAILLES = [4, 6, 8, 10, 12];
const ABSURDES = [0, -3, Number.NaN, Number.POSITIVE_INFINITY];

const dansLeRepere = (v: number) => v >= 0 && v <= REPERE;

describe('le catalogue des formes', () => {
    it('propose les quatre formes, l’anneau en tête', () => {
        expect(FORMES_DE_JAUGE).toEqual(['anneau', 'barre', 'points', 'aiguille']);
    });

    /** *Un choix ajouté ne redessine pas ce qui existait.* */
    it('retombe sur l’anneau, la forme des jauges d’avant', () => {
        expect(FORME_PAR_DEFAUT).toBe('anneau');
    });
});

describe('l’anneau segmenté', () => {
    it.each(TAILLES)('trace un arc par segment à %i', (total) => {
        expect(arcsDeLAnneau(total)).toHaveLength(total);
    });

    /**
     * **Un seul segment est le cas qui casse.** L'écart est retranché de
     * chaque arc ; sur un tour complet il ferait passer l'arrivée avant le
     * départ, et l'anneau se dessinerait à l'envers.
     */
    it('ne s’inverse pas sur une jauge d’un seul segment', () => {
        const [trace] = arcsDeLAnneau(1);
        expect(trace).toBeTruthy();
        expect(trace).not.toContain('NaN');
    });

    it.each(ABSURDES)('rend une liste vide sur %s', (total) => {
        expect(arcsDeLAnneau(total)).toEqual([]);
    });
});

describe('la barre segmentée', () => {
    it.each(TAILLES)('pose une case par segment à %i, toutes dans le repère', (total) => {
        const cases = casesDeLaBarre(total);
        expect(cases).toHaveLength(total);

        for (const c of cases) {
            expect(c.largeur).toBeGreaterThan(0);
            expect(dansLeRepere(c.x), `x=${c.x}`).toBe(true);
            expect(dansLeRepere(c.x + c.largeur), `droite=${c.x + c.largeur}`).toBe(true);
            expect(dansLeRepere(c.y + c.hauteur)).toBe(true);
        }
    });

    /**
     * *C'est la promesse de cette forme :* rester lisible là où l'anneau ne
     * l'est plus. Des cases plus étroites que leur propre espacement ne se
     * liraient plus comme une barre.
     */
    it('garde des cases plus larges que les écarts, même à douze', () => {
        const cases = casesDeLaBarre(12);
        const ecart = cases[1].x - (cases[0].x + cases[0].largeur);

        expect(cases[0].largeur).toBeGreaterThan(ecart);
    });

    it('ne se chevauche jamais', () => {
        for (const total of TAILLES) {
            const cases = casesDeLaBarre(total);
            for (let i = 1; i < cases.length; i++) {
                expect(cases[i].x, `${total} segments`).toBeGreaterThanOrEqual(cases[i - 1].x + cases[i - 1].largeur);
            }
        }
    });

    it.each(ABSURDES)('rend une liste vide sur %s', (total) => {
        expect(casesDeLaBarre(total)).toEqual([]);
    });
});

describe('les points', () => {
    it.each(TAILLES)('pose une pastille par segment à %i, toutes dans le repère', (total) => {
        const pastilles = pastillesDeLaJauge(total);
        expect(pastilles).toHaveLength(total);

        for (const p of pastilles) {
            expect(p.r).toBeGreaterThan(0);
            expect(dansLeRepere(p.cx - p.r), `gauche=${p.cx - p.r}`).toBe(true);
            expect(dansLeRepere(p.cx + p.r), `droite=${p.cx + p.r}`).toBe(true);
            expect(dansLeRepere(p.cy - p.r)).toBe(true);
            expect(dansLeRepere(p.cy + p.r)).toBe(true);
        }
    });

    /** Six d'un coup se comptent d'un regard ; douze en ligne se comptent un par un. */
    it('tient sur une seule rangée jusqu’à six', () => {
        const hauteurs = new Set(pastillesDeLaJauge(6).map(p => p.cy));
        expect(hauteurs.size).toBe(1);
    });

    it('passe à deux rangées au-delà', () => {
        const hauteurs = new Set(pastillesDeLaJauge(12).map(p => p.cy));
        expect(hauteurs.size).toBe(2);
    });

    /**
     * Une rangée incomplète doit se centrer sur elle-même. Sans quoi les
     * cinq derniers points d'une jauge à onze pendraient à gauche.
     */
    it('centre une dernière rangée incomplète', () => {
        const pastilles = pastillesDeLaJauge(11);
        const rangees = [...new Set(pastilles.map(p => p.cy))];
        const milieu = (r: number) => {
            const dedans = pastilles.filter(p => p.cy === r);
            return (Math.min(...dedans.map(p => p.cx)) + Math.max(...dedans.map(p => p.cx))) / 2;
        };

        expect(milieu(rangees[0])).toBeCloseTo(REPERE / 2, 6);
        expect(milieu(rangees[1])).toBeCloseTo(REPERE / 2, 6);
    });

    it.each(ABSURDES)('rend une liste vide sur %s', (total) => {
        expect(pastillesDeLaJauge(total)).toEqual([]);
    });
});

describe('le cadran à aiguille', () => {
    it('ne trace rien tant que la jauge est vide', () => {
        expect(arcDuCadran(0, 0)).toBe('');
    });

    it.each([0.25, 0.5, 0.75, 1])('trace un arc lisible à %s', (fraction) => {
        const trace = arcDuCadran(0, fraction);
        expect(trace).toMatch(/^M [\d.-]+ [\d.-]+ A /);
        expect(trace).not.toContain('NaN');
    });

    /** Une fraction hors bornes ne doit pas faire repartir l'aiguille en arrière. */
    it('borne les fractions au lieu de déborder du demi-tour', () => {
        expect(arcDuCadran(0, 5)).toBe(arcDuCadran(0, 1));
        expect(arcDuCadran(0, -2)).toBe('');
    });

    /**
     * L'axe des `y` d'un SVG descend : l'aiguille part de la gauche à vide et
     * arrive à droite à plein, en passant par le haut.
     */
    it('balaie de gauche à droite', () => {
        const vide = aiguilleDuCadran(0).pointe;
        const moitie = aiguilleDuCadran(0.5).pointe;
        const plein = aiguilleDuCadran(1).pointe;

        expect(vide.x).toBeLessThan(moitie.x);
        expect(moitie.x).toBeLessThan(plein.x);
        expect(moitie.y).toBeLessThan(vide.y); // le milieu pointe vers le haut
        expect(moitie.x).toBeCloseTo(REPERE / 2, 6);
    });

    it('ne rend jamais de NaN, quelle que soit l’entrée', () => {
        for (const f of [Number.NaN, Number.POSITIVE_INFINITY, -1, 42]) {
            const { pointe } = aiguilleDuCadran(f);
            expect(Number.isNaN(pointe.x) || Number.isNaN(pointe.y), `f=${f}`).toBe(false);
        }
    });

    it.each(TAILLES)('marque les %i segments, extrémités comprises, dans le repère', (total) => {
        const traits = traitsDuCadran(total);
        expect(traits).toHaveLength(total + 1);

        for (const trait of traits) {
            expect(dansLeRepere(trait.x1) && dansLeRepere(trait.x2), `x hors repère`).toBe(true);
            expect(dansLeRepere(trait.y1) && dansLeRepere(trait.y2), `y hors repère`).toBe(true);
        }
    });

    it.each(ABSURDES)('ne marque rien sur %s', (total) => {
        expect(traitsDuCadran(total)).toEqual([]);
    });
});

describe('le cadre de chaque forme', () => {
    /**
     * **Le cadre devient le `viewBox` : tout ce qui en sort est coupé.**
     *
     * Il est calculé sur la géométrie plutôt qu'écrit à la main, et c'est ce
     * que ce test garde — un cadre figé cesserait de suivre le jour où une
     * forme grandirait, et la moitié d'une jauge disparaîtrait sans un mot.
     */
    it.each(TAILLES)('contient toutes les cases de la barre à %i', (total) => {
        const boite = boiteDeLaForme('barre', total);
        for (const c of casesDeLaBarre(total)) {
            expect(c.y).toBeGreaterThanOrEqual(boite.y);
            expect(c.y + c.hauteur).toBeLessThanOrEqual(boite.y + boite.hauteur);
        }
    });

    it.each(TAILLES)('contient toutes les pastilles à %i', (total) => {
        const boite = boiteDeLaForme('points', total);
        for (const p of pastillesDeLaJauge(total)) {
            expect(p.cy - p.r).toBeGreaterThanOrEqual(boite.y);
            expect(p.cy + p.r).toBeLessThanOrEqual(boite.y + boite.hauteur);
        }
    });

    it.each(TAILLES)('contient les traits du cadran à %i', (total) => {
        const boite = boiteDeLaForme('aiguille', total);
        for (const trait of traitsDuCadran(total)) {
            expect(Math.min(trait.y1, trait.y2)).toBeGreaterThanOrEqual(boite.y);
        }
    });

    /** L'anneau est rond : son cadre est le carré, et doit le rester. */
    it('laisse l’anneau dans son carré', () => {
        expect(boiteDeLaForme('anneau', 6)).toEqual({ x: 0, y: 0, largeur: REPERE, hauteur: REPERE });
    });

    /**
     * *C'est tout l'objet du changement :* une barre dans le carré de l'anneau
     * n'occupait qu'un quart de sa hauteur, et devenait un trait perdu au
     * milieu d'un vide sur le Player Hub.
     */
    it('resserre les formes plates au lieu de les noyer dans un carré', () => {
        expect(boiteDeLaForme('barre', 6).hauteur).toBeLessThan(REPERE);
        expect(boiteDeLaForme('points', 6).hauteur).toBeLessThan(REPERE);
        expect(boiteDeLaForme('aiguille', 6).hauteur).toBeLessThan(REPERE);
    });

    /** Deux rangées de pastilles sont plus hautes qu'une : le cadre doit suivre. */
    it('suit le nombre de segments', () => {
        expect(boiteDeLaForme('points', 12).hauteur)
            .toBeGreaterThan(boiteDeLaForme('points', 6).hauteur);
    });

    it.each(ABSURDES)('retombe sur le carré sur %s', (total) => {
        expect(boiteDeLaForme('barre', total).hauteur).toBe(REPERE);
        expect(boiteDeLaForme('points', total).hauteur).toBe(REPERE);
    });
});

describe('la fraction remplie', () => {
    it('rend la proportion', () => {
        expect(fractionRemplie(3, 6)).toBe(0.5);
    });

    /** Une jauge sans segment est un piège de division, pas un cas d'erreur. */
    it('rend zéro plutôt qu’un NaN sur une jauge sans segment', () => {
        expect(fractionRemplie(0, 0)).toBe(0);
        expect(fractionRemplie(3, Number.NaN)).toBe(0);
    });

    it('borne à un même si le compte a débordé', () => {
        expect(fractionRemplie(9, 6)).toBe(1);
        expect(fractionRemplie(-2, 6)).toBe(0);
    });
});
