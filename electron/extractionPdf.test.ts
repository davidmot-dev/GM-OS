import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { extraireTextePdf, pdfDisponible } from './extractionPdf';
import { pdfArtificiel } from './fixtures/pdfArtificiel';

// Même export CommonJS que le lecteur, pour observer ses instances réelles.
const { PDFParse } = createRequire(import.meta.url)('pdf-parse') as typeof import('pdf-parse');
afterEach(() => vi.restoreAllMocks());

describe('extraction PDF v2', () => {
    it('lit deux pages avec le vrai parseur, sans marqueurs de pagination', async () => {
        expect(pdfDisponible).toBe(true);
        const destroy = vi.spyOn(PDFParse.prototype, 'destroy');
        const texte = await extraireTextePdf(pdfArtificiel(['Station Varn', 'Le relais (page deux)']));
        expect(texte).toContain('Station Varn');
        expect(texte).toContain('Le relais (page deux)');
        expect(texte).not.toMatch(/--\s*\d+ of \d+\s*--/);
        expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('rend une page sans texte sans inventer de contenu', async () => {
        expect((await extraireTextePdf(pdfArtificiel(['']))).trim()).toBe('');
    });

    it('libère aussi le parseur quand le document est invalide', async () => {
        const destroy = vi.spyOn(PDFParse.prototype, 'destroy');
        await expect(extraireTextePdf(Buffer.from('Pas un PDF'))).rejects.toThrow();
        expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('conserve une erreur d’extraction tout en demandant la libération', async () => {
        const erreur = new Error('Extraction interrompue');
        vi.spyOn(PDFParse.prototype, 'getText').mockRejectedValueOnce(erreur);
        const destroy = vi.spyOn(PDFParse.prototype, 'destroy');
        await expect(extraireTextePdf(pdfArtificiel(['Essai']))).rejects.toBe(erreur);
        expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('attend la libération avant de rendre le texte', async () => {
        vi.spyOn(PDFParse.prototype, 'getText').mockResolvedValueOnce({
            text: 'Essai', total: 1, pages: [{ num: 1, text: 'Essai' }], getPageText: () => 'Essai',
        });
        let liberer = () => {};
        const liberation = new Promise<void>(resolve => { liberer = resolve; });
        const destroy = vi.spyOn(PDFParse.prototype, 'destroy').mockReturnValueOnce(liberation);
        let termine = false;
        const lecture = extraireTextePdf(pdfArtificiel(['Essai']));
        void lecture.then(() => { termine = true; });
        await vi.waitFor(() => expect(destroy).toHaveBeenCalledTimes(1));
        expect(termine).toBe(false);
        liberer();
        await expect(lecture).resolves.toBe('Essai');
    });
});
