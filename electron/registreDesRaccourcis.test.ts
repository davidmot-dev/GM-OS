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

/*
  **Les raccourcis Ctrl posés hors du crochet de navigation** (2026-10-20).
  Ctrl+E, qui rouvre la scène en cours, est écouté par
  `EcranDeLaSceneEnCours.tsx` : la garde ci-dessus ne le voyait pas, et l'aide
  l'a oublié une semaine. Celle-ci parcourt tout `src/` et retient chaque ligne
  qui **exige** Ctrl (`!(e.ctrlKey`, `ctrlKey) &&`, `&& e.ctrlKey`) en lisant une
  touche. Une ligne qui **écarte** Ctrl (`|| e.ctrlKey ||`, comme l'Espace des
  tables) n'est pas un raccourci Ctrl.
*/
const RACINE_SRC = path.resolve(__dirname, '..', 'src');

/** Ce que l'aide écrit pour chaque touche lue par `code` ou par `key`. */
const LIBELLES_HORS_NAVIGATION: Record<string, string> = {
    KeyE: 'E', k: 'K', Enter: 'Entrée',
};

function fichiersSources(dossier: string): string[] {
    return fs.readdirSync(dossier, { withFileTypes: true }).flatMap(entree => {
        const chemin = path.join(dossier, entree.name);
        if (entree.isDirectory()) return fichiersSources(chemin);
        return /\.tsx?$/.test(entree.name) && !/\.test\.tsx?$/.test(entree.name) ? [chemin] : [];
    });
}

const EXIGE_CTRL = /!\(\w+\.ctrlKey|\.ctrlKey\)?\s*&&|&&\s*\w+\.ctrlKey/;
const TOUCHE_LUE = /\.(?:code\s*[!=]==\s*'(\w+)'|key\s*===\s*'(\w+)')/g;

const ecoutesCtrl = fichiersSources(RACINE_SRC)
    .filter(f => !f.endsWith('useRaccourcisDeNavigation.ts'))
    .flatMap(fichier => fs.readFileSync(fichier, 'utf-8').split('\n')
        .filter(ligne => ligne.includes('ctrlKey') && EXIGE_CTRL.test(ligne))
        .flatMap(ligne => [...ligne.matchAll(TOUCHE_LUE)].map(m => ({
            fichier: path.basename(fichier).replace(/\.tsx?$/, ''),
            touche: m[1] ?? m[2],
        }))));

describe('les raccourcis Ctrl posés ailleurs', () => {
    it('la garde trouve bien des écoutes (Ctrl+K, Ctrl+E, Ctrl+Entrée…)', () => {
        expect(ecoutesCtrl.length).toBeGreaterThanOrEqual(3);
    });

    it.each(ecoutesCtrl.map(e => [`${e.fichier} : ${e.touche}`, e] as const))('%s est inscrit au registre', (_, { fichier, touche }) => {
        const libelle = LIBELLES_HORS_NAVIGATION[touche];
        expect(libelle, `${touche} : donner son libellé à LIBELLES_HORS_NAVIGATION, puis l'inscrire au registre`).toBeDefined();
        const inscrit = GROUPES_DE_RACCOURCIS.some(g => g.raccourcis.some(r =>
            r.ou.includes(fichier) && r.touches.some(t => t[0] === 'Ctrl' && t[t.length - 1] === libelle)));
        expect(inscrit, `Ctrl+${libelle} (${fichier}) manque au registre, ou son « ou » ne cite pas ${fichier}`).toBe(true);
    });
});
