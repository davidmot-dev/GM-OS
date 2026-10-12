import type { Scene } from '../../../types/trame.types';
import type { Clue } from '../../../types/chronicle.types';
import type { ProjectedEntity } from '../../image/types';
import { etatDeLaScene } from './trame';

/**
 * **L'écran « Scène en cours » — ce qui s'y décide sans écran** (2026-10-12, L2).
 *
 * Plan : `documentation/Planning/2026-10-11-ecran-scene-en-cours.md`.
 */

/**
 * **Les scènes qui viennent d'ENTRER en cours** — c'est ce qui ouvre l'écran.
 *
 * ⛔ La règle se lit sur l'état, pas sur les boutons : `ouvrirLaScene` a trois
 * appelants (le panneau de séance, l'inspecteur et la fiche de la Trame), et
 * *une règle posée chez les appelants en oublierait un.* Une scène déjà en
 * cours qui change de titre n'ouvre rien ; une scène reprise après une pause,
 * si — elle recommence à se jouer.
 */
export function scenesEntreesEnCours(avant: readonly Scene[], apres: readonly Scene[]): string[] {
    const etaitEnCours = new Set(avant.filter(s => etatDeLaScene(s) === 'en-cours').map(s => s.id));
    return apres
        .filter(s => etatDeLaScene(s) === 'en-cours' && !etaitEnCours.has(s.id))
        .map(s => s.id);
}

/**
 * **La première rencontre d'un PNJ** : la scène donnée, sinon une scène en
 * cours qui le compte parmi ses PNJ — sinon la date seule. Mieux vaut une trace
 * sans scène qu'une scène devinée.
 */
export function premiereFoisVu(
    entite: { id: string; campaignId?: string | null },
    scenes: readonly Scene[],
    quand: number,
    sceneId?: string,
): { le: number; sceneId?: string } {
    const ici = sceneId ?? scenes.find(s =>
        s.entiteIds.includes(entite.id) && etatDeLaScene(s) === 'en-cours'
        && (!entite.campaignId || s.campaignId === entite.campaignId))?.id;
    return ici ? { le: quand, sceneId: ici } : { le: quand };
}

/**
 * **Un indice tel qu'il part au Player Hub.** Les deux écrans qui projetaient
 * un indice ne le décrivaient pas pareil (`avatar` ici, `imageUrl` là) : celui-ci
 * porte les deux, pour que la fiche ait son image quel que soit son lecteur.
 */
export const indiceProjete = (indice: Pick<Clue, 'id' | 'title' | 'content' | 'mediaUrl'>): ProjectedEntity => ({
    id: indice.id,
    type: 'evidence',
    name: indice.title,
    imageUrl: indice.mediaUrl,
    avatar: indice.mediaUrl,
    description: indice.content,
});
