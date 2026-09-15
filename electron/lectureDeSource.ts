import path from 'node:path';
import fs from 'fs-extra';

/**
 * **Lire le fichier qu'un meneur vient de choisir, quel qu'il soit.**
 *
 * Demandé par David le 2026-09-15, en découvrant que l'import de l'Atelier ne
 * savait que **coller** : *« est-ce que je peux importer des fichiers JSON ? des
 * PDF ? des fichiers MD ? »*. La réponse était non aux trois — il n'y avait
 * aucun sélecteur de fichier.
 *
 * ⚠️ **Ce module ne comprend rien aux tables.** Il rend du texte, ou une image
 * en base64 ; c'est le renderer qui décide ensuite si c'est du JSON, une table
 * de manuel ou une photo à confier au modèle. *Une lecture de fichier qui
 * interprète son contenu devient impossible à réutiliser.*
 *
 * ⛔ **Il lit ce que le meneur a désigné dans un dialogue système, et rien
 * d'autre.** Pas de chemin venu du renderer : c'est la différence entre ceci et
 * `cheminDesTables.ts`, qui doit se défendre contre une chaîne arbitraire.
 * *Un chemin choisi à la souris n'a pas besoin d'être confiné — mais il faut que
 * ce soit vrai, pas supposé*, d'où la signature qui n'accepte qu'un chemin
 * absolu déjà rendu par `showOpenDialog`.
 */

/*
  `pdf-parse` est déjà une dépendance du projet — le moteur RAG s'en sert pour
  indexer les manuels. Il le charge de son côté ; `require` rend le même module
  en cache, et le duplicat n'a pas de coût. On ne partage pas la fonction pour
  autant : le RAG *parcourt un corpus*, ceci *ouvre un fichier*. Deux gestes, et
  celui-ci doit pouvoir échouer sans qu'un index s'arrête.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdf: any;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pdf = require('pdf-parse');
} catch (e) {
    console.error('[Sources] pdf-parse indisponible :', e);
}

/** Ce qu'une source peut rendre. */
export type SourceLue =
    | { genre: 'texte'; texte: string; nom: string }
    | { genre: 'image'; donnees: string; mimeType: string; nom: string }
    | { genre: 'refus'; motif: 'extension-inconnue' | 'illisible' | 'pdf-indisponible'; nom: string };

/** Les extensions qu'on propose dans le dialogue, et qu'on sait lire. */
export const EXTENSIONS_TEXTE = ['json', 'md', 'markdown', 'txt', 'csv', 'tsv'];
export const EXTENSIONS_IMAGE = ['png', 'jpg', 'jpeg', 'webp'];

const MIME_DES_IMAGES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
};

/**
 * Lit une source et rend ce qu'elle contient.
 *
 * ⚠️ **Un refus est une réponse, pas une exception.** L'écran doit pouvoir dire
 * *pourquoi* il ne peut rien faire de ce fichier — « pas le bon format » et
 * « illisible » n'appellent pas le même geste du meneur.
 */
export async function lireUneSource(chemin: string): Promise<SourceLue> {
    const nom = path.basename(chemin);
    const ext = path.extname(chemin).toLowerCase();

    try {
        if (ext === '.pdf') {
            if (typeof pdf !== 'function') return { genre: 'refus', motif: 'pdf-indisponible', nom };
            const donnees = await fs.readFile(chemin);
            const extrait = await pdf(donnees);
            return { genre: 'texte', texte: String(extrait?.text ?? ''), nom };
        }

        if (MIME_DES_IMAGES[ext]) {
            const donnees = await fs.readFile(chemin);
            return {
                genre: 'image',
                donnees: donnees.toString('base64'),
                mimeType: MIME_DES_IMAGES[ext],
                nom,
            };
        }

        if (EXTENSIONS_TEXTE.includes(ext.replace('.', ''))) {
            return { genre: 'texte', texte: await fs.readFile(chemin, 'utf-8'), nom };
        }

        return { genre: 'refus', motif: 'extension-inconnue', nom };
    } catch (err) {
        console.error('[Sources] lecture impossible :', chemin, err);
        return { genre: 'refus', motif: 'illisible', nom };
    }
}
