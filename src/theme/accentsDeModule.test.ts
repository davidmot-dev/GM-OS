import { describe, it, expect } from 'vitest';
import { accentsDeModule, distanceOklab, ACCENTS_D_AUJOURD_HUI, CONTRASTE_MINIMAL } from './accentsDeModule';
import { contraste } from './editionDuTheme';
import { PALETTES, type ThemeID } from './themeDeLInterface';

/**
 * **R7 — les deux garanties de la dérivation**, sur tous les fonds qu'on
 * connaît : les quatre thèmes de base, les personnalités de Stitch (T2.3) et
 * l'accent des jeux, jusqu'au cas le plus dur, un accent gris.
 */
const DISTANCE_MINIMALE = 0.07;

const CAS: [nom: string, accent: string, fond: string][] = [
    ...(Object.keys(PALETTES) as ThemeID[]).map(t => [t, PALETTES[t].jetons.accent, PALETTES[t].jetons.bg] as [string, string, string]),
    ['personnalité cyberpunk', '#00f0ff', '#020617'],
    ['personnalité médiévale', '#7a5c20', '#dfcfb2'],
    ['personnalité moderne', '#1d4ed8', '#e9eef5'],
    ['personnalité claire', '#1d4ed8', '#f8fafc'],
    ['Blade Runner', '#ff5f56', '#020711'],
    ['un accent gris', '#888888', '#101010'],
    ['un accent gris sur blanc', '#777777', '#ffffff'],
];

describe('accentsDeModule — R7', () => {
    it.each(CAS)('%s : chaque accent atteint le contraste minimal sur le fond', (_nom, accent, fond) => {
        const accents = accentsDeModule(accent, fond)!;
        for (const [module, couleur] of Object.entries(accents)) {
            expect(contraste(couleur, fond)!, `${module} ${couleur} sur ${fond}`).toBeGreaterThanOrEqual(CONTRASTE_MINIMAL);
        }
    });

    it.each(CAS)('%s : les frères restent distincts', (_nom, accent, fond) => {
        const couleurs = Object.entries(accentsDeModule(accent, fond)!);
        for (let i = 0; i < couleurs.length; i++) {
            for (let j = i + 1; j < couleurs.length; j++) {
                const d = distanceOklab(couleurs[i][1], couleurs[j][1]);
                expect(d, `${couleurs[i][0]} ${couleurs[i][1]} / ${couleurs[j][0]} ${couleurs[j][1]}`).toBeGreaterThanOrEqual(DISTANCE_MINIMALE);
            }
        }
    });

    it('les accents d’aujourd’hui passent eux-mêmes la garde de distance', () => {
        const v = Object.values(ACCENTS_D_AUJOURD_HUI);
        for (let i = 0; i < v.length; i++) {
            for (let j = i + 1; j < v.length; j++) expect(distanceOklab(v[i], v[j])).toBeGreaterThanOrEqual(DISTANCE_MINIMALE);
        }
    });

    it('chaque module garde sa famille : le combat reste plus rouge que la musique', () => {
        const a = accentsDeModule('#ff5f56', '#020711')!;
        expect(distanceOklab(a.crimson, ACCENTS_D_AUJOURD_HUI.crimson)).toBeLessThan(distanceOklab(a.crimson, ACCENTS_D_AUJOURD_HUI.violet));
        expect(distanceOklab(a.violet, ACCENTS_D_AUJOURD_HUI.violet)).toBeLessThan(distanceOklab(a.violet, ACCENTS_D_AUJOURD_HUI.gold));
    });

    it('une couleur illisible rend `null` : l’appelant garde les accents d’aujourd’hui', () => {
        expect(accentsDeModule('rouge', '#000000')).toBeNull();
        expect(accentsDeModule('#ff0000', 'rgba(0,0,0,.5)')).toBeNull();
    });
});
