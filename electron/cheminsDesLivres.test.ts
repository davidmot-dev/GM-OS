import { beforeAll, describe, expect, it, vi } from 'vitest';
import path from 'node:path';

/**
 * Les gestes « Vérifier » et « Proposer depuis le livre », côté processus principal — « Les chemins
 * des livres », étape B (06/11/2026). Ils ne font que lire, et seulement un `.pdf`.
 */
const gestionnaires = new Map<string, (...args: unknown[]) => unknown>();
vi.mock('electron', () => ({
    ipcMain: { handle: (canal: string, f: (...args: unknown[]) => unknown) => gestionnaires.set(canal, f) },
    dialog: { showOpenDialog: vi.fn() },
}));

const appeler = (canal: string, ...args: unknown[]) => gestionnaires.get(canal)!({}, ...args);
// Un vrai PDF du dépôt (une fiche de personnage d'Alien, une page de formulaire, sans pagination).
const UN_PDF = path.resolve(__dirname, '../outils/rpg-sheet-builder/skills/instructions/references/AL-Fiche-de-personnage_pf.pdf');

beforeAll(async () => {
    const { registerLivresHandlers } = await import('./cheminsDesLivres');
    registerLivresHandlers();
});

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
