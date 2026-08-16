import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { archiverLaVersionPrecedente, publierLaFiche } from './ServiceDeCampagne';
import { resoudreCorpusDeCampagne } from '../../../../electron/corpusDeCampagne';

/**
 * Ce que ces tests protègent : **une reforge de campagne reste comparable**.
 *
 * Le slug d'une fiche de campagne est déterministe : `slugFicheDeCampagne` le
 * dérive du sujet et de l'acte. Reforger réécrit donc **le même fichier** — la
 * version précédente ne devient pas un doublon comme côté règles, elle
 * disparaît. C'est le seul cas du projet où l'absence d'archivage n'est pas une
 * gêne mais une perte sèche.
 */

const corpus = resoudreCorpusDeCampagne({ nom: 'Le secret de Milo' });
const FICHES = 'campaigns/le-secret-de-milo/fiches';
const V1 = 'campaigns/le-secret-de-milo/fiches-v1';

let disque: Record<string, string>;

beforeEach(() => {
    disque = {};
    (window as unknown as { appBridge: unknown }).appBridge = {
        ai: {
            readDoc: vi.fn(async (chemin: string) => disque[chemin] ?? null),
            writeDoc: vi.fn(async (chemin: string, contenu: string) => { disque[chemin] = contenu; return true; }),
            deleteDoc: vi.fn(async (chemin: string) => { delete disque[chemin]; return true; }),
        },
    };
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

describe('archiverLaVersionPrecedente', () => {
    it("met de côté la fiche présente avant qu'elle ne soit écrasée", async () => {
        disque[`${FICHES}/lieux-majeurs.md`] = 'la première version';

        const resultat = await archiverLaVersionPrecedente(corpus, 'lieux-majeurs');

        expect(resultat.archivee).toBe(true);
        expect(disque[`${V1}/lieux-majeurs.md`]).toBe('la première version');
        // L'original n'est PAS effacé : c'est l'appelant qui va l'écraser, et
        // l'effacer ici laisserait un trou si son écriture échouait.
        expect(disque[`${FICHES}/lieux-majeurs.md`]).toBe('la première version');
    });

    it("ne signale pas d'échec sur une première publication", async () => {
        const resultat = await archiverLaVersionPrecedente(corpus, 'lieux-majeurs');

        expect(resultat).toEqual({ archivee: false });
        expect(resultat.raison).toBeUndefined();
    });

    it("dit pourquoi quand l'archive n'a pas pu s'écrire", async () => {
        disque[`${FICHES}/lieux-majeurs.md`] = 'la première version';
        const pont = (window as unknown as { appBridge: { ai: { writeDoc: ReturnType<typeof vi.fn> } } }).appBridge.ai;
        pont.writeDoc.mockResolvedValueOnce(false);

        const resultat = await archiverLaVersionPrecedente(corpus, 'lieux-majeurs');

        expect(resultat.archivee).toBe(false);
        expect(resultat.raison).toContain('fiches-v1');
    });
});

describe('publierLaFiche', () => {
    it('archive puis remplace, et retire le brouillon', async () => {
        disque[`${FICHES}/lieux-majeurs.md`] = 'ancienne';
        disque[`campaigns/le-secret-de-milo/drafts/lieux-majeurs.md`] = 'le brouillon';

        const ok = await publierLaFiche(corpus, { slug: 'lieux-majeurs', markdown: 'nouvelle' });

        expect(ok).toBe(true);
        expect(disque[`${V1}/lieux-majeurs.md`]).toBe('ancienne');
        expect(disque[`${FICHES}/lieux-majeurs.md`]).toBe('nouvelle');
        expect(disque['campaigns/le-secret-de-milo/drafts/lieux-majeurs.md']).toBeUndefined();
    });

    it("publie quand même si l'archivage échoue", async () => {
        disque[`${FICHES}/lieux-majeurs.md`] = 'ancienne';
        const pont = (window as unknown as { appBridge: { ai: { writeDoc: ReturnType<typeof vi.fn> } } }).appBridge.ai;
        // Le premier writeDoc est celui de l'archive.
        pont.writeDoc.mockResolvedValueOnce(false);

        const ok = await publierLaFiche(corpus, { slug: 'lieux-majeurs', markdown: 'nouvelle' });

        // Perdre une fiche neuve pour n'avoir pas su ranger l'ancienne serait le
        // pire des deux échanges.
        expect(ok).toBe(true);
        expect(disque[`${FICHES}/lieux-majeurs.md`]).toBe('nouvelle');
    });
});
