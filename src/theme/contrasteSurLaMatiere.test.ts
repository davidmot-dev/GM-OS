import { describe, it, expect } from 'vitest';
import {
    lireUneCouleur, encresDuDegrade, encresDuSvg, fondSousLEncre, pireContraste,
} from './contrasteSurLaMatiere';
import { PERSONNALITES, type ThemeID } from './themeDeLInterface';
import { PAIRES_DU_CONTRAT } from './contratDuTheme';

describe('les encres d’une matière (T6.3)', () => {
    it('lit les couleurs CSS courantes, et dit ce qu’elle ne sait pas lire', () => {
        expect(lireUneCouleur('#fff')).toEqual({ couleur: '#ffffff', alpha: 1 });
        expect(lireUneCouleur('rgba(255, 255, 255, 0.08)')).toEqual({ couleur: '#ffffff', alpha: 0.08 });
        expect(lireUneCouleur('#00000080')?.alpha).toBeCloseTo(0.5, 2);
        expect(lireUneCouleur('transparent')).toBeNull();
        expect(lireUneCouleur('rebeccapurple')).toBeUndefined();
    });

    it('un dégradé garde l’alpha de chaque couleur', () => {
        const r = encresDuDegrade('repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 4px)');
        expect(r).toEqual({ encres: [{ couleur: '#ffffff', alpha: 0.08 }], incomplet: false });
    });

    it('un SVG : currentColor vaut noir, à pleine force', () => {
        const r = encresDuSvg('<svg viewBox="0 0 4 4"><rect width="4" height="4" fill="currentColor" opacity="0.2"/></svg>');
        expect(r).toEqual({ encres: [{ couleur: '#000000', alpha: 1 }], incomplet: false });
    });

    it('un bruit qui invente ses couleurs n’est pas mesurable — un bruit ramené au dessin l’est', () => {
        expect(encresDuSvg('<svg viewBox="0 0 4 4"><filter id="n"><feTurbulence/></filter><rect width="4" height="4" filter="url(#n)"/></svg>').incomplet).toBe(true);
        expect(encresDuSvg('<svg viewBox="0 0 4 4"><filter id="n"><feTurbulence/><feComposite in="SourceGraphic"/></filter><rect fill="currentColor" filter="url(#n)"/></svg>').incomplet).toBe(false);
    });
});

describe('le contraste au pire point', () => {
    it('le fond sous l’encre : un mélange à opacité × alpha', () => {
        expect(fondSousLEncre('#000000', { couleur: '#ffffff', alpha: 1 }, 0.5)).toBe('#808080');
        expect(fondSousLEncre('#000000', { couleur: '#ffffff', alpha: 0.5 }, 0.5)).toBe('#404040');
    });

    it('une encre claire sur un fond clair rapproche le fond du texte sombre', () => {
        const nu = pireContraste('#555555', '#f5f0e6', [], 0.35)!;
        const sous = pireContraste('#555555', '#f5f0e6', [{ couleur: '#808080', alpha: 1 }], 0.35)!;
        expect(sous.ratio).toBeLessThan(nu.ratio);
    });

    it('une encre qui éloigne le fond du texte ne change rien : le pire reste le fond nu', () => {
        const nu = pireContraste('#e2e8f0', '#020617', [], 0.35)!;
        expect(pireContraste('#e2e8f0', '#020617', [{ couleur: '#000000', alpha: 1 }], 0.35)).toEqual(nu);
    });
});

/**
 * **Les quatre thèmes de base, sur leurs matières** — ils n'ont pas droit à
 * moins qu'un thème de jeu (T0.3). Le grain fractal du médiéval invente ses
 * couleurs : il est sauté, et c'est dit.
 */
describe('les personnalités, au pire point de leurs matières', () => {
    const THEMES = Object.keys(PERSONNALITES) as ThemeID[];
    for (const theme of THEMES) {
        const j = PERSONNALITES[theme].jetons as Record<string, string>;
        const opacite = Number(j['texture-opacity'] ?? 0);
        for (const [cle, fond] of [['texture-bg', 'bg'], ['texture-panel', 'surface']] as const) {
            const valeur = j[cle];
            if (!valeur || valeur === 'none' || opacite <= 0) continue;
            const releve = valeur.startsWith('url(') ? null : encresDuDegrade(valeur);
            if (!releve || releve.incomplet) continue;
            for (const p of PAIRES_DU_CONTRAT.filter(q => q.fond === fond && j[q.avant])) {
                it(`${theme} : ${p.avant} sur ${fond} sous ${cle}`, () => {
                    const pire = pireContraste(j[p.avant], j[fond], releve.encres, opacite);
                    expect(pire?.ratio, `${j[p.avant]} sur ${pire?.fond}`).toBeGreaterThanOrEqual(p.minimum);
                });
            }
        }
    }
});
