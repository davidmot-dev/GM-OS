import path from 'node:path';
import fs from 'fs-extra';
import { dialog, ipcMain } from 'electron';
import { lirePagesPdf, pdfDisponible } from './extractionPdf';
import {
    mesurerLeDecalage, pagesAEchantillonner,
    type MotifDuLivre, type PropositionDeDecalage, type VerificationDuLivre,
} from '../src/modules/forge/rules/livres';

/**
 * **Les chemins des livres, côté processus principal** — étape B du plan
 * `documentation/Planning/2026-11-06-chemins-des-livres.md` (06/11/2026), écran validé par David
 * (*« je valide »*, maquette `stitch/livres/pdf-du-livre.png`).
 *
 * Trois gestes de la carte « PDF du livre » de la Forge : choisir le fichier, vérifier qu'il répond
 * (et compter ses pages), proposer le décalage des pages. **Aucun ne copie le livre**, aucun n'écrit :
 * le registre `livres.json` s'écrit par `ai:write-doc`, comme `supplements.json`.
 *
 * ⚠️ `verifier` et `proposer` reçoivent un chemin de l'interface : ils ne font que **lire**, et
 * seulement un `.pdf`. Rien n'est ouvert ni exécuté ici ; l'ouverture à la page (étape C) lira le
 * chemin dans le registre, jamais dans l'interface.
 */

const estUnPdf = (chemin: unknown): chemin is string => typeof chemin === 'string' && /\.pdf$/i.test(chemin.trim());

/** Le livre, lu en entier : un PDF du NAS se lit mal par morceaux, et la lecture est ponctuelle. */
async function lireLeLivre(chemin: unknown): Promise<{ donnees: Buffer } | { motif: MotifDuLivre }> {
    if (!estUnPdf(chemin)) return { motif: 'pas-un-pdf' };
    if (!pdfDisponible) return { motif: 'pdf-indisponible' };
    // Un NAS éteint rend une erreur, pas `false` : les deux disent que le livre ne répond pas.
    if (!(await fs.pathExists(chemin.trim()).catch(() => false))) return { motif: 'introuvable' };
    try {
        return { donnees: await fs.readFile(chemin.trim()) };
    } catch {
        return { motif: 'introuvable' };
    }
}

export function registerLivresHandlers(): void {
    /** Le dialogue système, filtré sur les PDF, ouvert dans le dossier du livre actuel s'il y en a un. */
    ipcMain.handle('livres:choisir', async (_event, cheminActuel?: unknown): Promise<string | null> => {
        const { filePaths } = await dialog.showOpenDialog({
            title: 'Le PDF du livre',
            properties: ['openFile'],
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
            ...(estUnPdf(cheminActuel) ? { defaultPath: path.dirname(cheminActuel.trim()) } : {}),
        });
        return filePaths?.[0] ?? null;
    });

    /** Le livre répond-il, et combien de pages a-t-il ? */
    ipcMain.handle('livres:verifier', async (_event, chemin: unknown): Promise<VerificationDuLivre> => {
        const lu = await lireLeLivre(chemin);
        if ('motif' in lu) return { repond: false, motif: lu.motif };
        try {
            const { total } = await lirePagesPdf(lu.donnees, () => []);
            return { repond: true, pages: total };
        } catch {
            return { repond: false, motif: 'illisible' };
        }
    });

    /**
     * Le décalage proposé, mesuré sur une quarantaine de pages réparties dans le livre : une
     * proposition, que le meneur retient ou non — jamais une écriture.
     */
    ipcMain.handle('livres:proposer-decalage', async (_event, chemin: unknown): Promise<PropositionDeDecalage> => {
        const lu = await lireLeLivre(chemin);
        if ('motif' in lu) return { trouve: false, motif: lu.motif };
        try {
            const { total, pages } = await lirePagesPdf(lu.donnees, n => pagesAEchantillonner(n, 60));
            const mesure = mesurerLeDecalage(pages, total);
            return mesure ? { trouve: true, mesure, pages: total } : { trouve: false, motif: 'rien-ne-se-degage' };
        } catch {
            return { trouve: false, motif: 'illisible' };
        }
    });
}
