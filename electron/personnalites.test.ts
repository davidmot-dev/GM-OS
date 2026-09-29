import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { extraireJetons } from '../src/theme/jetonsDeTheme';
import { PERSONNALITES, type ThemeID } from '../src/theme/themeDeLInterface';
import { traitsDistincts, TRAITS_DISTINCTS_MINIMUM } from '../src/theme/distinctionDesThemes';
import { validerLeTheme } from '../src/theme/validationDuTheme';

/**
 * **P1.7 · Les personnalités dans GM-OS disent ce que disent leurs fiches.**
 *
 * Les valeurs de T2.3 vivent deux fois : dans les fiches de
 * `documentation/Planning/stitch/personnalites/`, que le validateur a
 * acceptées et que David a relues, et dans `PERSONNALITES`, que GM-OS
 * applique. *Deux copies écrites à la main finissent par se contredire* : cet
 * essai les tient d'accord, jeton par jeton.
 */

const DOSSIER = path.resolve(__dirname, '..', 'documentation', 'Planning', 'stitch', 'personnalites');
const FICHES: Record<ThemeID, string> = { cyberpunk: 'cyberpunk', medieval: 'medieval', modern: 'moderne', claire: 'clair' };
const lire = (t: ThemeID) => fs.readFileSync(path.join(DOSSIER, `${FICHES[t]}.theme.css`), 'utf-8');
const THEMES = Object.keys(FICHES) as ThemeID[];

describe('les personnalités de GM-OS suivent leurs fiches de T2.3', () => {
    it.each(THEMES)('%s : les mêmes jetons, les mêmes valeurs', (t) => {
        expect(PERSONNALITES[t].jetons).toEqual(extraireJetons(lire(t)).jetons);
    });

    it.each(THEMES)('%s : la même polarité', (t) => {
        expect(PERSONNALITES[t].clarte).toBe(extraireJetons(lire(t)).clarte);
    });

    /** Le validateur des thèmes de jeu les avait acceptées ; elles doivent le rester. */
    it.each(THEMES)('%s : acceptée par le validateur des thèmes de jeu', (t) => {
        const intention = '# Intention\nPersonnalité de base de GM-OS.\n\n# Limites signalées\nAucune.\n';
        const rapport = validerLeTheme({
            jeu: FICHES[t], css: lire(t), fichiers: { 'intention.md': { taille: intention.length, contenu: intention } },
        });
        expect(rapport.erreurs.map(e => e.message)).toEqual([]);
    });
});

describe('les quatre personnalités, telles que GM-OS les applique, se distinguent', () => {
    const PAIRES = THEMES.flatMap((a, i) => THEMES.slice(i + 1).map(b => [a, b] as const));
    it.each(PAIRES)('%s et %s', (a, b) => {
        const distincts = traitsDistincts(PERSONNALITES[a].jetons, PERSONNALITES[b].jetons);
        expect(distincts.length, distincts.join(', ')).toBeGreaterThanOrEqual(TRAITS_DISTINCTS_MINIMUM);
    });
});
