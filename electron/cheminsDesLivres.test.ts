import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Les gestes du processus principal — « Les chemins des livres ». Étape B (06/11/2026) : « Vérifier »
 * et « Proposer depuis le livre » ne font que lire, et seulement un `.pdf`. Étape C : `livres:ouvrir`
 * relit le chemin dans le registre (jamais dans l'écran) et ouvre la fenêtre de lecture à la page.
 */
const gestionnaires = new Map<string, (...args: unknown[]) => unknown>();
const fenetres: { url: string[]; titre: string; montree: boolean; fermee: boolean }[] = [];
const echecDuChargement = { actif: false };

vi.mock('electron', () => {
    class BrowserWindow {
        etat = { url: [] as string[], titre: '', montree: false, fermee: false };
        webContents = { setWindowOpenHandler: vi.fn(), on: vi.fn() };
        constructor() { fenetres.push(this.etat); }
        static fromWebContents() { return null; }
        on() { return this; }
        isDestroyed() { return this.etat.fermee; }
        async loadURL(url: string) {
            if (echecDuChargement.actif) throw new Error('ERR_FAILED');
            this.etat.url.push(url);
        }
        setTitle(t: string) { this.etat.titre = t; }
        show() { this.etat.montree = true; }
        focus() { /* rien */ }
        close() { this.etat.fermee = true; }
    }
    return {
        ipcMain: { handle: (canal: string, f: (...args: unknown[]) => unknown) => gestionnaires.set(canal, f) },
        dialog: { showOpenDialog: vi.fn() },
        shell: { openPath: vi.fn().mockResolvedValue('') },
        BrowserWindow,
    };
});

const appeler = (canal: string, ...args: unknown[]) => gestionnaires.get(canal)!({ sender: {} }, ...args);
// Un vrai PDF du dépôt (une fiche de personnage d'Alien, une page de formulaire, sans pagination).
const UN_PDF = path.resolve(__dirname, '../outils/rpg-sheet-builder/skills/instructions/references/AL-Fiche-de-personnage_pf.pdf');
// Un corpus jetable : `systems/alien/livres.json` désigne ce PDF, décalé de + 3.
const DOCS = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-livres-'));

beforeAll(async () => {
    fs.mkdirSync(path.join(DOCS, 'systems', 'alien'), { recursive: true });
    fs.writeFileSync(path.join(DOCS, 'systems', 'alien', 'livres.json'), JSON.stringify([
        { cle: 'jeu', titre: 'ALIEN, le jeu de rôle', chemin: UN_PDF, decalage: 3 },
        { cle: 'colonial-marines', titre: 'Colonial Marines', chemin: path.join(DOCS, 'absent.pdf'), decalage: 3 },
        { cle: 'notes', titre: 'Notes', chemin: path.join(DOCS, 'notes.txt'), decalage: 0 },
        // F4 : le même PDF sans décalage, pour lire sa page 1 comme page imprimée.
        { cle: 'fiche', titre: 'Fiche', chemin: UN_PDF, decalage: 0 },
    ]));
    const { registerLivresHandlers } = await import('./cheminsDesLivres');
    registerLivresHandlers({ racineDesDocs: () => DOCS });
});
afterAll(() => { fs.rmSync(DOCS, { recursive: true, force: true }); });
beforeEach(() => { echecDuChargement.actif = false; });

describe('livres:verifier et livres:proposer-decalage', () => {
    it('refuse ce qui n’est pas un PDF, et dit qu’un livre absent ne répond pas', async () => {
        expect(await appeler('livres:verifier', 'C:\\notes.txt')).toEqual({ repond: false, motif: 'pas-un-pdf' });
        expect(await appeler('livres:verifier', 42)).toEqual({ repond: false, motif: 'pas-un-pdf' });
        expect(await appeler('livres:verifier', path.resolve(__dirname, 'absent.pdf'))).toEqual({ repond: false, motif: 'introuvable' });
        expect(await appeler('livres:proposer-decalage', 'C:\\x.docx')).toEqual({ trouve: false, motif: 'pas-un-pdf' });
    });

    it('un vrai PDF répond et compte ses pages ; sans numéros imprimés, rien ne se dégage', async () => {
        const v = await appeler('livres:verifier', UN_PDF) as { repond: boolean; pages: number };
        expect(v.repond).toBe(true);
        expect(v.pages).toBeGreaterThan(0);
        expect(await appeler('livres:proposer-decalage', UN_PDF)).toEqual({ trouve: false, motif: 'rien-ne-se-degage' });
    });
});

describe('livres:ouvrir', () => {
    it('ouvre la fenêtre de lecture à la page du PDF : la p. 309 imprimée est la page 312', async () => {
        const r = await appeler('livres:ouvrir', { racine: 'systems/alien', cle: 'jeu', page: 309 });
        expect(r).toEqual({ ouvert: true, titre: 'ALIEN, le jeu de rôle', pagePdf: 312, alaPage: true });
        const fenetre = fenetres.at(-1)!;
        expect(fenetre.url.at(-1)).toMatch(/^file:\/\/.*AL-Fiche-de-personnage_pf\.pdf\?ouverture=\d+#page=312$/);
        expect(fenetre.montree).toBe(true);
        expect(fenetre.titre).toBe('ALIEN, le jeu de rôle — page 312 du PDF');
    });

    it('la même fenêtre resert, avec une adresse distincte à chaque fois (sinon la page ne change pas)', async () => {
        const avant = fenetres.length;
        await appeler('livres:ouvrir', { racine: 'systems/alien', cle: 'jeu', page: 10 });
        await appeler('livres:ouvrir', { racine: 'systems/alien', cle: 'jeu' });
        expect(fenetres.length).toBe(avant);
        const [a, b] = fenetres.at(-1)!.url.slice(-2);
        expect(a).toMatch(/#page=13$/);
        expect(b).toMatch(/#page=1$/);
        expect(a.split('#')[0]).not.toBe(b.split('#')[0]);
    });

    it('aucun chemin ne vient de l’écran : une demande hors des jeux, ou qui porte un chemin, est refusée', async () => {
        expect(await appeler('livres:ouvrir', { racine: '../..', cle: 'jeu', page: 1 })).toEqual({ ouvert: false, motif: 'demande-invalide' });
        expect(await appeler('livres:ouvrir', { racine: 'systems/..', cle: 'jeu' })).toEqual({ ouvert: false, motif: 'demande-invalide' });
        expect(await appeler('livres:ouvrir', UN_PDF)).toEqual({ ouvert: false, motif: 'demande-invalide' });
    });

    it('un livre sans registre, absent, ou qui n’est pas un PDF le dit', async () => {
        expect(await appeler('livres:ouvrir', { racine: 'systems/dune', cle: 'jeu', page: 3 })).toEqual({ ouvert: false, motif: 'sans-livre' });
        expect(await appeler('livres:ouvrir', { racine: 'systems/alien', cle: 'inconnu' })).toEqual({ ouvert: false, motif: 'sans-livre' });
        expect(await appeler('livres:ouvrir', { racine: 'systems/alien', cle: 'colonial-marines', page: 3 })).toEqual({ ouvert: false, motif: 'introuvable' });
        expect(await appeler('livres:ouvrir', { racine: 'systems/alien', cle: 'notes' })).toEqual({ ouvert: false, motif: 'pas-un-pdf' });
    });

    it('si la fenêtre ne charge pas, l’application PDF du système l’ouvre à la première page', async () => {
        echecDuChargement.actif = true;
        const r = await appeler('livres:ouvrir', { racine: 'systems/alien', cle: 'jeu', page: 309 });
        expect(r).toEqual({ ouvert: true, titre: 'ALIEN, le jeu de rôle', pagePdf: 1, alaPage: false });
        const { shell } = await import('electron');
        expect(shell.openPath).toHaveBeenCalledWith(UN_PDF);
    });
});

/**
 * F4 — le livre vérifie la fiche (06/11/2026) : `livres:lire-pages` rend le texte des pages imprimées,
 * le chemin relu dans le registre.
 */
describe('livres:lire-pages', () => {
    it('lit la page demandée et la rend sous son numéro imprimé', async () => {
        const r = await appeler('livres:lire-pages', { racine: 'systems/alien', cle: 'fiche', pages: [1] }) as { lu: boolean; pages: { page: number; texte: string }[] };
        expect(r.lu).toBe(true);
        expect(r.pages.map(p => p.page)).toEqual([1]);
        expect(typeof r.pages[0].texte).toBe('string');
    });

    it('le décalage s’applique : une page imprimée au-delà du livre ne rend rien', async () => {
        const r = await appeler('livres:lire-pages', { racine: 'systems/alien', cle: 'jeu', pages: [1] }) as { lu: boolean; pages: unknown[] };
        expect(r).toEqual({ lu: true, titre: 'ALIEN, le jeu de rôle', pages: [] });
    });

    it('refuse une demande hors des jeux ou sans pages ; dit un livre absent ou sans registre', async () => {
        expect(await appeler('livres:lire-pages', { racine: '../x', cle: 'jeu', pages: [1] })).toEqual({ lu: false, motif: 'demande-invalide' });
        expect(await appeler('livres:lire-pages', { racine: 'systems/alien', cle: 'jeu', pages: [] })).toEqual({ lu: false, motif: 'demande-invalide' });
        expect(await appeler('livres:lire-pages', { racine: 'systems/alien', cle: 'colonial-marines', pages: [1] })).toEqual({ lu: false, motif: 'introuvable' });
        expect(await appeler('livres:lire-pages', { racine: 'systems/dune', cle: 'jeu', pages: [1] })).toEqual({ lu: false, motif: 'sans-livre' });
    });
});
