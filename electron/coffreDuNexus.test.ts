import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import nodeFs from 'node:fs';
import nodeOs from 'node:os';
import nodePath from 'node:path';

/**
 * **La deuxième racine — le coffre Obsidian EN PLUS de `docs/`.**
 *
 * Ces tests gardent l'inverse exact du défaut du 2026-08-22, où le coffre
 * *remplaçait* la racine documentaire : tout `docs/` sortait de l'index, et
 * l'Oracle répondait quand même, de sa propre mémoire.
 *
 * Ce qui avait fait le dégât n'était pas d'indexer un coffre — c'était qu'**une
 * seule variable** portait la racine. On garde donc deux champs distincts, et
 * ces tests éprouvent les quatre propriétés qui rendent l'échange impossible :
 * éteint par défaut, disjoint de `docs/`, espace de noms réservé, et **additif
 * seulement — le coffre n'enlève jamais rien.**
 */

const dirs = vi.hoisted(() => {
    const fs = require('node:fs') as typeof nodeFs;
    const os = require('node:os') as typeof nodeOs;
    const path = require('node:path') as typeof nodePath;

    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-coffre-'));
    const appRoot = path.join(base, 'appRoot');
    const docs = path.join(appRoot, 'docs');
    const coffre = path.join(base, 'Obsidian Vault');

    fs.mkdirSync(path.join(docs, 'systems', 'alien', 'rules'), { recursive: true });
    fs.writeFileSync(
        path.join(docs, 'systems', 'alien', 'rules', 'le-stress.md'),
        '---\nsujet: le stress\n---\n# Le stress\nLes dés de stress explosent.\n',
    );

    process.env.APP_ROOT = appRoot;
    return { base, appRoot, docs, coffre };
});

vi.mock('electron', () => ({ ipcMain: { handle: vi.fn() } }));
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn() } }));

const { RAGEngine } = await import('./RAGEngine');

const engine = RAGEngine.getInstance();
const cles = () => [...(engine as unknown as { index: Map<string, unknown> }).index.keys()].sort();
const duCoffre = () => cles().filter(c => c.startsWith('coffre/'));

/** Rebâtit un coffre neuf : chaque test part du même disque. */
function poserLeCoffre() {
    nodeFs.rmSync(dirs.coffre, { recursive: true, force: true });
    nodeFs.mkdirSync(nodePath.join(dirs.coffre, 'Campagnes'), { recursive: true });
    nodeFs.writeFileSync(nodePath.join(dirs.coffre, 'Index du Nexus.md'), '# Nexus\nLe fil rouge.\n');
    nodeFs.writeFileSync(nodePath.join(dirs.coffre, 'Campagnes', 'Hadley Hope.md'), '# Hadley Hope\nLa colonie.\n');
}

beforeEach(async () => {
    poserLeCoffre();
    await engine.brancherLeCoffre(null);
});

afterAll(() => {
    nodeFs.rmSync(dirs.base, { recursive: true, force: true });
});

describe('brancher le coffre', () => {
    /** *La propriété qui a coûté le plus cher : ajouter n'enlève rien.* */
    it('ajoute les notes SANS retirer docs/', async () => {
        const avant = cles();
        expect(avant, 'le corpus est là au départ').toContain('systems/alien/rules/le-stress.md');

        const verdict = await engine.brancherLeCoffre(dirs.coffre);

        expect(verdict.accepte).toBe(true);
        expect(cles(), 'la fiche du corpus n’a pas bougé').toContain('systems/alien/rules/le-stress.md');
        expect(duCoffre()).toEqual(['coffre/Campagnes/Hadley Hope.md', 'coffre/Index du Nexus.md']);
    });

    /**
     * Sans préfixe, une note rangée dans un dossier `systems/` du coffre
     * porterait la clé d'une fiche du corpus — elle l'écraserait dans l'index et
     * en prendrait le rang. *Le défaut d'août sous une autre forme.*
     */
    it('range tout le coffre sous un segment réservé', async () => {
        nodeFs.mkdirSync(nodePath.join(dirs.coffre, 'systems', 'alien', 'rules'), { recursive: true });
        nodeFs.writeFileSync(
            nodePath.join(dirs.coffre, 'systems', 'alien', 'rules', 'le-stress.md'),
            '---\nsujet: le stress\n---\n# Ma version perso\n',
        );

        await engine.brancherLeCoffre(dirs.coffre);

        expect(cles()).toContain('coffre/systems/alien/rules/le-stress.md');
        const fiche = (engine as unknown as { index: Map<string, { content: string }> })
            .index.get('systems/alien/rules/le-stress.md');
        expect(fiche!.content, 'la fiche du corpus est intacte').toContain('Les dés de stress explosent');
    });

    it('rend le nombre de notes lues, pour que l’écran puisse le dire', async () => {
        await engine.brancherLeCoffre(dirs.coffre);
        expect(engine.etatDuCoffre()).toEqual({ chemin: dirs.coffre, fichiers: 2 });
    });

    it('est éteint par défaut, et se débranche en rendant l’index à docs/', async () => {
        await engine.brancherLeCoffre(dirs.coffre);
        expect(duCoffre().length).toBe(2);

        await engine.brancherLeCoffre(null);

        expect(duCoffre(), 'les notes sortent de l’index').toEqual([]);
        expect(cles(), 'le corpus reste').toContain('systems/alien/rules/le-stress.md');
        expect(engine.etatDuCoffre().chemin).toBeNull();
    });
});

describe('ce que le coffre n’a pas le droit d’être', () => {
    it('refuse un dossier qui contient le corpus', async () => {
        const verdict = await engine.brancherLeCoffre(dirs.appRoot);
        expect(verdict.accepte).toBe(false);
        expect(verdict.raison).toMatch(/recouvre le corpus/);
    });

    it('refuse un dossier À L’INTÉRIEUR du corpus — les deux sens comptent', async () => {
        const verdict = await engine.brancherLeCoffre(nodePath.join(dirs.docs, 'systems'));
        expect(verdict.accepte).toBe(false);
        expect(verdict.raison).toMatch(/recouvre le corpus/);
    });

    /** *Un refus muet laisserait croire les notes indexées.* */
    it('refuse un dossier absent, et dit lequel', async () => {
        const verdict = await engine.brancherLeCoffre(nodePath.join(dirs.base, 'nulle part'));
        expect(verdict.accepte).toBe(false);
        expect(verdict.raison).toMatch(/introuvable/);
        expect(engine.etatDuCoffre().chemin, 'rien n’a été branché').toBeNull();
    });

    it('refuse un fichier là où on attend un dossier', async () => {
        const fichier = nodePath.join(dirs.base, 'pas-un-dossier.md');
        nodeFs.writeFileSync(fichier, '# non');
        expect((await engine.brancherLeCoffre(fichier)).accepte).toBe(false);
    });
});

describe('ce que le coffre laisse dehors', () => {
    /**
     * **L'index voit exactement ce que le panneau Nexus Wiki montre.** Sans
     * cela, `.trash/` entre dans le corpus de l'Oracle : *une note supprimée
     * qui continue de répondre est pire qu'une note absente.*
     */
    it('n’indexe ni .trash ni .obsidian', async () => {
        nodeFs.mkdirSync(nodePath.join(dirs.coffre, '.trash'), { recursive: true });
        nodeFs.writeFileSync(nodePath.join(dirs.coffre, '.trash', 'supprimee.md'), '# jetée');
        nodeFs.mkdirSync(nodePath.join(dirs.coffre, '.obsidian', 'plugins'), { recursive: true });
        nodeFs.writeFileSync(nodePath.join(dirs.coffre, '.obsidian', 'plugins', 'README.md'), '# greffon');

        await engine.brancherLeCoffre(dirs.coffre);

        expect(duCoffre().some(c => c.includes('.trash') || c.includes('.obsidian'))).toBe(false);
    });

    /** Le `.ragignore` vaut dans le coffre comme dans `docs/`, relatif à SA racine. */
    it('respecte un .ragignore posé dans le coffre', async () => {
        nodeFs.writeFileSync(nodePath.join(dirs.coffre, '.ragignore'), 'Campagnes/\n');

        await engine.brancherLeCoffre(dirs.coffre);

        expect(duCoffre()).toEqual(['coffre/Index du Nexus.md']);
    });

    /**
     * Un vrai `docs/coffre/` porterait les mêmes clés et prendrait le rang du
     * coffre. Le corpus était là le premier ; c'est le coffre qui s'efface, et
     * il le dit. *Un conflit d'espace de noms résolu en silence mélange deux
     * corpus.*
     */
    it('s’efface si docs/coffre/ existe', async () => {
        const intrus = nodePath.join(dirs.docs, 'coffre');
        nodeFs.mkdirSync(intrus, { recursive: true });
        nodeFs.writeFileSync(nodePath.join(intrus, 'note.md'), '# du corpus');
        try {
            await engine.brancherLeCoffre(dirs.coffre);
            expect(duCoffre(), 'seul le fichier du corpus porte cette clé').toEqual(['coffre/note.md']);
            expect(engine.etatDuCoffre().fichiers).toBe(0);
        } finally {
            nodeFs.rmSync(intrus, { recursive: true, force: true });
        }
    });
});

/**
 * **Le coffre peut disparaître ; le corpus, jamais.** OneDrive hors ligne, clé
 * USB retirée, dossier renommé : sans cette garde, la purge de fin de passage
 * effacerait de l'index des notes valides — l'Oracle deviendrait plus pauvre à
 * cause d'un dossier momentanément absent, et rien ne le dirait.
 */
describe('quand le coffre devient illisible', () => {
    it('garde docs/ ET les notes déjà lues', async () => {
        await engine.brancherLeCoffre(dirs.coffre);
        expect(duCoffre().length).toBe(2);

        nodeFs.rmSync(dirs.coffre, { recursive: true, force: true });
        await engine.updateIndex();

        expect(cles(), 'le corpus est intact').toContain('systems/alien/rules/le-stress.md');
        expect(duCoffre(), 'les notes lues sont conservées').toHaveLength(2);
    });
});
