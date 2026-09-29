import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { extraireJetons } from '../src/theme/jetonsDeTheme';
import { traitsDistincts, TRAITS_DISTINCTS_MINIMUM } from '../src/theme/distinctionDesThemes';

/**
 * **La garde de distinction, sur les personnalités de Stitch** (T2.3,
 * `documentation/Planning/stitch/personnalites/`) — P1.6, 2026-09-29.
 *
 * Ce sont les paquets que P1.7 fera entrer derrière l'interrupteur : la garde
 * les juge avant qu'ils n'arrivent. Elle vit ici, et non à côté de
 * `distinctionDesThemes.ts`, parce qu'elle lit le disque — interdit aux essais
 * de l'interface.
 */

const DOSSIER = path.resolve(__dirname, '..', 'documentation', 'Planning', 'stitch', 'personnalites');
const NOMS = ['cyberpunk', 'medieval', 'moderne', 'clair'] as const;
const jetons = Object.fromEntries(NOMS.map(n => [
    n, extraireJetons(fs.readFileSync(path.join(DOSSIER, `${n}.theme.css`), 'utf-8')).jetons,
])) as Record<typeof NOMS[number], Record<string, string>>;

const PAIRES = NOMS.flatMap((a, i) => NOMS.slice(i + 1).map(b => [a, b] as const));

describe('les quatre personnalités se distinguent', () => {
    it.each(PAIRES)('%s et %s diffèrent sur trois traits au moins', (a, b) => {
        const distincts = traitsDistincts(jetons[a], jetons[b]);
        expect(distincts.length, `${a} / ${b} : ${distincts.join(', ')}`).toBeGreaterThanOrEqual(TRAITS_DISTINCTS_MINIMUM);
    });

    /** Les comptes du plan de la phase 1 : la garde mesure ce qu'on croit qu'elle mesure. */
    it('retrouve les comptes du plan : 7/7 pour Cyberpunk et Clair, 3/7 pour Moderne et Clair', () => {
        expect(traitsDistincts(jetons.cyberpunk, jetons.clair)).toHaveLength(7);
        expect(traitsDistincts(jetons.moderne, jetons.clair).sort())
            .toEqual(['arrondi des cartes', 'fond du cadre', 'police de titre']);
    });

    /** Sans le cadre, Moderne et Clair tomberaient à deux traits — la raison pour laquelle David l'a retenu. */
    it('sans le cadre, Moderne et Clair seraient refusés', () => {
        const sansCadre = { ...jetons.moderne };
        delete sansCadre['frame-bg'];
        expect(traitsDistincts(sansCadre, jetons.clair).length).toBeLessThan(TRAITS_DISTINCTS_MINIMUM);
    });
});
