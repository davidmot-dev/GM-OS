import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GROUPES_DE_RACCOURCIS } from '../src/data/registreDesRaccourcis';

/**
 * **L'aide ne doit pas oublier un raccourci de navigation** — refonte, L6
 * (2026-10-03). Le registre (`src/data/registreDesRaccourcis.ts`) est ce que
 * l'aide affiche ; cette garde relit le crochet qui écoute vraiment le clavier
 * et vérifie que chacune de ses touches y figure.
 *
 * Dans `electron/` parce qu'elle lit le disque (`node:fs` n'existe pas dans le
 * projet de tests du renderer).
 */
const SOURCE = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'hooks', 'useRaccourcisDeNavigation.ts'), 'utf-8');

/** Ce que l'aide écrit pour chaque `code` de touche. */
const LIBELLES: Record<string, string> = {
    KeyH: 'H', KeyT: 'T', KeyN: 'N', Backquote: '²', Digit0: '0',
};

const combinaisons = GROUPES_DE_RACCOURCIS.flatMap(g => g.raccourcis.flatMap(r => r.touches.map(t => t.join('+'))));

describe('le registre des raccourcis', () => {
    const codes = [...new Set([...SOURCE.matchAll(/evenement\.code === '(\w+)'/g)].map(m => m[1]))];

    it('le crochet de navigation écoute bien des touches', () => {
        expect(codes.length).toBeGreaterThanOrEqual(4);
    });

    it.each(codes)('la touche %s du crochet de navigation est inscrite', (code) => {
        const libelle = LIBELLES[code];
        expect(libelle, `${code} : donner son libellé à LIBELLES, puis l'inscrire au registre`).toBeDefined();
        expect(combinaisons.some(c => c.startsWith('Ctrl+') && c.endsWith(`+${libelle}`))).toBe(true);
    });

    it('les neuf places y sont', () => {
        expect(combinaisons).toContain('Ctrl+1…9');
    });

    it("chaque raccourci dit où il est écouté", () => {
        for (const g of GROUPES_DE_RACCOURCIS) for (const r of g.raccourcis) expect(r.ou.length, r.titre).toBeGreaterThan(5);
    });
});
