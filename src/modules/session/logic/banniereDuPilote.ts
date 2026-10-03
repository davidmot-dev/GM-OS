import { resoudreCorpus } from '../../../../electron/corpusSysteme';
import type { GameDriver } from '../../../types/drivers';

/**
 * **La bannière d'un jeu, en fond de l'en-tête de Session-OS** — demandée par
 * David le 2026-10-03 : *« un bandeau en fond en fonction du driver (Cthulhu
 * Hack, Blade Runner…) »*.
 *
 * Le pilote porte le **nom d'un fichier de son dossier** (`docs/systems/<jeu>/`),
 * jamais un chemin libre : l'image vit avec le jeu, comme son thème, et un nom
 * ne peut pas sortir du dossier. L'en-tête ne montre qu'une bande d'environ
 * 54 px sur toute la largeur — l'image (4:1 conseillé) y est recadrée au centre.
 */

/** Les images qu'un navigateur affiche sans aide. */
export const EST_UNE_IMAGE = /\.(jpe?g|png|webp|avif)$/i;

/** Un nom de fichier, sans dossier ni remontée : sinon, rien. */
export function fichierValide(nom: string | undefined): string | null {
    const n = nom?.trim();
    if (!n || /[\\/]/.test(n) || n === '.' || n === '..' || !EST_UNE_IMAGE.test(n)) return null;
    return n;
}

/**
 * L'adresse `gmos://` de la bannière — chaque segment encodé, parce que les
 * noms de David portent des espaces (« Blade Runner Band.jpg »).
 */
export function adresseDeLaBanniere(racine: string, fichier: string | undefined): string | null {
    const nom = fichierValide(fichier);
    if (!nom || !racine) return null;
    const segments = ['docs', ...racine.split('/').filter(Boolean), nom];
    return `gmos://media/${segments.map(encodeURIComponent).join('/')}`;
}

/** Le dossier du jeu d'un pilote — la même résolution que le thème (`jeuDeLaCampagne.ts`). */
export async function racineDuPilote(pilote: Pick<GameDriver, 'id' | 'name'> & { corpusId?: string; ragPath?: string }): Promise<string> {
    const dossiersConnus = (await window.appBridge?.ai?.listSystems?.()) ?? [];
    return resoudreCorpus({
        systemId: pilote.id,
        systemName: pilote.name,
        corpusId: pilote.corpusId,
        ragPath: pilote.ragPath,
        dossiersConnus,
    }).racine;
}

/** Les images du dossier du jeu — ce que l'éditeur du pilote propose. */
export async function imagesDuDossier(racine: string): Promise<string[]> {
    const fichiers = (await window.appBridge?.ai?.listDir?.(racine)) ?? [];
    return fichiers.filter(f => EST_UNE_IMAGE.test(f)).sort((a, b) => a.localeCompare(b, 'fr'));
}
