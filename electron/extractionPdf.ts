import { createRequire } from 'node:module';
import type { PDFParse } from 'pdf-parse';

const require = createRequire(import.meta.url);
let Constructeur: typeof PDFParse | null = null;
try {
    // Frontière CommonJS : v2 expose un constructeur, pas la fonction de v1.
    const modulePdf: unknown = require('pdf-parse');
    if (typeof modulePdf !== 'object' || modulePdf === null
        || !('PDFParse' in modulePdf) || typeof modulePdf.PDFParse !== 'function') {
        throw new Error('Le constructeur PDFParse est absent.');
    }
    Constructeur = modulePdf.PDFParse as typeof PDFParse;
} catch (erreur) {
    console.error('[PDF] pdf-parse indisponible :', erreur);
}

export const pdfDisponible = Constructeur !== null;

/**
 * Le nombre de pages d'un PDF, et le texte des pages que `choisir` désigne d'après ce nombre — pour
 * vérifier un livre et mesurer son décalage (« Les chemins des livres », 06/11/2026). Un seul
 * document ouvert pour les deux lectures, libéré ensuite.
 */
export async function lirePagesPdf(
    donnees: Buffer,
    choisir: (total: number) => number[],
): Promise<{ total: number; pages: { num: number; text: string }[] }> {
    if (!Constructeur) throw new Error('PDF Parser non disponible.');
    const parseur = new Constructeur({ data: donnees });
    try {
        const { total } = await parseur.getInfo();
        const voulues = choisir(total).filter(n => n >= 1 && n <= total);
        if (!voulues.length) return { total, pages: [] };
        const { pages } = await parseur.getText({ partial: voulues });
        return { total, pages: pages.map(p => ({ num: p.num, text: p.text })) };
    } finally {
        await parseur.destroy();
    }
}

/** Les trois lecteurs de GM-OS partagent l'API v2 et libèrent chaque document. */
export async function extraireTextePdf(donnees: Buffer): Promise<string> {
    if (!Constructeur) throw new Error('PDF Parser non disponible.');
    const parseur = new Constructeur({ data: donnees });
    try {
        // Le texte du corpus n'a pas besoin des marqueurs de pagination ajoutés par v2.
        return (await parseur.getText({ pageJoiner: '' })).text;
    } finally {
        await parseur.destroy();
    }
}
