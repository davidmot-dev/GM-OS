import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Ce que ces tests protègent : **la racine documentaire du moteur ne bouge
 * pas.**
 *
 * Le défaut, relevé en réel le 2026-08-22. `RAGService.getRelevantContext`
 * appelait `reindex(vaultPath)` **avant chaque recherche**, et `ai:reindex`
 * appelait `setDocsPath` : le coffre Obsidian *remplaçait* la racine du moteur.
 * Tout `docs/` sortait de l'index — le corpus, les campagnes, `.ragignore` — et
 * la recherche ne retenait plus rien.
 *
 * Le coffre était renseigné **en dur par défaut** dans `useObsidianStore` :
 * personne n'avait à le demander pour que ça arrive. Et rien ne le disait :
 * l'Oracle répondait de sa propre mémoire, avec aplomb.
 *
 * *Deux arbres, une seule variable de racine, le dernier écrivain gagne* — le
 * motif que ce projet rencontre chaque jour. On le rend **impossible** plutôt
 * que déconseillé : un champ qu'on peut écrire finit écrit.
 */

const APP_ROOT = path.join(__dirname, '..');
const lire = (rel: string) => fs.readFileSync(path.join(APP_ROOT, rel), 'utf-8');

describe('la racine du moteur', () => {
    const moteur = lire('electron/RAGEngine.ts');

    it('ne peut plus être déplacée : plus de `setDocsPath`, ni déclaré ni appelé', () => {
        // La forme appelable, pas le mot : le commentaire qui explique le
        // retrait le nomme, et il doit pouvoir continuer à le nommer.
        expect(moteur).not.toMatch(/setDocsPath\s*\(/);
    });

    it('est calculée une seule fois, depuis APP_ROOT', () => {
        const affectations = moteur.match(/this\.docsPath\s*=/g) ?? [];
        expect(affectations).toHaveLength(1);
        expect(moteur).toContain("this.docsPath = path.join(process.env.APP_ROOT || '', 'docs')");
    });

    /**
     * **La réindexation réindexe ; elle ne déménage pas.** Tant que le handler
     * accepte un chemin, quelqu'un finira par lui en passer un — c'est
     * exactement ce qui s'est produit.
     */
    it('la réindexation n’accepte aucun chemin', () => {
        const handler = moteur.slice(moteur.indexOf("ipcMain.handle('ai:reindex'"));
        expect(handler.slice(0, 200)).toMatch(/ipcMain\.handle\('ai:reindex',\s*async\s*\(\s*\)\s*=>/);
    });

    it('le pont n’offre pas non plus d’argument', () => {
        expect(lire('electron/preload.ts')).toContain("reindex: () => ipcRenderer.invoke('ai:reindex')");
    });
});

describe('personne ne déplace la racine', () => {
    /**
     * Le seul appelant légitime — le bouton de réindexation des réglages IA —
     * appelle `reindex()` sans rien. Un appel *avec* argument est le défaut
     * lui-même, et il ne se voit pas à la lecture d'un diff.
     */
    it('aucun appel à reindex ne passe de chemin', () => {
        const fautifs: string[] = [];
        const parcourir = (dossier: string) => {
            for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
                const complet = path.join(dossier, e.name);
                if (e.isDirectory()) { parcourir(complet); continue; }
                if (!/\.tsx?$/.test(e.name) || /\.test\.tsx?$/.test(e.name)) continue;
                const source = fs.readFileSync(complet, 'utf-8');
                for (const appel of source.match(/\.reindex\(([^)]*)\)/g) ?? []) {
                    if (appel !== '.reindex()') fautifs.push(`${e.name} : ${appel}`);
                }
            }
        };
        parcourir(path.join(APP_ROOT, 'src'));
        parcourir(path.join(APP_ROOT, 'electron'));
        expect(fautifs).toEqual([]);
    });
});

describe('ce que la racine contient réellement', () => {
    /** Reproduit `ai:list-systems`, qui alimente la résolution du corpus. */
    const listSystems = (): string[] => {
        const dossier = path.join(APP_ROOT, 'docs', 'systems');
        if (!fs.existsSync(dossier)) return [];
        return fs.readdirSync(dossier, { withFileTypes: true })
            .filter(e => e.isDirectory()).map(e => e.name);
    };

    /**
     * **Le corpus que l'Oracle ne trouvait pas est là, et il l'a toujours été.**
     * Ce n'est pas le disque qui manquait, c'est la racine qui regardait
     * ailleurs.
     */
    it('énumère les corpus du dépôt, dont celui de Rêves de Dragons', () => {
        const dossiers = listSystems();
        expect(dossiers).toContain('reves de dragons');
        expect(dossiers.length).toBeGreaterThan(5);
    });

    it('et le corpus porte bien des fiches', () => {
        const fiches = fs.readdirSync(path.join(APP_ROOT, 'docs/systems/reves de dragons/rules'));
        expect(fiches.filter(f => f.endsWith('.md')).length).toBeGreaterThan(0);
    });
});
