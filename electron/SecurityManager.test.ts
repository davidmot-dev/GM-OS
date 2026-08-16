import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import path from 'node:path';
import fs from 'fs-extra';

/**
 * Ce que ces tests protègent : **un coffre qu'on ne sait pas lire ne doit jamais
 * être écrasé**.
 *
 * L'incident du 2026-08-16. David retrouve ses quatre clés absentes de
 * l'application ; le fichier, lui, est intact — quatre entrées, longueurs
 * justes, écrit la veille. Personne ne l'avait lu. Et le geste naturel — retaper
 * une clé — écrivait alors une carte mémoire vide augmentée de cette seule clé :
 * **les trois autres disparaissaient du disque**. Le fichier n'était pas la
 * victime du défaut, il en devenait l'instrument.
 *
 * Deux causes se sont additionnées, et les deux sont testées ici :
 * le chargement avait lieu **avant que le chiffrement ne soit disponible**, et
 * un chargement raté **autorisait l'écriture**.
 */

const dirs = vi.hoisted(() => {
    const nodeFs = require('node:fs') as typeof import('node:fs');
    const nodePath = require('node:path') as typeof import('node:path');
    const nodeOs = require('node:os') as typeof import('node:os');
    return { userData: nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'gmos-vault-')) };
});

/**
 * Un `safeStorage` pilotable — c'est lui le cœur du scénario.
 *
 * `disponible` bascule pour rejouer l'instant où le coffre se lisait avant que
 * l'application ne soit prête. Le « chiffrement » est un préfixe reconnaissable :
 * on ne teste pas la cryptographie d'Electron, on teste ce que le code en fait.
 */
const faux = vi.hoisted(() => ({ disponible: true }));

vi.mock('electron', () => ({
    app: { getPath: () => dirs.userData },
    ipcMain: { handle: vi.fn() },
    safeStorage: {
        isEncryptionAvailable: () => faux.disponible,
        encryptString: (texte: string) => Buffer.concat([Buffer.from('v10'), Buffer.from(texte, 'utf-8')]),
        decryptString: (buf: Buffer) => {
            if (buf.subarray(0, 3).toString() !== 'v10') throw new Error('format inconnu');
            return buf.subarray(3).toString('utf-8');
        },
    },
}));

const { SecurityManager } = await import('./SecurityManager');

const COFFRE = path.join(dirs.userData, 'vault', 'secrets.enc');

/** Un coffre plein, tel que `safeStorage` l'aurait écrit. */
function coffrePlein() {
    fs.mkdirpSync(path.dirname(COFFRE));
    fs.writeFileSync(COFFRE, Buffer.concat([
        Buffer.from('v10'),
        Buffer.from(JSON.stringify({
            'ai-key-gemini': 'G'.repeat(39),
            'ai-key-openai': 'O'.repeat(164),
            'ai-key-anthropic': 'A'.repeat(108),
        }), 'utf-8'),
    ]));
}

function lireLeCoffre(): Record<string, string> {
    return JSON.parse(fs.readFileSync(COFFRE).subarray(3).toString('utf-8'));
}

beforeEach(() => {
    faux.disponible = true;
    fs.removeSync(path.dirname(COFFRE));
});

afterAll(() => {
    fs.removeSync(dirs.userData);
});

describe('le coffre ne se lit pas avant que le chiffrement ne soit disponible', () => {
    it('ne lit rien à la construction', () => {
        coffrePlein();
        faux.disponible = false;

        // Construire avant `ready` ne doit plus rien décider : c'est ce qui
        // faisait conclure « coffre vide » sur un fichier plein.
        const manager = new SecurityManager();

        faux.disponible = true;
        expect(manager.getSecret('ai-key-gemini')).toBe('G'.repeat(39));
        expect(manager.etatDuCoffre().etat).toBe('lu');
    });

    it("retente la lecture quand le coffre avait été déclaré illisible", () => {
        coffrePlein();
        faux.disponible = false;

        const manager = new SecurityManager();
        expect(manager.etatDuCoffre().etat).toBe('illisible');
        expect(manager.getSecret('ai-key-gemini')).toBeNull();

        // Le chiffrement arrive — la seconde chance suffit, et rien n'a été écarté.
        faux.disponible = true;
        expect(manager.getSecret('ai-key-gemini')).toBe('G'.repeat(39));
        expect(fs.readdirSync(path.dirname(COFFRE))).toEqual(['secrets.enc']);
    });

    it('distingue un coffre absent d\'un coffre illisible', () => {
        const neuf = new SecurityManager();
        expect(neuf.etatDuCoffre().etat).toBe('vide');

        coffrePlein();
        faux.disponible = false;
        expect(new SecurityManager().etatDuCoffre().etat).toBe('illisible');
    });
});

describe("une lecture ratée n'autorise pas l'écrasement", () => {
    it("met le coffre de côté au lieu d'écrire par-dessus", () => {
        coffrePlein();
        faux.disponible = false;
        const manager = new SecurityManager();
        // Le coffre reste illisible : ni la lecture initiale, ni la seconde chance.
        expect(manager.etatDuCoffre().etat).toBe('illisible');

        const resultat = manager.setSecret('ai-key-gemini', 'N'.repeat(39));

        expect(resultat.ecrit).toBe(true);
        expect(resultat.ecarte).toBeDefined();
        // L'ancien coffre existe toujours, entier.
        const ecarte = fs.readFileSync(resultat.ecarte!);
        expect(JSON.parse(ecarte.subarray(3).toString('utf-8'))).toHaveProperty('ai-key-openai');
    });

    it('conserve les autres clés quand la lecture a réussi', () => {
        coffrePlein();
        const manager = new SecurityManager();

        manager.setSecret('ai-key-gemini', 'N'.repeat(39));

        // Le cas nominal, et celui qui était cassé : les trois autres survivent.
        const sur = lireLeCoffre();
        expect(Object.keys(sur).sort()).toEqual(['ai-key-anthropic', 'ai-key-gemini', 'ai-key-openai']);
        expect(sur['ai-key-openai']).toBe('O'.repeat(164));
    });
});

describe('une valeur vide n\'est pas un secret', () => {
    it("refuse de l'écrire, parce que cela supprimerait l'entrée en silence", () => {
        coffrePlein();
        const manager = new SecurityManager();

        // Le champ de saisie appelle à CHAQUE frappe, y compris quand on le vide.
        const resultat = manager.setSecret('ai-key-gemini', '');

        expect(resultat.ecrit).toBe(false);
        expect(resultat.raison).toContain('vide');
        expect(manager.getSecret('ai-key-gemini')).toBe('G'.repeat(39));
        expect(lireLeCoffre()['ai-key-gemini']).toBe('G'.repeat(39));
    });

    it("refuse aussi une suite d'espaces", () => {
        coffrePlein();
        expect(new SecurityManager().setSecret('ai-key-gemini', '   ').ecrit).toBe(false);
    });

    it('supprime quand on le demande explicitement', () => {
        coffrePlein();
        const manager = new SecurityManager();

        expect(manager.deleteSecret('ai-key-gemini').ecrit).toBe(true);
        expect(manager.getSecret('ai-key-gemini')).toBeNull();
        expect(Object.keys(lireLeCoffre()).sort()).toEqual(['ai-key-anthropic', 'ai-key-openai']);
    });
});

describe("l'état du coffre", () => {
    it('rend les noms des entrées, jamais les valeurs', () => {
        coffrePlein();
        const etat = new SecurityManager().etatDuCoffre();

        expect(etat.entrees.sort()).toEqual(['ai-key-anthropic', 'ai-key-gemini', 'ai-key-openai']);
        expect(JSON.stringify(etat)).not.toContain('G'.repeat(39));
    });
});

describe('le repli base64', () => {
    it('relit un coffre écrit sans chiffrement', () => {
        faux.disponible = false;
        fs.mkdirpSync(path.dirname(COFFRE));
        fs.writeFileSync(COFFRE, Buffer.from(JSON.stringify({ 'ai-key-gemini': 'G'.repeat(39) }), 'utf-8').toString('base64'));

        const manager = new SecurityManager();
        expect(manager.etatDuCoffre().etat).toBe('lu');
        expect(manager.getSecret('ai-key-gemini')).toBe('G'.repeat(39));
    });

    it("est tenté même quand le chiffrement se dit disponible", () => {
        // L'inverse du scénario de l'incident : un coffre en base64 relu par une
        // application où le chiffrement fonctionne. Décider du format d'après
        // `isEncryptionAvailable()` le rendait illisible.
        fs.mkdirpSync(path.dirname(COFFRE));
        fs.writeFileSync(COFFRE, Buffer.from(JSON.stringify({ 'ai-key-gemini': 'G'.repeat(39) }), 'utf-8').toString('base64'));

        expect(new SecurityManager().getSecret('ai-key-gemini')).toBe('G'.repeat(39));
    });
});
