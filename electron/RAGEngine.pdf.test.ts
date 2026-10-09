import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import { pdfArtificiel } from './fixtures/pdfArtificiel';

const controle = vi.hoisted(() => ({
    disponible: true,
    gestionnaires: new Map<string, unknown>(),
}));
vi.mock('electron', () => ({
    ipcMain: { handle: (nom: string, gestionnaire: unknown) => controle.gestionnaires.set(nom, gestionnaire) },
}));
// Aucun journal Electron réel ; les seules lectures de fichiers sont sous le dossier d'essai.
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn() } }));
vi.mock('./extractionPdf', async importOriginal => {
    const original = await importOriginal<typeof import('./extractionPdf')>();
    return { ...original, get pdfDisponible() { return controle.disponible; } };
});

const { RAGEngine, registerRagHandlers } = await import('./RAGEngine');
const { lireUneSource } = await import('./lectureDeSource');
let dossier: string;
let corpus: string;
let extraire: (evenement: unknown, relatif: string) => Promise<string>;
const MANUEL = 'systems/essai/MANUEL.PDF';

beforeAll(async () => {
    dossier = await fs.mkdtemp(path.join(os.tmpdir(), 'gmos-rag-pdf-'));
    corpus = path.join(dossier, 'docs');
    await fs.outputFile(path.join(corpus, MANUEL), pdfArtificiel(['Station Varn - relais', 'Regles du relais']));
    await fs.outputFile(path.join(corpus, 'systems/essai/invalide.pdf'), 'Pas un PDF');
    await fs.outputFile(path.join(corpus, 'systems/essai/vide.pdf'), pdfArtificiel(['']));
    await fs.outputFile(path.join(corpus, 'systems/essai/exclu.pdf'), pdfArtificiel(['Relais secret exclu']));
    await fs.outputFile(path.join(corpus, '.ragignore'), '**/exclu.pdf');
    await fs.outputFile(path.join(corpus, 'commun/note.md'), 'Une note commune accompagne le relais.');
    await fs.outputFile(path.join(dossier, 'hors.pdf'), pdfArtificiel(['Hors corpus']));
    vi.stubEnv('GMOS_RACINE_DOCS', corpus);
    // Enregistrer les vrais handlers sans laisser de scan différé après le test.
    vi.useFakeTimers();
    registerRagHandlers();
    vi.clearAllTimers();
    vi.useRealTimers();
    const gestionnaire = controle.gestionnaires.get('ai:extract-pdf');
    if (typeof gestionnaire !== 'function') throw new Error('Le handler PDF doit être enregistré.');
    extraire = gestionnaire as typeof extraire;
});
beforeEach(() => {
    controle.disponible = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    if (path.dirname(path.resolve(dossier)) !== path.resolve(os.tmpdir())
        || !path.basename(dossier).startsWith('gmos-rag-pdf-')) {
        throw new Error('Nettoyage refusé hors du dossier PDF temporaire.');
    }
    await fs.remove(dossier);
});

describe('ai:extract-pdf avec le parseur réel', () => {
    it('extrait toutes les pages du PDF sous le corpus isolé', async () => {
        const texte = await extraire({}, MANUEL);
        expect(texte).toContain('Station Varn - relais');
        expect(texte).toContain('Regles du relais');
    });

    it('conserve la réponse historique pour un document invalide', async () => {
        expect(await extraire({}, 'systems/essai/invalide.pdf')).toBe("Erreur lors de l'extraction.");
    });

    it('un fichier absent reste introuvable', async () => {
        expect(await extraire({}, 'absent.pdf')).toBe('Fichier introuvable.');
    });

    it('refuse de sortir du corpus même quand le fichier existe', async () => {
        expect(await extraire({}, '../hors.pdf')).toBe('Fichier introuvable.');
    });

    it('une page vide rend du texte vide plutôt qu’une erreur', async () => {
        expect((await extraire({}, 'systems/essai/vide.pdf')).trim()).toBe('');
    });

    it('un parseur indisponible conserve les réponses IPC et import', async () => {
        controle.disponible = false;
        expect(await extraire({}, MANUEL)).toBe('PDF Parser non disponible.');
        expect(await lireUneSource(path.join(corpus, MANUEL)))
            .toMatchObject({ genre: 'refus', motif: 'pdf-indisponible', nom: 'MANUEL.PDF' });
    });
});

describe('index RAG des PDF artificiels', () => {
    it('le texte du PDF entre dans le contexte, sans le PDF invalide ou exclu', async () => {
        const moteur = RAGEngine.getInstance();
        await moteur.updateIndex();
        const selection = await moteur.selectRelevantContext({ systemId: 'essai', campaignName: '', query: 'relais' });
        expect(selection.context).toContain('Regles du relais');
        const chemins = selection.retenus.map(source => source.path);
        expect(chemins).toContain(MANUEL);
        expect(chemins).not.toContain('systems/essai/invalide.pdf');
        expect(chemins).not.toContain('systems/essai/exclu.pdf');
        expect(chemins).toContain('commun/note.md');
    });

    it('une indisponibilité du parseur n’empêche pas l’indexation du texte', async () => {
        controle.disponible = false;
        await fs.outputFile(path.join(corpus, 'commun/nouvelle.md'), 'Le relais accueille une nouvelle note.');
        await fs.outputFile(path.join(corpus, 'systems/essai/nouveau.pdf'), pdfArtificiel(['Nouveau relais']));
        const moteur = RAGEngine.getInstance();
        await moteur.updateIndex();
        const selection = await moteur.selectRelevantContext({ systemId: 'essai', campaignName: '', query: 'relais' });
        const chemins = selection.retenus.map(source => source.path);
        expect(chemins).toContain('commun/nouvelle.md');
        expect(chemins).not.toContain('systems/essai/nouveau.pdf');
    });
});
