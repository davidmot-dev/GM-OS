import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import path from 'node:path';
import fs from 'fs-extra';

/**
 * **Les garde-fous de la sauvegarde automatique.**
 *
 * Ils existent parce que la première tentative a **vidé l'application** : un
 * service qui exécutait `git stash` / `git checkout data-sync` / `git push`
 * dans le dépôt de GM-OS lui-même. Voir l'en-tête de `sauvegardeAutomatique.ts`
 * pour le détail du mécanisme.
 *
 * Ce fichier ne vérifie pas que la sauvegarde marche — ça, c'est le § du bas.
 * Il vérifie surtout **qu'elle ne peut pas faire ce que l'ancienne faisait**.
 */

const dirs = vi.hoisted(() => {
    const nodeFs = require('node:fs') as typeof import('node:fs');
    const nodePath = require('node:path') as typeof import('node:path');
    const nodeOs = require('node:os') as typeof import('node:os');
    const base = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'gmos-sauvegarde-'));
    return { base, userData: nodePath.join(base, 'userData'), appRoot: nodePath.join(base, 'appRoot') };
});

vi.mock('electron', () => ({
    app: { getPath: (name: string) => (name === 'userData' ? dirs.userData : dirs.base) },
}));

const {
    ecrireSauvegarde, cheminDeSauvegarde, dossierDesSauvegardes, sauvegardesConnues, nomHorodate,
    faireLaRotation,
} = await import('./sauvegardeAutomatique');

const BACKUPS = path.join(dirs.userData, 'backups');
const ETAT = { modules: { sessionOS: { campaigns: [{ id: 'c-1774865486579', name: 'Anges de Feu' }] } } };

beforeEach(async () => {
    await fs.remove(BACKUPS);
    process.env.APP_ROOT = dirs.appRoot;
});

afterAll(async () => {
    await fs.remove(dirs.base);
});

describe('R1 · aucune commande de gestion de version', () => {
    /**
     * La règle ne se teste pas à l'exécution, elle se lit. Ce contrôle vaut
     * pour ce qu'il empêche : quelqu'un — moi dans six mois — qui rebranche
     * `git` « juste pour pousser les sauvegardes ».
     */
    it('le module n’invoque ni git ni aucun processus', () => {
        const source = fs.readFileSync(path.resolve(__dirname, 'sauvegardeAutomatique.ts'), 'utf-8');
        const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\*.*$/gm, '');

        expect(code).not.toMatch(/child_process|execAsync|\bexec\(|spawn\(/);
        expect(code).not.toMatch(/\bgit\s+(add|commit|push|checkout|stash|rm)\b/);
    });
});

describe('R2 · jamais dans le dépôt ni dans le dossier de l’application', () => {
    it('écrit sous userData/backups', () => {
        expect(dossierDesSauvegardes()).toBe(BACKUPS);
    });

    it.each([
        ['../../evasion.json', 'remontée de dossier'],
        ['..\\..\\evasion.json', 'remontée de dossier, séparateurs Windows'],
        ['sous/dossier/gmos-auto-2026-08-28T14-32-05.json', 'sous-dossier'],
        ['C:\\Projet_David\\GM-OS-v5\\main.ts', 'chemin absolu'],
        ['/etc/passwd', 'chemin absolu POSIX'],
        ['gmos-auto-2026-08-28T14-32-05.json.part', 'extension inattendue'],
        ['package.json', 'fichier du dépôt'],
        ['', 'nom vide'],
    ])('refuse « %s » (%s)', (nom) => {
        expect(() => cheminDeSauvegarde(nom)).toThrow();
    });

    it('accepte un nom conforme, et lui seul', () => {
        const nom = nomHorodate(new Date('2026-08-28T14:32:05.123Z'));
        expect(nom).toBe('gmos-auto-2026-08-28T14-32-05-123.json');
        expect(cheminDeSauvegarde(nom)).toBe(path.join(BACKUPS, nom));
    });

    /**
     * Le cas de l'installation portable : `userData` tombe alors DANS le dossier
     * de l'application. C'est exactement la configuration de mars. On préfère
     * ne pas sauvegarder du tout plutôt qu'écrire là.
     */
    it('refuse tout si le dossier de sauvegardes tombe sous APP_ROOT', () => {
        process.env.APP_ROOT = dirs.base; // userData est dessous
        expect(() => cheminDeSauvegarde(nomHorodate())).toThrow(/dossier de sauvegardes tomberait/);
    });

    it('n’écrit rien nulle part quand la destination est refusée', async () => {
        process.env.APP_ROOT = dirs.base;
        await expect(ecrireSauvegarde(ETAT)).rejects.toThrow();
        expect(await fs.pathExists(BACKUPS)).toBe(false);
    });
});

describe('R3 · ne voit que les fichiers qu’elle a écrits', () => {
    it('ignore ce qui ne suit pas son motif', async () => {
        await fs.ensureDir(BACKUPS);
        await fs.writeFile(path.join(BACKUPS, 'notes-de-david.json'), '{}');
        await fs.writeFile(path.join(BACKUPS, 'gmos-session.json'), '{}');
        await ecrireSauvegarde(ETAT);

        const vues = await sauvegardesConnues();
        expect(vues).toHaveLength(1);
        expect(vues[0].nom).toMatch(/^gmos-auto-/);
        // Et les fichiers étrangers sont toujours là.
        expect(await fs.pathExists(path.join(BACKUPS, 'notes-de-david.json'))).toBe(true);
    });
});

describe('l’écriture est atomique et relue', () => {
    it('écrit, relit, et rend le constat', async () => {
        const r = await ecrireSauvegarde(ETAT);
        expect(r.statut).toBe('ecrite');
        if (r.statut !== 'ecrite') return;

        expect(await fs.pathExists(r.chemin)).toBe(true);
        expect(JSON.parse(await fs.readFile(r.chemin, 'utf-8'))).toEqual(ETAT);
        expect(r.octets).toBe(Buffer.byteLength(JSON.stringify(ETAT), 'utf-8'));
    });

    it('ne laisse aucun fichier .part derrière elle', async () => {
        await ecrireSauvegarde(ETAT);
        const restes = (await fs.readdir(BACKUPS)).filter(n => n.endsWith('.part'));
        expect(restes).toEqual([]);
    });

    /** Une sauvegarde illisible qu'on croit bonne est pire que pas de sauvegarde. */
    it('retire le fichier et lève si la relecture ne correspond pas', async () => {
        const vraiReadFile = fs.readFile;
        // On simule un disque qui rend autre chose que ce qu'on vient d'écrire.
        vi.spyOn(fs, 'readFile').mockImplementation((async () => '{"tronqu') as unknown as typeof fs.readFile);

        await expect(ecrireSauvegarde(ETAT)).rejects.toThrow(/non vérifiable/);
        vi.mocked(fs.readFile).mockRestore();
        expect(fs.readFile).toBe(vraiReadFile);

        expect(await sauvegardesConnues()).toEqual([]);
    });
});

describe('la rotation', () => {
    /** Pose des sauvegardes datées, sans passer par l'écriture réelle. */
    async function poser(...horodatages: string[]) {
        await fs.ensureDir(BACKUPS);
        for (const h of horodatages) {
            await fs.writeFile(path.join(BACKUPS, `gmos-auto-${h}.json`), '{}');
        }
    }

    it('ne touche à rien tant qu’il y a peu de sauvegardes', async () => {
        await poser('2026-08-28T10-00-00', '2026-08-28T11-00-00');
        expect(await faireLaRotation()).toEqual([]);
        expect(await sauvegardesConnues()).toHaveLength(2);
    });

    it('garde les douze plus récentes', async () => {
        const heures = Array.from({ length: 20 }, (_, i) => `2026-08-28T${String(i).padStart(2, '0')}-00-00`);
        await poser(...heures);

        await faireLaRotation();
        const restantes = (await sauvegardesConnues()).map(f => f.nom);

        expect(restantes).toHaveLength(12);
        expect(restantes[0]).toContain('19-00-00'); // la plus récente est là
        expect(restantes.at(-1)).toContain('08-00-00');
    });

    /**
     * La couche qui compte le plus : les deux pertes réelles n'ont pas été vues
     * sur le moment. Douze sauvegardes d'affilée peuvent tenir dans une heure.
     */
    it('garde une trace par jour au-delà des douze récentes', async () => {
        const aujourdhui = Array.from({ length: 15 }, (_, i) => `2026-08-28T${String(i).padStart(2, '0')}-00-00`);
        await poser(...aujourdhui, '2026-08-27T09-00-00', '2026-08-27T18-00-00', '2026-08-25T12-00-00');

        await faireLaRotation();
        const restantes = (await sauvegardesConnues()).map(f => f.nom);

        expect(restantes).toContain('gmos-auto-2026-08-27T18-00-00.json'); // la plus récente du 27
        expect(restantes).not.toContain('gmos-auto-2026-08-27T09-00-00.json');
        expect(restantes).toContain('gmos-auto-2026-08-25T12-00-00.json');
    });

    it('ne supprime jamais un fichier qui n’est pas à elle', async () => {
        const heures = Array.from({ length: 20 }, (_, i) => `2026-08-28T${String(i).padStart(2, '0')}-00-00`);
        await poser(...heures);
        await fs.writeFile(path.join(BACKUPS, 'notes-de-david.json'), '{}');
        await fs.writeFile(path.join(BACKUPS, 'gmos-session.json'), '{}');

        await faireLaRotation();

        expect(await fs.pathExists(path.join(BACKUPS, 'notes-de-david.json'))).toBe(true);
        expect(await fs.pathExists(path.join(BACKUPS, 'gmos-session.json'))).toBe(true);
    });

    it('l’écriture la déclenche', async () => {
        const heures = Array.from({ length: 14 }, (_, i) => `2026-08-27T${String(i).padStart(2, '0')}-00-00`);
        await poser(...heures);
        await ecrireSauvegarde(ETAT, { baisseAttendue: true });

        // 12 récentes + la plus récente du 27 déjà comprise dedans
        expect((await sauvegardesConnues()).length).toBeLessThanOrEqual(13);
    });
});

describe('ne pas remplacer une sauvegarde par une plus petite sans le dire', () => {
    const GROS = { modules: { sessionOS: { campaigns: Array.from({ length: 200 }, (_, i) => ({ id: `c-${i}` })) } } };

    it('refuse un rétrécissement de plus de moitié, et garde la précédente', async () => {
        const gros = await ecrireSauvegarde(GROS);
        expect(gros.statut).toBe('ecrite');

        const petit = await ecrireSauvegarde({ modules: { sessionOS: { campaigns: [] } } });
        expect(petit.statut).toBe('refusee');
        if (petit.statut !== 'refusee') return;
        expect(petit.raison).toMatch(/rétrécissement/);

        const restantes = await sauvegardesConnues();
        expect(restantes).toHaveLength(1);
        expect(restantes[0].octets).toBe(gros.statut === 'ecrite' ? gros.octets : 0);
    });

    it('l’accepte quand l’appelant déclare savoir pourquoi', async () => {
        await ecrireSauvegarde(GROS);
        const petit = await ecrireSauvegarde({ modules: { sessionOS: { campaigns: [] } } }, { baisseAttendue: true });
        expect(petit.statut).toBe('ecrite');
        expect(await sauvegardesConnues()).toHaveLength(2);
    });

    it('la première sauvegarde n’a rien à comparer', async () => {
        const r = await ecrireSauvegarde({ modules: { sessionOS: { campaigns: [] } } });
        expect(r.statut).toBe('ecrite');
    });
});
