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
 *
 * ⛔ **La scène doit avoir existé juste avant, sans être en cours.** Une scène
 * qui APPARAÎT déjà en cours n'a pas commencé : elle revient d'une sauvegarde
 * rechargée ou d'une semence. Ce chemin-là (`SessionService`) ne lève pas
 * `isSystemSyncing` — seul l'import Nexus-OS le fait —, et l'écran s'ouvrait à
 * la restauration (trouvé le 2026-10-12 en préparant les captures du manuel).
 */
export function scenesEntreesEnCours(avant: readonly Scene[], apres: readonly Scene[]): string[] {
    const avantParId = new Map(avant.map(s => [s.id, s]));
    return apres
        .filter(s => {
            const precedente = avantParId.get(s.id);
            return !!precedente && etatDeLaScene(precedente) !== 'en-cours' && etatDeLaScene(s) === 'en-cours';
        })
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
 * **Ce qu'un moment de storyboard déclenche**, dit en mots — pour que le
 * meneur sache, avant de lancer, ce qui va bouger dans la pièce (2026-10-12).
 */
export function ceQueDeclencheLeMoment(moment: {
    musicPadId?: string; lightSceneId?: string; mapUrl?: string; imageMediaId?: string;
    diaporamaId?: string; soundPadId?: string; ambientSceneId?: string; ambientThemeId?: string; titre?: string;
}): string[] {
    return [
        moment.musicPadId && 'Musique',
        moment.lightSceneId && 'Lumière',
        moment.mapUrl && 'Carte',
        moment.diaporamaId ? 'Diaporama' : moment.imageMediaId && 'Image',
        moment.soundPadId && 'Son',
        (moment.ambientSceneId || moment.ambientThemeId) && 'Ambiance',
        moment.titre?.trim() && 'Titre',
    ].filter((x): x is string => !!x);
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
